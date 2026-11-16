import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Translate } from '../../shared/pipes/translate';
import { I18nService } from './i18n';

@Component({ template: `{{ 'Réglages' | t }}`, imports: [Translate] })
class TranslationHost {}

describe('Interface language', () => {
  beforeEach(() => localStorage.removeItem('wirdlink.language.v1'));
  afterEach(() => {
    localStorage.removeItem('wirdlink.language.v1');
    document.documentElement.lang = 'fr';
    document.documentElement.dir = 'ltr';
  });

  it('defaults to French and uses an untranslated content fallback', () => {
    const i18n = TestBed.inject(I18nService);
    expect(i18n.locale()).toBe('fr');
    expect(i18n.translate('Réglages')).toBe('Réglages');
    i18n.setLocale('en');
    expect(i18n.translate('Salat ala Nabi')).toBe('Salat ala Nabi');
  });

  it('persists language and restores Arabic reading direction', () => {
    TestBed.inject(I18nService).setLocale('ar');
    expect(localStorage.getItem('wirdlink.language.v1')).toBe('ar');
    const restored = TestBed.runInInjectionContext(() => new I18nService());
    expect(restored.locale()).toBe('ar');
    expect(restored.translate('Accueil')).toBe('الرئيسية');
    expect(document.documentElement.lang).toBe('ar');
    expect(document.documentElement.dir).toBe('rtl');
    restored.setLocale('en');
    expect(document.documentElement.dir).toBe('ltr');
    expect(document.documentElement.lang).toBe('en');
  });

  it('keeps translations functional when preference storage is unavailable', () => {
    spyOn(Storage.prototype, 'getItem').and.throwError('blocked');
    spyOn(Storage.prototype, 'setItem').and.throwError('blocked');
    const i18n = TestBed.inject(I18nService);
    i18n.setLocale('en');
    expect(i18n.translate('Mes parts')).toBe('My shares');
  });

  it('ignores invalid stored language and formats count placeholders', () => {
    localStorage.setItem('wirdlink.language.v1', 'invalid');
    const i18n = TestBed.inject(I18nService);
    expect(i18n.locale()).toBe('fr');
    i18n.setLocale('en');
    expect(
      i18n.translate('Il reste {available} sur {target}', { available: 200, target: 1000 }),
    ).toBe('200 left out of 1,000');
  });

  it('updates existing views immediately when language changes', () => {
    const fixture = TestBed.createComponent(TranslationHost);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toBe('Réglages');
    TestBed.inject(I18nService).setLocale('en');
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toBe('Settings');
    TestBed.inject(I18nService).setLocale('ar');
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toBe('الإعدادات');
  });
});
