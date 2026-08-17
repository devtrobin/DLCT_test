# Rendez-vous et changements de créneau

> Statut : référence métier  
> Dernière mise à jour : 17 août 2026  
> Navigation : [`SUMMARY.md`](SUMMARY.md)

## 1. Périmètre

Ce document possède les règles de création, de concurrence, d'annulation et de modification d'un rendez-vous. Le calcul des créneaux disponibles appartient à [`AVAILABILITY_AND_TIMEZONES.md`](AVAILABILITY_AND_TIMEZONES.md) et leur traduction en contraintes PostgreSQL à [`DATA_MODEL.md`](DATA_MODEL.md).

## 2. Création [Imposé]

Un rendez-vous contient au minimum :

- le professionnel ;
- le compte client lorsqu'il existe ;
- un instant de début et de fin en UTC ;
- un instantané du prénom, du nom, du téléphone et de l'adresse électronique du client ;
- un statut ;
- un code public aléatoire, opaque, unique et non séquentiel ;
- les dates de création et de mise à jour.

Sa création, l'incrément de `calendarVersion`, l'événement d'historique et les
notifications partagent une transaction. Les DTO HTTP ne reprennent jamais
directement un objet Prisma `Appointment`.

### 2.1 Réservation par un client

Le client connecté choisit un créneau réellement disponible. La réservation est immédiatement confirmée : le professionnel reçoit une notification de nouvelle réservation et le client une notification interne de confirmation, selon le catalogue de [`NOTIFICATIONS.md`](NOTIFICATIONS.md).

### 2.2 Création manuelle par un professionnel

La création manuelle respecte les mêmes disponibilités, indisponibilités et protections concurrentes que la réservation client.

Le professionnel saisit les coordonnées du client :

- si l'adresse correspond exactement à un compte `CLIENT`, le rendez-vous lui est rattaché ;
- sinon, le rendez-vous reste invité et son code public est affiché au professionnel afin qu'il le transmette directement au client.

Dans les deux cas, l'instantané du rendez-vous reprend les coordonnées saisies
par le professionnel. Un rattachement permet l'accès et les notifications ; il
ne remplace pas ces valeurs par le profil et ne modifie pas ce profil.

Ce parcours représente un accord déjà obtenu par téléphone ou en personne. Le rendez-vous est donc immédiatement confirmé, sans acceptation supplémentaire.

## 3. Code public [Démo]

- Le code possède au moins 128 bits d'entropie.
- Il utilise une représentation compatible URL.
- Il est conservé sous forme opaque afin de pouvoir être réaffiché pendant la démonstration.
- Il n'a pas d'expiration temporelle.
- Il est révoqué si le compte client ou professionnel lié est supprimé.
- Une annulation seule ne le révoque pas : le rendez-vous annulé reste consultable en lecture seule.

Un projet réel pourrait ne conserver qu'une empreinte du code et ne l'afficher qu'une fois.

Les actions autorisées au détenteur du code sont décrites dans [`ACCOUNTS_AND_AUTHENTICATION.md`](ACCOUNTS_AND_AUTHENTICATION.md).

La page publique affiche uniquement les informations du rendez-vous nécessaires à sa gestion : nom commercial du professionnel, état, date, heure, fuseau, durée, proposition éventuelle et historique. Elle n'affiche aucune coordonnée personnelle du client.

## 4. Statuts

Le périmètre utilise volontairement deux statuts de rendez-vous :

- `CONFIRMED` : le rendez-vous réserve son créneau ;
- `CANCELED` : le rendez-vous ne réserve plus le créneau et reste consultable dans l'historique.

Une proposition de modification possède son propre état et ne change pas celui du rendez-vous avant son acceptation.

## 5. Garantie contre les chevauchements [Imposé]

