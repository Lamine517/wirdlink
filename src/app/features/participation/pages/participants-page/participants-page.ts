import { WirdHeader } from '../../components/wird-header/wird-header';
import { BackButton } from '../../../../shared/components/back-button/back-button';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { WirdStore } from '../../../../core/wird-store';
import { groupParticipants } from '../../data-access/participant-groups';
import { WirdTabs } from '../../components/wird-tabs/wird-tabs';
import { Icon } from '../../../../shared/components/icon/icon';
import { EmptyState } from '../../../../shared/components/empty-state/empty-state';
import { WirdAccess } from '../../../access/data-access/wird-access';

@Component({
  selector: 'app-participants-page',
  imports: [BackButton, WirdHeader, RouterLink, DecimalPipe, WirdTabs, Icon, EmptyState],
  templateUrl: './participants-page.html',
  styleUrl: './participants-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ParticipantsPage {
  protected readonly store = inject(WirdStore);
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
    this.store.parts().filter((part) => part.wirdId === this.selected()?.id),
  );
  protected readonly groups = computed(() => groupParticipants(this.parts()));
}
