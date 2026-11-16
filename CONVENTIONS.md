# Conventions WirdLink

## Référence et périmètre

Les instructions explicites de l'utilisateur et les exigences produit confirmées guident le travail.
Le code décrit l'existant ; les exports Notion décrivent le besoin ; Figma
sert de référence visuelle. En cas de divergence, la signaler et documenter la décision.
Voir `docs/ressources.md`. Ne pas choisir un backend ou une plateforme sur la seule base
du fichier d'exemple archivé.

Les arbitrages de `docs/decisions/0001-arbitrages-produit-figma.md` puis `docs/decisions/0002-pages-composants-typographie.md` priment pour les divergences connues ; les décisions 0002 puis 0003 révisent la typographie et les boutons.
Navigation : Accueil / Mes parts / Créer ; libellés participant : Je participe / Je commence / J'ai fini.

## Frontend

- Conserver TypeScript strict ; éviter `any`, les assertions non justifiées et les erreurs silencieuses.
- Composants standalone ; privilégier `ChangeDetectionStrategy.OnPush` pour les nouveaux composants.
- Signals pour l'état local, `computed` pour l'état dérivé ; RxJS pour les flux asynchrones.
- Nettoyer les abonnements via `async` ou `takeUntilDestroyed` lorsque nécessaire.
- Garder les templates simples ; utiliser `@if`, `@for` avec une clé stable.
- Préférer les formulaires réactifs typés pour les parcours à validation.
- Isoler les appels HTTP dans des services ; traiter explicitement attente, vide, erreur et succès.
- Charger les routes de fonctionnalités à la demande lorsque cela réduit le chargement initial.
- Introduire `src/app/features/`, `shared/` et `core/` seulement lorsqu'un besoin concret apparaît.
  `features/` porte un domaine, `shared/` les éléments réutilisables, `core/` les services transversaux.
- Réutiliser les composants et tokens visuels ; SCSS local aux composants et variables CSS partagées.
- Respecter le format Prettier existant : quotes simples, largeur 100 ; ne pas reformater des fichiers hors périmètre.

Exemple de composant autonome (proposition pour les nouveaux écrans) :

```ts
import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';

@Component({
  selector: 'app-reading-counter',
  template: `
    <p aria-live="polite">{{ label() }}</p>
    <button type="button" (click)="increment()">Ajouter une lecture</button>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReadingCounter {
  protected readonly count = signal(0);
  protected readonly label = computed(() => `${this.count()} lectures`);

  protected increment(): void {
    this.count.update((value) => value + 1);
  }
}
```

Cet exemple ne définit aucune règle de réservation ou de comptage collectif.

## UI et UX

Interface en français selon les maquettes consultées ; code en anglais et documentation en français.
La v2 ne prévoit que le français ; préserver les passages arabes présents dans les contenus, sans ajouter de parcours multilingue.
Concevoir d'abord pour mobile ; sur ordinateur, afficher la même application dans un cadre de téléphone centré et entièrement contenu dans la fenêtre, avec défilement interne. Les panneaux desktop et les actions de partage mobile sont intégrés. Vérifier zoom et textes longs.
Exigences v2 : hiérarchie compacte 24/20/16/14 px (en rem), décision 0003, zones tactiles de 48 px minimum, un geste principal par écran, Écouter uniquement en présence d’un fichier audio réellement joint, avec lecture et pause.
Choix utilisateur : Nunito Sans, graisses 600/800, hébergée localement ; icônes Phosphor. La remise au développement prévoyait Nunito SemiBold/ExtraBold, boutons principaux de 68 à 100 px, tokens et safe areas ; consulter `docs/sources/remise-au-developpement.md` (§3–5).
Appliquer `docs/decisions/0003-interface-compacte-formulaires.md` : boutons principaux 56 px, cibles secondaires 48 px minimum ; tailles en rem et zoom conservés.
Employer des boutons et liens sémantiques, des labels associés aux champs et un focus visible.
Vérifier navigation clavier, contrastes et restitution des erreurs. Cible de qualité proposée : WCAG 2.2 AA.
Ne pas dépendre uniquement de la couleur ou de l'audio. Prévoir une alternative textuelle.
Les dimensions, textes et couleurs finaux se vérifient sur les nœuds Figma concernés.
Ne pas transformer les dimensions fixes de la maquette en mise en page rigide.

## Backend et sécurité

Supabase est prévu par les sources produit pour Auth, PostgreSQL et Storage, sans intégration existante.
Préciser contrat, modèle de données, autorisations et invariants dans un ADR avant l'implémentation ; le schéma de la remise est une proposition à valider.
Participants sans compte ; connexion du responsable seulement à la publication après aperçu.
La v2 prévoit téléphone +221 avec code à 6 chiffres, Google et Apple ; email OTP retiré.
Fournisseur WhatsApp, coût et secours SMS restent à valider. Ne pas assimiler offre gratuite et absence de coûts pour toutes les intégrations.
Pour les futures tables exposées, prévoir RLS et tests d'accès ; protéger aussi les fichiers privés.
Un identifiant d'appareil seul ne constitue pas une preuve d'autorisation ; définir le mécanisme de reprise des parts sans imposer un compte au participant.
Les validations client améliorent l'UX ; le serveur doit valider données et permissions.
Pour une écriture collective, définir l'atomicité et le comportement des doubles requêtes
avant de coder. Tester les accès croisés entre utilisateurs et les liens privés.
Ne jamais placer un secret dans `environment.ts` ou le bundle. Utiliser des données fictives.
Éviter les insertions HTML non maîtrisées et les contournements de sanitization.
Les téléphones, noms, enregistrements et pratiques religieuses demandent une minimisation
et des règles d'accès explicites ; documenter la conservation selon les exigences confirmées.

## Tests et livraison

Tester les comportements et les régressions : entrées invalides, échecs réseau, doubles
soumissions, chargement et permissions selon le changement. Ne pas imposer des snapshots
ou des pourcentages de couverture sans besoin établi.
Jasmine/Karma est l'outillage actuel. Playwright, lint et CI sont des évolutions possibles,
pas des commandes disponibles. Décrire et justifier toute nouvelle dépendance.
Pour du code Angular, exécuter tests ciblés et build de production. Pour la documentation,
vérifier liens locaux, commandes et cohérence avec le dépôt ; aucun test applicatif supplémentaire requis.
Rapporter les échecs et les contrôles impossibles avec leur cause.

Commits proposés : `feat: ajouter le compteur de lectures`, `fix: empêcher une double validation`,
`docs: préciser les conventions`. Une PR décrit comportement obtenu, validation et limites.
Ne pas créer de commit ou publier de changement distant sans demande correspondante.

## Critères de fin

Besoin couvert, erreurs traitées, vérifications pertinentes effectuées, documentation à jour,
aucun secret ajouté et aucune hypothèse métier présentée comme exigence validée.

## Nommage et organisation des styles

Code en anglais : classes/types en `PascalCase`, propriétés/variables/méthodes en `camelCase`,
constantes partagées en `UPPER_SNAKE_CASE`, fichiers Angular en `kebab-case`.
Une méthode décrit une action (`reserve`, `finish`, `selectFilter`) ; une propriété décrit
une donnée (`savedName`, `visibleWirds`). Préférer des noms explicites et des fonctions courtes.
Les booléens expriment un état (`finished`, `filtersOpen`) ou une question (`isSavedState`).

Styles partagés dans `src/styles/` : `_variables.scss` (tokens), `_mixins.scss`
(composition), `_reset.scss`, `_typography.scss`, `_forms.scss`, `_ui.scss` et `_motion.scss`.
Le fichier `src/styles.scss` assemble ces modules avec `@use`. Les styles de composant
chargent uniquement variables et mixins ; ne pas y importer les modules qui émettent le CSS global.
Ne pas employer `@import`, `!important` ou `::ng-deep` pour résoudre un problème de structure.

Variables Sass en anglais et `kebab-case` (`$button-height-min`) ; propriétés CSS de thème
préfixées par rôle (`--color-primary`, `--space-16`). Sass porte les constantes de compilation,
CSS les tokens utilisés au rendu. Réutiliser un token existant avant d'ajouter une valeur.
Classes CSS en anglais suivant BEM pour les éléments et variantes (`.button--primary`,
`.quantity-counter__input`). Les utilitaires ont des noms explicites (`.text-secondary`).

Exemple de réutilisation dans un composant :

```scss
@use '../../styles/mixins';

