# 0009 — Socle Supabase

- Date : 2026-11-16
- Statut : accepté pour le socle technique ; activation progressive
- Responsable : coordination technique WirdLink

## Contexte

La v2 retient Supabase et une participation sans formulaire de compte. Le projet
dédié est accessible ; le frontend possède une frontière de services fermée
tant que les opérations réelles ne sont pas raccordées.

## Options

Des écritures directes du client avec RLS seule ne suffisent pas à garantir les
compteurs concurrents. Des fonctions transactionnelles bornées permettent de
garder ces invariants dans PostgreSQL, sans introduire un autre serveur.

## Décision

Le projet dédié `unhcqgwexwmxkwkwvgbl` héberge les données réelles, séparées
des exemples locaux. Aucun remplacement silencieux de la démonstration.

Les responsables sont des utilisateurs Supabase permanents. Les participants
pourront utiliser une session anonyme Supabase, sans formulaire de compte.
Une simple chaîne d’identification d’appareil ne donne aucun droit.

Les tables exposées ont RLS et des droits explicites. Les mutations de publication,
réservation et confirmation passent par des fonctions : validation serveur,
identifiant de requête idempotent et verrou du wird pour les réservations.
Le nombre disponible est l’objectif moins toutes les parts ; seules les parts
confirmées contribuent au nombre lu. La confirmation répétée ne recompte rien.
Les noms des participants et les identifiants de responsables ne sont pas publics.

Les fonctions privilégiées sont dans un schéma non exposé, avec `search_path`
fixe et contrôle de `auth.uid()`. Les fonctions API sont des enveloppes invoker.
Les médias restent dans un bucket privé, sous un dossier du propriétaire.

## Limites et activation

Le socle conserve les dates et la fréquence, sans inventer de remise à zéro,
expiration de part ou notification automatique. Ces règles restent à arbitrer.
Les codes privés restent lisibles uniquement par leur propriétaire. L’ouverture
par code nécessite encore une limitation des essais côté serveur avant activation.
Les sessions anonymes, fournisseurs téléphone/Google/Apple et callbacks doivent
être configurés avant de raccorder les parcours réels. Aucun fournisseur payant
n’est choisi automatiquement. L’authentification Angular est raccordée au SDK
avec PKCE, reprise vérifiée et déconnexion. Les fournisseurs désactivés restent
indisponibles ; les opérations de publication restent fermées jusqu’au
raccordement complet des lectures et médias.

## Conséquences et validation

Tests SQL transactionnels avec utilisateurs fictifs, rôles anon/authenticated,
contrôles d’accès croisés, rejets des dépassements et répétition des mutations.
Les fixtures sont annulées par rollback. Les tests ne contactent aucun téléphone.
Un contrôle distinct sur deux connexions a confirmé le rejet du dépassement
concurrent ; ses fixtures ont été supprimées. Aucun rollback destructif de la
migration n’est exécuté automatiquement : toute correction ultérieure passe par
une nouvelle migration, afin de préserver les futures données.
