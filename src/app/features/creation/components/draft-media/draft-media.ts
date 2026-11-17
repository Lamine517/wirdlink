import { Translate } from '../../../../shared/pipes/translate';
import { Icon } from '../../../../shared/components/icon/icon';
import { AudioPlayer } from '../../../../shared/components/audio-player/audio-player';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { LocalMedia } from '../../data-access/creation-draft';

const MAX_RECORDING_SECONDS = 600;
const RECORDING_TYPES = [
  'audio/webm;codecs=opus',
  'audio/webm',
  'audio/mp4',
  'audio/ogg;codecs=opus',
];

@Component({
  selector: 'app-draft-media',
  imports: [Translate, Icon, AudioPlayer],
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

  protected readonly canRecord =
    typeof MediaRecorder !== 'undefined' && !!navigator.mediaDevices?.getUserMedia;
  protected readonly recording = signal(false);
  protected readonly elapsed = signal(0);
  protected readonly recordError = signal('');
  private recorder: MediaRecorder | null = null;
  private stream: MediaStream | null = null;
  private timer: ReturnType<typeof setInterval> | undefined;
  private discard = false;

  constructor() {
    inject(DestroyRef).onDestroy(() => {
      this.discard = true;
      this.stopRecording();
      this.release();
    });
  }

  protected select(event: Event, kind: 'image' | 'audio'): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) this.fileSelected.emit({ kind, file });
    input.value = '';
  }

  protected async startRecording(): Promise<void> {
    if (this.recording()) return;
    this.recordError.set('');
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      this.recordError.set('Le micro n’est pas accessible. Autorisez-le, ou importez un fichier.');
      return;
    }
    const type = RECORDING_TYPES.find((candidate) => MediaRecorder.isTypeSupported(candidate));
    const recorder = new MediaRecorder(this.stream, type ? { mimeType: type } : undefined);
    const chunks: Blob[] = [];
    recorder.ondataavailable = (event) => {
      if (event.data.size) chunks.push(event.data);
    };
    recorder.onstop = () => {
      const mime = (recorder.mimeType || type || 'audio/webm').split(';')[0];
      this.release();
      if (this.discard || !chunks.length) return;
      const extension = mime === 'audio/mp4' ? 'm4a' : mime.split('/')[1];
      this.fileSelected.emit({
        kind: 'audio',
        file: new File(chunks, `ma-voix.${extension}`, { type: mime }),
      });
    };
    this.discard = false;
    this.recorder = recorder;
    this.elapsed.set(0);
    this.recording.set(true);
    recorder.start();
    this.timer = setInterval(() => {
      this.elapsed.update((seconds) => seconds + 1);
      if (this.elapsed() >= MAX_RECORDING_SECONDS) this.stopRecording();
    }, 1000);
  }

  protected stopRecording(): void {
    if (this.recorder && this.recorder.state !== 'inactive') this.recorder.stop();
  }

  protected duration(seconds: number): string {
    return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
  }

  private release(): void {
    clearInterval(this.timer);
    this.stream?.getTracks().forEach((track) => track.stop());
    this.stream = null;
    this.recorder = null;
    this.recording.set(false);
  }
}
