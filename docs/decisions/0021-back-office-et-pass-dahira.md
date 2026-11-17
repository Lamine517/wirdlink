# 0021 — Back office et Pass dahira

Date : 17 novembre 2026. Statut : livré (accès admin, Pass dahira, dons, modèles, fonctionnalités, modération, textes).

## Contexte

Le responsable veut piloter l’application depuis un back office plutôt que dans le code.
Périmètre retenu, par étapes : pass, dons, modèles de wirds, fonctionnalités, modération,
textes ciblés. Ordre choisi : d’abord l’accès admin et les réglages, puis le Pass dahira
complet (décision 0020). Les administrateurs sont le responsable et quelques personnes de
confiance qu’il ajoute lui-même.

## Décisions

- Équipe : table privée `wirdlink_private.admins`. Aucun accès direct depuis le client ;
  chaque fonction `admin_*` revérifie l’appartenance dans la base. Le back office a une adresse non
  listée (`ADMIN_PATH` dans `admin-guard.ts`), seulement masquée côté client : un visiteur qui
  n’est pas de l’équipe est renvoyé à l’accueil, comme pour une adresse inconnue. Le dernier membre ne peut pas être retiré.
  Le premier membre est ajouté à la main en SQL ; ensuite l’équipe se gère depuis le back office.
- Ajout d’un membre par e-mail ou téléphone d’un compte existant (non anonyme).
- Réglages : table `public.app_settings` lisible par tous, modifiable seulement par
  `admin_set_setting`, qui valide chaque clé (`valid_setting`) : `pass`, `donations`,
  `templates`, `features`, `texts`. Le client (`AppConfig`) garde des valeurs par défaut
  identiques à l’application d’avant : sans réglage lisible, rien ne change.
- L’offre est désactivée par défaut. Désactivée : page Pass masquée, aucune limite.
- Limite de wirds avec code : appliquée par `publish_wird` seulement si l’offre est active
  et que la date « Limite appliquée à partir du » est passée. Elle compte les wirds avec
  code en cours (sans date de fin ou date de fin non passée). Les wirds existants ne sont
  jamais bloqués ; seule la publication d’un nouveau wird avec code est refusée.
- Pass : enregistrements datés (`trial`, `month`, `year`, `founder`). Un nouveau pass commence
  à la fin du précédent. Essai : une fois par compte, lancé par le créateur. Places fondateur
  limitées par le réglage, comptées par compte ; un fondateur peut renouveler à ce prix.
- Paiement manuel : le créateur paie par Wave ou Orange Money (même numéro que les dons),
  puis un membre de l’équipe enregistre le pass depuis le back office avec le montant et une note.
- Avantages livrés : wirds avec code au-delà de la limite, historique complet du suivi de
  chaque wird. Rappel dans Mon profil pendant les derniers jours (réglage « Rappel »).
- L’offre n’est montrée qu’à la limite : message à la publication, mention sous le suivi
  après 7 périodes, lien dans Mon profil seulement après un premier pass ou à la limite.
- Le back office est en français uniquement ; les écrans créateur sont traduits.
- Navigation : un menu de tuiles avec icône ouvre chaque rubrique sur sa propre page
  (`ADMIN_PATH/<rubrique>`, liste dans `admin-sections.ts`), protégée par le même garde.

## Phase 2 : autres rubriques

- Dons : page Soutenir activable, 1 à 6 montants, minimum et maximum, numéro à 9 chiffres
  (aussi utilisé pour le Pass), Wave et Orange Money activables séparément.
- Modèles : 0 à 12 modèles (nom, objectif, icône parmi une liste fixe), ordre modifiable.
  Chaque modèle peut porter la formule en arabe, sa prononciation et une explication en français.
  Les trois s’affichent sur la carte et remplissent la description, que le créateur peut modifier.
  L’explication française est aussi montrée aux lecteurs en anglais. « Mon propre wird » reste
  toujours proposé en premier. Les wirds existants ne changent pas.
- Fonctionnalités : tasbih, photo et note vocale. Désactiver masque l’entrée dans l’interface ;
  la route du tasbih renvoie vers Mes parts. Les médias déjà publiés restent visibles et la
  base ne refuse pas un envoi de média : c’est un réglage d’interface, pas une sécurité.
- Modération : un wird masqué (`wirdlink_private.hidden_wirds`) n’est plus lisible par
  `can_read_wird`, donc ni affiché, ni rejoignable, ni déverrouillable par code, ni lisible
  dans le stockage. Son créateur le voit encore, avec un message. Rien n’est supprimé ;
  l’équipe peut le réafficher. Les wirds avec code ne sont listés que masqués et sans leur
  contenu ; on les masque à partir du lien signalé.
- Textes : annonce sur l’accueil (500 caractères), pages Aide et Règles d’utilisation
  réécrites (6 000 caractères, paragraphes séparés par une ligne vide). Une langue vide
  affiche le français ; tout vide garde le texte d’origine traduit.

## Limites et suites

- Rapprochement du paiement : le transfert ne porte pas l’identité du compte. L’équipe
  doit vérifier le reçu avec le créateur avant d’enregistrer le pass.
- Les Règles d’utilisation disent encore « projet bénévole et gratuit » : à reformuler
  avant d’activer l’offre.
- Non livrés : co-responsables, logo de dahira, rappels SMS/WhatsApp, signalement d’un wird
  par les participants, historique des modifications des réglages.
- Le numéro de paiement est modifiable par toute l’équipe : n’y ajouter que des personnes
  de confiance.
