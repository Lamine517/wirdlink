# 0021 — Back office et Pass dahira

Date : 17 novembre 2026. Statut : phase 1 livrée (accès admin, réglages du pass, pass complet).

## Contexte

Le responsable veut piloter l’application depuis un back office plutôt que dans le code.
Périmètre retenu, par étapes : pass, dons, modèles de wirds, fonctionnalités, modération,
textes ciblés. Ordre choisi : d’abord l’accès admin et les réglages, puis le Pass dahira
complet (décision 0020). Les administrateurs sont le responsable et quelques personnes de
confiance qu’il ajoute lui-même.

## Décisions

- Équipe : table privée `wirdlink_private.admins`. Aucun accès direct depuis le client ;
  chaque fonction `admin_*` revérifie l’appartenance dans la base. La route `/admin` est
  seulement masquée côté client (`adminGuard`). Le dernier membre ne peut pas être retiré.
  Le premier membre est ajouté à la main en SQL ; ensuite l’équipe se gère depuis `/admin`.
- Ajout d’un membre par e-mail ou téléphone d’un compte existant (non anonyme).
- Réglages : table `public.app_settings` lisible par tous, modifiable seulement par
  `admin_set_setting`, qui valide le contenu. Seule la clé `pass` existe pour l’instant ;
  chaque nouveau domaine (dons, modèles…) ajoutera sa clé et sa validation.
- L’offre est désactivée par défaut. Désactivée : page Pass masquée, aucune limite.
- Limite de wirds avec code : appliquée par `publish_wird` seulement si l’offre est active
  et que la date « Limite appliquée à partir du » est passée. Elle compte les wirds avec
  code en cours (sans date de fin ou date de fin non passée). Les wirds existants ne sont
  jamais bloqués ; seule la publication d’un nouveau wird avec code est refusée.
- Pass : enregistrements datés (`trial`, `month`, `year`, `founder`). Un nouveau pass commence
  à la fin du précédent. Essai : une fois par compte, lancé par le créateur. Places fondateur
  limitées par le réglage, comptées par compte ; un fondateur peut renouveler à ce prix.
- Paiement manuel : le créateur paie par Wave ou Orange Money (même numéro que les dons),
  puis un membre de l’équipe enregistre le pass depuis `/admin` avec le montant et une note.
- Avantages livrés : wirds avec code au-delà de la limite, historique complet du suivi de
  chaque wird. Rappel dans Mon profil pendant les derniers jours (réglage « Rappel »).
- L’offre n’est montrée qu’à la limite : message à la publication, mention sous le suivi
  après 7 périodes, lien dans Mon profil seulement après un premier pass ou à la limite.
- Le back office est en français uniquement ; les écrans créateur sont traduits.

## Limites et suites

- Rapprochement du paiement : le transfert ne porte pas l’identité du compte. L’équipe
  doit vérifier le reçu avec le créateur avant d’enregistrer le pass.
- Les Règles d’utilisation disent encore « projet bénévole et gratuit » : à reformuler
  avant d’activer l’offre.
- Non livrés : co-responsables, logo de dahira, rappels SMS/WhatsApp, et les autres domaines
  du back office (dons, modèles, fonctionnalités, modération, textes).
