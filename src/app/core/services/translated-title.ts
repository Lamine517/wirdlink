import { Injectable, effect, inject, signal } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { RouterStateSnapshot, TitleStrategy } from '@angular/router';
import { I18nService } from './i18n';

@Injectable()
export class TranslatedTitle extends TitleStrategy {
  private readonly title = inject(Title);
  private readonly i18n = inject(I18nService);
  private readonly routeTitle = signal('WirdLink');

  constructor() {
    super();
    effect(() => {
      this.title.setTitle(
        this.routeTitle()
          .split(' · ')
          .map((part) => this.i18n.translate(part))
          .join(' · '),
      );
    });
  }

  override updateTitle(snapshot: RouterStateSnapshot): void {
    this.routeTitle.set(this.buildTitle(snapshot) ?? 'WirdLink');
  }
}
