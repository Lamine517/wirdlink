# WirdLink – Remise au développement

Version de travail pour l'équipe de développement. Sources : fichier Figma « Link » (page « WirdLink mobile v2 ») et maquette en ligne. Tout est en français.

## 1. Principes du produit

- **Application web installable (PWA)**, mobile d'abord, qui se comporte comme une application mobile. Technologie prévue : Angular, avec Supabase pour la connexion, la base de données et le stockage.
- **Public visé :** grand public, y compris personnes peu à l'aise avec le numérique ou la lecture. Donc : audio d'abord, gros boutons, peu de texte, un geste principal par écran.
- **Trois piliers :** Créer, Wird, Partager.
- **Participer sans compte.** Le compte n'est demandé qu'au responsable, et seulement au moment de publier.
- **Sur ordinateur :** la même application est affichée dans une colonne centrée, avec un panneau de partage autour. Il n'y a pas de version bureau séparée.

## 2. Écrans

Les noms ci-dessous sont ceux des cadres dans Figma (390 × 844).

### Parcours participant (sans compte)

| Écran | Rôle |
| --- | --- |
| 0 Langue | Choix de la langue au premier lancement (français uniquement à ce stade). |
| 5 Installer | Explique comment ajouter l'application à l'écran d'accueil. |
| 1 Accueil | Liste des wirds : écouter, voir ce qui reste, prendre sa part. Carte privée avec bouton « Code ». |
| 2 Prendre ma part | Quantité (− / + et +1, +5, +10), choix Anonyme ou Mon nom, bouton COMMENCER. |
| 3 Mes parts | Parts en cours, bouton J'AI TERMINÉ. |
| 4 Merci | Remerciement après avoir terminé, avec la jauge mise à jour. |
| Code privé | Saisie du code à 4 chiffres pour ouvrir un wird privé. |

### Parcours responsable

| Écran | Rôle |
| --- | --- |
| A Modèles | Choix d'un modèle (Salat ala Nabi, Al Fatiha, Istighfar, Tahlil) ou « Mon propre wird ». |
| B Quoi ? | Étape 1 sur 3 : nom, voix, description (facultative), photo (facultative), nombre cible. |
| C Quand ? | Étape 2 sur 3 : récurrence, début, fin facultative, Public ou Privé. |
| D Aperçu | Étape 3 sur 3 : aperçu de la carte, bouton PUBLIER. |
| E Numéro | Numéro de téléphone (+221), code par WhatsApp ou SMS, ou Google / Apple. |
| F Code reçu | Saisie du code à 6 chiffres. |
| G Partage | WhatsApp en premier, puis Facebook, Telegram, SMS, autres, copier le lien. |
| H Suivi | Rappel d'échéance, bouton Relancer, indication de remise à zéro. |

### États

- États : code erroné, liste vide, hors ligne, chargement, wird terminé.
- Pages du pied de page : Aide, Confidentialité, Conditions d'utilisation.
- Vues web : accueil, et lien reçu sur WhatsApp.

## 3. Composants à construire

- **Button/Listen, Button/Take, Button/Next, Button/WhatsApp, Button/Outline :** 68 px de haut, coins 20, une icône + un libellé modifiable.
- **Header/Back :** flèche + « Retour », 48 px de haut.
- **Card/Wird :** titre, récurrence, bouton Écouter, jauge, reste sur total, bouton Prendre ma part.
- **Progress/Beads :** 10 perles de tasbih, pleines ou vides.
- **BottomNav :** trois onglets (Écouter, Mes parts, Créer), libellés de 20 px.
- **Safe area top :** zone de 48 px réservée à la barre d'état.

## 4. Jetons de design

**Couleurs** (variables Figma → variable CSS prévue)

| Rôle | Valeur | CSS |
| --- | --- | --- |
| Primaire | #006B85 | --color-primary |
| Accent | #F9C55B | --color-accent |
| Texte principal | #1F2A30 | --color-text-primary |
| Texte secondaire | #3C4A52 | --color-text-secondary |
| Texte sur fond sombre | #FFFFFF | --color-text-inverse |
| Fond de l'application | #F4F8F9 | --color-bg-app |
| Surface (cartes) | #FFFFFF | --color-bg-surface |
| Fond atténué | #DCE8EB | --color-bg-muted |
| Bordure | #BBD0D6 | --color-border-default |
| WhatsApp | #25D366 | --color-brand-whatsapp |
| Erreur | #B3261E | --color-feedback-error |

