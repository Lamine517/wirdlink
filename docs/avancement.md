# Avancement du développement

## Premier lot — parcours participant local

Disponible : accueil basé sur Figma P1, filtre d'état et de récurrence, saisie de quantité,
choix du nom ou Sans nom, réservation, Mes parts, confirmation de lecture et Merci.
Les dix perles affichent les lectures terminées ; le reste exclut les parts réservées.
Les doubles confirmations ne comptent pas une seconde fois. Les parts et le nom choisi
sont conservés dans le stockage du navigateur, avec validation des données relues et
message si la sauvegarde est indisponible. Sans connexion, les actions d'écriture sont refusées.

La bannière identifie explicitement les données de démonstration. Aucun compteur n'est partagé
entre appareils ; les données initiales sont fictives. La synthèse vocale lit le résumé affiché,
pas une note vocale du responsable ni une récitation. Créer indique le prochain lot sans simuler une publication.
Pas encore de PWA installable, Supabase, connexion, wird privé, récurrence ou notification.
Le filtre de visibilité et les autres fréquences seront ajoutés avec les données correspondantes.
Le panneau de partage desktop fait partie d'un prochain lot ; l'application est actuellement centrée.

Nunito Sans 600/800 est hébergée localement avec sa licence OFL. Les SVG Phosphor sont
les exports Figma d'origine ; leur licence est conservée dans les assets. Les dimensions
suivent les arbitrages : texte minimum 20 px et boutons principaux minimum 68 px.
Les exports Figma comportent des tailles inférieures : l'écart est intentionnel et documenté.

## Vérifications du 15 novembre 2026

- Build de production réussi, dans les budgets Angular.
- 11 tests Jasmine/Karma réussis : navigation, parcours complet, bornes, restauration,
  sauvegarde invalide/indisponible, filtres et absence de double comptage.
- Couverture LCOV : 85,36 % des lignes, 77,61 % des branches ; ce résultat local ne valide pas le Quality Gate distant.
- Chrome Headless : réservation de 10, Mes parts, J'ai fini, Merci avec reste 390,
  puis rechargement réussi. Aucune exception JavaScript relevée pendant ce parcours.
- Rendu inspecté à 390 et 1440 px ; contrôle de débordement à 320 px.
  Police locale chargée et images présentes vérifiées dans le navigateur.
- Limites : pas de test sur appareil iPhone/Android réel, ni d'audit d'accessibilité exhaustif.

## Styles et qualité

Les modules partagés sont dans `src/styles/` (variables, mixins, reset, typographie,
formulaires, composants UI). Le nommage BEM et les méthodes/propriétés anglaises sont
précisés dans les conventions. Voir [la préparation SonarQube](qualite.md) : rapport LCOV
généré par `npm run test:coverage`, scanner distant non exécuté sans serveur configuré.

## Lancement

```sh
npm ci
npm start
```

Ouvrir http://localhost:4200. Les données sont propres à l'origine du navigateur.
Pour repartir à zéro : effacer la clé `wirdlink.demo.v1` du stockage local dans les outils
de développement. Ne pas y saisir de données personnelles réelles pour ces essais.

## Suite

Parcours de création avec brouillon, puis contrat de données/permissions Supabase et
intégration serveur. Les règles de cycle, d'expiration et les fournisseurs/coûts doivent
être explicités avant les fonctions concernées.
