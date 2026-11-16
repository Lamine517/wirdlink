# 0005 — Terminer les vues avant le raccordement serveur

- Date : 2026-11-16
- Statut : appliqué au frontend, intégration serveur reportée à la demande de l’utilisateur

Le frontend expose un port typé `FRONTEND_GATEWAY` pour connexion, code, publication,
accès privé et rappels. Son implémentation livrée refuse ces opérations avec une
indisponibilité explicite. Les tests injectent des réponses contrôlées pour vérifier
succès, attente, erreur, limitation et conservation du brouillon ; ces tests ne sont pas
une preuve de fonctionnement Supabase ni une protection serveur.

Le responsable ne reçoit une confirmation qu’après résolution du port. Aucun nom,
numéro, code de connexion ou code privé n’est ajouté au stockage local de ces parcours.
Le reçu et l’autorisation privée sont conservés uniquement en mémoire. Les URL de retour
sont fixes ; les paramètres OAuth sont retirés de l’historique. Le serveur devra vérifier
l’identité et les permissions indépendamment de cet état client.

Le partage de liens publics existants fonctionne séparément de la publication. Le
partage mobile et les panneaux desktop réutilisent les mêmes actions et des IDs distincts.
Le code privé n’est exposé que dans un reçu approuvé ; le lien public ne l’embarque pas.
La récupération d’un reçu après rechargement relève du futur service authentifié.

Description et consignes sont deux textes facultatifs distincts. Les consignes d’ouverture
ne modifient pas l’objectif collectif. Les anciens brouillons sans champ `instructions`
sont restaurés sans perte de leur description. L’affiche originale contenant une personne
réelle n’est pas ajoutée aux assets publics.

Les invitations d’installation suivent les capacités du navigateur ; aucun dialogue
système n’est déclenché automatiquement. Les rappels ne sont déclarés actifs qu’après
acceptation du service. La PWA et les notifications réelles ne sont pas livrées par cette décision.
