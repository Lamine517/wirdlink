# WirdLink

Application Angular pour créer et partager des wirds. Parcours frontend : accueil,
participation, tasbih lié à chaque part, Mes parts, création, aperçu, connexion, accès privé
et partage mobile. Apparence automatique, claire ou sombre dans Réglages.
L’accueil démarre vide, sans wird de démonstration. Les anciens exemples et leurs
parts locales sont retirés au chargement ; les comptes et les profils sont conservés.
La connexion Google utilise Supabase Auth avec reprise de session et retour OAuth PKCE.
L’avatar ouvre le profil : prénom, nom et organisation facultative,
déconnexion et suppression du compte avec ses wirds. Les onglets Téléphone et Email
affichent « Bientôt ». Réglages conserve apparence, rappels et aide.
La publication reste indisponible jusqu’au raccordement complet
des données ; aucune publication n’est simulée.

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

- [Avancement et limites](docs/avancement.md)
- [Exigences produit](docs/exigences-produit.md)
- [Qualité et SonarQube](docs/qualite.md)
- [Conventions](CONVENTIONS.md)
- [Profils de l'équipe](docs/agents/README.md)

Interface française, Nunito Sans locale et icônes Phosphor. Le schéma Supabase et
ses tests figurent dans `supabase/`. Les réservations distantes restent
à raccorder ; cette version ne publie aucune réservation sur un serveur.

Déploiement Vercel : `vercel.json` configure Angular, `npm ci`, `npm run build`
et le dossier `dist/wirdlink/browser`, avec retour SPA pour les liens directs.
Après déploiement, autoriser l’URL exacte `/connexion/retour` du domaine retenu
dans Supabase Auth. Les secrets serveur restent dans Supabase Edge Functions.

Pour le nom de l’écran Google, configurer « WirdLink » dans Google Auth Platform
→ Branding et faire vérifier la marque. Tant que la marque et le domaine ne sont
pas configurés, Google peut afficher le domaine `supabase.co` du projet.

La PWA utilise un manifeste et le service worker Angular : installation proposée
sur l’accueil, instructions Safari, icônes WirdLink et coque disponible hors ligne.
Seuls les fichiers statiques sont mis en cache, sans les réponses Supabase ni le
retour OAuth. Sur mobile, l’interface prend toute la largeur ; le cadre de 390 px
reste réservé au desktop.