- Un professionnel ne peut pas posséder deux rendez-vous confirmés dont les intervalles se chevauchent.
- Une vérification applicative seule n'est pas suffisante : la base doit conserver cet invariant en cas de requêtes concurrentes.
- Un rendez-vous adjacent à un autre est autorisé.
- Lors de deux demandes simultanées pour le même créneau, une seule peut réussir.
- Une violation concurrente retourne `409 Conflict` ; le frontend recharge alors les créneaux.
- Le même client peut réserver le même horaire auprès de professionnels différents.

La contrainte PostgreSQL et sa migration sont documentées dans [`DATA_MODEL.md`](DATA_MODEL.md).

## 6. Annulation

- Aucun délai minimal n'est imposé.
- Une confirmation visuelle est requise.
- Le motif est facultatif pour le client et obligatoire pour le professionnel.
- Le rendez-vous passe à `CANCELED` et n'est pas effacé physiquement.
- Une `CancellationCause` stable distingue l'auteur ou l'effet automatique ;
  le texte libre reste séparé dans `cancellationReason`.
- Toute proposition `PENDING` liée passe à `CANCELED` dans la même transaction.
- Le créneau est libéré immédiatement.
- L'autre partie reçoit une notification interne si elle possède un compte.
- Le rendez-vous reste consultable dans les historiques et par son code public, tant que celui-ci n'est pas révoqué.

Dans l'interface, l'action est toujours nommée « Annuler le rendez-vous », jamais « Supprimer le rendez-vous ».

## 7. Modification bilatérale [Démo — objectif secondaire]

Le client ou le professionnel peut proposer un nouveau créneau auprès du même professionnel.

Ce workflow n'est pas imposé par le sujet. Si le temps de réalisation devient contraint, il constitue la première fonctionnalité à réduire après le parcours obligatoire de réservation et d'annulation.

### 7.1 Proposition

- Le rendez-vous actuel reste confirmé et réserve son créneau.
- Une seule proposition peut être active à la fois pour un rendez-vous.
- Le créneau proposé n'est pas réservé.
- La proposition n'expire pas automatiquement.
- Le nombre de propositions successives n'est pas limité.
- Le destinataire peut accepter ou refuser ; le motif du refus est facultatif.
- L'auteur peut annuler sa proposition tant qu'elle est en attente.
- Chaque action est ajoutée à l'historique et produit l'événement interne correspondant.
- Le rendez-vous doit être `CONFIRMED`, futur, et le créneau proposé doit être
  différent du créneau courant.
- Le créneau est vérifié lors de la création pour éviter une proposition déjà
  impossible, mais cette vérification ne le réserve pas.
- La création verrouille le calendrier sans en changer la version et recharge
  le rendez-vous dans la transaction. Elle ne peut pas laisser une proposition
  en attente après une annulation concurrente.
- Le sélecteur, la création, l'acceptation et le forçage ignorent uniquement
  le rendez-vous déplacé dans le calcul des conflits. Ils conservent toutes les
  autres contraintes et permettent ainsi un déplacement qui recouvre
  partiellement l'ancien intervalle.

Une session du client rattaché ou le code public valide représente le même
côté métier `CLIENT_SIDE`. L'auteur et le destinataire d'une proposition sont
des côtés métier ; l'historique conserve séparément le moyen d'accès réellement
utilisé.

### 7.2 Acceptation et conflit

L'acceptation vérifie à nouveau la disponibilité dans une transaction.

Si le créneau est encore libre, le rendez-vous est déplacé et la proposition devient `ACCEPTED`.

S'il est devenu indisponible :

- le premier rendez-vous confirmé reste prioritaire ;
- le rendez-vous initial n'est pas modifié ;
- la proposition devient `CONFLICT` ;
- le destinataire reçoit immédiatement l'erreur et peut proposer un autre
  créneau ;
- l'auteur connecté reçoit une notification indiquant l'échec de sa
  proposition.

Le service verrouille d'abord le calendrier puis recharge la proposition avec
`status = PENDING`. Si le créneau est occupé, il enregistre `CONFLICT`,
l'historique et la notification, valide la transaction, puis retourne l'erreur
HTTP stable. Il ne lève pas à l'intérieur de la transaction une exception qui
annulerait également ces écritures.

