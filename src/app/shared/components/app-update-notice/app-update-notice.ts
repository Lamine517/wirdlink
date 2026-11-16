import { ChangeDetectionStrategy, Component, inject, viewChild } from '@angular/core';
import { AppUpdates } from '../../../core/services/app-updates';
import { CreationDraftStore } from '../../../features/creation/data-access/creation-draft';
import { Translate } from '../../pipes/translate';
import { BottomSheet } from '../bottom-sheet/bottom-sheet';
import { Icon } from '../icon/icon';

@Component({
  selector: 'app-update-notice',
  imports: [Translate, BottomSheet, Icon],
  templateUrl: './app-update-notice.html',
  styleUrl: './app-update-notice.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppUpdateNotice {
  protected readonly updates = inject(AppUpdates);
  private readonly draft = inject(CreationDraftStore);
  private readonly confirmation = viewChild.required<BottomSheet>('confirmation');

  protected requestReload(): void {
    if (this.draft.image() || this.draft.audio()) {
      this.confirmation().open();
      return;
    }
    this.updates.reload();
  }
}
