import { NavigationEnd, Router } from '@angular/router';
import { filter, map, tap } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';
import { Icon } from './shared/components/icon/icon';
import { DesktopIntro } from './shared/components/desktop-companion/desktop-intro';
import { DesktopShare } from './shared/components/desktop-companion/desktop-share';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { WirdStore } from './core/wird-store';
import { RouterLink, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, Icon, DesktopIntro, DesktopShare],
  templateUrl: './app.html',
  styleUrl: './app.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
  protected readonly homeEntered = signal(false);
  private readonly router = inject(Router);
  private readonly url = toSignal(
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      tap((event) => {
        if (event.urlAfterRedirects === '/') this.homeEntered.set(true);
      }),
      map((event) => event.urlAfterRedirects),
    ),
    { initialValue: this.router.url },
  );
  protected readonly section = computed(() => {
    const url = this.url();
    if (/^\/creer(?:\/|$)/.test(url)) return 'create';
    if (/^\/(mes-parts|merci)(?:\/|$)/.test(url)) return 'parts';
    return url === '/' || /^\/wird\//.test(url) ? 'home' : 'none';
  });
  protected readonly sharePath = computed(() => {
    const match = this.url().match(/^\/(?:wird|merci)\/([a-z0-9-]+)/);
    return match ? '/wird/' + match[1] : '/';
  });
  protected readonly shareUrl = computed(() => window.location.origin + this.sharePath());
  protected readonly store = inject(WirdStore);
  private readonly content = viewChild<ElementRef<HTMLElement>>('content');

  protected resetScroll(): void {
    queueMicrotask(() => this.content()?.nativeElement.scrollTo({ top: 0 }));
  }
}
