# 0003 — Interface compacte et formulaire guidé

- Date : 2026-11-15
- Statut : accepté, demande utilisateur et revue des profils UI/UX et frontend
- Remplace : tailles par défaut et boutons de la décision 0002 ; structure des pages conservée

## Présentation

Nunito Sans en rem : page 24 px, carte 20 px, corps/actions 16 px, informations secondaires
et navigation 14 px (racine 16 px). Boutons principaux 56 px, secondaires au moins 48 px.
Cartes de 16 px de padding, marges resserrées et en-tête plus compact, sans réduction
artificielle des cibles tactiles ni blocage du zoom. Le cadre téléphone centré reste inchangé.

## Filtres

Le fond apparaît progressivement en 240 ms ; le panneau se déplace de 40 px avec fondu
en 360 ms. La fermeture dure 200 ms et conserve le dialogue ouvert jusqu'à sa fin pour
maintenir le focus et empêcher les interactions avec l'arrière-plan. Échap, fond et bouton
Fermer suivent la même fermeture. Aucun mouvement si `prefers-reduced-motion` est actif.

## Formulaire

Quantité vide initialement avec placeholder Ex. 10 et aide de 1 au reste disponible.
Erreur rouge après interaction seulement ; un champ vide intact ne produit pas d'alerte.
Choix Sans nom par défaut. Mon nom affiche un champ avec placeholder Ex. Awa et une aide
sur sa visibilité. Les vrais labels sont conservés : le placeholder ne les remplace pas.

Je commence n'est rendu que si la quantité est un entier entre 1 et le disponible, et si
le nom est valide quand choisi. Sinon, une indication explique la prochaine action.
La soumission clavier conserve les mêmes contrôles et ne peut contourner ce masquage.

## Vérification

18 tests Jasmine/Karma réussis ; couverture de lignes 88,84 %. Build dans les budgets.
Chrome Headless : parcours complet, CTA initialement absent, erreur puis correction,
clavier/focus du panneau, tailles 320/390/1440, texte à 200 % et mouvement réduit.
Revue statique du rendu par le profil UI/UX ; aucun Quality Gate distant exécuté.
