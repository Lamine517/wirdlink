# 0008 — Apparence et continuité des vues

- Date : 2026-11-16
- Statut : appliqué, mode automatique confirmé explicitement par l’utilisateur

Le nom du wird est le titre commun aux vues Le wird et Les participants, à la même position.
Il n’est pas répété visuellement dans le cercle de la vue principale ; le nom reste dans son
libellé accessible. Le partage public est une icône nommée, alignée à droite du retour, dans
un composant d’en-tête commun. Aucun lien privé ou code n’est ajouté à cette action publique.

Les préférences proposent Automatique, Clair et Sombre. Le mode par défaut suit
prefers-color-scheme et ses changements pendant la session ; le choix manuel le remplace.
Le choix est local. Un petit script externe applique l’apparence avant le rendu Angular,
puis le service Angular suit les changements et gère les erreurs de sauvegarde.

Les palettes utilisent les tokens partagés. Les couleurs de texte sur accent, danger et
surfaces primaires sont distinctes pour conserver leur contraste. Les icônes monochromes
suivent currentColor, les logos restent identifiables, et le QR garde son fond clair scannable.
Le choix de thème reste accessible avec des radios natives et sans libellé coupé.

Les changements de page utilisent un fondu de 180 ms, sans déplacement spatial ni attente
artificielle ; la première entrée desktop garde son animation propre. Les animations réduites
sont respectées. Une animation précédente est annulée à la navigation suivante.

Contrôles : choix automatique, changement système, remplacement manuel, rechargement,
contrastes des principaux rôles texte/fond, stabilité géométrique du titre, animation et
absence d’animation en mode réduit, largeurs 320/390/1440 et texte 200 %. Ces contrôles
ne constituent pas un audit d’accessibilité complet ni une recette sur téléphone physique.
