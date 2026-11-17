# 0020 — Statistiques du créateur et offre organisateur

Date : 17 novembre 2026. Statut : statistiques livrées ; offre organisateur reportée.

## Statistiques globales du créateur

- La page Mon profil affiche « Mes wirds en chiffres » dès que le compte a publié un wird :
  nombre de wirds, participants distincts, lectures terminées, objectifs atteints sur le nombre
  de cycles, puis un lien vers le suivi de chaque wird.
- La fonction `creator_stats()` est réservée aux comptes connectés et ne renvoie que des totaux
  par jour (fuseau Africa/Dakar). Aucun nom ni identifiant de participant ne quitte la base.
- Un wird « Une fois » compte pour un cycle ; le cycle en cours entre dans le total.
- Pas de tableau de bord de toute l’application pour le responsable : non demandé à ce stade.

## Offre organisateur (choix du responsable, non implémentés)

- Contenu payant envisagé : statistiques détaillées, historique complet des cycles, plusieurs
  responsables par wird, logo de la dahira, rappels SMS ou WhatsApp, plus de wirds privés.
- Paiement de départ : transfert Wave ou Orange Money au numéro, puis activation manuelle.
- Calendrier : plus tard, quand des dahiras utilisent réellement l’application.

Restent à décider avant toute implémentation : prix et durée, limites de l’offre gratuite
(nombre de wirds privés, profondeur de l’historique), sort des statistiques aujourd’hui gratuites
pour les créateurs existants, fournisseur de rappels et son coût.
