import { Injectable, inject } from '@angular/core';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { LocalMedia } from '../../features/creation/data-access/creation-draft';
import {
  GuestAccessError,
  InvalidCodeError,
  PrivateLimitError,
  RateLimitError,
  ServiceUnavailableError,
} from '../services/frontend-gateway';
import { publicationContentType, publicationExtension } from '../media-file';
import type { PublicationReceipt, PublicationRequest } from '../services/frontend-gateway';
import type {
  CreatorStats,
  PartMutation,
  WirdRepository,
  WirdChanges,
  WirdStats,
} from '../services/wird-repository';
import type { Part, Wird } from '../wird-store';
import { SUPABASE_CLIENT } from './supabase-client';

function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    throw new ServiceUnavailableError();
  return value as Record<string, unknown>;
}
function string(value: unknown): string {
  if (typeof value !== 'string') throw new ServiceUnavailableError();
  return value;
}
function integer(value: unknown, minimum = 0): number {
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < minimum)
    throw new ServiceUnavailableError();
  return value;
}
function visibility(value: unknown): 'public' | 'private' {
  if (value !== 'public' && value !== 'private') throw new ServiceUnavailableError();
  return value;
}
function optionalString(value: unknown): string | undefined {
  return value === null || value === undefined ? undefined : string(value);
}
function optionalDate(value: unknown): string | undefined {
  const date = optionalString(value);
  if (date === undefined) return undefined;
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
    Number.isNaN(Date.parse(date)) ||
    new Date(date).toISOString().slice(0, 10) !== date
  )
    throw new ServiceUnavailableError();
  return date;
}
function part(value: unknown, snakeCase = false): Part {
  const row = record(value);
  if (typeof row['finished'] !== 'boolean') throw new ServiceUnavailableError();
  const createdAt = row[snakeCase ? 'created_at' : 'createdAt'];
  return {
    id: string(row['id']),
    wirdId: string(row[snakeCase ? 'wird_id' : 'wirdId']),
    quantity: integer(row['quantity'], 1),
    name: string(row['name']),
    finished: row['finished'],
    createdAt:
      typeof createdAt === 'string' && !Number.isNaN(Date.parse(createdAt)) ? createdAt : undefined,
  };
}
function array(value: unknown): unknown[] {
  if (!Array.isArray(value)) throw new ServiceUnavailableError();
  return value;
}

@Injectable({ providedIn: 'root' })
export class SupabaseWirdRepository implements WirdRepository {
  private readonly client = inject(SUPABASE_CLIENT);