**Espacements :** 4, 8, 12, 16, 20, 24, 28 px (grille de 4 px).

**Arrondis :** 14, 16, 20, 28, 36 px. Les cercles gardent un arrondi libre.

**Typographie :** Nunito, graisses SemiBold et ExtraBold. Styles Figma : Display/Counter (84), Title/Screen (32), Title/Card (28), Heading/L (26), Heading/M (24), Label/L (22), Body/M (22), Label/M (20), Body/S (20). Aucun texte en dessous de 20 px.

## 5. Règles d'interface et d'accessibilité

- **Zones à toucher :** 48 px minimum. Les boutons principaux font 68 à 100 px.
- **Marges de sécurité :** utiliser `env(safe-area-inset-top)` et `env(safe-area-inset-bottom)`. La barre du bas réserve 34 px pour la barre de gestes.
- **Audio d'abord :** le bouton Écouter est le premier de chaque carte. La synthèse vocale du navigateur peut lire l'écran ; la note vocale du responsable est un fichier audio.
- **Structure HTML :** un seul titre `h1` par écran, zones d'en-tête, contenu principal et navigation, de vrais éléments `button` (pas de blocs cliquables).
- **Boutons à icône seule :** libellé accessible obligatoire. Focus visible sur tous les éléments interactifs.
- **Erreurs :** jamais la couleur seule, toujours une icône et un texte.
- **Contraste :** texte blanc sur #006B85 et texte #1F2A30 sur #F9C55B passent les seuils usuels. À re-vérifier sur l'application réelle.

## 6. Règles de fonctionnement

- **Récurrence :** Une fois, Tous les jours, Chaque semaine, Chaque vendredi. La remise à zéro des compteurs se fait à l'échéance prévue. Date de début, date de fin facultative.
- **Visibilité :** Public, ou Privé avec un code à 4 chiffres et un lien direct. Un wird privé masque son contenu tant que le code n'est pas saisi.
- **Participation sans compte :** le nom choisi et les parts sont mémorisés sur le téléphone. Le compteur baisse dès qu'on appuie sur COMMENCER.
- **Connexion du responsable :** demandée seulement au moment de PUBLIER. Numéro +221, code reçu par WhatsApp ou SMS, ou Google / Apple.
- **Partage :** API de partage du navigateur, et lien WhatsApp direct, en bouton principal. Le lien est de la forme wirdlink.app/xxxx (exemple de maquette).
- **Hors ligne :** l'écran prévoit un message et la conservation des parts sur le téléphone. À confirmer avant de promettre ce comportement.
- **Rappels :** notification ou message au responsable quand l'échéance approche.

## 7. Données (proposition à valider)

- **wirds :** titre, description, image, note vocale, objectif, récurrence, date de début, date de fin, visibilité, code, responsable.
- **parts :** wird, quantité, nom affiché ou anonyme, statut (en cours, terminée), identifiant de l'appareil, date.
- **Stockage :** fichiers audio et images dans Supabase Storage.

## 8. Points ouverts

1. **Textes juridiques :** Confidentialité et Conditions sont des brouillons à faire relire.
2. **Contact d'aide :** le bouton « Poser une question » n'est relié à aucun numéro ou lien.
3. **QR du lien :** emplacement dessiné, à générer pour chaque wird.
4. **Code reçu par WhatsApp :** le fournisseur et le coût sont à déterminer ; prévoir le SMS en secours.
5. **Notifications sur téléphone :** leur disponibilité dépend de l'appareil et du navigateur ; à tester sur iPhone et Android.
6. **Langues :** seulement le français pour l'instant.
7. **Barre du bas :** trois onglets dans la maquette, alors que la maquette d'origine en avait quatre avec Profil. À arbitrer.
8. **Images :** les illustrations de la maquette en ligne sont provisoires.

## 9. Liens

- Figma : https://www.figma.com/design/NuTNH7YIfpPBtR4OfCwwRe/Link (page « WirdLink mobile v2 »)
- Maquette en ligne : https://claude.ai/artifact/JywxAh4qDoQKQgDZp8D595