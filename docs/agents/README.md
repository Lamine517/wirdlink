# Équipe WirdLink

Profils persistants pour préparer le travail avant l'implémentation des fonctionnalités.
Les fichiers ne représentent pas des processus démarrés en permanence.

| Identifiant | Profil |
| --- | --- |
| `coordinateur` | [Coordinateur technique](coordinateur.md) |
| `product-owner` | [Product owner / analyste](product-owner.md) |
| `architecte` | [Architecte logiciel](architecte.md) |
| `dev-front` | [Développeur frontend Angular](dev-front.md) |
| `dev-back` | [Développeur backend](dev-back.md) |
| `ui-ux` | [Designer UI / UX](ui-ux.md) |
| `qa` | [Testeur QA](qa.md) |
| `devops` | [Ingénieur DevOps](devops.md) |
| `securite` | [Ingénieur sécurité](securite.md) |

## Utilisation

Claude Code : les profils sont déclarés dans `.claude/agents/`.
Demander par exemple : « Utilise l'agent dev-front pour implémenter le compteur,
puis l'agent qa pour vérifier les critères de la tâche. »

Codex : demander « Lis `docs/agents/architecte.md` et propose un ADR pour le backend. »
Pour un travail délégué, transmettre explicitement le chemin du profil à chaque sous-agent.
La disponibilité et le nombre d'agents simultanés dépendent de l'outil utilisé.

Exemple de mission :

```text
Profil : dev-front
Objectif : implémenter le compteur selon les critères validés de la story.
Sources : story confirmée et nœud Figma de participation 28:102.
Fichiers attribués : composant et test de compteur uniquement.
Dépendances : contrat métier des limites fourni par product-owner / architecte.
Terminé quand : interactions accessibles, bornes testées, build vérifié.
Retour attendu : fichiers, contrôles exécutés, limites et questions.
```

Le coordinateur découpe le besoin ; product-owner et UI/UX clarifient les points
nécessaires ; architecte et sécurité cadrent les décisions concernées ; frontend et
backend implémentent des périmètres distincts ; QA vérifie ; DevOps prépare la livraison.
Mobiliser uniquement les profils utiles à la tâche, sans imposer tout le circuit à une petite modification.
