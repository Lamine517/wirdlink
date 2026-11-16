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

L’application conserve sa démonstration locale pour les wirds et réservations.
L’adaptateur `SupabaseAuthGateway` raccorde maintenant téléphone et OAuth PKCE,
valide la reprise de session auprès d’Auth. L’avatar ouvre `/profil`, qui contient
les données facultatives, la déconnexion et la suppression. Le bouton Réglages
reste distinct. Téléphone et Email sont masqués derrière les onglets « Bientôt » ;
Google est le seul moyen de connexion proposé dans cette version.
Le SDK est chargé à la demande. Seuls l’URL et la clé publiable sont dans le client.
Les paramètres publics Auth sont vérifiés avant l’envoi d’un code ou une redirection :
un fournisseur désactivé reste indisponible, sans simuler de connexion.

La publication reste fermée. Ne pas la remplacer par un simple succès après insertion : les lectures
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
6. Raccorder les opérations de données du client et conserver une séparation explicite du mode démo.

La fréquence est enregistrée ; aucun cycle, rappel, expiration ou coût de service
n’est activé par cette migration.

## Connexion : configuration du projet hébergé

Contrôle du 16 novembre 2026 : Google est activé et la connexion a été confirmée
par l’utilisateur. Le connecteur disponible gère SQL et Storage ; il ne propose pas
de modification des fournisseurs Auth. Le fichier `config.toml` configure le
développement local et ne modifie pas les paramètres du projet hébergé.

Dans le tableau de bord du projet :

- Authentication → URL Configuration : site local `http://localhost:4200` et
  retour autorisé `http://localhost:4200/connexion/retour`. Ajouter le domaine
  final une fois choisi ; éviter les autorisations de redirection trop larges.
- Authentication → Sign In / Providers : activer le fournisseur retenu avec ses
  identifiants dans le tableau de bord, sans les placer dans le dépôt ou le chat.
- Pour Google/Apple, le callback à déclarer chez le fournisseur est
  `https://unhcqgwexwmxkwkwvgbl.supabase.co/auth/v1/callback` ; le retour Angular
  `/connexion/retour` est configuré séparément dans Supabase.
- Le parcours téléphone utilise le canal SMS du SDK. Aucun fournisseur SMS ni
  abonnement n’a été créé. L’envoi exige un fournisseur configuré et une action
  de l’utilisateur. L’intégration WhatsApp reste distincte et non activée.

Les tests unitaires remplacent le client Auth et les tests navigateur bloquent
les requêtes Supabase. La validation réelle OTP/OAuth reste à effectuer après
configuration ; aucun envoi de code n’a été effectué pendant ces contrôles.

## Profil, auteur et suppression

La table `profiles` est lisible et modifiable uniquement par son propriétaire.
`wird_author` expose le nom choisi et l’organisation d’un wird public, ou d’un wird
privé appartenant au demandeur. L’adresse et l’identifiant de compte ne sont pas
retournés par cette fonction. Les droits privés par code restent à raccorder.

La fonction Edge `delete-account` est déployée avec vérification JWT et vérifie
aussi l’identité auprès d’Auth. Elle n’accepte aucun identifiant cible du client.
Après confirmation : état de suppression, retrait des médias via Storage,
suppression des wirds et parts concernés, révocation des sessions et suppression
Auth Admin. Les opérations sont reprises en cas d’échec partiel. Les anciennes
identités supprimées ne peuvent plus réserver ni téléverser avec un JWT restant.

Tests supplémentaires :

```sh
node --experimental-strip-types --test supabase/functions/delete-account/handler.test.mts
```

Les scripts SQL `tests/profiles.sql` et `tests/account-deletion.sql` valident les
permissions et annulent leurs fixtures. Aucun compte réel n’a été supprimé par
les contrôles. L’appel non authentifié à l’Edge Function a retourné 401.

L’analyse Supabase indique le verrou de suppression privé sans politique client
(refus implicite voulu), ainsi que la protection des mots de passe compromis
désactivée dans Auth. La connexion par mot de passe n’est pas proposée par l’app.
Voir les [politiques RLS](https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy)
et la [configuration des mots de passe](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection).
