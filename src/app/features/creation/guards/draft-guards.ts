import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { CreationDraftStore } from '../data-access/creation-draft';

export const contentReady: CanActivateFn = () =>
  inject(CreationDraftStore).contentValid() || inject(Router).createUrlTree(['/creer/contenu']);

export const scheduleReady: CanActivateFn = () =>
  inject(CreationDraftStore).scheduleValid() || inject(Router).createUrlTree(['/creer/calendrier']);
