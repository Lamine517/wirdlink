import { AuthFlow } from './features/auth/data-access/auth-flow';
import { inject } from '@angular/core';
import { WirdStore } from './core/wird-store';
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
    canActivate: [
      async (route) => {
        const store = inject(WirdStore);
        const auth = inject(AuthFlow);
        await auth.ready;
        const id = route.paramMap.get('id') ?? '';
        if (store.parts().some((part) => part.id === id)) void store.refresh();
        else await store.refresh();
        return true;
      },
    ],
    loadComponent: () =>
      import('./features/tasbih/pages/tasbih-page/tasbih-page').then((m) => m.TasbihPage),
    title: 'Mon tasbih · WirdLink',
  },
  {
    path: 'wird/:id/modifier',
    canActivate: [readableWird],
    loadComponent: () =>
      import('./features/wirds/pages/edit-wird-page/edit-wird-page').then((m) => m.EditWirdPage),
    title: 'Modifier le wird · WirdLink',
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
        'Pour créer un wird, choisissez Créer, renseignez son nom et son objectif, puis vérifiez l’aperçu. Connectez-vous pour le publier.',
        'Dans le menu Plus de votre wird, vous pouvez le modifier, le partager, le dupliquer ou le supprimer.',
        'Dans Réglages, vous pouvez choisir la langue et le thème, ou installer l’application sur votre écran d’accueil.',
        'Pour compter vos lectures, ouvrez Mes parts puis le compteur. Chaque appui ajoute une lecture. À la fin, confirmez avec J’ai fini.',
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
        'Votre brouillon et votre compteur restent sur cet appareil. Vos wirds et vos parts sont enregistrés avec votre session.',
        'Vous pouvez vous connecter avec Google ou un lien reçu par email. Votre profil est facultatif.',
        'Votre prénom, votre nom et votre organisation peuvent apparaître comme auteur de vos wirds. ',
        'Depuis Mon profil, vous pouvez modifier vos informations, vous déconnecter ou supprimer votre compte et vos wirds.',
        'À la publication, vos photos et fichiers audio sont enregistrés dans un espace protégé et accessibles aux personnes autorisées à voir le wird.',
        'Un wird public est visible par toute personne qui possède son lien. Un wird avec un code demande ce code. Partagez-le seulement avec les personnes de votre choix.',
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
        'WirdLink est un projet bénévole et gratuit.',
        'Les parts sont réservées au moment de leur confirmation. Confirmez vos lectures terminées pour actualiser la progression collective.',
        'Publiez seulement les textes, images et audios que vous avez le droit de partager. Ne publiez pas les informations personnelles d’une autre personne sans son accord.',
      ],
    },
  },
  { path: '**', redirectTo: '' },
];
