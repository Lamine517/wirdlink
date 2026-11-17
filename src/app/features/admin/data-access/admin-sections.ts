import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { IconName } from '../../../shared/components/icon/icon';
import { ADMIN_PATH } from './admin-guard';

export type AdminSectionId =
  | 'chiffres'
  | 'createurs'
  | 'wirds'
  | 'pass'
  | 'dons'
  | 'modeles'
  | 'textes'
  | 'fonctions'
  | 'equipe';

export interface AdminSection {
  id: AdminSectionId;
  label: string;
  title: string;
  icon: IconName;
}

export const ADMIN_SECTIONS: readonly AdminSection[] = [
  { id: 'chiffres', label: 'Chiffres', title: 'Chiffres', icon: 'chart' },
  { id: 'createurs', label: 'Créateurs', title: 'Créateurs', icon: 'users' },
  { id: 'wirds', label: 'Wirds', title: 'Wirds publiés', icon: 'book' },
  { id: 'pass', label: 'Pass', title: 'Pass dahira', icon: 'ticket' },
  { id: 'dons', label: 'Dons', title: 'Dons', icon: 'coins' },
  { id: 'modeles', label: 'Modèles', title: 'Modèles de wirds', icon: 'grid' },
  { id: 'textes', label: 'Textes', title: 'Textes', icon: 'text' },
  { id: 'fonctions', label: 'Fonctions', title: 'Fonctionnalités', icon: 'toggle' },
  { id: 'equipe', label: 'Équipe', title: 'Équipe', icon: 'shield' },
];

export function adminSection(id: string | null | undefined): AdminSection | null {
  return ADMIN_SECTIONS.find((section) => section.id === id) ?? null;
}

/** Sends unknown section addresses back to the back office menu. */
export const adminSectionGuard: CanActivateFn = (route) =>
  adminSection(route.paramMap.get('section')) !== null ||
  inject(Router).createUrlTree(['/', ADMIN_PATH]);
