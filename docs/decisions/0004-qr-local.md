# 0004 — QR généré localement pour la vue web

- Date : 2026-11-15
- Statut : accepté comme choix technique dans la demande de compléter Web: accueil

Le QR décrit par la maquette est généré dans le navigateur avec `qrcode` et ses types,
versions exactes dans le lockfile, chargé à la demande. Aucun lien n'est envoyé à un
service QR externe. Le QR ne s'affiche pas pour localhost/loopback : un téléphone
ouvrirait sa propre adresse locale. Le partage ne transmet pas de brouillon local.
Comparer cette petite dépendance à réimplémenter le codage QR : la bibliothèque réduit
les risques d'un code invalide et reste testable sans réseau.