.summary-panel {
  @include mixins.stack;
  @include mixins.surface;
  padding: var(--space-16);
}
```

## Analyse SonarQube

Exécuter `npm run test:coverage` avant le scanner. Le rapport LCOV attendu est
`coverage/wirdlink/lcov.info`, déclaré dans `sonar-project.properties`.
Les tests sont classés séparément des sources ; aucun fichier métier n'est exclu de la couverture.
Le scanner utilise le serveur, la clé de projet et les identifiants fournis par l'environnement,
jamais un jeton versionné. Ne pas ajouter de suppression Sonar pour masquer un défaut.
Une compilation ou un test réussi n'équivaut pas à un Quality Gate SonarQube validé.

## Pages et composants

Organiser les fonctionnalités par domaine (`features/wirds`, `features/participation`,
`features/creation`), puis `pages/` et `components/`. Une route charge une page dédiée.
Les pages composent les vues et orchestrent store/navigation. Les composants de présentation
reçoivent des entrées typées et émettent des événements ; ne pas leur injecter le store métier.
`shared/components/` accueille les composants réellement transversaux. Ne pas créer de
superclasse ou de service générique pour éviter quelques lignes de composition explicite.
Voir les décisions 0002/0003 pour la structure, la hiérarchie compacte et les règles de zoom.

Les états vides passent par `shared/components/empty-state` : icône décorative, titre,
explication et action facultative. Les panneaux inférieurs passent par `bottom-sheet`
avec dialogue natif, fermeture Échap/fond et retour du focus au déclencheur.
Toute animation respecte `prefers-reduced-motion`. Les effets de survol restent réservés
aux appareils avec un pointeur précis ; conserver un focus visible et un état appuyé.
Les erreurs de quantité sont immédiates : bordure rouge, message textuel lié au champ
et `aria-invalid`, puis retour à l’état normal lorsque la saisie est corrigée.

Le formulaire guide la saisie avec labels, exemples et aides. Son action principale reste visible mais désactivée lorsque les champs nécessaires sont invalides ; une indication explique quoi renseigner pour l’activer. Les mêmes règles sont vérifiées à la soumission clavier.

## Choix uniques

Utiliser le motif segmenté de l’état En cours/Terminés pour les choix mutuellement exclusifs :
fond commun atténué, option active en primaire et texte inverse. Les groupes des formulaires
et filtres utilisent `.segmented-choice`. Conserver les radios natives pour les préférences
et les formulaires, et un focus clavier visible. Les raccourcis de quantité sont des actions
de saisie, pas une liste exhaustive de valeurs exclusives.

Exception pour la fréquence : les quatre choix sont des boutons distincts en grille
2 × 2, avec bordure primaire et sélection pleine en primaire. Ne pas les réunir
dans un fond segmenté sur deux lignes.
