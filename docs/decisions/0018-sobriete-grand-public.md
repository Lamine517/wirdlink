# 0018 — Sobriété grand public : Mes parts, page wird, tasbih et voix

- Date : 2026-11-17
- Statut : accepté, demande utilisateur
- Responsable : coordination technique WirdLink

## Contexte

Une grande partie du public de WirdLink utilise peu le numérique. Une page trop
chargée, un bouton grisé sans explication ou un choix inutile peuvent suffire à
faire abandonner. L’utilisateur demande une interface propre, sans effets qui
« font IA », où l’on sent la différence entre une part prise, en cours et terminée.

## Repères observés

- Wave et Orange Money, très utilisés au Sénégal : une action principale par
  écran, de gros montants lisibles, peu de texte.
- WhatsApp : enregistrer une note vocale et partager sont des gestes déjà connus,
  on les reprend plutôt que d’en inventer.
- Un chapelet physique : 33 grains et un grain de repère. Le compteur imite cet
  objet au lieu d’une jauge abstraite.
- Les marqueurs visuels associés aux outils d’IA (étincelles, dégradés décoratifs)
  sont retirés.

## Décision

- Mes parts : recherche et icône Filtrer sur une ligne. Chaque carte affiche un
  état en mots et en couleur (Pris, En cours, Terminé), avec une seule action
  principale (Commencer ou Reprendre). Les cartes en cours passent en premier.
  Le lien vers Réglages est retiré de cette page.
- Page d’un wird : un participant ne voit qu’un bouton Partager direct ; Modifier,
  Dupliquer et Supprimer restent au responsable. Photo, description et consignes
  tiennent dans un seul bloc. Le nom devient un champ facultatif unique, sans le
  choix préalable « Sans nom / Mon nom ». Les compteurs disparaissent quand
  l’objectif est atteint.
- Tasbih : anneau de grains par tours de 33, grain jaune de départ, état visible
  sous le titre. « J’ai fini » n’apparaît qu’une fois l’objectif atteint.
- Voix : Enregistrer dans l’application (MediaRecorder, 10 minutes au plus) ou
  Importer un fichier. Sans micro disponible, seule l’importation est proposée.
- Design system : `.status-chip`, `.icon-button`, `.switch-field` et
  `.field-optional` sont partagés au lieu de styles propres à chaque page.

Correctif lié : un lien public ouvert à froid affichait « Ce wird est privé »,
car la lecture tombait pendant l’installation de la session. Elle est relancée
dans ce cas ; un vrai changement de compte rejette toujours la réponse.

## Conséquences et validation

Tests mis à jour pour les états, les tours de grains, le partage direct, le nom
facultatif et le lien public à froid. Restent à valider sur téléphones réels :
l’enregistrement audio (autorisation du micro sur iOS et Android) et la lisibilité
des grains en plein soleil.
