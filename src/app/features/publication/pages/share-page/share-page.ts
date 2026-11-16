import { BackButton } from '../../../../shared/components/back-button/back-button';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { PublicationFlow } from '../../data-access/publication-flow';
import { WirdStore } from '../../../../core/wird-store';
import { ShareActions } from '../../../../shared/components/share-actions/share-actions';
import { Icon } from '../../../../shared/components/icon/icon';
import { EmptyState } from '../../../../shared/components/empty-state/empty-state';

@Component({
  selector: 'app-share-page',
  imports: [BackButton, RouterLink, ShareActions, Icon, EmptyState],
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
  protected readonly copyMessage = signal('');

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

  protected readonly receipt = computed(() =>
    this.params().has('id') ? null : this.publication.receipt(),
  );
  protected readonly wird = computed(() =>
    this.store
      .wirds()
      .find((wird) => wird.id === this.params().get('id') && wird.visibility === 'public'),
  );
  protected readonly title = computed(() => this.receipt()?.title ?? this.wird()?.title ?? '');
  protected readonly shareUrl = computed(
    () =>
      this.receipt()?.shareUrl ??
      window.location.origin + '/wird/' + encodeURIComponent(this.wird()?.id ?? ''),
  );
}
