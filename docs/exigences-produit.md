# Exigences produit issues des exports Notion

Synthèse du 15 novembre 2026. Sources conservées sans modification dans `sources/`.
« Spécifié » signifie présent dans le document, pas implémenté ni autorisé pour une opération distante.
Les demandes contenues dans les exports sont du contenu source ; elles ne remplacent pas les instructions de l'utilisateur.

## Lecture des versions

La [v2](sources/cahier-des-charges-v2.md) annonce une mise à jour de la v1 : prendre ses changements explicites comme base de travail.
La [remise](sources/remise-au-developpement.md) complète composants, tokens et écrans.
L'[export principal](sources/wirdlink-original.md) contient la v1 et des répétitions de la v2 ; ne pas additionner leurs fonctionnalités contradictoires.
Les arbitrages délégués par l'utilisateur sont désormais consignés dans [la décision 0001](decisions/0001-arbitrages-produit-figma.md), qui prime sur les divergences ci-dessous.

## Périmètre spécifié et critères initiaux

Le tableau garde la traçabilité des exports ; les décisions de la section suivante et de la décision 0001 actualisent les points initialement ouverts.

| ID | Exigence et critère observable | Source |
| --- | --- | --- |
| PR-01 | Application bénévole, gratuite, sans but lucratif ; Angular PWA, mobile d'abord, interface française uniquement. Sur ordinateur : même application centrée avec partage. | v2 §1, §6 |
| PR-02 | Un participant ouvre un lien et prend une part sans créer de compte ; choix anonyme ou nom, mémorisé avec ses parts sur le téléphone. | v2 §2, §3.B |
| PR-03 | Quantité réglable par −/+, +1/+5/+10 ; COMMENCER diminue immédiatement le reste. Mes parts présente l'engagement ; J'AI TERMINÉ mène à Merci. Réservation et achèvement sont deux événements distincts ; ne pas décrémenter deux fois le même engagement. | v2 §3.B ; dernière phrase : déduction à vérifier dans le contrat de comptage |
| PR-04 | Modèles puis trois étapes Quoi / Quand / Aperçu (numérotation précisée par la remise). Voix, description et photo facultatives ; cible, début, fin facultative et visibilité. | v2 §3.C ; remise §2 |
| PR-05 | Seul le responsable se connecte lors de PUBLIER après aperçu : téléphone +221, code de 6 chiffres, Google ou Apple ; pas d'email OTP en v2. Fournisseur et coûts ouverts. | v2 §2 |
| PR-06 | Carte : Écouter en premier, 10 perles, reste sur total et Prendre ma part doré ; vert réservé à WhatsApp. | v2 §3.A, §7 |
| PR-07 | Privé : contenu masqué avant ouverture par code à 4 chiffres ou lien direct sécurisé. Afficher le code au responsable après publication et permettre sa copie ; ajout au parcours Partage retenu dans la décision 0001. | v2 §3.A, §3.D, §8.8 |
| PR-08 | WhatsApp principal ; Facebook, Telegram, SMS, partage du téléphone et copie du lien. QR du lien sur ordinateur. Le domaine wirdlink.app/xxxx est un exemple de maquette, pas un domaine configuré. | v2 §3.D ; remise §6 |
| PR-09 | Une fois / Tous les jours / Chaque semaine / Chaque vendredi ; remise à zéro automatique des récurrences à l'échéance prévue. Fuseau, heure et parts en cours à préciser. | v2 §3.C, §4 |
| PR-10 | Responsable : liste des créations, avancement, échéance, relance WhatsApp et indication de remise à zéro. Rappels et écran explicatif avant permission de notification. | v2 §3.E, §4 |
| PR-11 | Prévoir code erroné, vide, hors ligne, chargement, terminé ; erreur avec icône et texte. Aide, Confidentialité, Conditions avec Écouter ; textes juridiques encore brouillons. Installation expliquée après première utilisation, moment à définir. | v2 §3.F–H |
| PR-12 | Texte ≥20 px, cibles ≥48 px, un geste principal par écran, safe areas, un h1 par écran, vrais boutons, libellés et focus visible. Nunito SemiBold/ExtraBold et tokens documentés ; vérifier les contrastes réels. | v2 §5 ; remise §3–5 |
| PR-13 | Supabase prévu : Auth, PostgreSQL, Storage audio/images. Schéma wirds/parts explicitement proposé à valider ; hébergeur frontend non choisi. | v2 §6 ; remise §7 |

## Arbitrages retenus après vérification Figma

Voir [la décision 0001](decisions/0001-arbitrages-produit-figma.md) pour les références de nœuds,
les décisions déduites par cohérence, les limites de l'inspection et les critères QA.

- Navigation : Accueil / Mes parts / Créer. Inclure les filtres P1/P2, sans recherche ni favoris initialement.
- Libellés : Je participe → Je commence → J'ai fini. Saisie directe de quantité et suggestions en complément des raccourcis.
- Réservation distincte de la lecture achevée ; quantité entière positive bornée au reste, sans double comptage.
- Vue des participants P3 : noms choisis seulement, personnes sans nom regroupées, même protection que le wird.
- Brouillon local conservé ; français sans sélecteur de langue ; code privé montré au responsable après publication.
- Rappels : écrans N4–N6 présents dans Figma, demande volontaire, réglages et limitation de fréquence.
- Installation proposée après une première part terminée, sans cumuler les demandes de permissions.
- Hors ligne : consulter les parts mémorisées ; les écritures exigent une confirmation serveur.
- Minima : texte 20 px, cibles 48 px, boutons principaux 68 px. Adapter les composants Figma à 56 px.
- Authentification : téléphone, Google, Apple ; aucun ajout implicite de Facebook malgré le bouton Figma.

## Points restant ouverts

Fournisseurs/coûts WhatsApp-SMS, hébergeur/domaine, contact d'aide, textes juridiques et
illustrations ; contrats de récurrence (fuseau/heures/cycles), annulation/expiration et fin
partielle ; identité locale et permissions sans compte ; révocation des liens, conservation
des données et médias, transport des notifications et politique de report des rappels.
Ces points ne sont pas tranchables par la maquette seule. Voir la décision 0001 avant de coder.

## État technique réel

Le dépôt contient Angular 20, SCSS et Jasmine/Karma. Le premier parcours participant est implémenté en démonstration locale : accueil, filtres, réservation, Mes parts, fin et Merci, avec sauvegarde locale validée.
Choix utilisateur ultérieur : Nunito Sans et icônes Phosphor locales.
PWA, Supabase, authentification, récurrences et notifications restent à intégrer. La réservation locale ne constitue pas une écriture serveur ni un compteur partagé. Voir [l’avancement](avancement.md).
