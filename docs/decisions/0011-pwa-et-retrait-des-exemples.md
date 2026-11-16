# 0011 — PWA et retrait des exemples

- Date : 2026-11-16
- Statut : accepté
- Responsable : coordination technique WirdLink

## Contexte et décision

L’utilisateur demande le retrait du bandeau, une base vide, une installation PWA,
le favicon WirdLink et une interface mobile adaptée à toute la largeur.
La vérification Supabase montre zéro wird, part et média : les cartes visibles
étaient des fixtures frontend. Aucun compte Auth n’est supprimé.

Le store démarre vide. Les fixtures sont exclusivement dans les fichiers de test,
injectées par un token dont la valeur de production est vide. La clé locale des
anciennes démonstrations et leurs compteurs sont retirés, sans effacer la session,
les préférences ni le brouillon. Aucun paramètre d’URL ne réactive les exemples.

Le service worker Angular 20.3.35 et le manifeste rendent l’application installable.
Seuls les fichiers statiques sont préchargés. Aucun cache de réponses Supabase,
de profil ou de retour OAuth n’est créé. L’installation requiert une action de
l’utilisateur ; les navigateurs sans invitation native reçoivent des instructions.
Les icônes PNG, Apple et favicon sont dérivés du logo SVG existant.

Sur mobile : largeur complète et safe areas. À partir du breakpoint desktop, le
cadre existant est conservé. La suppression du bandeau ne vaut pas activation de
la publication distante, qui reste fermée tant que son raccordement est incomplet.

## Validation

Tests métier conservés avec fixtures isolées. Contrôles navigateur sur accueil
vide, largeurs 320/390/430/600 px, cadre desktop, manifeste, installation et
rechargement hors ligne réellement servi par le service worker.
