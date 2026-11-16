import { Translate } from '../../../../shared/pipes/translate';
import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthFlow } from '../../../auth/data-access/auth-flow';
import { PublicationFlow } from '../../../publication/data-access/publication-flow';
import { NetworkStatus } from '../../../../core/services/network-status';
import { RequestState } from '../../../../shared/components/request-state/request-state';
import { CreationDraftStore } from '../../data-access/creation-draft';
import { CreationSteps } from '../../components/creation-steps/creation-steps';
import { BeadProgress } from '../../../../shared/components/bead-progress/bead-progress';
import { AudioPlayer } from '../../../../shared/components/audio-player/audio-player';

@Component({
  selector: 'app-preview-page',
  imports: [Translate, RouterLink, CreationSteps, BeadProgress, AudioPlayer, RequestState],
  templateUrl: './preview-page.html',
  styleUrl: './preview-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PreviewPage {
  protected readonly store = inject(CreationDraftStore);
  protected readonly draft = this.store.draft;
  protected readonly auth = inject(AuthFlow);
  protected readonly publication = inject(PublicationFlow);
  protected readonly network = inject(NetworkStatus);
  protected readonly error = signal('');
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  protected async publish(): Promise<void> {
    if (
      !this.store.contentValid() ||
      !this.store.scheduleValid() ||
      !this.network.online() ||
      this.publication.busy() ||
      this.auth.restoring()
    )
      return;
    this.error.set('');
    if (!this.auth.session()) {
      await this.router.navigateByUrl('/connexion');
      return;
    }
    try {
      if ((await this.publication.publish()) && !this.destroyRef.destroyed)
        await this.router.navigateByUrl(
          '/partage/' + encodeURIComponent(this.publication.receipt()!.id),
        );
    } catch {
      this.error.set(
        'La publication a échoué. Votre brouillon est conservé, vous pouvez réessayer.',
      );
    }
  }
}
