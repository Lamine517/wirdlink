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
Le panneau de filtres présente état, récurrence et visibilité ; les jeux de démonstration ne contiennent que des wirds publics quotidiens ou du vendredi. Les autres choix peuvent donc donner un état vide.
Le panneau de partage desktop fait partie d'un prochain lot ; l'application est centrée dans un cadre de téléphone, avec défilement interne.

Nunito Sans 600/800 est hébergée localement avec sa licence OFL. Les SVG Phosphor sont
les exports Figma d'origine ; leur licence est conservée dans les assets. Les dimensions
suivent les arbitrages : hiérarchie 28/24/18/16 px en rem (décision 0002), cibles tactiles 48 px et boutons principaux 68 px.
Les exports Figma comportent des tailles inférieures : l'écart est intentionnel et documenté.

## Vérifications du 15 novembre 2026

- Build de production réussi, dans les budgets Angular.
- 14 tests Jasmine/Karma réussis : navigation, parcours complet, bornes, restauration,
  sauvegarde invalide/indisponible, filtres et absence de double comptage.
- Couverture LCOV : 87,98 % des lignes, 77,33 % des branches ; ce résultat local ne valide pas le Quality Gate distant.
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

## Refonte des pages et de l’interface

Chaque route charge une page dédiée dans `features/<domaine>/pages/`. Cartes, filtres
et sélecteur de quantité sont dans les dossiers `components/` de leur domaine.
La jauge, le panneau inférieur et l’état vide sont dans `shared/components/`.
Plus de page unique qui branche tous les parcours avec un `@switch`.

Le logo original Figma est intégré. La typographie est rééquilibrée. Le dépassement
affiche immédiatement une bordure rouge et un message, sans attendre la soumission.
Le panneau de filtres est un dialogue inférieur avec gestion clavier/focus.
Le cadre desktop tient dans la fenêtre ; le contenu défile à l’intérieur.
Effets de survol/appui et animations respectent la préférence de mouvement réduit.
Voir la décision 0002 pour les contrôles effectués et leurs limites.

## Ajustements de densité et de guidage

La décision 0003 remplace les tailles précédentes : 24/20/16/14 px, boutons principaux 56 px.
Panneau de filtres avec fond progressif et fermeture animée. Quantité initiale vide,
placeholders, erreurs après interaction et action visible uniquement lorsque les champs
sont valides. Revue UI/UX effectuée avec le profil dédié.

Dernière vérification : 18 tests réussis, couverture des lignes 88,84 %, build réussi et
parcours Chrome vérifié. Les chiffres des lots antérieurs ci-dessus restent historiques.

## Participation visuelle

Le résumé textuel objectif/reste est remplacé par un composant partagé `circular-progress` :
nom du wird, lectures terminées, objectif et pourcentage dans un cercle bleu pétrole,
repère doré, puis disponibles/en cours. La quantité choisie reste distincte de l'avancement
collectif ; elle ne modifie le cercle qu'une fois réellement terminée.
La demande « prix » a été clarifiée par l'utilisateur comme parts prises/progression,
sans ajout de tarification. Les textes d'accompagnement sont raccourcis.

19 tests réussis, 89,13 % des lignes couvertes, build et parcours Chrome validés.
Le nouveau cercle a été inspecté visuellement à 390 px ; les tests vérifient aussi que
le choix d'une quantité ne modifie pas les lectures terminées.
