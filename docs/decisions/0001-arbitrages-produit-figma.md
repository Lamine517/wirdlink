# 0001 — Arbitrages produit entre Figma et les exports Notion

- Date : 2026-11-15
- Statut : accepté pour la préparation du développement, sur délégation d'arbitrage de l'utilisateur
- Périmètre : exigences locales ; aucune modification de Figma ni publication GitHub

## Contexte et priorité

L'utilisateur demande de valider les points par cohérence avec Figma.
Page « WirdLink mobile v2 », fichier `NuTNH7YIfpPBtR4OfCwwRe`, métadonnées relues
le 15 novembre 2026 ; capture de P1 (58:537) inspectée visuellement.
Les autres constats ci-dessous proviennent des noms, textes et dimensions des nœuds,
pas d'une inspection visuelle exhaustive. Les exports originaux restent inchangés.

Ordre de décision : arbitrages de ce document, exigences explicites v2 et minima
d'accessibilité, puis Figma pour l'interaction et le visuel, puis remise et v1 pour
les compléments compatibles. Un écran Figma ne prouve ni son implémentation ni la
faisabilité d'un service. Les décisions déduites par cohérence sont identifiées ci-dessous.

## Décisions retenues

| Sujet | Décision | Preuve ou justification |
| --- | --- | --- |
| Navigation | Trois onglets : Accueil, Mes parts, Créer. Aucun quatrième onglet Profil. Le titre d'accueil reste Mes wirds. | Variantes BottomNav 61:781 ; P1 58:537 et capture |
| Filtres | Inclure En cours/Terminés et feuille de filtres par état, récurrence et visibilité. Sans favoris ni recherche dans le périmètre initial. | P1 58:537, P2 58:616 ; absence de besoin initial confirmé pour favoris/recherche, arbitrage de simplicité |
| Libellés participant | Je participe sur la carte, Je commence à la confirmation, J'ai fini pour terminer. Employer ces formulations partout. | Capture P1 ; N2 54:554 ; première visite N3 54:584 |
| Quantité | Conserver −/+, raccourcis +1/+5/+10 du cahier et permettre la saisie directe ainsi que des suggestions de quantité dont Tout. Quantité entière positive, au plus le reste disponible ; refuser un dépassement avec explication, puis actualiser le reste. Les valeurs 100/200/400 sont illustratives. | N1 54:520, N2 54:554 ; bornes et réaction serveur retenues par cohérence |
| Comptage | Je commence réserve la quantité et réduit le disponible ; J'ai fini transforme cette réservation en lecture terminée sans seconde baisse du disponible. Distinguer réservé et terminé dans les données ; une répétition de requête ne compte pas deux fois. | v2 §3.B ; arbitrage nécessaire pour cohérence du compteur |
| Progression | Les perles représentent les lectures terminées ; le texte Il reste indique les quantités encore disponibles à réserver. Ne pas présenter une réservation comme une lecture achevée. Si les deux valeurs divergent, montrer explicitement les engagements en cours. | Décision de cohérence : P3 58:655 distingue en cours/fini mais ses chiffres d'exemple confondent ces notions |
| Participants | Inclure la vue Le wird / Les participants ; ne montrer que le nom choisi, le statut et la quantité. Regrouper les personnes sans nom ; aucun téléphone ni identifiant d'appareil affiché. Appliquer la même autorisation que pour le wird. | P3 58:655 ; protection déduite de la confidentialité du wird |
| Création | Modèles avant Quoi / Quand / Aperçu ; connexion seulement à Publier puis partage. Audio, description et photo facultatifs. | v2 et remise ; 28:134, 28:162, 28:194 |
| Brouillon | Conserver localement les champs de création sur le même navigateur et les restaurer après retour ; effacer après publication réussie ou abandon explicite. Ne pas promettre une reprise des fichiers audio/images ni une synchronisation multi-appareils. | Arbitrage de continuité du parcours, non démontré par la maquette |
| Langue | Français uniquement, sans écran de choix de langue. Préserver les contenus arabes sans ajouter de traduction de l'interface. | v2 §1 ; aucun choix utile pour une seule langue |
| Privé après publication | Afficher au responsable le code à 4 chiffres et le lien sécurisé sur Partage pour un wird privé, avec copie. Ne pas exposer ces éléments dans les listes publiques. | Arbitrage : indispensable pour rendre exploitable le parcours privé prévu ; ajout requis au cadre 28:216 |
| Authentification | Téléphone +221, code à 6 chiffres, Google et Apple ; pas d'email OTP. Le bouton Facebook observé dans E Numéro ne devient pas un mode de connexion initial. | 34:161 contient aussi Facebook, absent des modes spécifiés v2 ; éviter l'ajout implicite d'un fournisseur |
| Rappels | Prévoir demande douce après une première part terminée, puis permission système uniquement sur action explicite ; refus sans blocage. Réglages accessibles depuis Mes parts sans nouvel onglet. Fin/reprise du wird pour les participants volontaires, échéance pour le responsable. | N4 54:625, N5 54:651, N6 54:674 ; emplacement des réglages et déclencheur exact arbitrés par cohérence |
| Fréquence des rappels | Maximum un rappel par jour et par destinataire, heures calmes 22 h–7 h ; fin sans son demandé par l'application. Le vendredi à 9 h est un exemple de rappel, pas une heure de réinitialisation validée. | N4/N5/N6 ; fuseau et règle de priorité des messages restent à préciser |
| Installation | Proposition non bloquante après une première participation terminée ; possibilité de reporter. Éviter de cumuler demandes d'installation et notifications au même moment. Adapter l'explication au navigateur réel. | 34:271 ; moment retenu par cohérence, pas imposé par les nœuds |
| Hors ligne | Consultation des parts déjà mémorisées, indication visible du hors ligne. Aucune nouvelle réservation, publication ou confirmation de fin réputée validée sans réponse serveur. Pas de file de synchronisation implicite. L'installation seule ne garantit pas un premier chargement hors connexion. | 41:199 annonce conservation locale ; périmètre limité retenu pour éviter les conflits de compteur |
| Dimensions | Textes ≥20 px et cibles ≥48 px restent obligatoires. Boutons principaux : 68 px minimum selon la remise, hauteur extensible si retour de ligne. Les composants Figma de 56 px sont une divergence à corriger dans l'implémentation. | v2 §5, remise §3–5, composants 28:3–17 à 56 px ; accessibilité prioritaire |
| Tokens et écran web | Partir des tokens documentés dans la remise ; vérifier chaque contraste réel et éviter tout débordement. Même application centrée sur ordinateur, avec partage et QR. | Remise §4 ; cadres web 36:60 et 36:173 ; tokens non relus via styles Figma pendant cet arbitrage |

