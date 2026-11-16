import { DOCUMENT } from '@angular/common';
import { Injectable, effect, inject, signal } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { RouterStateSnapshot, TitleStrategy } from '@angular/router';
import { I18nService } from './i18n';

export const SITE_ORIGIN = 'https://wirdlink.vercel.app';

const INDEXABLE_DESCRIPTIONS: Record<string, string> = {
  '/': 'Partagez un wird, choisissez votre part et comptez vos lectures simplement avec WirdLink.',
  '/aide':
    'Choisissez un wird, puis Je participe. Choisissez votre quantité et confirmez avec Je commence.',
  '/confidentialite':
    'Votre brouillon et votre compteur restent sur cet appareil. Vos wirds et vos parts sont enregistrés avec votre session.',
  '/conditions': 'WirdLink est un projet bénévole et gratuit.',
};

export function pageIndexing(url: string): {
  path: string;
  description: string;
  indexable: boolean;
} {
  const bare = url.split('?')[0]?.split('#')[0] || '/';
  const path = bare === '' ? '/' : bare.length > 1 && bare.endsWith('/') ? bare.slice(0, -1) : bare;
  const description = INDEXABLE_DESCRIPTIONS[path];
  return {
    path,
    description: description ?? INDEXABLE_DESCRIPTIONS['/'],
    indexable: description !== undefined,
  };
}

@Injectable()
export class TranslatedTitle extends TitleStrategy {
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);
  private readonly document = inject(DOCUMENT);
  private readonly i18n = inject(I18nService);
  private readonly routeTitle = signal('WirdLink');
  private readonly routePath = signal('/');

  constructor() {
    super();
    effect(() => {
      const translatedTitle = this.routeTitle()
        .split(' · ')
        .map((part) => this.i18n.translate(part))
        .join(' · ');
      const indexing = pageIndexing(this.routePath());
      const description = this.i18n.translate(indexing.description);
      const canonical = `${SITE_ORIGIN}${indexing.path}`;
      this.title.setTitle(translatedTitle);
      this.meta.updateTag({ name: 'description', content: description });
      this.meta.updateTag({ property: 'og:title', content: translatedTitle });
      this.meta.updateTag({ property: 'og:description', content: description });
      this.meta.updateTag({ property: 'og:url', content: canonical });
      this.meta.updateTag({ name: 'twitter:title', content: translatedTitle });
      this.meta.updateTag({ name: 'twitter:description', content: description });
      this.meta.updateTag({
        name: 'robots',
        content: indexing.indexable ? 'index, follow' : 'noindex, nofollow',
      });
      this.setCanonical(indexing.indexable ? canonical : null);
    });
  }

  override updateTitle(snapshot: RouterStateSnapshot): void {
    this.routeTitle.set(this.buildTitle(snapshot) ?? 'WirdLink');
    this.routePath.set(snapshot.url || '/');
  }

  private setCanonical(href: string | null): void {
    const existing = this.document.querySelector('link[rel="canonical"]');
    if (!href) {
      existing?.remove();
      return;
    }
    const link = existing ?? this.document.createElement('link');
    link.setAttribute('rel', 'canonical');
    link.setAttribute('href', href);
    if (!existing) this.document.head.append(link);
  }
}
