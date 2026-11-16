import { Injectable, computed, inject, signal } from '@angular/core';
import { FRONTEND_GATEWAY, PublicationReceipt } from '../../../core/services/frontend-gateway';
import type { CreationDraft, LocalMedia } from '../../creation/data-access/creation-draft';
import { CreationDraftStore } from '../../creation/data-access/creation-draft';
import { WirdStore } from '../../../core/wird-store';
import { AuthFlow } from '../../auth/data-access/auth-flow';

const REQUEST_KEY = 'wirdlink.publication-request.v1';

export function isValidReceipt(receipt: PublicationReceipt): boolean {
  try {
    const url = new URL(receipt.shareUrl);
    return Boolean(
      receipt.id &&
        receipt.title &&
        ['public', 'private'].includes(receipt.visibility) &&
        url.origin === window.location.origin &&
        url.protocol === window.location.protocol &&
        !url.username &&
        !url.password &&
        url.pathname === '/wird/' + encodeURIComponent(receipt.id) &&
        !url.searchParams.has('code') &&
        (receipt.visibility === 'public' || /^\d{4}$/.test(receipt.accessCode ?? '')),
    );
  } catch {
    return false;
  }
}

@Injectable({ providedIn: 'root' })
export class PublicationFlow {
  private readonly gateway = inject(FRONTEND_GATEWAY);
  private readonly draft = inject(CreationDraftStore);
  private readonly auth = inject(AuthFlow);
  private readonly wirds = inject(WirdStore);
  private readonly confirmedReceipt = signal<PublicationReceipt | null>(null);
  private readonly receiptOwner = signal('');
  readonly receipt = computed(() =>
    this.auth.session()?.id === this.receiptOwner() ? this.confirmedReceipt() : null,
  );
  readonly busy = signal(false);
  readonly canPublish = computed(
    () =>
      this.draft.contentValid() &&
      this.draft.scheduleValid() &&
      !!this.auth.session() &&
      !this.busy(),
  );
  private requestId = '';
  private fingerprint = '';

  private draftFingerprint(): string {
    return JSON.stringify([
      this.auth.session()?.id,
      this.draft.draft(),
      this.draft.image()?.url,
      this.draft.audio()?.url,
    ]);
  }

  private async requestFingerprint(
    draft: CreationDraft,
    image: LocalMedia | null,
    audio: LocalMedia | null,
    ownerId: string,
  ): Promise<string> {
    const hash = async (value: ArrayBuffer): Promise<string> => {
      const digest = await crypto.subtle.digest('SHA-256', value);
      return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join(
        '',
      );
    };
    const mediaHash = async (media: LocalMedia | null): Promise<unknown> =>
      media ? [media.file.type, await hash(await media.file.arrayBuffer())] : null;
    const canonical = JSON.stringify([
      ownerId,
      draft.title.trim(),
      draft.description,
      draft.instructions ?? '',
      draft.target,
      draft.recurrence,
      draft.startDate,
      draft.endDate || null,
      draft.visibility,
      await mediaHash(image),
      await mediaHash(audio),
    ]);
    return hash(new TextEncoder().encode(canonical).buffer);
  }

  private reuseRequest(fingerprint: string): void {
    if (fingerprint === this.fingerprint) return;
    this.fingerprint = fingerprint;
    this.requestId = crypto.randomUUID();
    try {
      const raw = localStorage.getItem(REQUEST_KEY);
      const previous: unknown = raw ? JSON.parse(raw) : null;
      if (
        previous &&
        typeof previous === 'object' &&
        'fingerprint' in previous &&
        previous.fingerprint === fingerprint &&
        'requestId' in previous &&
        typeof previous.requestId === 'string' &&
        /^[a-f0-9-]{36}$/i.test(previous.requestId)
      ) {
        this.requestId = previous.requestId;
      }
      localStorage.setItem(REQUEST_KEY, JSON.stringify({ fingerprint, requestId: this.requestId }));
    } catch {
      // A storage restriction does not prevent publishing; retries in this tab remain stable.
    }
  }

  async publish(): Promise<boolean> {
    if (!this.canPublish()) return false;
    this.busy.set(true);
    try {
      const ownerId = this.auth.session()!.id;
      const draft = { ...this.draft.draft() };
      const image = this.draft.image();
      const audio = this.draft.audio();
      const snapshot = this.draftFingerprint();
      const fingerprint = await this.requestFingerprint(draft, image, audio, ownerId);
      this.reuseRequest(fingerprint);
      const receipt = await this.gateway.publish({
        requestId: this.requestId,
        draft,
        image,
        audio,
      });
      if (
        !isValidReceipt(receipt) ||
        receipt.visibility !== draft.visibility ||
        receipt.title !== draft.title.trim()
      )
        throw new Error('Invalid publication response');
      const published = await this.wirds.ensure(receipt.id);
      if (this.wirds.remote && !published) throw new Error('Publication read unavailable');
      if (this.auth.session()?.id !== ownerId) throw new Error('Publication identity changed');
      this.receiptOwner.set(ownerId);
      this.confirmedReceipt.set(receipt);
      const currentFingerprint = this.draftFingerprint();
      // An earlier request must never erase edits made while it was in flight.
      if (currentFingerprint === snapshot) {
        this.draft.discard();
        try {
          localStorage.removeItem(REQUEST_KEY);
        } catch {
          /* Retry metadata is harmless. */
        }
      }
      return true;
    } finally {
      this.busy.set(false);
    }
  }
}
