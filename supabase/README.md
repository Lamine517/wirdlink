# Backend WirdLink

Projet dédié : `unhcqgwexwmxkwkwvgbl` (Europe, Londres).

## Socle livré

- Tables `wirds` et `parts`, RLS et droits de colonnes explicites.
- Codes des wirds privés dans le schéma non exposé `wirdlink_private`.
- RPC `publish_wird`, `reserve_part`, `finish_part` pour les sessions authentifiées.
- Réservation sérialisée par verrou du wird ; idempotence par utilisateur/requête.
- Bucket `wird-media` privé, maximum 10 Mio, images et audio autorisés.

Les fonctions vérifient l’identité Supabase. La publication exige un utilisateur
permanent ; une session anonyme peut uniquement réserver et confirmer ses parts.
Les réservations restent comptées après confirmation : le disponible ne baisse
pas une deuxième fois. Le client ne peut modifier directement les tables.

## Vérification

`tests/publication-security.sql` s’exécute via un client SQL administrateur sur
une base portant la migration. Le script ouvre une transaction, crée des
utilisateurs fictifs sans téléphone, teste les rôles, puis annule les fixtures.
Il n’envoie aucun message. Ne pas retirer le `rollback`.

Contrôles : publication permanente, refus d’un participant anonyme, accès public
et privé, absence de fuite des identifiants, séparation des parts, idempotence,
quantités disponibles, double confirmation et politiques Storage.
Le script teste les quantités séquentiellement. Un contrôle complémentaire sur
deux connexions simultanées a été exécuté le 16 novembre 2026 : deux réservations
de 600 pour un objectif de 1 000, une seule acceptée, total final 600. Les fixtures
ont ensuite été supprimées. Cela ne remplace pas un test de charge.

Les tests transactionnels et l’analyse de sécurité Supabase ont passé. L’analyse
de performance indique deux index encore inutilisés sur cette base vide ; ils
sont conservés pour les listes publiques et les accès du propriétaire.

Docker n’est pas démarré dans l’environnement de travail : le reset local de la
base n’a pas été exécuté. La migration a été appliquée et testée sur le projet
dédié, avec l’historique distant comme référence de version.

## Raccordement restant

L’application conserve sa démonstration locale et son adaptateur indisponible.
Ne pas remplacer celui-ci par un simple succès après insertion : les lectures
distantes, médias autorisés, reprise de session et erreurs doivent être raccordés
ensemble. Aucun secret serveur ne doit être ajouté au bundle Angular.

Avant activation des parcours réels :

1. Configurer les fournisseurs téléphone, Google et Apple, avec leurs callbacks.
2. Activer les sessions anonymes avec protection contre les créations abusives.
3. Ajouter l’ouverture privée avec limitation effective des essais côté serveur,
   puis l’autorisation de lecture et de réservation correspondante.
4. Exposer uniquement les compteurs agrégés et les noms volontairement choisis,
   sans identifiants utilisateur ni téléphone.
5. Donner accès aux médias joints via des URL signées après contrôle du wird.
6. Raccorder le client Supabase et conserver une séparation explicite du mode démo.

La fréquence est enregistrée ; aucun cycle, rappel, expiration ou coût de service
n’est activé par cette migration.
