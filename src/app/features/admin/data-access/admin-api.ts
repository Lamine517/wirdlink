import { Injectable, inject } from '@angular/core';
import { SUPABASE_CLIENT } from '../../../core/supabase/supabase-client';
import { PassError, PassKind, PassSettings, passErrorCode } from '../../../core/pass/pass-service';

export interface AdminTotals {
  wirds: number;
  privateWirds: number;
  creators: number;
  participants: number;
  finished: number;
  activePasses: number;
  trials: number;
  founders: number;
  collected: number;
}

export interface AdminCreator {
  id: string;
  name: string;
  organization: string;
  contact: string;
  wirds: number;
  privateInProgress: number;
  passEndsOn: string | null;
  passKind: PassKind | null;
}

export interface AdminPass {
  id: string;
  ownerId: string;
  ownerName: string;
  kind: PassKind;
  startsOn: string;
  endsOn: string;
  amount: number;
  note: string;
}

export interface AdminOverview {
  totals: AdminTotals;
  creators: AdminCreator[];
  passes: AdminPass[];
}

/** Private wirds come without title nor description: the team only sees public content. */
export interface AdminWird {
  id: string;
  title: string;
  description: string;
  visibility: 'public' | 'private';
  author: string;
  createdAt: string;
  participants: number;
  hidden: boolean;
  reason: string;
}

export interface AdminMember {
  id: string;
  name: string;
  contact: string;
  addedAt: string;
  isMe: boolean;
}

const KINDS: readonly PassKind[] = ['trial', 'month', 'year', 'founder'];

function row(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}
function list(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}
function text(value: unknown): string {
  return typeof value === 'string' ? value : '';
}
function count(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}
function kind(value: unknown): PassKind | null {
  return KINDS.find((item) => item === value) ?? null;
}
function day(value: unknown): string | null {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : null;
}

export function parseOverview(value: unknown): AdminOverview {
  const data = row(value);
  const totals = row(data['totals']);
  return {
    totals: {
      wirds: count(totals['wirds']),
      privateWirds: count(totals['privateWirds']),
      creators: count(totals['creators']),
      participants: count(totals['participants']),
      finished: count(totals['finished']),
      activePasses: count(totals['activePasses']),
      trials: count(totals['trials']),
      founders: count(totals['founders']),
      collected: count(totals['collected']),
    },
    creators: list(data['creators']).map((item) => {
      const creator = row(item);
      return {
        id: text(creator['id']),
        name: text(creator['name']),
        organization: text(creator['organization']),
        contact: text(creator['contact']),
        wirds: count(creator['wirds']),
        privateInProgress: count(creator['privateInProgress']),
        passEndsOn: day(creator['passEndsOn']),
        passKind: kind(creator['passKind']),
      };
    }),
    passes: list(data['passes']).flatMap((item) => {
      const pass = row(item);
      const passKind = kind(pass['kind']);
      const startsOn = day(pass['startsOn']);
      const endsOn = day(pass['endsOn']);
      if (!passKind || !startsOn || !endsOn) return [];
      return [
        {
          id: text(pass['id']),
          ownerId: text(pass['ownerId']),
          ownerName: text(pass['ownerName']),
          kind: passKind,
          startsOn,
          endsOn,
          amount: count(pass['amount']),
          note: text(pass['note']),
        },
      ];
    }),
  };
}

/** Every call is re-authorized by the database; the client only hides the screens. */
@Injectable({ providedIn: 'root' })
export class AdminApi {
  private readonly client = inject(SUPABASE_CLIENT);

  private async call(name: string, args?: Record<string, unknown>): Promise<unknown> {
    const { data, error } = await (await this.client()).rpc(name, args);
    if (error) throw new PassError(passErrorCode(error));
    return data;
  }

  async overview(): Promise<AdminOverview> {
    return parseOverview(await this.call('admin_overview'));
  }
  async grantPass(owner: string, passKind: PassKind, amount: number, note: string): Promise<void> {
    await this.call('admin_grant_pass', {
      p_owner: owner,
      p_kind: passKind,
      p_amount: amount,
      p_note: note,
    });
  }
  async revokePass(id: string): Promise<void> {
    await this.call('admin_revoke_pass', { p_pass: id });
  }
  async savePassSettings(settings: PassSettings): Promise<void> {
    await this.call('admin_set_setting', { p_key: 'pass', p_value: settings });
  }
  async saveSetting(
    key: 'donations' | 'templates' | 'features' | 'texts',
    value: unknown,
  ): Promise<void> {
    await this.call('admin_set_setting', { p_key: key, p_value: value });
  }
  async wirds(): Promise<AdminWird[]> {
    return list(await this.call('admin_wirds')).map((item) => {
      const wird = row(item);
      return {
        id: text(wird['id']),
        title: text(wird['title']),
        description: text(wird['description']),
        visibility: wird['visibility'] === 'private' ? 'private' : 'public',
        author: text(wird['author']),
        createdAt: text(wird['createdAt']),
        participants: count(wird['participants']),
        hidden: wird['hidden'] === true,
        reason: text(wird['reason']),
      };
    });
  }
  async hideWird(id: string, reason: string): Promise<void> {
    await this.call('admin_hide_wird', { p_wird: id, p_reason: reason });
  }
  async unhideWird(id: string): Promise<void> {
    await this.call('admin_unhide_wird', { p_wird: id });
  }
  async team(): Promise<AdminMember[]> {
    return list(await this.call('admin_team')).map((item) => {
      const member = row(item);
      return {
        id: text(member['id']),
        name: text(member['name']),
        contact: text(member['contact']),
        addedAt: text(member['addedAt']),
        isMe: member['isMe'] === true,
      };
    });
  }
  async addMember(contact: string): Promise<void> {
    await this.call('admin_add_member', { p_contact: contact });
  }
  async removeMember(id: string): Promise<void> {
    await this.call('admin_remove_member', { p_user: id });
  }
}
