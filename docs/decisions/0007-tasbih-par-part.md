# 0007 — Tasbih personnel associé à une part

- Date : 2026-11-16
- Statut : appliqué au frontend sur demande utilisateur

Chaque part en cours propose Compter, puis Reprendre si une progression existe. Cette action
ouvre un tasbih personnel dont l’objectif est exactement la quantité réservée. Un appui natif
sur le cercle ajoute une unité ; le compteur est plafonné à la part. Il reste utilisable hors ligne.

Les compteurs sont enregistrés localement par identifiant de part, indépendamment des lectures
collectives terminées. Les préférences de vibration sont mémorisées sur cet appareil. L’annulation
retire une unité sans descendre sous zéro ; la remise à zéro demande confirmation et ne libère
pas la part. Les enregistrements sont validés au chargement ; en cas d’échec, un message explique
que la part reste réservée. Une indisponibilité de stockage ne bloque pas la session.

À l’objectif : signal visuel et demande de vibration si activée et proposée par le navigateur.
Aucune vibration au rechargement d’un objectif déjà atteint. Une vibration par appui peut être
activée ; le signal de fin remplace alors le petit signal du dernier appui pour éviter deux pulses.
Les refus et navigateurs sans vibration ne bloquent pas le compteur. La vibration physique doit
encore être vérifiée sur appareils réels ; la compatibilité dépend du navigateur et du matériel.
Référence : https://developer.mozilla.org/en-US/docs/Web/API/Navigator/vibrate

J’ai fini exige une confirmation explicite ; les appuis ne modifient jamais le total collectif.
La confirmation reste désactivée hors ligne. Le raccourci manuel J’ai fini dans Mes parts reste
possible pour les personnes qui lisent sans le tasbih. Le projet reste une démonstration locale ;
la future transaction serveur devra conserver cette séparation et l’idempotence.

Les trois onglets principaux sont conservés. Les favoris et le tasbih libre sans part ne sont pas
ajoutés par ce lot : la demande précise ici un compteur pour l’objectif pris par le participant.
