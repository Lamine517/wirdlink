import { contentReady, scheduleReady } from './features/creation/guards/draft-guards';
import { Routes } from '@angular/router';
import { readableWird } from './features/access/data-access/wird-access';

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
    path: 'mes-parts/:id/compteur',
    loadComponent: () =>
      import('./features/tasbih/pages/tasbih-page/tasbih-page').then((m) => m.TasbihPage),
    title: 'Mon tasbih · WirdLink',
  },
  {
    path: 'wird/:id',
    canActivate: [readableWird],
    loadComponent: () =>
      import('./features/participation/pages/participate-page/participate-page').then(
        (m) => m.ParticipatePage,
      ),
    title: 'Je participe · WirdLink',
  },
  {
    path: 'merci/:id',
    canActivate: [readableWird],
    loadComponent: () =>
      import('./features/participation/pages/thank-you-page/thank-you-page').then(
        (m) => m.ThankYouPage,
      ),
    title: 'Merci · WirdLink',
  },
  {
    path: 'wird/:id/participants',
    canActivate: [readableWird],
    loadComponent: () =>
      import('./features/participation/pages/participants-page/participants-page').then(
        (m) => m.ParticipantsPage,
      ),
    title: 'Les participants · WirdLink',
  },
  {
    path: 'preferences',
    loadComponent: () =>
      import('./features/preferences/pages/preferences-page/preferences-page').then(
        (m) => m.PreferencesPage,
      ),
    title: 'Réglages · WirdLink',
  },
  {
    path: 'acces/:id',
    loadComponent: () =>
      import('./features/access/pages/access-page/access-page').then((m) => m.AccessPage),
    title: 'Accès privé · WirdLink',
  },
  {
    path: 'profil',
    loadComponent: () =>
      import('./features/profile/pages/profile-page/profile-page').then((m) => m.ProfilePage),
    title: 'Mon profil · WirdLink',
  },
  {
    path: 'connexion',
    canActivate: [contentReady, scheduleReady],
    loadComponent: () =>
      import('./features/auth/pages/sign-in-page/sign-in-page').then((m) => m.SignInPage),
    title: 'Connexion · WirdLink',
  },
  {
    path: 'connexion/retour',
    loadComponent: () =>
      import('./features/auth/pages/sign-in-page/sign-in-page').then((m) => m.SignInPage),
    title: 'Votre connexion · WirdLink',
  },
  {
    path: 'partage',
    loadComponent: () =>
      import('./features/publication/pages/share-page/share-page').then((m) => m.SharePage),
    title: 'Partager · WirdLink',
  },
  {
    path: 'partage/:id',
    loadComponent: () =>
      import('./features/publication/pages/share-page/share-page').then((m) => m.SharePage),
    title: 'Partager ce wird · WirdLink',
  },
  {
    path: 'creer',
    loadComponent: () =>
      import('./features/creation/pages/create-page/create-page').then((m) => m.CreatePage),
    title: 'Créer · WirdLink',
  },
  {
    path: 'creer/contenu',
    loadComponent: () =>
      import('./features/creation/pages/content-page/content-page').then((m) => m.ContentPage),
    title: 'Mon wird · WirdLink',
  },
  {
    path: 'creer/calendrier',
    canActivate: [contentReady],
    loadComponent: () =>
      import('./features/creation/pages/schedule-page/schedule-page').then((m) => m.SchedulePage),
    title: 'Quand ? · WirdLink',
  },
  {
    path: 'creer/apercu',
    canActivate: [contentReady, scheduleReady],
    loadComponent: () =>
      import('./features/creation/pages/preview-page/preview-page').then((m) => m.PreviewPage),
    title: 'Aperçu · WirdLink',
  },

  {
    path: 'aide',
    loadComponent: () =>
      import('./features/information/pages/information-page').then((m) => m.InformationPage),
    title: 'Aide · WirdLink',
    data: {
      title: 'Comment participer ?',
      paragraphs: [
        'Choisissez un wird, puis Je participe. Choisissez votre quantité et confirmez avec Je commence.',
        'Retrouvez vos engagements dans Mes parts. Touchez J’ai fini après votre lecture.',
        'Dans cette démonstration, vos parts restent sur ce navigateur. La création prépare un brouillon, sans publication.',
      ],
    },
  },
  {
    path: 'confidentialite',
    loadComponent: () =>
      import('./features/information/pages/information-page').then((m) => m.InformationPage),
    title: 'Vos informations · WirdLink',
    data: {
      title: 'Vos informations',
      paragraphs: [
        'Cette démonstration conserve les parts, le nom choisi et le texte du brouillon dans le stockage de ce navigateur.',
        'La connexion Google et votre profil sont gérés par Supabase. Les informations du profil restent facultatives.',
        'Votre prénom, votre nom et votre organisation peuvent apparaître comme auteur de vos wirds. Votre adresse reste privée.',
        'Depuis Mon profil, vous pouvez modifier vos informations, vous déconnecter ou supprimer votre compte et vos wirds.',
        'Les photos et fichiers audio choisis restent dans la session et ne sont pas envoyés à un serveur.',
        'Le partage ouvre le service choisi. Les textes de confidentialité définitifs seront relus avant la publication du service.',
      ],
    },
  },
  {
    path: 'conditions',
    loadComponent: () =>
      import('./features/information/pages/information-page').then((m) => m.InformationPage),
    title: 'Règles d’utilisation · WirdLink',
    data: {
      title: 'Règles d’utilisation',
      paragraphs: [
        'WirdLink est un projet bénévole et gratuit. Cette version est une démonstration.',
        'Les compteurs ne sont pas encore partagés entre appareils. Aucun brouillon n’est publié.',
        'Les conditions définitives restent à faire valider avant ouverture du service.',
      ],
    },
  },
  { path: '**', redirectTo: '' },
];
