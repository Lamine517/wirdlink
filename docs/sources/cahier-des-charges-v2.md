# WirdLink – Cahier des charges v2

Mise à jour du cahier des charges initial, d'après la maquette Figma (page « WirdLink mobile v2 »). Les points marqués **à valider** sont des propositions, pas des décisions.

## 1. Vision et périmètre

- **Nom :** WirdLink.
- **Philosophie :** application bénévole, gratuite et sans but lucratif, très simple, rapide et accessible au grand public, y compris aux personnes peu à l'aise avec le numérique ou la lecture.
- **Technologie :** application web installable (PWA) en Angular, mobile d'abord. Elle s'ouvre par un lien et s'ajoute à l'écran d'accueil sans passer par un magasin d'applications.
- **Cœur du produit :** trois piliers, Créer, Wird et Partager.
- **Langue :** français. Aucune autre langue en v2.
- **Sur ordinateur :** la même application s'affiche dans une colonne centrée, avec un panneau de partage autour. Pas de version bureau séparée.

## 2. Parcours et authentification

**Participants.** Aucun compte. Ils ouvrent le lien, prennent leur part (anonyme ou avec leur nom), et tout est mémorisé sur leur téléphone.

**Responsables.** Un compte simple, demandé seulement au moment de **publier**, après l'aperçu du wird. Modes de connexion :

- numéro de téléphone (+221), avec un code à 6 chiffres reçu par WhatsApp ou par SMS (mode principal) ;
- Google en un clic ;
- Apple en un clic.

**Changé par rapport à la v1 :** la connexion par email avec code est retirée, et le numéro de téléphone devient le mode principal. **À valider :** le fournisseur du code WhatsApp, son coût, et le SMS comme solution de secours.

## 3. Fonctionnalités et écrans

### A. Accueil

- Barre du haut : logo et bouton d'aide audio.
- Cartes de wirds : titre, image facultative, récurrence, bouton **Écouter** en premier, jauge en 10 perles de tasbih, « Il reste X sur Y », bouton **Prendre ma part**.
- Wird privé : contenu masqué et bouton « Code » ; le code à 4 chiffres ou le lien direct l'ouvre.
- Barre du bas : trois onglets (Écouter, Mes parts, Créer).

### B. Prise de part (participant, sans compte)

1. Touche **Prendre ma part**.
2. Choix de la quantité : −, +, et raccourcis +1, +5, +10.
3. Choix du nom : **Anonyme** ou **Mon nom** (mémorisé pour la prochaine fois).
4. Touche **COMMENCER** : le compteur baisse tout de suite.
5. L'onglet **Mes parts** affiche l'engagement, avec le bouton **J'AI TERMINÉ**.
6. Écran **Merci** avec la jauge mise à jour, et possibilité de prendre encore une part.

### C. Création (responsable), en 3 étapes

1. **Modèles :** Salat ala Nabi, Al Fatiha, Istighfar, Tahlil, ou « Mon propre wird ». Tout est prérempli.
2. **Quoi ? :** nom, note vocale (facultative), **description (facultative)**, **photo (facultative)**, nombre cible.
3. **Quand ? :** récurrence (Une fois, Tous les jours, Chaque semaine, Chaque vendredi), date de début, date de fin facultative, visibilité Public ou Privé.
4. **Aperçu :** la carte telle que la verront les gens, puis le bouton **PUBLIER**.
5. **Connexion** (numéro, puis code reçu), seulement ici.
6. **Partage.**

Le brouillon doit être conservé si la personne quitte le parcours. **À valider.**

### D. Partage

- **WhatsApp en bouton principal**, le plus grand de l'écran. Partage possible vers un groupe ou le Statut.
- Autres réseaux : Facebook, Telegram, SMS, autres via le partage du téléphone.
- Copier le lien. Affichage du lien court du wird.
- Wird privé : le **code à 4 chiffres est affiché** au responsable après la publication, avec un lien sécurisé. **Manquant dans la maquette actuelle.**
- Sur ordinateur : QR code du lien pour ouvrir sur le téléphone.

### E. Suivi (responsable)

- Liste des wirds créés, avancement, alerte « Il reste X. Fin vendredi. ».
- Bouton **Relancer** vers WhatsApp.
- Indication des wirds remis à zéro automatiquement.

### F. États à prévoir

Code erroné, liste vide, hors ligne, chargement, wird terminé. Chaque erreur combine icône et texte, jamais la couleur seule.

### G. Pages d'information

Aide, Confidentialité, Conditions d'utilisation. Textes courts, avec bouton **Écouter**. Les textes juridiques sont des brouillons à faire relire avant publication.

### H. Installation

Écran qui explique comment ajouter l'application à l'écran d'accueil, proposé après une première utilisation (le bon moment est à définir).

## 4. Automatisation et rappels

- **Réinitialisation automatique :** pour un wird Tous les jours, Chaque semaine ou Chaque vendredi, les compteurs repassent à zéro à la date et à l'heure prévues.
- **Rappels au responsable :** notification ou message quand l'échéance approche ou que l'objectif n'est pas atteint, avec un bouton pour relancer en un clic.
- **Demande d'autorisation des notifications :** à prévoir dans le parcours, avec un écran d'explication. **Manquant dans la maquette actuelle.** La disponibilité des notifications dépend de l'appareil et du navigateur ; à tester sur iPhone et Android.

## 5. Conception et accessibilité

- Zones à toucher de 48 px au minimum, textes de 20 px au minimum, un geste principal par écran.
- Audio d'abord : le bouton Écouter est le premier de chaque carte.
- Marges de sécurité en haut et en bas pour les téléphones à encoche.
- Structure HTML correcte : un titre par écran, vrais boutons, libellés sur les icônes, focus visible.
- Couleurs, espacements, arrondis et styles de texte définis comme variables dans Figma.

## 6. Architecture technique

- **Frontend :** Angular (PWA), hébergé gratuitement (Cloudflare Pages, Vercel ou Firebase Hosting).
- **Backend et base de données :** Supabase (offre gratuite) : authentification, PostgreSQL pour les wirds, les parts et les récurrences, stockage des fichiers audio et des images.
- **Partage :** API de partage du navigateur et lien WhatsApp direct.

## 7. Écarts avec le cahier des charges v1

| Sujet | v1 | v2 |
| --- | --- | --- |
| Connexion | Google, Apple, email avec code | Numéro (WhatsApp ou SMS), Google, Apple ; email retiré |
| Création | 4 étapes, voix demandée | 3 étapes, modèles, voix facultative, description et photo ajoutées |
| Bouton Prendre ma part | Vert | Doré (le vert est réservé à WhatsApp) |
| Jauge | Barre | 10 perles de tasbih |
| Navigation | 4 onglets avec Profil | 3 onglets (À valider) |
| Favoris, filtres, recherche | Présents | Retirés de la maquette pour simplifier (À valider) |
| Partage | WhatsApp | WhatsApp en priorité, plus Facebook, Telegram, SMS, QR sur ordinateur |
| Nouveautés | – | États, pages d'information, écran d'installation, suivi, vue web |

## 8. Points à valider

1. Garder ou réintroduire les favoris, les filtres et la recherche ?
2. Trois ou quatre onglets dans la barre du bas, et le nom du premier onglet ?
3. Fournisseur et coût du code par WhatsApp.
4. Conservation du brouillon de création.
5. Textes de Confidentialité et de Conditions, à faire relire.
6. Contact réel pour le bouton d'aide.
7. Promesse de fonctionnement hors ligne : jusqu'où va-t-on ?
8. Affichage du code des wirds privés après publication.