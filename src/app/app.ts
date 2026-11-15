import { ChangeDetectionStrategy, Component, ElementRef, inject, viewChild } from '@angular/core';
import { WirdStore } from './core/wird-store';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app.html',
  styleUrl: './app.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
  protected readonly store = inject(WirdStore);
  private readonly content = viewChild<ElementRef<HTMLElement>>('content');

  protected resetScroll(): void {
    queueMicrotask(() => this.content()?.nativeElement.scrollTo({ top: 0 }));
  }
}
