# 0020 — Statistiques du créateur et offre organisateur

Date : 17 novembre 2026. Statut : statistiques livrées ; offre organisateur validée, implémentation reportée.

## Statistiques globales du créateur

- La page Mon profil affiche « Mes wirds en chiffres » dès que le compte a publié un wird :
  nombre de wirds, participants distincts, lectures terminées, objectifs atteints sur le nombre
  de cycles, puis un lien vers le suivi de chaque wird.
- La fonction `creator_stats()` est réservée aux comptes connectés et ne renvoie que des totaux
  par jour (fuseau Africa/Dakar). Aucun nom ni identifiant de participant ne quitte la base.
- Un wird « Une fois » compte pour un cycle ; le cycle en cours entre dans le total.
- Pas de tableau de bord de toute l’application pour le responsable : non demandé à ce stade.

## Offre organisateur (validée le 17 novembre 2026, non implémentée)

Principe : ne jamais retirer ce qui est déjà donné, ne jamais faire payer celui qui lit.
Seul le responsable d’une dahira paie, pour des outils d’organisation.

Gratuit, sans limite de durée :

- participer sans compte, Mes parts, tasbih, rappels dans l’application ;
- wirds publics illimités ;
- 3 wirds privés en cours au maximum (les wirds terminés ne comptent pas) ;
- statistiques actuelles : résumé dans Mon profil et suivi de chaque wird sur 7 cycles.

Offre organisateur :

- wirds privés illimités ;
- historique complet des cycles de chaque wird ;
- jusqu’à 5 responsables par wird ;
- logo de la dahira sur ses wirds ;
- rappels SMS ou WhatsApp en recharge séparée, à prix coûtant plus une petite marge,
  fixé après le choix du fournisseur.

Prix et durée, sous le nom « Pass dahira » (révisé le 17 novembre 2026) :

- pas d’abonnement ni de renouvellement automatique : le public cible n’a pas l’habitude
  des paiements récurrents, et chaque paiement est de toute façon un transfert manuel ;
- Pass année : 15 000 F CFA, offre principale ;
- Pass mois : 2 000 F CFA ;
- un mois d’essai gratuit, sans paiement préalable ;
- membres fondateurs (20 premières dahiras) : Pass année à 10 000 F CFA, conservé à vie ;
- rappel discret dans l’application 7 jours avant la fin du pass.

Règles de transition :

- à l’expiration, rien n’est supprimé ni bloqué : les wirds privés existants continuent,
  les participants ne voient aucune différence ; seuls la création d’un 4e wird privé
  et l’affichage du logo sont désactivés ;
- la limite de 3 wirds privés est annoncée un mois avant son application ; les créateurs
  qui en ont déjà plus les conservent ;
- l’offre n’est présentée qu’au créateur, au moment où il atteint une limite, sans bandeau
  ni relance.

Paiement : transfert Wave ou Orange Money au numéro de dons, puis activation manuelle par le
responsable de WirdLink depuis une page qui lui est réservée (dahira, date de fin).

Calendrier : implémentation quand des dahiras utilisent réellement l’application et sur
demande explicite. Au 17 novembre 2026 : 2 créateurs, 6 wirds, au plus 3 wirds privés par
créateur ; la limite gratuite ne touche donc personne.

Restent à préciser à l’implémentation : rattachement d’une offre à un compte ou à une
dahira, fournisseur de rappels, rôle administrateur pour l’activation, mention dans les
Règles d’utilisation.
