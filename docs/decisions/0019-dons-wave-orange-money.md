# 0019 — Dons facultatifs par Wave et Orange Money

Date : 17 novembre 2026. Statut : transfert manuel en place ; paiement Wave Checkout prêt mais inactif.

## Contexte

WirdLink reste gratuit. Le responsable souhaite recevoir des dons pour couvrir les frais,
avec des montants suggérés et un montant libre. Le mode développeur de son compte Wave Business
n’est pas encore activé : l’API Checkout n’est donc pas utilisable pour l’instant.

## Décision

- Page `/soutenir`, accessible depuis Réglages : 500, 1 000, 2 000, 5 000 F CFA ou un autre
  montant entre 100 et 500 000 F CFA.
- Wave et Orange Money suivent le même parcours : un panneau affiche le montant, le numéro
  76 557 83 79, un bouton pour le copier et la marche à suivre dans l’application de l’opérateur.
  Sur Android, Orange Money propose aussi de composer `#144#`.
- La fonction Supabase `wave-donation` (session Wave Checkout, `verify_jwt = false`) reste
  déployée sans clé et répond `not_configured`. Elle sera branchée sur le bouton Wave quand la
  clé `WAVE_API_KEY` sera ajoutée aux secrets Supabase.
- Les Règles d’utilisation précisent que les dons sont facultatifs et sans avantage.

## Limites

Aucun suivi des dons dans l’application. Le numéro est public, avec l’accord du responsable.
Le parcours doit être testé sur téléphone.
