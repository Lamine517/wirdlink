# Solalma — consignes pour Claude Code

Solalma : essayage virtuel de vêtements pour vendeurs de Dakar (Instagram, WhatsApp). L'acheteur essaie une tenue sur sa photo puis commande sur WhatsApp en 3 touches. Public peu à l'aise avec le numérique.

## Stack

- `web/` : Angular (standalone, signals, OnPush), SCSS. Application publique en PWA (acheteur `/b/:boutique`, vendeur `/vendeur`) et console d'administration (`web/console/`, ADR 0015 et 0021).
- `supabase/` : PostgreSQL + RLS, Storage, Edge Functions (Deno, TypeScript).
- Essayage IA via l'interface `TryOnProvider`, fournisseur `demo` par défaut.

## Commandes

```
cd web && npm start          # développement, données de démo
cd web && npm run start:local  # développement sur le Supabase local (port 4200 ; code SMS de test : 77 123 45 67 / 123456)
cd web && npm run start:console  # console d'administration sur le Supabase local (port 4300 ; admin@solalma.local / Console-Locale-2026, puis application d'authentification)
cd web && npm test           # tests unitaires (npm run test:console pour la console)
cd web && npm run e2e        # parcours critiques et accessibilité (Playwright, démo, port 4210)
cd web && npm run lint       # lint
cd web && npm run build      # build de production + budgets
supabase start               # back local (Docker)
supabase db reset            # rejoue migrations + seed
supabase test db             # tests pgTAP des règles d'accès
npx deno test --allow-env --config supabase/functions/deno.json supabase/functions   # tests des fonctions serveur
```

Node 24 requis (`.nvmrc`). Supabase local sur les ports 5532x (voir `supabase/config.toml`).

## Règles qui ne se discutent pas

- Le navigateur n'appelle jamais un fournisseur d'IA ; tout passe par la fonction serveur `try-on`.
- RLS activée sur toute nouvelle table, dans la même migration, avec un test pgTAP.
- Aucun secret dans le code ; aucune photo, nom ou numéro complet dans les journaux.
- Une migration appliquée ne se modifie jamais.
- Aucune photo de personne réelle dans le dépôt.
- UX du public cible : 3 touches jusqu'à la commande, texte 15 px minimum, boutons 48 px minimum, icône toujours accompagnée d'un mot.
- Textes de l'interface en français, vouvoiement, via l'i18n Angular.
- Nouvelle dépendance, nouveau service externe ou exception à une norme : proposer un ADR dans `docs/decisions/` avant de coder.

## Façon de travailler

- Maquettes : fichier Figma `cdiHnecyd1PM4eyaLPlXZt`. Le code fait foi pour l'existant : les pages numérotées (Site vitrine, Acheteur, Vendeur, Attente et erreurs, Administration) en sont la capture, en téléphone et ordinateur ; « Écrans annexes » regroupe l'ancien. Les nouvelles idées se dessinent dans leur propre page (par exemple « Couleurs · Proposition »), à partir de « Composants ». Pour intégrer un écran, lire le nœud Figma via le MCP Figma et réutiliser les tokens et composants existants. Après un lancement, recapturer les écrans modifiés.

- Changement de prix, de quota offert ou de fournisseur payant : mettre à jour `docs/modele-economique.md` (aucune offre sous son coût d'essai).
- Lire la norme du domaine avant de coder : `docs/normes/` (architecture, frontend, backend, tests-qa, design-ux, ia-donnees, devops).
- Code en anglais (glossaire de l'ADR 0014) ; textes de l'interface, adresses des pages, commentaires et documentation en français.
- Commits au format Conventional Commits, description en français (voir `CONTRIBUTING.md`).
- Changement de comportement : mettre à jour le test et la doc concernés dans le même commit.
- Fin de tâche : lancer lint, tests et build du périmètre touché ; signaler ce qui n'a pas pu être vérifié.
- Relecture : proposer `@agent-dev-front`, `@agent-dev-back`, `@agent-ux` ou `@agent-testeur` selon le changement.
