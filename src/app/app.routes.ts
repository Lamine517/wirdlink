import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./features/wirds/pages/home-page/home-page').then((m) => m.HomePage),
    title: 'Mes wirds · WirdLink',
  },
  {
    path: 'mes-parts',
    loadComponent: () =>
      import('./features/participation/pages/my-parts-page/my-parts-page').then(
        (m) => m.MyPartsPage,
      ),
    title: 'Mes parts · WirdLink',
  },
  {
    path: 'wird/:id',
    loadComponent: () =>
      import('./features/participation/pages/participate-page/participate-page').then(
        (m) => m.ParticipatePage,
      ),
    title: 'Je participe · WirdLink',
  },
  {
    path: 'merci/:id',
    loadComponent: () =>
      import('./features/participation/pages/thank-you-page/thank-you-page').then(
        (m) => m.ThankYouPage,
      ),
    title: 'Merci · WirdLink',
  },
  {
    path: 'creer',
    loadComponent: () =>
      import('./features/creation/pages/create-page/create-page').then((m) => m.CreatePage),
    title: 'Créer · WirdLink',
  },
  { path: '**', redirectTo: '' },
];
