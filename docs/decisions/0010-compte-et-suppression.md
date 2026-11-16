# 0010 — Avatar et suppression du compte

- Date : 2026-11-16
- Statut : accepté
- Responsable : coordination technique WirdLink

## Contexte et options

L’utilisateur demande un avatar jaune avec l’initiale après connexion et la
possibilité de supprimer son compte. Le 16 novembre, il choisit explicitement
de supprimer aussi les wirds créés par le compte, plutôt que de les anonymiser.

## Décision

Le nom Google est utilisé uniquement pour l’affichage ; les droits restent basés
sur l’identité vérifiée par Supabase. Aucun avatar distant n’est téléchargé.

Une confirmation dans Réglages annonce la suppression du compte, des wirds
créés, des participations associées et du brouillon local. Une Edge Function
vérifie le bearer auprès d’Auth et déduit seule l’utilisateur à supprimer. Aucun
identifiant cible ni secret administrateur n’est accepté du navigateur.

La suppression prépare un état bloquant les nouvelles écritures, supprime les
fichiers via Storage, les données métier, révoque les sessions puis supprime
l’utilisateur via Auth Admin. Les opérations peuvent être reprises après échec.
Une erreur partielle est présentée comme une suppression non terminée.
Les mutations et téléversements vérifient que le compte existe et n’est pas en
cours de suppression : les anciens JWT ne permettent pas de recréer des données.

## Conséquences et validation

Les parts prises par d’autres utilisateurs sur les wirds supprimés disparaissent
aussi. Les parts du compte sur d’autres wirds sont retirées, libérant la quantité.
Les sessions anonymes ne disposent pas de cette action de compte responsable.
La suppression ne retire pas le compte Google lui-même et ne promet pas de
supprimer instantanément les sauvegardes du fournisseur.

Tests du handler serveur avec services isolés, tests SQL des permissions et
suppression transactionnelle, tests Angular de confirmation/échec/succès et avatar.
Aucun compte réel n’est supprimé pendant la validation.
