# Revue globale frontend — 16 novembre 2026

## Périmètre et méthode

Lecture des routes, stores, formulaires, composants partagés, styles, tests, dépendances
et configuration qualité. Revue manuelle avec le skill local WirdLink ; compilation stricte,
Jasmine/Karma (68 tests réussis, lignes 89,80 %, branches 76,40 %) et contrôle Chrome/CDP reproductible. Aucun service Supabase ni fournisseur
externe n’est raccordé ou modifié pendant ce lot.

## Constats corrigés

| Gravité | Scénario et impact | Correction et preuve |
| --- | --- | --- |
| Haute | Deux soumissions avant navigation pouvaient réserver deux fois la même part. | Verrou immédiat après réservation, test de deux soumissions synchrones. |
| Haute | Une publication lente pouvait effacer un brouillon édité pendant l’attente. | Comparaison avec le contenu effectivement envoyé avant suppression ; test d’une réponse différée. |
| Haute | Des vues privées pouvaient montrer un titre si la navigation contournait l’écran d’accès. | Garde sur participation, participants et Merci ; filtrage de l’accueil ; tests d’accès direct et code incorrect. Le vrai contrôle devra aussi être serveur. |
| Moyenne | Les formulaires sans FormGroup écoutaient ngSubmit sans directive qui émette cet événement. | Soumission native avec prévention du rechargement et validations explicites ; tests utilisateur. |
| Moyenne | Un reçu inattendu pouvait afficher un faux succès et effacer le brouillon. | Vérification de l’origine, du chemin, du nom, de la visibilité et du code privé ; refus sans suppression. |
| Moyenne | Un nouveau modèle écrasait immédiatement le brouillon existant. | Confirmation de remplacement en plus de la suppression confirmée. |
| Moyenne | Le bouton de validation d’un code pouvait rester utilisable après une limitation de tentatives. | Délai de vérification distinct du délai de renvoi ; délai serveur rendu et action bloquée. |
| Moyenne | Une réponse asynchrone pouvait imposer une navigation après fermeture de sa page. | Vérification de la destruction avant redirection. |
| Moyenne | Le passage hors ligne n’actualisait pas toutes les actions visibles. | État réseau partagé, bannière, actions désactivées ; vérification navigateur. |
| Moyenne | L’en-tête d’accueil débordait avec un texte à 200 %. | Retour à la ligne de l’en-tête ; contrôle 320/390/1440 et texte à 200 %. |
| Basse | Le style WhatsApp pouvait repeindre en vert un bouton désactivé. | Couleur de marque limitée à l’état actif. |
| Basse | Des fichiers vides pouvaient créer un lecteur inutilisable. | Refus des fichiers de taille nulle, test dédié. |
| Basse | Le partage mobile et desktop pouvaient réutiliser les mêmes IDs. | Préfixe explicite par panneau, contrôle d’unicité dans Chrome. |

## Résultat fonctionnel

Les vues connexion et code, confirmation/partage mobile, accès privé, participants,
réglages, attente/erreur/hors ligne sont présentes. Les services non raccordés échouent
explicitement ; aucun envoi de code ni publication réelle n’est simulé. Les réponses de
succès sont exercées avec des ports substitués uniquement dans les tests.

L’entrée Réglages remplace l’ancien bouton Aide vocal sur l’accueil. Aide, informations et
règles restent accessibles depuis Réglages. L’onglet actif colore texte et icône en primaire,
avec fond léger derrière l’icône. Les consignes d’ouverture et la description sont facultatives,
restaurées séparément et masquées lorsqu’elles sont vides.

## Vérification reproductible

```sh
npm run test:coverage
npm run build
npm run check:frontend
```

`check:frontend` sert le build, démarre Chrome avec un profil temporaire et vérifie les parcours
participant/création, image portrait sans recadrage, audio WAV avec vraie lecture/pause,
restauration du texte sans faux maintien des fichiers, erreur de connexion sans faux envoi,
accès privé, partage, réglages, hors ligne, focus clavier des filtres et mouvement réduit.
Largeurs 320/390/1440, texte à 200 %. Captures dans le dossier temporaire du système.
Les assertions testent l’interface ; elles ne remplacent pas des tests serveur de concurrence
et de permissions. La recette sur iPhone/Android réels et lecteur d’écran reste à effectuer.

## Points restant ouverts avant mise en service

- **Qualité distante** : aucun binaire `sonar`/`sonar-scanner` ni outil MCP SonarQube disponible
  dans cette session. Aucun Quality Gate distant validé. Le workflow `.github/` fourni par
  l’utilisateur n’est pas modifié ; sa génération du build/LCOV est actuellement commentée.
  La clé locale `wirdlink` diffère de la clé explicite du workflow `Lamine517_wirdlink` ; le
  passage d’arguments du workflow la remplace pour ce scan, mais pas pour un lancement local.
- **Dépendances** : `npm audit` signale 16 dépendances modérées dans l’arbre de développement
  de l’Angular CLI, autour de glob/minimatch. `npm audit --omit=dev` ne signale aucune
  vulnérabilité connue. npm propose une mise à niveau majeure de la CLI ; aucune migration
  Angular majeure ni override incompatible n’a été appliqué pour masquer ces alertes.
- **Serveur** : authentification réelle, vérification des codes, limitation des essais,
  stockage des médias privés, autorisations, compteurs atomiques et idempotence durable
  après rechargement restent à implémenter et tester.
- **Produit** : les règles de cycles/expiration et les fournisseurs/coûts de messages restent
  ouverts ; les textes juridiques ne sont pas des documents validés. PWA/notifications réelles
  et synchronisation multi-appareils non livrées.

Ces limites ne bloquent pas la relecture des écrans frontend, mais interdisent de présenter
cette démonstration comme un service public prêt pour des données ou participations réelles.
