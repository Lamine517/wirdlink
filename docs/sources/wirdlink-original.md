# WirdLink

[https://www.figma.com/design/NuTNH7YIfpPBtR4OfCwwRe/Link?node-id=28-2&p=f&t=9vLHvW7eLrISPDKQ-0](https://www.figma.com/design/NuTNH7YIfpPBtR4OfCwwRe/Link?node-id=28-2&p=f&t=9vLHvW7eLrISPDKQ-0)

## 1. Vision & Périmètre du Projet

- **Nom de l'application :** WirdLink (ou Wird & Partage)
- **Philosophie :** Application **bénévole, gratuite et sans but lucratif**, conçue pour être extrêmement simple, rapide et accessible au grand public (y compris les personnes non-digitales ou peu à l'aise avec la lecture).
- **Technologie :** **Angular (PWA)**. Pas besoin d'application native lourde à télécharger sur Google Play ou App Store : l'utilisateur clique sur un lien, l'application s'ouvre dans le navigateur et peut s'installer sur l'écran d'accueil en 1 clic (« Ajouter à l'écran d'accueil »).
- **Cœur de l'application :** Uniquement 3 piliers : **Créer**, **Wird**, et **Partager**.

## 2. Parcours Utilisateur & Authentification (Côté Responsable)

Pour créer et gérer des wirds récurrents ou ponctuels, le responsable a besoin d'un compte simple, rapide et sans mot de passe compliqué à retenir.

- **Modes de connexion universels :**
    - 🟢 **Connexion avec Google en 1 clic** (Idéal pour les utilisateurs Android).
    - 🍎 **Connexion avec Apple en 1 clic** (Idéal pour les utilisateurs iPhone).
    - ✉️ **Connexion par Email avec Code OTP** (Alternative universelle par code reçu par mail).
- *Note :* Les **participants** (ceux qui prennent une part) n'ont **aucun compte à créer**. Ils cliquent sur le lien WhatsApp, prennent leur part anonymement ou avec leur nom, et tout est mémorisé sur leur téléphone.

## 3. Fonctionnalités Clés & Écrans (Interface Mobile PWA)

### A. Écran d'Accueil / Découvrir (Fil des Wirds)

- **Barre du haut :** Logo simple + Bouton d'aide audio (synthèse vocale qui lit l'écran).
- **Cartes Wirds (Style papier tactile) :**
    - Titre du Wird + Image d'illustration (optionnelle).
    - Badge de visibilité : *Public* ou *🔒 Privé* (si privé, les informations sont masquées tant qu'on ne saisit pas le code secret à 4 chiffres ou qu'on n'arrive pas via le lien direct).
    - **Gros bouton bleu "Écouter"** (écoute de la note vocale enregistrée par le responsable).
    - Jauge de progression visuelle très claire (*ex: Reste 12 sur 30*).
    - **Bouton vert "Prendre ma part"**.
    - **Bouton favori (★)** pour épingler ses wirds quotidiens en haut de page.

### B. Prise de Part (Pour les participants - Sans compte)

1. Clic sur "Prendre ma part".
2. Choix de la quantité avec des gros boutons tactiles (, `+`, et raccourcis `+1`, `+5`, `+10`).
3. Choix du nom : **Anonyme** ou **Mon Nom** (mémorisé pour la prochaine fois).
4. Clic sur **"COMMENCER"** (le compteur baisse immédiatement).
5. Bascule automatique sur l'onglet **"Mes Parts"** pour retrouver son engagement et cliquer plus tard sur **"J'AI TERMINÉ ✓"**.

### C. Création & Récurrence Avancée (Pour le Responsable)

Le formulaire de création reste minimaliste (4 étapes max) :

1. **Nom du Wird** (ex: *Wird de la semaine*).
2. **Note vocale** (Bouton micro pour enregistrer sa voix directement).
3. **Nombre cible total** (ex: *1000* ou *30*).
4. **Récurrence & Date de début/fin (NOUVEAU) :**
    - *Type de récurrence :*
        - ▫️ **Une seule fois** (Ponctuel)
        - ▫️ **Tous les jours**
        - ▫️ **Chaque semaine**
        - ▫️ **Chaque vendredi**
    - *Choix de la date :* Possibilité de choisir précisément la **date de début** (et optionnellement une date de fin ou d'expiration).
5. **Visibilité :** *Public* ou *Privé* (génère un code secret et un lien sécurisé).
6. **Bouton final :** « **PUBLIER & PARTAGER SUR WHATSAPP** ».

## 4. Automatisation & Rappels pour le Responsable (Bénévole)

Puisque le projet est géré bénévolement, l'application doit automatiser le travail du responsable pour ses wirds récurrens :

- **Réinitialisation automatique :** Si un wird est configuré en mode *Tous les jours* ou *Chaque vendredi*, l'application remet automatiquement les compteurs à zéro à la date/heure prévue.
- **Rappels intelligents (Notifications Push Web ou Email) :**
    - Le responsable reçoit un rappel (via notification PWA sur son téléphone ou email) lorsque le wird approche de son échéance ou s'il n'a pas atteint son objectif, lui permettant de le relancer ou de le partager à nouveau en un clic.

## 5. Architecture Technique (Simple & Gratuite)

Pour maintenir le projet **totalement gratuit** et facile à maintenir en tant que bénévole :

- **Frontend :** **Angular (PWA)** hébergé gratuitement (sur Cloudflare Pages, Vercel ou Firebase Hosting).
- **Backend & Base de Données :** **Supabase** (Offre gratuite très généreuse) :
    - Authentification (Google, Apple, Email OTP).
    - Base de données PostgreSQL (gestion des wirds, des parts et des récurrences).
    - Stockage (pour les fichiers audio `.mp3/.m4a` et les images).
- **Partage :** API Web Share native + intégration directe du lien de partage WhatsApp.

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

[WirdLink – Remise au développement](https://app.notion.com/p/WirdLink-Remise-au-d-veloppement-4183a89db9ee8092bebed1b352cd477f?pvs=21)

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

[WirdLink – Cahier des charges v2](https://app.notion.com/p/WirdLink-Cahier-des-charges-v2-4183a89db9ee80abb251cf5e886f6168?pvs=21)