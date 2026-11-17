import { Translate } from '../../../../shared/pipes/translate';
import { RequestState } from '../../../../shared/components/request-state/request-state';
import { WirdHeader } from '../../components/wird-header/wird-header';
import { BackButton } from '../../../../shared/components/back-button/back-button';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { I18nService } from '../../../../core/services/i18n';
import { relativeTime } from '../../../../core/relative-time';
import { DecimalPipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { PassService } from '../../../../core/pass/pass-service';
import { Part, WirdStore } from '../../../../core/wird-store';
import { groupParticipants } from '../../data-access/participant-groups';
import { WirdTabs } from '../../components/wird-tabs/wird-tabs';
import { Icon } from '../../../../shared/components/icon/icon';
import { EmptyState } from '../../../../shared/components/empty-state/empty-state';
import { WirdAccess } from '../../../access/data-access/wird-access';
import { WirdStats } from '../../components/wird-stats/wird-stats';
import type { WirdStats as WirdStatsData } from '../../../../core/services/wird-repository';

@Component({
  selector: 'app-participants-page',
  imports: [
    Translate,
    RequestState,
    BackButton,
    WirdHeader,
    RouterLink,
    DecimalPipe,
    WirdTabs,
    Icon,
    EmptyState,
    WirdStats,
  ],
  templateUrl: './participants-page.html',
  styleUrl: './participants-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ParticipantsPage {
  protected readonly shareOrigin = window.location.origin;
  protected readonly store = inject(WirdStore);
  protected readonly passes = inject(PassService);
  private readonly access = inject(WirdAccess);
  private readonly route = inject(ActivatedRoute);
  private readonly params = toSignal(this.route.paramMap, {
    initialValue: this.route.snapshot.paramMap,
  });
  protected readonly selected = computed(() =>
    this.store
      .wirds()
      .find((wird) => wird.id === this.params().get('id') && this.access.canRead(wird.id)),
  );
  protected readonly parts = computed(() =>
    this.store.remote
      ? this.remoteParts()
      : this.store.parts().filter((part) => part.wirdId === this.selected()?.id),
  );
  private readonly remoteParts = signal<Part[]>([]);
  protected readonly stats = signal<WirdStatsData | null>(null);
  private readonly ownedId = computed(() =>
    this.selected()?.isOwner ? this.selected()!.id : null,
  );
  protected readonly loading = signal(false);
  protected readonly error = signal('');
  constructor() {
    const clock = setInterval(() => this.now.set(Date.now()), 60_000);
    inject(DestroyRef).onDestroy(() => clearInterval(clock));
    effect((onCleanup) => {
      const id = this.selected()?.id;
      if (!id || !this.store.remote) return;
      let active = true;
      onCleanup(() => {
        active = false;
      });
      this.loading.set(true);
      this.error.set('');
      void this.store
        .participants(id)
        .then((parts) => {
          if (active) this.remoteParts.set(parts);
        })
        .catch(() => {
          if (active) this.error.set('Impossible de charger les participations.');
        })
        .finally(() => {
          if (active) this.loading.set(false);
        });
    });
    effect((onCleanup) => {
      const id = this.ownedId();
      this.stats.set(null);
      if (!id) return;
      void this.passes.loadSettings();
      void this.passes.loadStatus();
      let active = true;
      onCleanup(() => {
        active = false;
      });
      this.store
        .stats(id)
        .then((stats) => {
          if (active) this.stats.set(stats);
        })
        .catch(() => undefined);
    });
  }
  protected readonly groups = computed(() => groupParticipants(this.parts()));
  private readonly i18n = inject(I18nService);
  private readonly now = signal(Date.now());

  protected since(iso: string | undefined): string {
    if (!iso) return '';
    return (
      relativeTime(iso, this.now(), this.i18n.locale()) ?? this.i18n.translate('à l’instant')
    );
  }
}