### 7.3 Acceptation forcée

Le professionnel peut forcer l'acceptation après avoir obtenu l'accord du client hors de l'application.

- une seconde confirmation visuelle est obligatoire ;
- la contrainte anti-chevauchement reste applicable ;
- l'historique ajoute « Acceptation forcée par le restaurateur » ;
- l'autre compte reçoit une notification interne.

Cette action est limitée à une proposition créée par ce professionnel et
adressée à `CLIENT_SIDE`. Une proposition du client adressée au professionnel
utilise simplement l'acceptation normale. Le corps HTTP contient une
confirmation explicite ; le professionnel ne peut jamais forcer un conflit de
base de données.

### 7.4 Machine d'état et autorisations

Une répétition de l'action ayant produit `ACCEPTED`, `REJECTED` ou `CANCELED`
retourne l'état courant en `200`, sans nouvel historique ni notification. Une
acceptation répétée après `CONFLICT` retourne encore le conflit du créneau.
Toute autre action sur une proposition déjà décidée retourne
`409 PROPOSAL_NOT_PENDING`. Deux acceptations concurrentes ne peuvent donc pas
déplacer deux fois le rendez-vous.

| Transition | Acteur autorisé | Résultat |
|---|---|---|
| création | un côté du rendez-vous | `PENDING` |
| `PENDING` → `ACCEPTED` | destinataire | rendez-vous déplacé |
| `PENDING` → `REJECTED` | destinataire | rendez-vous inchangé |
| `PENDING` → `CANCELED` | auteur ou annulation système | rendez-vous inchangé |
| `PENDING` → `CONFLICT` | service lors d'une acceptation | rendez-vous inchangé |
| `PENDING` → `ACCEPTED` forcé | professionnel auteur | rendez-vous déplacé |

Il est interdit de proposer sur un rendez-vous passé ou annulé, d'accepter sa
propre proposition ou de proposer le créneau courant. Une seconde annulation
retourne l'état annulé en `200`, sans dupliquer ses effets.

## 8. Historique

L'historique conserve au minimum :

- la création ;
- l'annulation et son auteur ;
- les propositions de créneau ;
- leur acceptation, refus, annulation ou conflit ;
- toute acceptation forcée ;
- les annulations provoquées par un changement d'horaires ou une indisponibilité.

Sa présentation visuelle est définie dans [`SCREENS.md`](SCREENS.md).

Les codes persistés sont :

| Code | Usage principal |
|---|---|
| `APPOINTMENT_CREATED` | réservation client |
| `MANUAL_APPOINTMENT_CREATED` | création manuelle professionnelle |
| `APPOINTMENT_CANCELED` | annulation volontaire |
| `CHANGE_PROPOSED` | nouvelle proposition |
| `CHANGE_ACCEPTED` | acceptation normale |
| `CHANGE_REJECTED` | refus |
| `CHANGE_CANCELED` | retrait ou annulation avec le rendez-vous |
| `CHANGE_CONFLICT` | créneau devenu indisponible |
| `CHANGE_FORCED` | acceptation forcée |
| `SCHEDULE_CANCELLATION` | horaires hebdomadaires modifiés |
| `UNAVAILABILITY_CANCELLATION` | indisponibilité créée |
| `ACCOUNT_DELETION_CANCELLATION` | compte supprimé |

Le `payload` contient seulement les instants, fuseaux, motifs et identifiants
fonctionnels nécessaires. Le mapper destiné au code public retire toute
coordonnée, tout identifiant de compte et tout libellé révélant l'identité du
client. Lors d'une suppression de compte, les instantanés et payloads conservés
sont anonymisés dans la même transaction.

Une action interactive conserve son principal réel dans l'historique. Un effet
dérivé, comme un conflit constaté ou une annulation provoquée par une autre
commande, utilise `SYSTEM`; le tableau exact appartient au
[modèle de données](DATA_MODEL.md#7-historique).
