import { Injectable, inject, signal } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { FRONTEND_GATEWAY } from '../../../core/services/frontend-gateway';
import { WirdStore } from '../../../core/wird-store';

@Injectable({ providedIn: 'root' })
export class WirdAccess {
  private readonly gateway = inject(FRONTEND_GATEWAY);
  private readonly store = inject(WirdStore);
  private readonly allowed = signal<ReadonlySet<string>>(new Set());

  canRead(id: string): boolean {
    const wird = this.store.wirds().find((item) => item.id === id);
    return Boolean(
      wird && (this.store.remote || wird.visibility === 'public' || this.allowed().has(id)),
    );
  }

  async unlock(id: string, code: string): Promise<void> {
    if (!id || !/^\d{4}$/.test(code)) throw new Error('Invalid access request');
    const wird = await (this.store.remote
      ? this.store.unlock(id, code)
      : this.gateway.unlock(id, code));
    if (
      wird.id !== id ||
      wird.visibility !== 'private' ||
      !Number.isSafeInteger(wird.target) ||
      wird.target < 1 ||
      !Number.isSafeInteger(wird.completed) ||
      wird.completed < 0 ||
      wird.completed > wird.target ||
      !wird.title.trim()
    )
      throw new Error('Invalid access response');
    if (!this.store.remote)
      this.store.wirds.update((items) => [...items.filter((item) => item.id !== id), wird]);
    this.allowed.update((items) => new Set([...items, id]));
  }
}

export const readableWird: CanActivateFn = async (route) => {
  const store = inject(WirdStore);
  const access = inject(WirdAccess);
  const router = inject(Router);
  const id = route.paramMap.get('id') ?? '';
  if (store.remote) {
    const known = store.wirds().some((wird) => wird.id === id);
    if (known) {
      void store.ensure(id);
    } else {
      try {
        await store.ensure(id);
      } catch {
        return router.createUrlTree(['/'], { queryParams: { retry: 'true' } });
      }
    }
  }
  const wird = store.wirds().find((item) => item.id === id);
  // Unknown local examples use the existing not-found screen; no content is disclosed.
  return (
    (!wird && !store.remote) ||
    access.canRead(id) ||
    router.createUrlTree(['/acces', id], {
      queryParams: route.routeConfig?.path?.endsWith('/participants')
        ? { view: 'participants' }
        : {},
    })
  );
};
