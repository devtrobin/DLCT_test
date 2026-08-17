# Notifications internes

> Statut : référence fonctionnelle  
> Dernière mise à jour : 17 août 2026  
> Navigation : [`SUMMARY.md`](SUMMARY.md)

## 1. Principe [Démo]

Toutes les notifications sont internes à l'application. Aucun SMS ni courriel n'est envoyé ou simulé.

Une notification contient :

- le compte destinataire ;
- un type d'événement ;
- les données structurées nécessaires à sa présentation ;
- le rendez-vous lié, si pertinent ;
- sa date de création ;
- sa date de lecture, nulle tant qu'elle n'a pas été lue ;
- une clé métier empêchant deux notifications pour le même événement métier.

Le backend ne stocke pas de titre ou de phrase prétraduite. Le frontend
associe le type à une clé Vue I18n et utilise les données comme variables
d'interpolation. Les valeurs saisies par un utilisateur restent inchangées.
Les acteurs et causes automatiques sont aussi des codes stables, jamais des
libellés français persistés.

Il existe uniquement deux états : **non lue** et **lue**.

## 2. Destinataires

- Un client connecté possède sa propre boîte de notifications.
- Un professionnel connecté possède sa propre boîte de notifications.
- Un visiteur muni d'un code public ne possède pas de boîte : les événements utiles apparaissent dans l'état et l'historique de son rendez-vous unique.
- Une notification n'est jamais exposée à un autre compte.

## 3. Catalogue des événements

Une notification est créée pour le compte concerné lors des événements suivants :

| Type | Événement | Destinataire |
|---|---|---|
| `APPOINTMENT_CREATED` | Nouvelle réservation client. | Professionnel et client ayant réservé. |
| `MANUAL_APPOINTMENT_CREATED` | Création manuelle rattachée à un compte client. | Client rattaché. |
| `APPOINTMENT_CANCELED` | Annulation par l'autre partie. | Autre compte lié. |
| `CHANGE_PROPOSED` | Nouvelle proposition de créneau. | Compte rattaché au côté destinataire, s'il existe. |
| `CHANGE_ACCEPTED` | Proposition acceptée. | Compte rattaché au côté auteur, s'il existe. |
| `CHANGE_REJECTED` | Proposition refusée. | Compte rattaché au côté auteur, s'il existe. |
| `CHANGE_CANCELED` | Proposition retirée par son auteur. | Compte rattaché au côté destinataire, s'il existe. |
| `CHANGE_FORCED` | Acceptation forcée par le professionnel. | Client rattaché. |
| `CHANGE_CONFLICT` | Créneau proposé devenu indisponible. | Compte rattaché au côté auteur, s'il existe. |
| `SCHEDULE_CANCELLATION` | Annulation causée par un changement d'horaires. | Client rattaché. |
| `UNAVAILABILITY_CANCELLATION` | Annulation causée par une indisponibilité exceptionnelle. | Client rattaché. |
| `ACCOUNT_DELETION_CANCELLATION` | Annulation causée par la suppression de l'autre compte. | Contrepartie authentifiée restante. |

Ce tableau est l'unique catalogue détaillé des événements de notification. Les autres documents y font référence sans le recopier.

Le destinataire est résolu depuis le côté métier et les relations actuelles du
rendez-vous, jamais depuis `authorUserId` ou le canal ayant effectué l'action.
Ainsi, une action avec un code public conserve `PUBLIC_CLIENT` dans
l'historique, mais notifie aussi le compte client rattaché s'il existe.

Quand une proposition `PENDING` est annulée automatiquement avec son
rendez-vous, `CHANGE_CANCELED` reste dans l'historique mais ne crée pas une
seconde notification. La contrepartie reçoit uniquement la notification
d'annulation du rendez-vous, volontaire ou spécialisée selon sa cause.

Le schéma de transport de chaque `payload` appartient au
[`contrat API`](API.md#44-notification). La relation au rendez-vous reste un
champ distinct et n'est pas recopiée dans le payload. Les champs absents sont
omis, jamais remplacés par `null` sans signification. Les identifiants de
comptes, mots de passe, codes publics et jetons de session y sont interdits.

## 4. Création et cohérence

- La notification est créée dans la même transaction que l'événement métier.
- Sa clé métier est unique pour un destinataire et un événement afin d'éviter
  un doublon de notification.
- Cette unicité ne rend pas toute la commande HTTP idempotente : une seconde
  réservation ou proposition suit ses validations et peut retourner un conflit.
- Il n'existe ni statut de livraison, ni erreur télécom, ni nouvelle tentative d'envoi.
- Les notifications sont conservées jusqu'à la suppression du compte destinataire.
- Aucune tâche de purge périodique n'est nécessaire dans la démonstration.
- Une notification reste lisible si sa ressource liée n'est plus accessible ; son lien est alors absent.

## 5. Consultation

- Une cloche affiche le nombre de notifications non lues.
- Un panneau présente les cinq notifications les plus récentes.
- Une page présente la liste complète, de la plus récente à la plus ancienne.
- Un clic ouvre le rendez-vous associé lorsqu'il reste accessible.
- L'utilisateur peut marquer une notification ou toutes ses notifications comme lues.
- Il ne peut pas supprimer manuellement une notification.
- Un bouton « Actualiser » récupère les événements produits par l'autre partie.
- La liste est aussi rafraîchie au chargement d'une page et après une action métier.
- Aucun WebSocket ni mécanisme push n'est requis.

Les écrans correspondants sont décrits dans [`SCREENS.md`](SCREENS.md).

## 6. API et persistance

Les routes appartiennent à [`API.md`](API.md) et la persistance à
[`DATA_MODEL.md`](DATA_MODEL.md).