## Points qui demandent encore une décision externe ou un contrat technique

- Fournisseur WhatsApp/SMS, coûts, configuration Google/Apple, hébergeur et domaine réel.
- Contact d'aide, validation des textes juridiques et droits des illustrations.
- Fuseau, heures et frontières des cycles ; traitement des engagements en cours au changement de cycle.
- Annulation, expiration et achèvement partiel des parts ; conservation des historiques et médias.
- Mécanisme d'autorisation sans compte, conservation/perte de l'identité locale et révocation du lien privé.
- Transport et disponibilité réelle des notifications ; suppression ou report d'un rappel pendant les heures calmes.

Ne pas déduire ces choix d'un texte d'exemple. Les minima et les parcours ci-dessus
peuvent guider le frontend ; les contrats de comptage, permissions et récurrence doivent
être précisés avant les migrations et écritures serveur correspondantes.

## Validation et conséquences

Pour les futures tâches QA : absence de compte participant, trois onglets, cohérence
des trois libellés, refus des quantités invalides, réservation distincte de la fin,
non-duplication, confidentialité des participants et du code privé, brouillon restauré,
lecture locale hors ligne sans faux succès serveur, refus de notifications non bloquant,
textes/cibles conformes. Vérifier aussi clavier, zoom et petits écrans.
Ces critères ne sont pas encore exécutables : aucune fonctionnalité n'est implémentée.
