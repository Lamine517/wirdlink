# 0006 — Retour dans l’historique de l’application

- Date : 2026-11-16
- Statut : appliqué

Les retours généraux utilisaient des destinations fixes. Réglages renvoyait toujours à
Mes parts, même depuis l’accueil ; Aide ne revenait pas à Réglages.

Un composant BackButton appelle désormais NavigationHistory, qui utilise Location.back()
lorsqu’une entrée précédente est identifiée comme interne à WirdLink. Un compteur de
profondeur est inscrit dans history.state, sans URL ni donnée personnelle, en préservant
navigationId d’Angular. Il est restauré après rechargement. Les navigations remplacées
et les retours navigateur ne créent pas artificiellement de profondeur.

Sans historique interne, le repli est l’accueil, ou l’aperçu pour la connexion. Aucun
historique externe n’est utilisé sur une première ouverture directe. Un double appui
ne déclenche pas deux retours. Les étapes de création conservent leur destination
précédente explicite pour éviter les boucles lors de la modification d’un aperçu.

Contrôles : 72 tests réussis, build réussi, script Chrome validé sur Accueil → Réglages →
Aide et retours, Mes parts → Réglages → retour, rechargement et ouverture directe.

Référence : https://angular.dev/api/common/Location

Favoris et tasbih ont été discutés comme propositions produit. Ils ne sont pas implémentés
par cette correction et ne modifient aucun compteur collectif.
