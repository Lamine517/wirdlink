# Localisation et gestion des wirds

Décision du 16 novembre 2026, à la demande de l’utilisateur.

- Langue choisie dans Réglages : français, anglais, arabe ; préférence locale, attributs lang/dir du document, textes métier saisis préservés. Le thème reste indépendant.
- Les panneaux mobiles suivent toute la largeur du viewport ; le cadre desktop reste limité à 390 px. Les lectures distantes affichent des squelettes ; les actions affichent un état en cours.
- Le menu Plus remplace le partage direct. L’auteur peut modifier le nom, le texte, les consignes et l’objectif, avec contrôle serveur des engagements existants. Calendrier, médias et visibilité restent inchangés lors de cette modification.
- Supprimer demande confirmation et retire aussi les participations. Les médias référencés sont supprimés ensuite côté Storage ; en cas d’échec de ce nettoyage, ils restent privés et seront purgés lors de la suppression du compte.
- Dupliquer prépare un brouillon de texte ; les fichiers doivent être joints de nouveau. Aucun brouillon existant n’est écrasé automatiquement.
- Les noms de wirds publiés sont mémorisés dans une table privée par compte pour les suggestions. Les noms non publiés restent dans le brouillon local.
- La connexion email utilise un lien PKCE, sans mot de passe saisi dans l’application. Le téléphone et les rappels ne sont pas encore disponibles.

Validation : tests SQL transactionnels des propriétaires, objectifs et suggestions ; tests Angular des confirmations, langues et menus ; contrôle Chrome des panneaux mobiles. Aucun audit ne garantit l’absence de toute faille. Les rappels et l’activation des sessions anonymes restent des limites explicites.
