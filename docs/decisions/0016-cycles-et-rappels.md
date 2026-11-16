# 0016 — Cycles d’objectif et rappel la veille

- Date : 2026-11-16
- Statut : accepté, demande utilisateur
- Responsable : coordination technique WirdLink

## Contexte

Choisir une fréquence doit réinitialiser l’objectif. Une semaine ou un vendredi
sans rappel la veille ne sert pas. Les sommes de parts comptaient jusqu’ici
toutes les réservations, et l’écran du calendrier disait que l’objectif ne
recommençait pas. Aucun fournisseur d’email n’est relié. Le fuseau produit est
celui du Sénégal, Africa/Dakar, sans heure d’été.

## Décision

`Une fois` garde le même objectif jusqu’à la fin. `Tous les jours` ne compte
que les parts du jour. `Chaque semaine` reprend le jour de la semaine du
premier jour, par blocs de sept jours. `Chaque vendredi` reprend chaque
vendredi ; les jours qui précèdent le premier vendredi forment un cycle court.
Les parts des cycles passés restent enregistrées, mais ne remplissent plus
l’objectif, la liste des participants ni Mes parts.

La veille d’un nouveau cycle hebdomadaire ou du vendredi, WirdLink affiche un
rappel et envoie une notification si la personne l’a autorisée dans Réglages.
Le rappel concerne le responsable et les personnes qui ont une part. Il n’est
pas envoyé s’il n’y a plus de cycle suivant. L’email sortant n’est pas branché :
aucun service d’envoi n’est configuré. L’heure silencieuse et le fournisseur
WhatsApp ou SMS restent ouverts.

## Conséquences et validation

La migration `20261116225050_reset_wird_cycles` est appliquée sur
`unhcqgwexwmxkwkwvgbl`. Elle remplace les totaux, la réservation, le plancher
de l’objectif et la liste des participants. Les tests du calcul de cycle
couvrent le jour, la semaine, le vendredi et le rappel. Le tableau de bord Auth
a été confirmé par l’utilisateur pour les sessions anonymes et la liaison manuelle.
