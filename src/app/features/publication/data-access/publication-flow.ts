import { Injectable, computed, inject, signal } from '@angular/core';
import { FRONTEND_GATEWAY, PublicationReceipt } from '../../../core/services/frontend-gateway';
import { CreationDraftStore } from '../../creation/data-access/creation-draft';
import { AuthFlow } from '../../auth/data-access/auth-flow';

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
  private readonly confirmedReceipt = signal<PublicationReceipt | null>(null);
  readonly receipt = this.confirmedReceipt.asReadonly();
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

  async publish(): Promise<boolean> {
    if (!this.canPublish()) return false;
    this.busy.set(true);
    try {
      const draft = { ...this.draft.draft() };
      const image = this.draft.image();
      const audio = this.draft.audio();
      const fingerprint = JSON.stringify([draft, image?.url, audio?.url]);
      if (fingerprint !== this.fingerprint) {
        this.fingerprint = fingerprint;
        this.requestId = crypto.randomUUID();
      }
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
      this.confirmedReceipt.set(receipt);
      const currentFingerprint = JSON.stringify([
        this.draft.draft(),
        this.draft.image()?.url,
        this.draft.audio()?.url,
      ]);
      // An earlier request must never erase edits made while it was in flight.
      if (currentFingerprint === fingerprint) this.draft.discard();
      return true;
    } finally {
      this.busy.set(false);
    }
  }
}
