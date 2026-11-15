import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./features/participant-page').then((m) => m.ParticipantPage),
    title: 'Mes wirds · WirdLink',
  },
  {
    path: 'mes-parts',
    loadComponent: () => import('./features/participant-page').then((m) => m.ParticipantPage),
    data: { view: 'parts' },
    title: 'Mes parts · WirdLink',
  },
  {
    path: 'wird/:id',
    loadComponent: () => import('./features/participant-page').then((m) => m.ParticipantPage),
    data: { view: 'participate' },
    title: 'Je participe · WirdLink',
  },
  {
    path: 'merci/:id',
    loadComponent: () => import('./features/participant-page').then((m) => m.ParticipantPage),
    data: { view: 'thanks' },
    title: 'Merci · WirdLink',
  },
  {
    path: 'creer',
    loadComponent: () => import('./features/participant-page').then((m) => m.ParticipantPage),
    data: { view: 'create' },
    title: 'Créer · WirdLink',
  },
  { path: '**', redirectTo: '' },
];
