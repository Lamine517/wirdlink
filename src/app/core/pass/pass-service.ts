import { Injectable, computed, inject, signal } from '@angular/core';
import { SUPABASE_CLIENT } from '../supabase/supabase-client';
import { WirdStore } from '../wird-store';

export interface PassSettings {
  enabled: boolean;
  monthPrice: number;
  yearPrice: number;
  founderPrice: number;
  founderSlots: number;
  trialDays: number;
  freePrivateLimit: number;
  /** ISO date from which the free private wird limit applies; null while it is only announced. */
  limitStartsOn: string | null;
  reminderDays: number;
}

export type PassKind = 'trial' | 'month' | 'year' | 'founder';

export interface PassStatus {
  active: boolean;
  kind: PassKind | null;
  endsOn: string | null;
  hadPass: boolean;
  privateInProgress: number;
  privateAllowed: boolean;
  isAdmin: boolean;
  founder: boolean;
  foundersLeft: number;
}

export const DEFAULT_PASS_SETTINGS: PassSettings = {
  enabled: false,
  monthPrice: 2000,
  yearPrice: 15000,
  founderPrice: 10000,
  founderSlots: 20,
  trialDays: 30,
  freePrivateLimit: 3,
  limitStartsOn: null,
  reminderDays: 7,
};

const PASS_KINDS: readonly PassKind[] = ['trial', 'month', 'year', 'founder'];
const DATE = /^\d{4}-\d{2}-\d{2}$/;

/** Backend error codes raised on purpose by the database functions. */
export class PassError extends Error {
  constructor(readonly code: string) {
    super(code);
  }
}

function count(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0 ? value : fallback;
}
function date(value: unknown): string | null {
  return typeof value === 'string' && DATE.test(value) ? value : null;
}

export function parsePassSettings(value: unknown): PassSettings {
  const row = value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
  const fallback = DEFAULT_PASS_SETTINGS;
  return {
    enabled: row['enabled'] === true,
    monthPrice: count(row['monthPrice'], fallback.monthPrice),
    yearPrice: count(row['yearPrice'], fallback.yearPrice),
    founderPrice: count(row['founderPrice'], fallback.founderPrice),
    founderSlots: count(row['founderSlots'], fallback.founderSlots),
    trialDays: count(row['trialDays'], fallback.trialDays),
    freePrivateLimit: count(row['freePrivateLimit'], fallback.freePrivateLimit),
    limitStartsOn: date(row['limitStartsOn']),
    reminderDays: count(row['reminderDays'], fallback.reminderDays),
  };
}

export function parsePassStatus(value: unknown): PassStatus | null {
  if (!value || typeof value !== 'object') return null;
  const row = value as Record<string, unknown>;
  const kind = PASS_KINDS.find((item) => item === row['kind']) ?? null;
  return {
    active: row['active'] === true,
    kind,
    endsOn: date(row['endsOn']),
    hadPass: row['hadPass'] === true,
    privateInProgress: count(row['privateInProgress'], 0),
    privateAllowed: row['privateAllowed'] !== false,
    isAdmin: row['isAdmin'] === true,
    founder: row['founder'] === true,
    foundersLeft: count(row['foundersLeft'], 0),
  };
}

export function passErrorCode(error: { message?: string } | null): string {
  const message = error?.message ?? '';
  return /^[a-z_]+$/.test(message) ? message : 'unavailable';
}

/** Public offer settings and the signed-in creator's Pass dahira. Inert in the local demo. */
@Injectable({ providedIn: 'root' })
export class PassService {
  private readonly client = inject(SUPABASE_CLIENT);
  private readonly remote = inject(WirdStore).remote;
  readonly settings = signal<PassSettings>(DEFAULT_PASS_SETTINGS);
  readonly status = signal<PassStatus | null>(null);
  /** Days before the active pass ends (0 on its last day), only inside the reminder window. */
  readonly endingIn = computed(() => {
    const status = this.status();
    if (!status?.active || !status.endsOn) return null;
    const today = new Date().toISOString().slice(0, 10);
    const days = Math.round((Date.parse(status.endsOn) - Date.parse(today)) / 86_400_000);
    return days >= 0 && days < this.settings().reminderDays ? days : null;
  });
  private settingsLoad: Promise<PassSettings> | undefined;

  loadSettings(force = false): Promise<PassSettings> {
    if (!this.remote) return Promise.resolve(this.settings());
    if (!force && this.settingsLoad) return this.settingsLoad;
    this.settingsLoad = (async () => {
      try {
        const { data, error } = await (
          await this.client()
        )
          .from('app_settings')
          .select('value')
          .eq('key', 'pass')
          .maybeSingle();
        if (!error && data) this.settings.set(parsePassSettings(data.value));
      } catch {
        // The defaults keep the offer disabled when settings are unreachable.
      }
      return this.settings();
    })();
    return this.settingsLoad;
  }

  async loadStatus(): Promise<PassStatus | null> {
    if (!this.remote) return null;
    try {
      const { data, error } = await (await this.client()).rpc('my_pass');
      const status = error ? null : parsePassStatus(data);
      this.status.set(status);
      return status;
    } catch {
      this.status.set(null);
      return null;
    }
  }

  async startTrial(): Promise<PassStatus | null> {
    const { data, error } = await (await this.client()).rpc('start_trial');
    if (error) throw new PassError(passErrorCode(error));
    const status = parsePassStatus(data);
    this.status.set(status);
    return status;
  }

  clear(): void {
    this.status.set(null);
  }
}
