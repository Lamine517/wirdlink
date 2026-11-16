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
    return Boolean(wird && (wird.visibility === 'public' || this.allowed().has(id)));
  }

  async unlock(id: string, code: string): Promise<void> {
    if (!id || !/^\d{4}$/.test(code)) throw new Error('Invalid access request');
    const wird = await this.gateway.unlock(id, code);
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
    this.store.wirds.update((items) => [...items.filter((item) => item.id !== id), wird]);
    this.allowed.update((items) => new Set([...items, id]));
  }
}

export const readableWird: CanActivateFn = (route) => {
  const store = inject(WirdStore);
  const access = inject(WirdAccess);
  const id = route.paramMap.get('id') ?? '';
  const wird = store.wirds().find((item) => item.id === id);
  // Unknown local examples use the existing not-found screen; no content is disclosed.
  return (
    !wird ||
    access.canRead(id) ||
    inject(Router).createUrlTree(['/acces', id], {
      queryParams: route.routeConfig?.path?.endsWith('/participants')
        ? { view: 'participants' }
        : {},
    })
  );
};
