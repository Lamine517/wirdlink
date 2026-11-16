# Mise à jour des clients PWA

16 novembre 2026. Une capture utilisateur affichait encore le message de publication indisponible retiré du code publié. L’ouverture avec ngsw-bypass a permis à l’utilisateur de publier, confirmant le blocage dans l’ancienne version locale.

Un avis d’actualisation est ajouté à la coque. SwUpdate signale les versions prêtes et les erreurs irrécupérables ; la vérification attend la stabilisation de l’application et reprend au retour dans l’onglet/en ligne, avec déduplication et temporisation.

Aucun rechargement automatique : l’utilisateur choisit Actualiser. Les photos/audio du brouillon étant en mémoire, une confirmation les signale avant rechargement. Le texte persistant reste conservé. Le mécanisme ne vide ni stockage utilisateur, ni session, ni caches. La version complète se recharge, sans activation partielle des chunks.

Le lien de dépannage ngsw-bypass sert aux anciens clients qui ne contiennent pas encore cet avis. Les publications continuent d’être autorisées et validées côté Supabase.
