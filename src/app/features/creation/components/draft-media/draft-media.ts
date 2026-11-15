import { AudioPlayer } from '../../../../shared/components/audio-player/audio-player';
import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { LocalMedia } from '../../data-access/creation-draft';

@Component({
  selector: 'app-draft-media',
  imports: [AudioPlayer],
  templateUrl: './draft-media.html',
  styleUrl: './draft-media.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DraftMedia {
  readonly image = input<LocalMedia | null>(null);
  readonly audio = input<LocalMedia | null>(null);
  readonly error = input('');
  readonly fileSelected = output<{ kind: 'image' | 'audio'; file: File }>();
  readonly removeRequested = output<'image' | 'audio'>();
  protected select(event: Event, kind: 'image' | 'audio'): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) this.fileSelected.emit({ kind, file });
    input.value = '';
  }
}
