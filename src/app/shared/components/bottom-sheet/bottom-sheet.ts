import { Translate } from '../../pipes/translate';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  input,
  signal,
  viewChild,
} from '@angular/core';

@Component({
  imports: [Translate],
  selector: 'app-bottom-sheet',
  templateUrl: './bottom-sheet.html',
  styleUrl: './bottom-sheet.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BottomSheet {
  readonly title = input.required<string>();
  readonly panelId = input.required<string>();
  readonly isOpen = signal(false);
  private readonly dialog = viewChild.required<ElementRef<HTMLDialogElement>>('dialog');
  private readonly panel = viewChild.required<ElementRef<HTMLElement>>('panel');
  private closing = false;

  open(): void {
    const dialog = this.dialog().nativeElement;
    if (dialog.open) return;
    dialog.showModal();
    this.isOpen.set(true);
    if (this.prefersReducedMotion()) return;
    dialog.animate([{ backgroundColor: 'transparent' }, { backgroundColor: 'rgb(0 0 0 / 48%)' }], {
      duration: 240,
      easing: 'ease-out',
    });
    this.panel().nativeElement.animate(
      [
        { transform: 'translateY(40px)', opacity: 0 },
        { transform: 'translateY(0)', opacity: 1 },
      ],
      { duration: 360, easing: 'cubic-bezier(0.16, 1, 0.3, 1)' },
    );
  }

  close(): void {
    const dialog = this.dialog().nativeElement;
    if (!dialog.open || this.closing) return;
    this.closing = true;
    if (this.prefersReducedMotion()) {
      this.finishClose(dialog);
      return;
    }
    const panel = this.panel().nativeElement;
    const panelStyle = getComputedStyle(panel);
    const fromTransform = panelStyle.transform;
    const fromOpacity = panelStyle.opacity;
    const fromBackground = getComputedStyle(dialog).backgroundColor;
    dialog.getAnimations({ subtree: true }).forEach((animation) => animation.cancel());
    const animations = [
      dialog.animate([{ backgroundColor: fromBackground }, { backgroundColor: 'transparent' }], {
        duration: 200,
        fill: 'forwards',
      }),
      panel.animate(
        [
          { transform: fromTransform, opacity: fromOpacity },
          { transform: 'translateY(24px)', opacity: 0 },
        ],
        { duration: 200, easing: 'ease-in', fill: 'forwards' },
      ),
    ];
    const finish = () => {
      this.finishClose(dialog);
      animations.forEach((animation) => animation.cancel());
    };
    void Promise.all(animations.map((animation) => animation.finished)).then(finish, finish);
  }

  protected cancel(event: Event): void {
    event.preventDefault();
    this.close();
  }

  protected closeOnBackdrop(event: MouseEvent): void {
    if (event.target === this.dialog().nativeElement) this.close();
  }

  private prefersReducedMotion(): boolean {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  private finishClose(dialog: HTMLDialogElement): void {
    dialog.close();
    this.isOpen.set(false);
    this.closing = false;
  }
}
