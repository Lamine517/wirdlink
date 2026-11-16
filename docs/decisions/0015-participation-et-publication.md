# 0015 — Participation sans compte et publication fiable

Date : 16 novembre 2026. Statut : le client relie une session invitée au même compte, et la migration `stabilize_publication` est appliquée. Les sessions anonymes et la liaison manuelle restent à confirmer dans le tableau de bord.

## Contexte

Un participant sans session permanente ne peut pas réserver : Auth du projet
`unhcqgwexwmxkwkwvgbl` annonce `anonymous_users: false`. Le client appelle déjà
`signInAnonymously`, puis la réservation échoue. Une publication avec une session
Google peut aussi échouer alors que le brouillon est valide : validation Auth
momentanément indisponible, date de début devenue passée, ou fichier photo/voix
dont le type déclaré par le téléphone n’est pas celui attendu par Storage.

## Décision

La participation sans formulaire reste une session anonyme Supabase, distincte
du compte responsable exigé pour publier. `config.toml` active ce fournisseur
pour le développement local. Le projet hébergé doit avoir le même réglage :
Authentication → Sign In / Providers → Anonymous Sign-Ins. Tant qu’il est
désactivé, le client explique l’indisponibilité au lieu d’un simple message de
connexion.

Une session invitée qui se connecte ensuite avec Google ou un email reste le
même compte, donc ses parts suivent. Si ce compte existe déjà, l’application
le dit et n’échange la session qu’après un choix explicite. Cette liaison
exige Anonymous Sign-Ins et Manual Linking dans Auth. Une validation Auth
interrompue n’annule pas une session permanente déjà présente. Un rafraîchissement de jeton sans session ne vide pas l’identité en
cours. Les types `image/jpg` et `audio/x-m4a` sont publiés comme JPEG et MP4,
formats déjà acceptés par le bucket. Une date de début locale d’un jour avant
la date UTC reste acceptée par la fonction de publication. Le client propose
de ramener à aujourd’hui une date déjà passée.

## Vérification

Tests Angular des types de fichiers, du repli de session et du refus explicite
lorsque les sessions anonymes sont désactivées. La migration
`20261116221420_stabilize_publication` est appliquée sur
`unhcqgwexwmxkwkwvgbl` : une date de début locale d’un jour avant la date UTC
est acceptée, et l’envoi d’un fichier exige un compte permanent lu dans
`auth.users`, plus le jeton. Le rôle anonyme ne peut pas appeler cette
vérification. L’utilisateur a confirmé avoir activé Anonymous Sign-Ins et Manual Linking
dans le tableau de bord. Cet environnement ne relit pas ce réglage Auth.
