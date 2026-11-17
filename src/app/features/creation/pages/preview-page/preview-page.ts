import { Translate } from '../../../../shared/pipes/translate';
import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthFlow, rememberAuthReturn } from '../../../auth/data-access/auth-flow';
import { PublicationFlow } from '../../../publication/data-access/publication-flow';
import { NetworkStatus } from '../../../../core/services/network-status';
import { RequestState } from '../../../../shared/components/request-state/request-state';
import {
  CreationDraftStore,
  isContentValid,
  isScheduleValid,
  todayDate,
} from '../../data-access/creation-draft';
import { CreationSteps } from '../../components/creation-steps/creation-steps';
import { BeadProgress } from '../../../../shared/components/bead-progress/bead-progress';
import { AudioPlayer } from '../../../../shared/components/audio-player/audio-player';
import { Icon } from '../../../../shared/components/icon/icon';
import { PrivateLimitError } from '../../../../core/services/frontend-gateway';
import { PassService } from '../../../../core/pass/pass-service';

@Component({
  selector: 'app-preview-page',
  imports: [Translate, RouterLink, CreationSteps, BeadProgress, AudioPlayer, RequestState, Icon],
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
  protected readonly privateLimit = signal(false);
  protected readonly passes = inject(PassService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  protected canSubmit(): boolean {
    return (
      isContentValid(this.draft()) &&
      isScheduleValid(this.draft()) &&
      !this.publication.busy() &&
      this.network.online() &&
      !this.auth.restoring()
    );
  }

  protected startPassed(): boolean {
    const start = this.draft().startDate;
    return /^\d{4}-\d{2}-\d{2}$/.test(start) && start < todayDate();
  }

  protected startToday(): void {
    const draft = this.draft();
    const start = todayDate();
    this.store.updateSchedule({
      recurrence: draft.recurrence,
      startDate: start,
      endDate: draft.endDate && draft.endDate < start ? '' : draft.endDate,
      visibility: draft.visibility,
    });
    this.error.set('');
  }

  protected async publish(): Promise<void> {
    if (!this.canSubmit()) {
      if (this.startPassed())
        this.error.set('La date de début est passée. Choisissez aujourd’hui ou une date à venir.');
      return;
    }
    this.error.set('');
    this.privateLimit.set(false);
    if (!this.auth.session()) {
      rememberAuthReturn('/creer/apercu');
      await this.router.navigateByUrl('/connexion');
      return;
    }
    try {
      if (!(await this.publication.publish())) {
        this.error.set(
          'La publication a échoué. Votre brouillon est conservé, vous pouvez réessayer.',
        );
        return;
      }
      if (!this.destroyRef.destroyed)
        await this.router.navigateByUrl(
          '/partage/' + encodeURIComponent(this.publication.receipt()!.id),
        );
    } catch (error) {
      if (error instanceof PrivateLimitError) {
        void this.passes.loadSettings();
        this.privateLimit.set(true);
        return;
      }
      this.error.set(
        'La publication a échoué. Votre brouillon est conservé, vous pouvez réessayer.',
      );
    }
  }
}
