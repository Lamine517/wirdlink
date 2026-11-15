import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CreationDraftStore } from '../../data-access/creation-draft';
import { CreationSteps } from '../../components/creation-steps/creation-steps';
import { BeadProgress } from '../../../../shared/components/bead-progress/bead-progress';
import { AudioPlayer } from '../../../../shared/components/audio-player/audio-player';

@Component({
  selector: 'app-preview-page',
  imports: [RouterLink, DecimalPipe, CreationSteps, BeadProgress, AudioPlayer],
  templateUrl: './preview-page.html',
  styleUrl: './preview-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PreviewPage {
  protected readonly store = inject(CreationDraftStore);
  protected readonly draft = this.store.draft;
}
