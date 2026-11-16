# Validation frontend — 16 novembre 2026

Les parcours participant, création et les nouvelles vues sont prêts à être relus et
raccordés aux services. Ce document ne valide pas un service Supabase fonctionnel.

## Vues et interactions livrées

- Accueil avec engrenage seul, nom accessible Réglages ; navigation active avec icône
  sur fond léger, icône et texte en primaire.
- Filtres en panneau animé, état vide, logo, cadre mobile et panneaux desktop espacés.
- Participation : cercle, quantités entières, suggestions adaptées, dépassement en rouge,
  nom facultatif et prévention de double réservation.
- Participants : noms choisis et regroupement des participations sans nom ; données de
  cet appareil clairement identifiées, pas de faux nombre de personnes.
- Mes parts : regroupement par wird, recherche, fin individuelle, Merci et réglages.
- Création : modèles, formulaire, calendrier/visibilité, aperçu, image entière, suppression
  et remplacement du brouillon confirmés.
- Description et consignes facultatives distinctes, avec restauration des anciens brouillons.
- Audio sélectionné : lecture/pause réelle ; aucun audio fictif ni récitation synthétisée.
- Connexion : téléphone +221, code 6 chiffres, renvoi, délais et retours Google/Apple.
- Accès privé : code 4 chiffres, attente, code erroné, indisponibilité et limitation.
- Publication/partage : succès après réponse approuvée uniquement, copie du lien et code
  privé, WhatsApp/Facebook/Telegram/SMS, partage natif si le navigateur le propose.
- Réglages : rappels, ajout à l’écran d’accueil, Aide, Informations et Règles.
- Hors ligne : parts consultables, écritures désactivées, message visible.

## Contrôles exécutés

- 87 tests Jasmine/Karma réussis ; couverture lignes 90,81 %, branches 77,91 %.
- Compilation de production réussie dans les budgets Angular.
- `npm run check:frontend` : Chrome, largeurs 320/390/1440, texte 200 %, filtres clavier/focus,
  animation et mouvement réduit, véritable WAV lecture/pause, portrait sans recadrage,
  restauration des deux textes sans prétendre restaurer les fichiers, parcours participant,
  erreurs de connexion et accès privé, partage, réglages et hors ligne.
- Aucune exception JavaScript dans les parcours vérifiés.
- `npm audit --omit=dev` : aucune vulnérabilité connue signalée. Audit complet : 16 alertes
  modérées de dépendances de développement ; voir la revue pour les limites du correctif.

## Derniers ajouts vérifiés

Tasbih lié aux parts, reprise locale, annulation, remise à zéro confirmée, vibration facultative,
objectif plafonné et confirmation distincte. En-tête commun avec nom du wird et partage par icône.
Thème automatique/claire/sombre mémorisé, contrastes principaux et fondu court respectant le
mouvement réduit. La vibration testée vérifie la demande à l’API ; aucun matériel n’est certifié.

## Limites avant mise en service

La passerelle de services livrée refuse explicitement les demandes tant qu’aucun adaptateur
vérifié n’est raccordé. Les succès connexion/publication/accès privé sont testés uniquement
avec une passerelle substituée en test ; aucun succès n’est inventé dans l’application.
Les protections client ne remplacent pas les permissions et compteurs du serveur.
PWA et notifications effectives restent non intégrées. Les cycles récurrents ne s’exécutent pas.

Recette sur appareils réels et lecteur d’écran, Quality Gate SonarQube distant, fournisseurs,
conditions définitives et tests serveur restent nécessaires. Voir [la revue globale](revue-frontend.md).

## Suite autorisée

Le raccordement Supabase reste en attente après ce lot frontend et sa revue. La création du
projet dédié a été refusée par le quota gratuit. Aucun projet existant ni aucune base distante
n’a été modifié.
