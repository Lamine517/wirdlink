# WirdLink

Application Angular pour créer et partager des wirds. Parcours frontend : accueil,
participation, Mes parts, création, aperçu, connexion, accès privé et partage mobile.
Les réservations et brouillons utilisent encore des données locales de démonstration.
Les écrans de connexion et publication affichent une indisponibilité tant qu’un service
vérifié n’est pas raccordé ; aucun code ni aucune publication n’est simulé.

```sh
npm ci
npm start
```

Ouvrir http://localhost:4200. Chrome est nécessaire aux tests :

```sh
npm run test:coverage
npm run build
npm run check:frontend
```

Le contrôle navigateur nécessite Chrome et Node.js 22 ou plus. Définir `CHROME_BIN`
si Chrome n’est pas à son emplacement habituel. Il utilise un profil temporaire isolé
et conserve les captures dans le dossier temporaire du système.


Interface française, Nunito Sans locale et icônes Phosphor. Supabase et la PWA restent
à intégrer ; cette version ne publie aucune réservation sur un serveur.