  private async run<T>(operation: (client: SupabaseClient) => Promise<T>): Promise<T> {
    try {
      return await operation(await this.client());
    } catch (error) {
      if (
        error instanceof InvalidCodeError ||
        error instanceof RateLimitError ||
        error instanceof GuestAccessError ||
        error instanceof PrivateLimitError
      )
        throw error;
      throw new ServiceUnavailableError();
    }
  }
  private async rpc(
    client: SupabaseClient,
    name: string,
    args?: Record<string, unknown>,
  ): Promise<unknown> {
    const { data, error } = await client.rpc(name, args);
    if (error?.message === 'private_limit') throw new PrivateLimitError();
    if (error) throw new ServiceUnavailableError();
    return data;
  }
  private async mapWirds(client: SupabaseClient, values: unknown[]): Promise<Wird[]> {
    const rows = values.map(record);
    const paths = [
      ...new Set(
        rows
          .flatMap((row) => [optionalString(row['image_path']), optionalString(row['audio_path'])])
          .filter((path): path is string => !!path),
      ),
    ];
    const urls = new Map<string, string>();
    if (paths.length) {
      const { data, error } = await client.storage.from('wird-media').createSignedUrls(paths, 3600);
      if (error || !data) throw new ServiceUnavailableError();
      for (const item of data) {
        if (item.error || !item.path || !item.signedUrl) throw new ServiceUnavailableError();
        urls.set(item.path, item.signedUrl);
      }
      if (paths.some((path) => !urls.has(path))) throw new ServiceUnavailableError();
    }
    return rows.map((row) => {
      const recurrence = row['recurrence'];
      if (
        recurrence !== 'Une fois' &&
        recurrence !== 'Tous les jours' &&
        recurrence !== 'Chaque semaine' &&
        recurrence !== 'Chaque vendredi'
      )
        throw new ServiceUnavailableError();
      const target = integer(row['target'], 1);
      const completed = integer(row['completed']);
      const reserved = integer(row['reserved']);
      if (completed + reserved > target) throw new ServiceUnavailableError();
      return {
        isOwner: row['is_owner'] === true,
        id: string(row['id']),
        title: string(row['title']),
        description: string(row['description']),
        instructions: string(row['instructions']),
        target,
        completed,
        reserved,
        recurrence,
        visibility: visibility(row['visibility']),
        startDate: optionalDate(row['start_date']),
        endDate: optionalDate(row['end_date']),
        imageUrl: urls.get(optionalString(row['image_path']) ?? ''),
        audioUrl: urls.get(optionalString(row['audio_path']) ?? ''),
      };
    });
  }
  update(id: string, changes: WirdChanges): Promise<Wird> {
    return this.run(async (client) => {
      const identity = await this.identity();
      const result = await this.rpc(client, 'update_wird', { p_wird_id: id, p_changes: changes });
      const wird = (await this.mapWirds(client, [result]))[0];
      if (!identity || identity !== (await this.identity())) throw new ServiceUnavailableError();
      return wird;
    });
  }
  delete(id: string): Promise<void> {
    return this.run(async (client) => {
      const userId = await this.identity();
      if (!userId) throw new ServiceUnavailableError();
      const { data, error } = await client
        .from('wirds')
        .select('image_path,audio_path')
        .eq('id', id)
        .maybeSingle();
      if (error) throw new ServiceUnavailableError();
      await this.rpc(client, 'delete_wird', { p_wird_id: id });
      // Delete only this owner's exact referenced objects, after the ownership-checked RPC.
      const row = data ? record(data) : {};
      const paths = [optionalString(row['image_path']), optionalString(row['audio_path'])].filter(
        (path): path is string => !!path && path.startsWith(userId + '/'),
      );
      if (paths.length) {
        try {
          await this.assertIdentity(client, userId);
          await client.storage.from('wird-media').remove(paths);
        } catch {
          /* The record is deleted. Private orphan files are purged with account deletion. */
        }
      }
    });
  }
  titles(): Promise<string[]> {
    return this.run(async (client) => {
      if (!(await this.identity())) return [];
      const { data, error } = await client
        .from('wird_titles')
        .select('title')
        .order('used_at', { ascending: false })
        .limit(50);
      if (error) throw new ServiceUnavailableError();
      return array(data).map((value) => string(record(value)['title']));
    });
  }
  watchIdentity(listener: (id: string | null) => void): () => void {
    let active = true;
    let stop = () => {};
    void this.client()
      .then((client) => {
        if (!active) return;
        const { data } = client.auth.onAuthStateChange((event, session) => {
          // A token refresh can briefly report no session. That is not a sign-out.
          if (active && !(event === 'TOKEN_REFRESHED' && !session))
            listener(session?.user.id ?? null);
        });
        stop = () => data.subscription.unsubscribe();
      })
      .catch(() => {
        if (active) listener(null);
      });
    return () => {
      active = false;
      stop();
    };
  }
  identity(): Promise<string | null> {
    return this.run(async (client) => {
      const { data, error } = await client.auth.getSession();
      if (error) throw new ServiceUnavailableError();
      return data.session?.user.id ?? null;
    });
  }
  listWirds(): Promise<Wird[]> {
    return this.run(async (client) =>
      this.mapWirds(client, array(await this.rpc(client, 'read_wirds'))),
    );
  }
  getWird(id: string): Promise<Wird | null> {
    return this.run(async (client) => {
      const { data, error } = await client.rpc('read_wird', { p_wird_id: id });
      if (error?.code === '42501' || error?.code === 'PGRST116') return null;
      if (error) throw new ServiceUnavailableError();
      return data === null ? null : (await this.mapWirds(client, [data]))[0];
    });
  }
  listParts(): Promise<Part[]> {
    return this.run(async (client) => {
      const { data: session, error: authError } = await client.auth.getSession();
      if (authError) throw new ServiceUnavailableError();
      if (!session.session) return [];
      const { data, error } = await client
        .from('parts')
        .select('id,wird_id,quantity,name,finished,created_at');
      if (error) throw new ServiceUnavailableError();
      return array(data).map((value) => part(value, true));
    });
  }
  private async participantSession(client: SupabaseClient): Promise<string> {
    const { data, error } = await client.auth.getSession();
    if (error) throw new ServiceUnavailableError();
    if (data.session) return data.session.user.id;
    const result = await client.auth.signInAnonymously();
    if (result.error?.code === 'anonymous_provider_disabled') throw new GuestAccessError();
    if (result.error || !result.data.session) throw new ServiceUnavailableError();
    return result.data.session.user.id;
  }
  private async assertIdentity(client: SupabaseClient, userId: string): Promise<void> {
    const { data, error } = await client.auth.getSession();
    if (error || data.session?.user.id !== userId) throw new ServiceUnavailableError();
  }
  private async mutation(client: SupabaseClient, value: unknown): Promise<PartMutation> {
    const row = record(value);
    return { part: part(row['part']), wird: (await this.mapWirds(client, [row['wird']]))[0] };
  }
  reserve(id: string, quantity: number, name: string, requestId: string): Promise<PartMutation> {
    return this.run(async (client) => {
      const userId = await this.participantSession(client);
      const result = await this.mutation(
        client,
        await this.rpc(client, 'reserve_wird_part', {
          p_request_id: requestId,
          p_wird_id: id,
          p_quantity: quantity,
          p_name: name,
        }),
      );
      await this.assertIdentity(client, userId);
      return result;
    });
  }
  finish(partId: string): Promise<PartMutation> {
    return this.run(async (client) =>
      this.mutation(client, await this.rpc(client, 'finish_wird_part', { p_part_id: partId })),
    );
  }
  listParticipants(id: string): Promise<Part[]> {
    return this.run(async (client) =>
      array(await this.rpc(client, 'wird_participants', { p_wird_id: id })).map((value) =>
        part(value),
      ),
    );
  }
  stats(id: string): Promise<WirdStats | null> {
    return this.run(async (client) => {
      const data = await this.rpc(client, 'wird_stats', { p_wird_id: id });
      if (data === null) return null;
      const row = record(data);
      return {
        participants: integer(row['participants'], 0),
        days: array(row['days']).map((value) => {
          const day = record(value);
          const date = string(day['day']);
          if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new ServiceUnavailableError();
          return {
            day: date,
            finished: day['finished'] === null ? 0 : integer(day['finished'], 0),
            reserved: day['reserved'] === null ? 0 : integer(day['reserved'], 0),
          };
        }),
      };
    });
  }
  creatorStats(): Promise<CreatorStats | null> {
    return this.run(async (client) => {
      const data = await this.rpc(client, 'creator_stats');
      if (data === null) return null;
      const row = record(data);
      return {
        participants: integer(row['participants'], 0),
        wirds: array(row['wirds']).map((value) => {
          const wird = record(value);
          return {
            id: string(wird['id']),
            days: array(wird['days']).map((entry) => {
              const day = record(entry);
              const date = string(day['day']);
              if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new ServiceUnavailableError();
              return { day: date, finished: integer(day['finished'], 0) };
            }),
          };
        }),
      };
    });
  }
  unlock(id: string, code: string): Promise<Wird> {
    return this.run(async (client) => {
      const userId = await this.participantSession(client);
      const result = record(await this.rpc(client, 'unlock_wird', { p_wird_id: id, p_code: code }));
      if (result['error'] === 'invalid_code') throw new InvalidCodeError();
      if (result['error'] === 'rate_limited') throw new RateLimitError();
      const wird = (await this.mapWirds(client, [result['wird']]))[0];
      await this.assertIdentity(client, userId);
      return wird;
    });
  }
  private async upload(
    client: SupabaseClient,
    media: LocalMedia | null,
    kind: 'image' | 'audio',
    userId: string,
    requestId: string,
  ): Promise<string | null> {
    if (!media) return null;
    const contentType = publicationContentType(kind, media.file);
    const extension = contentType ? publicationExtension(contentType) : null;
    if (!contentType || !extension || media.file.size === 0 || media.file.size > 10 * 1024 * 1024)
      throw new ServiceUnavailableError();
    const digest = await crypto.subtle.digest('SHA-256', await media.file.arrayBuffer());
    const hash = Array.from(new Uint8Array(digest), (byte) =>
      byte.toString(16).padStart(2, '0'),
    ).join('');
    const path = `${userId}/${requestId}/${kind}-${hash}.${extension}`;
    const { error } = await client.storage
      .from('wird-media')
      .upload(path, media.file, { upsert: false, contentType });
    if (error && String(error.statusCode) !== '409') throw new ServiceUnavailableError();
    return path;
  }
  publish(request: PublicationRequest): Promise<PublicationReceipt> {
    return this.run(async (client) => {
      const user = await this.responsibleUser(client);
      const imagePath = await this.upload(
        client,
        request.image,
        'image',
        user.id,
        request.requestId,
      );
      const audioPath = await this.upload(
        client,
        request.audio,
        'audio',
        user.id,
        request.requestId,
      );
      const draft = request.draft;
      const result = await this.rpc(client, 'publish_wird', {
        p_request_id: request.requestId,
        p_draft: {
          title: draft.title.trim(),
          description: draft.description,
          instructions: draft.instructions ?? '',
          target: draft.target,
          recurrence: draft.recurrence,
          startDate: draft.startDate,
          endDate: draft.endDate || null,
          imagePath,
          audioPath,
          visibility: draft.visibility,
        },
      });
      const id = typeof result === 'string' ? result : string(record(result)['id']);
      const receipt = await this.receipt(client, id);
      if (!receipt) throw new ServiceUnavailableError();
      return receipt;
    });
  }
  private async responsibleUser(client: SupabaseClient): Promise<{ id: string }> {
    const verified = await client.auth.getUser();
    if (!verified.error && verified.data.user) {
      if (verified.data.user.is_anonymous !== false) throw new ServiceUnavailableError();
      return verified.data.user;
    }
    // A transient Auth check must not block a permanent session. The database still enforces it.
    const stored = await client.auth.getSession();
    const user = stored.data.session?.user;
    if (stored.error || !user || user.is_anonymous !== false) throw new ServiceUnavailableError();
    return user;
  }
  private async receipt(client: SupabaseClient, id: string): Promise<PublicationReceipt | null> {
    const { data, error } = await client.rpc('publication_receipt', { p_wird_id: id });
    if (error?.code === '42501' || (data === null && !error)) return null;
    if (error) throw new ServiceUnavailableError();
    const row = record(data);
    const receiptId = string(row['id']);
    return {
      id: receiptId,
      title: string(row['title']),
      visibility: visibility(row['visibility']),
      shareUrl: `${window.location.origin}/wird/${encodeURIComponent(receiptId)}`,
      accessCode: optionalString(row['accessCode']),
    };
  }
  getPublicationReceipt(id: string): Promise<PublicationReceipt | null> {
    return this.run((client) => this.receipt(client, id));
  }
}
