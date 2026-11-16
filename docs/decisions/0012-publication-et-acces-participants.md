# 0012 — Publication et accès aux participants

Date : 16 novembre 2026. Statut : appliqué au backend WirdLink dédié, tests transactionnels distants réussis.

## Décision

La publication appelle le RPC existant avec une session permanente (Google dans cette version).
Une session anonyme Supabase permet seulement la participation et le déblocage sans formulaire.
Son activation dans Auth est indépendante de la publication Google.

Les lectures passent par des RPC à DTO explicites, limités à 1 000 wirds par liste. Les totaux
`completed` et `reserved` représentent respectivement les lectures terminées et les parts en cours ;
le disponible vaut `target - completed - reserved`. La fin est facultative. Les nouvelles publications
et les nouvelles tentatives idempotentes normalisent titre, fin vide et chemins facultatifs.
Les dates et fréquences sont conservées sans création de cycles automatiques.

Les fonctions privilégiées restent dans `wirdlink_private`, avec recherche de schéma vide,
contrôles d'accès et droits explicites. Les RPC publics sont des enveloppes invoker. Ni identifiants
de comptes ni codes d'accès ne sont exposés dans les DTO participant. Le reçu avec code est réservé
au propriétaire permanent. Les noms volontairement saisis des participants sont visibles pour
les lecteurs autorisés du wird.

Un code valide accorde une autorisation persistante liée au compte, technique ou permanent,
pour ce wird. Les erreurs incrémentent des compteurs privés et retournent du JSON sans exception :
5 échecs par identité et wird, et 100 échecs globaux par wird, pendant une fenêtre fixe de 15 minutes.
Un verrou transactionnel par wird sérialise ces compteurs. La limite globale réduit la rotation
d'identités, au prix d'un blocage temporaire possible par un tiers ; aucun code n'est communiqué
lors d'un échec. Les autorisations et compteurs sont supprimés avec le compte ou le wird.

Les réservations conservent le verrou du wird, la borne collective et la clé idempotente.
Les images et fichiers audio doivent exister dans Storage et appartenir au répertoire du propriétaire.
Le bucket reste privé : une politique de lecture autorise les médias joints à un wird lisible ;
le client produit des URL signées temporaires. Une URL déjà signée reste utilisable jusqu'à son
expiration ; choisir une durée courte dans le client.

## Vérification

`supabase/tests/connected-publication.sql` couvre lecture publique et privée, absence de fuite média,
déblocage, cloisonnement des comptes, reçus, réservation, dépassement, reprises idempotentes,
fin de part, incréments persistants, limites et expiration, fin facultative et médias invalides.
Les fixtures s'exécutent dans une transaction annulée. Aucun utilisateur réel n'est requis.
La concurrence repose sur les verrous déjà employés ; un test simultané multi-connexion reste
un contrôle complémentaire distinct du script transactionnel.

## Gestion des publications — 16 novembre 2026

`update_wird` et `delete_wird` exigent le propriétaire permanent actif. La modification
verrouille le même wird que les réservations et refuse un objectif inférieur à toutes les
parts engagées, terminées comprises. Seuls titre, objectif, description et consigne changent.
Le DTO expose `is_owner` pour proposer ces actions sans déléguer l'autorisation au client.

Les titres déjà publiés ou modifiés sont retenus dans `public.wird_titles`, accessibles
uniquement à leur auteur actif. Ils restent disponibles après suppression du wird et
sont supprimés avec le compte. Aucun catalogue de titres privés n'est exposé aux tiers.

La suppression d'un wird retire ses parts, codes, autorisations et compteurs d'essais.
Les fichiers Storage restent privés dans le répertoire du propriétaire jusqu'à la purge
du compte : leur nettoyage après suppression individuelle constitue une dette technique.
Aucune suppression directe de métadonnées Storage n'est employée.

Migration de gestion appliquée et `supabase/tests/wird-management.sql` exécuté avec succès,
fixtures annulées : droits propriétaire, refus tiers/anonyme, bornes des objectifs,
confidentialité des suggestions, conservation des champs non modifiables et cascades.
