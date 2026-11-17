import { Injectable, inject, signal } from '@angular/core';
import { SUPABASE_CLIENT } from '../supabase/supabase-client';
import { WirdStore } from '../wird-store';
import type { Locale } from '../services/i18n';

export interface DonationSettings {
  enabled: boolean;
  amounts: number[];
  min: number;
  max: number;
  /** Nine-digit Senegalese number receiving Wave and Orange Money transfers. */
  number: string;
  wave: boolean;
  orange: boolean;
}

export const TEMPLATE_ICONS = [
  'prayer',
  'book',
  'heart',
  'tap',
  'hand',
  'calendar',
  'clock',
  'bell',
  'users',
] as const;
export type TemplateIcon = (typeof TEMPLATE_ICONS)[number];

export interface WirdTemplate {
  id: string;
  title: string;
  target: number;
  icon: TemplateIcon;
}

export interface FeatureSettings {
  tasbih: boolean;
  photo: boolean;
  audio: boolean;
}

export type LocalizedText = Record<Locale, string>;

export interface TextSettings {
  announcement: LocalizedText & { active: boolean };
  help: LocalizedText;
  conditions: LocalizedText;
}

export const DEFAULT_DONATIONS: DonationSettings = {
  enabled: true,
  amounts: [500, 1000, 2000, 5000],
  min: 100,
  max: 500_000,
  number: '765578379',
  wave: true,
  orange: true,
};

export const DEFAULT_TEMPLATES: WirdTemplate[] = [
  { id: 'salat', title: 'Salat ala Nabi', target: 1000, icon: 'prayer' },
  { id: 'fatiha', title: 'Al Fatiha', target: 100, icon: 'book' },
  { id: 'istighfar', title: 'Istighfar', target: 1000, icon: 'heart' },
  { id: 'tahlil', title: 'Tahlil', target: 1000, icon: 'tap' },
];

export const DEFAULT_FEATURES: FeatureSettings = { tasbih: true, photo: true, audio: true };

const EMPTY_TEXT: LocalizedText = { fr: '', en: '', ar: '' };
export const DEFAULT_TEXTS: TextSettings = {
  announcement: { active: false, ...EMPTY_TEXT },
  help: EMPTY_TEXT,
  conditions: EMPTY_TEXT,
};

type Row = Record<string, unknown>;
function row(value: unknown): Row {
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as Row) : {};
}
function amount(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value > 0 ? value : fallback;
}
function flag(value: unknown, fallback: boolean): boolean {
  return typeof value === 'boolean' ? value : fallback;
}
function text(value: unknown, max: number): string {
  return typeof value === 'string' ? value.slice(0, max) : '';
}
function localized(value: unknown, max: number): LocalizedText {
  const data = row(value);
  return { fr: text(data['fr'], max), en: text(data['en'], max), ar: text(data['ar'], max) };
}

export function parseDonations(value: unknown): DonationSettings {
  const data = row(value);
  const fallback = DEFAULT_DONATIONS;
  const amounts = Array.isArray(data['amounts'])
    ? data['amounts'].filter((item): item is number => amount(item, 0) > 0).slice(0, 6)
    : [];
  const min = amount(data['min'], fallback.min);
  const max = amount(data['max'], fallback.max);
  const number = typeof data['number'] === 'string' && /^\d{9}$/.test(data['number']);
  return {
    enabled: flag(data['enabled'], fallback.enabled),
    amounts: amounts.length ? amounts : fallback.amounts,
    min: min <= max ? min : fallback.min,
    max: min <= max ? max : fallback.max,
    number: number ? (data['number'] as string) : fallback.number,
    wave: flag(data['wave'], fallback.wave),
    orange: flag(data['orange'], fallback.orange),
  };
}

export function parseTemplates(value: unknown): WirdTemplate[] {
  if (!Array.isArray(value)) return DEFAULT_TEMPLATES;
  const seen = new Set<string>();
  return value.slice(0, 12).flatMap((item) => {
    const data = row(item);
    const id = typeof data['id'] === 'string' ? data['id'] : '';
    const title = text(data['title'], 100).trim();
    const target = amount(data['target'], 0);
    const icon = TEMPLATE_ICONS.find((name) => name === data['icon']);
    if (!/^[a-z0-9-]{1,40}$/.test(id) || id === 'custom' || seen.has(id)) return [];
    if (!title || target < 1 || target > 2147483647 || !icon) return [];
    seen.add(id);
    return [{ id, title, target, icon }];
  });
}

export function parseFeatures(value: unknown): FeatureSettings {
  const data = row(value);
  return {
    tasbih: flag(data['tasbih'], true),
    photo: flag(data['photo'], true),
    audio: flag(data['audio'], true),
  };
}

export function parseTexts(value: unknown): TextSettings {
  const data = row(value);
  return {
    announcement: {
      active: flag(row(data['announcement'])['active'], false),
      ...localized(data['announcement'], 500),
    },
    help: localized(data['help'], 6000),
    conditions: localized(data['conditions'], 6000),
  };
}

/**
 * Text written by the team for the reader's language. When only the French version exists, it
 * replaces the built-in translations too, so readers never see outdated content.
 */
export function localizedText(value: LocalizedText, locale: Locale): string {
  return (value[locale] || value.fr).trim();
}

export function paragraphs(value: string): string[] {
  return value
    .split(/\n\s*\n/)
    .map((item) => item.trim())
    .filter(Boolean);
}

/** Settings edited in the back office. Defaults reproduce the app as it was before them. */
@Injectable({ providedIn: 'root' })
export class AppConfig {
  private readonly client = inject(SUPABASE_CLIENT);
  private readonly remote = inject(WirdStore).remote;
  readonly donations = signal(DEFAULT_DONATIONS);
  readonly templates = signal(DEFAULT_TEMPLATES);
  readonly features = signal(DEFAULT_FEATURES);
  readonly texts = signal(DEFAULT_TEXTS);
  private loading: Promise<void> | undefined;

  constructor() {
    void this.load();
  }

  load(force = false): Promise<void> {
    if (!this.remote) return Promise.resolve();
    if (!force && this.loading) return this.loading;
    this.loading = (async () => {
      try {
        const { data, error } = await (
          await this.client()
        )
          .from('app_settings')
          .select('key, value')
          .in('key', ['donations', 'templates', 'features', 'texts']);
        if (error || !data) return;
        for (const item of data as { key: string; value: unknown }[]) {
          if (item.key === 'donations') this.donations.set(parseDonations(item.value));
          if (item.key === 'templates') this.templates.set(parseTemplates(item.value));
          if (item.key === 'features') this.features.set(parseFeatures(item.value));
          if (item.key === 'texts') this.texts.set(parseTexts(item.value));
        }
      } catch {
        // The defaults keep the app usable when settings are unreachable.
      }
    })();
    return this.loading;
  }
}
