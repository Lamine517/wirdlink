# 0002 — Pages par fonctionnalité et hiérarchie typographique

- Date : 2026-11-15
- Statut : accepté, suite à la demande utilisateur de séparer les pages et réduire les textes trop grands
- Remplace : minimum universel de 20 px de la décision 0001 ; autres règles conservées

## Décision

Organiser le frontend par domaine dans `features/` : `wirds`, `participation`, `creation`.
Chaque domaine sépare `pages/` et `components/`. Une route charge sa propre page standalone
avec `loadComponent`. Aucun composant de page ne choisit plusieurs écrans via un `@switch`.
Les pages orchestrent les données et la navigation ; les composants présentent un modèle
via `input` et émettent les interactions via `output`/`model`, sans accès au store métier.
La création reste une page d'attente explicitement indiquée, sans nouvelle fonctionnalité ajoutée.

Composants extraits : carte de wird, filtres, carte de part, sélecteur de quantité.
La jauge indépendante du domaine est dans `shared/components/bead-progress/`.
La persistance reste dans `core/wird-store.ts` ; la synthèse vocale dans un service dédié,
limité à la page d'accueil et arrêté à sa destruction.
Templates et styles non triviaux sont dans leurs propres fichiers, à côté du composant.

## Typographie

Nunito Sans locale, tailles en rem respectant les préférences du navigateur :

| Rôle | Taille par défaut (racine 16 px) |
| --- | --- |
| Titre de page | 1,75 rem / 28 px |
| Titre de carte | 1,5 rem / 24 px |
| Corps et actions principales | 1,125 rem / 18 px |
| Informations secondaires, navigation et filtres | 1 rem / 16 px |
| Saisie du compteur | 2,25 rem / 36 px |

Il ne s'agit pas d'un minimum WCAG de taille de police : vérifier lisibilité, contrastes,
reflow et agrandissement jusqu'à 200 % sans perte de fonctionnalité.
Référence : [WCAG 1.4.4](https://www.w3.org/WAI/WCAG22/Understanding/resize-text.html).
Les cibles tactiles restent au minimum de 48 px prévu pour ce produit ; les boutons
principaux gardent leur hauteur minimale de 68 px. La taille du texte et la surface
interactive sont deux décisions distinctes.

## Validation

Rejouer le parcours participant et les filtres après séparation des routes.
Vérifier petits écrans, police à 200 %, navigation clavier et lisibilité des cartes.
Aucun résultat local ne constitue une certification d'accessibilité ni un Quality Gate SonarQube.

## Compléments demandés dans le même lot

- Dépassement de quantité : message immédiat, icône Phosphor d’erreur et bordure rouge,
  reliés au champ avec `aria-invalid` et `aria-describedby`. Le maximum de réservation
  est le reste disponible ; l’objectif collectif est affiché séparément. Nœud Figma N2 54:554.
- Filtres : panneau inférieur conforme à P2 58:616, avec choix sous forme de boutons,
  effacement et compteur de résultats. Dialogue natif pour le focus et le clavier.
- Desktop : cadre de 390 px, hauteur maximale de 844 px réduite si nécessaire pour
  tenir dans la fenêtre ; défilement du contenu interne et navigation toujours visible.
  Le panneau est confiné aux mêmes dimensions. Aucun conteneur rigide n’empêche le scroll.
- États vides : `shared/components/empty-state`, réutilisé pour les listes et l’attente
  de création ; icône, titre, texte et action facultative. Référence état vide 41:172.
- Logo : SVG original du nœud 28:22, visible dans l’en-tête d’accueil.
- Micro-interactions : survol discret sur pointeur précis, appui, entrée du panneau et
  état vide. Animations et transitions désactivées sous `prefers-reduced-motion`.

## Résultats vérifiés

14 tests Jasmine/Karma réussis, dont erreur immédiate/correction, ouverture/fermeture
du panneau et effacement des filtres. Couverture : 87,98 % des lignes.
Chrome : mobile 320/390 px, cadre desktop 390 × 844 centré dans 1440 × 1000,
absence de débordement horizontal à 200 % de taille racine du texte sur l’accueil,
Échap et retour du focus, bordure rouge et réduction des animations.
Ce contrôle du texte ne remplace pas un audit exhaustif de tous les écrans à tous les niveaux de zoom.
