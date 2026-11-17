# 0017 — Accueil centré sur les wirds ouverts et heure des participations

- Date : 2026-11-17
- Statut : accepté, demande utilisateur
- Responsable : coordination technique WirdLink

## Contexte

L’accueil proposait un choix En cours / Terminés hérité de la maquette (0001).
Depuis les cycles (0016), un wird récurrent atteint passait dans « Terminés »
puis revenait le lendemain. Un wird dont la date de fin était passée restait
« En cours » alors que la réservation est refusée. La liste des participants ne
disait pas quand chacun avait pris sa part.

## Décision

L’accueil ne liste que les wirds où l’on peut encore participer. Un wird
récurrent dont l’objectif est atteint y reste avec « Objectif atteint. Il
recommence demain » ou le jour du prochain cycle. Un wird qui n’a pas commencé
indique sa date de début, sans bouton de participation. Un wird `Une fois`
atteint, ou dont la date de fin est passée, rejoint une section repliée
« Wirds terminés » en bas de l’accueil. Le choix En cours / Terminés est
retiré, la feuille Filtrer garde la fréquence et la visibilité.

Chaque personne de la liste des participants affiche le moment de sa dernière
part du cycle, en temps relatif dans la langue choisie. Cette heure est visible
par toute personne qui peut lire le wird.

## Conséquences et validation

La migration `20261117102804_participant_times` ajoute `createdAt` à
`wird_participants`, sans changer son contrôle d’accès. Les tests couvrent le
temps relatif, l’état d’un wird selon son cycle et la carte. Le classement
utilise le jour Africa/Dakar au chargement de l’accueil.
