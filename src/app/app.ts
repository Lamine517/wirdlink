import { AppUpdateNotice } from './shared/components/app-update-notice/app-update-notice';
import { CycleReminder } from './shared/components/cycle-reminder/cycle-reminder';
import { I18nService } from './core/services/i18n';
import { Translate } from './shared/pipes/translate';
import { Appearance } from './core/services/appearance';
import { NavigationHistory } from './core/services/navigation-history';
import { DeviceInstall } from './core/services/device-install';
import { NetworkStatus } from './core/services/network-status';
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
  DestroyRef,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { WirdStore } from './core/wird-store';
import { RouterLink, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  imports: [
    AppUpdateNotice,
    CycleReminder,
    Translate,
    RouterOutlet,
    RouterLink,
    Icon,
    DesktopIntro,
    DesktopShare,
  ],
  templateUrl: './app.html',
  styleUrl: './app.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
  protected readonly i18n = inject(I18nService);
  protected readonly homeEntered = signal(false);
  protected readonly navigation = inject(NavigationHistory);
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
    if (/^\/(creer|connexion)(?:\/|$)/.test(url) || url === '/partage') return 'create';
    if (/^\/(mes-parts|merci)(?:\/|$)/.test(url)) return 'parts';
    return url === '/' || /^\/wird\//.test(url) ? 'home' : 'none';
  });
  protected readonly sharePath = computed(() => {
    const match = this.url().match(/^\/(?:wird|merci|partage)\/([a-z0-9-]+)(?:\/|\?|$)/);
    const wird = this.store
      .wirds()
      .find((item) => item.id === match?.[1] && item.visibility === 'public');
    return wird ? '/wird/' + wird.id : '/';
  });
  protected readonly shareUrl = computed(() => window.location.origin + this.sharePath());
  protected readonly store = inject(WirdStore);
  protected readonly network = inject(NetworkStatus);
  protected readonly installation = inject(DeviceInstall);
  protected readonly appearance = inject(Appearance);
  private readonly destroyRef = inject(DestroyRef);
  private routeActivated = false;
  private pageAnimation?: Animation;
  private readonly pageView = viewChild<ElementRef<HTMLElement>>('pageView');
  private readonly content = viewChild<ElementRef<HTMLElement>>('content');

  protected resetScroll(): void {
    const animate = this.routeActivated;
    this.routeActivated = true;
    queueMicrotask(() => {
      if (this.destroyRef.destroyed) return;
      const content = this.content()?.nativeElement;
      content?.scrollTo({ top: 0 });
      content?.focus({ preventScroll: true });
      this.pageAnimation?.cancel();
      const page = this.pageView()?.nativeElement;
      const travel = this.navigation.travel();
      if (
        animate &&
        page &&
        travel !== 'none' &&
        !window.matchMedia('(prefers-reduced-motion: reduce)').matches
      ) {
        this.pageAnimation = page.animate(
          [
            { opacity: 0.72, transform: `translateX(${travel === 'back' ? '-18%' : '18%'})` },
            { opacity: 1, transform: 'translateX(0)' },
          ],
          { duration: 240, easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)' },
        );
      }
    });
  }
}
