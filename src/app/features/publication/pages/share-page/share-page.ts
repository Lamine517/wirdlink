import { Translate } from '../../../../shared/pipes/translate';
import { AuthFlow } from '../../../auth/data-access/auth-flow';
import { BackButton } from '../../../../shared/components/back-button/back-button';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { PublicationFlow, isValidReceipt } from '../../data-access/publication-flow';
import type { PublicationReceipt } from '../../../../core/services/frontend-gateway';
import { WIRD_REPOSITORY } from '../../../../core/services/wird-repository';
import { RequestState } from '../../../../shared/components/request-state/request-state';
import { WirdStore } from '../../../../core/wird-store';
import { ShareActions } from '../../../../shared/components/share-actions/share-actions';
import { Icon } from '../../../../shared/components/icon/icon';
import { EmptyState } from '../../../../shared/components/empty-state/empty-state';

@Component({
  selector: 'app-share-page',
  imports: [Translate, BackButton, RouterLink, ShareActions, Icon, EmptyState, RequestState],
  templateUrl: './share-page.html',
  styleUrl: './share-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SharePage {
  private readonly route = inject(ActivatedRoute);
  private readonly params = toSignal(this.route.paramMap, {
    initialValue: this.route.snapshot.paramMap,
  });
  private readonly store = inject(WirdStore);
  private readonly publication = inject(PublicationFlow);
  private readonly auth = inject(AuthFlow);
  protected readonly copyMessage = signal('');
  protected readonly loading = signal(false);
  protected readonly error = signal('');
  private readonly repository = inject(WIRD_REPOSITORY, { optional: true });
  private readonly restoredReceipt = signal<PublicationReceipt | null>(null);

  constructor() {
    effect((onCleanup) => {
      const id = this.params().get('id');
      const ownerId = this.auth.session()?.id;
      this.loading.set(false);
      this.restoredReceipt.set(null);
      this.error.set('');
      if (!id || this.publication.receipt()?.id === id || !this.store.remote) return;
      let active = true;
      onCleanup(() => {
        active = false;
      });
      this.loading.set(true);
      void (async () => {
        try {
          const [receipt] = await Promise.all([
            this.repository?.getPublicationReceipt(id),
            this.store.ensure(id),
          ]);
          if (
            active &&
            this.auth.session()?.id === ownerId &&
            receipt &&
            receipt.id === id &&
            isValidReceipt(receipt)
          )
            this.restoredReceipt.set(receipt);
        } catch {
          if (active) this.error.set('Le partage n’a pas pu être chargé. Réessayez.');
        } finally {
          if (active) this.loading.set(false);
        }
      })();
    });
  }

  protected async copyCode(): Promise<void> {
    const code = this.receipt()?.accessCode;
    if (!code || this.receipt()?.visibility !== 'private') return;
    try {
      await navigator.clipboard.writeText(code);
      this.copyMessage.set('Code copié.');
    } catch {
      this.copyMessage.set('Copie indisponible. Recopiez les 4 chiffres affichés.');
    }
  }

  protected readonly receipt = computed(() => {
    const id = this.params().get('id');
    const current = this.publication.receipt();
    return !id || current?.id === id ? current : this.restoredReceipt();
  });
  protected readonly justPublished = computed(
    () => this.publication.receipt()?.id === this.params().get('id'),
  );
  protected readonly wird = computed(() =>
    this.store
      .wirds()
      .find(
        (wird) =>
          wird.id === this.params().get('id') &&
          (this.store.remote || wird.visibility === 'public'),
      ),
  );
  protected readonly title = computed(() => this.receipt()?.title ?? this.wird()?.title ?? '');
  protected readonly shareUrl = computed(
    () =>
      this.receipt()?.shareUrl ??
      window.location.origin + '/wird/' + encodeURIComponent(this.wird()?.id ?? ''),
  );
}
