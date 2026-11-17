# 0019 — Dons facultatifs par Wave et Orange Money

Date : 17 novembre 2026. Statut : page et fonction déployées ; la clé Wave reste à ajouter par le responsable.

## Contexte

WirdLink reste gratuit. Le responsable souhaite recevoir des dons pour couvrir les frais,
avec des montants suggérés, un montant libre et une redirection vers l’opérateur choisi.
Il dispose d’un compte Wave Business et d’un numéro Orange Money personnel.

## Décision

- Page `/soutenir`, accessible depuis Réglages : 500, 1 000, 2 000, 5 000 F CFA ou un autre
  montant entre 100 et 500 000 F CFA.
- Wave : la fonction Supabase `wave-donation` crée une session de l’API Checkout Wave avec
  le montant, puis l’application redirige vers `wave_launch_url`. La clé `WAVE_API_KEY` (et
  `WAVE_SIGNING_SECRET` si la clé a été créée avec signature) est un secret Supabase, jamais
  exposé au navigateur. Sans clé, la fonction répond `not_configured`.
- Orange Money : aucun lien public ne préremplit un transfert vers un numéro personnel. La page
  affiche le montant et le numéro, propose de le copier, et ouvre `#144#` sur Android.
- La fonction accepte les visiteurs sans session (`verify_jwt = false`) : elle ne lit aucune
  donnée et ne redirige que vers `https://pay.wave.com/`.
- Les Règles d’utilisation précisent que les dons sont facultatifs et sans avantage.

## Limites

Pas de webhook ni de reçu : le retour `?don=merci` indique seulement que Wave a redirigé.
Aucune limitation de fréquence sur la création de sessions. Le numéro Orange Money est public,
avec l’accord du responsable. Le parcours réel doit être testé sur téléphone après ajout de la clé.
