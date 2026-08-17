# Modèle de données

> Statut : source de vérité pour PostgreSQL et Prisma  
> Dernière mise à jour : 17 août 2026  
> Navigation : [`SUMMARY.md`](SUMMARY.md)

## 1. Principe d'alignement avec le backend fourni

Le modèle part du schéma réellement livré dans
`02_Back-End/ExpressStarterDCT/prisma/schema.prisma`. Le modèle Prisma `User`
reste l'agrégat d'authentification. Le terme « compte » utilisé dans l'API et
l'interface désigne donc un `User` ; aucun modèle concurrent `Account` n'est
créé.

Les éléments utiles du starter sont conservés et adaptés :

- Prisma 7 et le générateur `prisma-client` ;
- PostgreSQL avec `@prisma/adapter-pg` ;
- les identifiants `Int` auto-incrémentés ;
- `User.email`, `User.password`, `User.role` et `User.createdAt` ;
- le client généré dans `src/generated/client` ;
- la connexion configurée par `prisma.config.ts`.

Le champ générique `User.name` est remplacé par `firstName` et `lastName` dans
le profil du rôle concerné. Le nom commercial n'est pas une identité de
connexion : il appartient uniquement à `ProfessionalProfile.businessName`.

Les exemples génériques sans parcours dans la démonstration sont supprimés :

- `LoginMethodType`, Google et toute identité externe ;
- les rôles `USER` et `ADMIN` ;
- `allowMarketingEmails` et `lastLogin` ;
- `RefreshToken` et l'authentification JWT ;
- `ForgotPasswordRequest` et les jetons de réinitialisation.

La récupération du mot de passe est un affichage de démonstration et ne
nécessite donc aucune table. Le modèle n'ajoute pas non plus de table pour les
SMS, courriels, exports, archives ou tâches de livraison, qui sont hors scope.

Le schéma cible utilise le mode multi-fichier de Prisma :

```text
02_Back-End/ExpressStarterDCT/prisma/
├── schema.prisma
├── models/
│   ├── users.prisma
│   ├── sessions.prisma
│   ├── availability.prisma
│   ├── appointments.prisma
│   ├── proposals.prisma
│   ├── appointment-history.prisma
│   └── notifications.prisma
└── migrations/
```

`schema.prisma` ne contient que le générateur et la datasource.
`prisma.config.ts` cible le dossier `prisma` et `prisma/migrations`.
Un fichier de modèle est encore scindé par responsabilité avant de dépasser
la limite de 100 lignes ; cette arborescence est donc extensible.

## 2. Conventions physiques

- Un identifiant métier interne est un `Int @id @default(autoincrement())`.
- Une clé étrangère porte le suffixe `UserId` lorsqu'elle vise `User`.
- Les noms Prisma sont en `camelCase` et les colonnes SQL en `snake_case`.
- Un instant absolu est un `DateTime @db.Timestamptz(3)`.
- Une date sans heure n'est pas persistée pour les rendez-vous.
- Une heure hebdomadaire locale est un nombre de minutes depuis minuit.
- Un fuseau est une chaîne IANA validée par le service avant écriture.
- Un intervalle temporel est semi-ouvert : `[start, end)`.
- Les chaînes ont une taille SQL explicite afin que l'API puisse appliquer
  la même limite avant l'accès à la base.
- Les contraintes impossibles à exprimer avec Prisma sont versionnées dans
  une migration SQL, jamais seulement dans le service.

Les objets Prisma ne constituent pas des DTO HTTP. Les services sélectionnent
les champs autorisés et les contrôleurs utilisent les projections de l'API.

### Correspondance avec l'API

- `/auth/register` crée un `User`, son profil et une `Session` dans une
  transaction.
- Le « compte courant » de `/v1/account` est la projection de `User` et du
  profil correspondant à `User.role`.
- L'identifiant `:id` d'un professionnel est `ProfessionalProfile.userId`,
  donc aussi `User.id` ; aucun second identifiant public n'est introduit.
- L'identifiant d'un rendez-vous est `Appointment.id` pour une session
  autorisée ; l'accès public résout seulement `Appointment.publicCode`.
- Les identifiants internes d'utilisateur ne figurent ni dans la projection
  publique d'un rendez-vous, ni dans son historique public.

## 3. Enums du domaine

### `UserRole`

- `CLIENT`
- `PROFESSIONAL`

Il n'existe ni administrateur, ni rôle implicite. Les anciennes valeurs du
starter ne sont pas migrées car aucune donnée de production n'existe.

### `AppointmentStatus`

- `CONFIRMED`
- `CANCELED`

### `CancellationCause`

- `CLIENT`
- `PROFESSIONAL`
- `SCHEDULE_CHANGED`
- `UNAVAILABILITY`
- `ACCOUNT_DELETED`

### `ProposalStatus`

- `PENDING`
- `ACCEPTED`
- `REJECTED`
- `CANCELED`
- `CONFLICT`

### `AppointmentParty`

- `CLIENT`
- `PROFESSIONAL`

Cette enum indique le côté métier d'une proposition. Elle ne décrit pas le
mode d'accès : un client peut agir avec sa session ou avec le code public.

### `HistoryActorType`

- `CLIENT_USER`
- `PROFESSIONAL_USER`
- `PUBLIC_CLIENT`
- `SYSTEM`

### `HistoryEventType`

- `APPOINTMENT_CREATED`
- `MANUAL_APPOINTMENT_CREATED`
- `APPOINTMENT_CANCELED`
- `CHANGE_PROPOSED`
- `CHANGE_ACCEPTED`
- `CHANGE_REJECTED`
- `CHANGE_CANCELED`
- `CHANGE_FORCED`
- `CHANGE_CONFLICT`
- `SCHEDULE_CANCELLATION`
- `UNAVAILABILITY_CANCELLATION`
- `ACCOUNT_DELETION_CANCELLATION`

`NotificationType` reprend exactement le catalogue de
[`NOTIFICATIONS.md`](NOTIFICATIONS.md). Une nouvelle valeur métier exige une
migration, un schéma de payload et une traduction Vue I18n.

## 4. Utilisateurs, profils et sessions

### 4.1 `User`

| Champ | Type et nullabilité | Règle |
|---|---|---|
| `id` | `Int`, non nul | Clé primaire auto-incrémentée. |
| `email` | `VarChar(254)`, non nul | Adresse validée, conservée sans passage en minuscules. |
| `password` | `VarChar(255)`, non nul | Texte en clair uniquement pour la démonstration. |
| `role` | `UserRole`, non nul | Rôle choisi à l'inscription. |
| `createdAt` | `Timestamptz(3)`, non nul | `now()` à la création. |

La contrainte unique porte sur `(role, email)`. PostgreSQL compare la valeur
exacte : la même adresse peut exister une fois par rôle et une différence de
casse constitue une autre valeur. Le service refuse les chaînes vides et les
adresses syntaxiquement invalides.

Cette contrainte est nommée `user_role_email_unique` dans la migration.

Un `User` possède exactement un profil conforme à son rôle. Cette règle
traverse plusieurs tables : l'inscription crée le `User` et son profil dans
la même transaction, puis tous les services chargent le profil attendu par le
rôle. Aucun `ClientProfile` n'est accepté pour un `PROFESSIONAL`, ni l'inverse.

### 4.2 `ClientProfile`

| Champ | Type et nullabilité | Règle |
|---|---|---|
| `userId` | `Int`, non nul | Clé primaire et FK vers `User`. |
| `firstName` | `VarChar(100)`, non nul | Chaîne non vide. |
| `lastName` | `VarChar(100)`, non nul | Chaîne non vide. |
| `phone` | `VarChar(30)`, non nul | Chaîne non vide, sans format national imposé. |
| `preferredTimezone` | `VarChar(64)`, non nul | Fuseau IANA valide. |

La relation vers `User` utilise `onDelete: Cascade`.

### 4.3 `ProfessionalProfile`

| Champ | Type et nullabilité | Règle |
|---|---|---|
| `userId` | `Int`, non nul | Clé primaire et FK vers `User`. |
| `firstName` | `VarChar(100)`, non nul | Chaîne non vide. |
| `lastName` | `VarChar(100)`, non nul | Chaîne non vide. |
| `phone` | `VarChar(30)`, non nul | Chaîne non vide. |
| `businessName` | `VarChar(150)`, non nul | Nom commercial unique. |
| `timezone` | `VarChar(64)`, non nul | Fuseau IANA valide. |
| `calendarVersion` | `Int`, non nul | Zéro à la création, jamais négatif. |

`businessName` est comparé exactement, sans équivalence de casse, d'accent ou
de ponctuation. La relation vers `User` utilise `onDelete: Cascade`, après les
effets métier de la suppression décrits en section 11.
La contrainte porte le nom `professional_business_name_unique`.

### 4.4 `Session`

| Champ | Type et nullabilité | Règle |
|---|---|---|
| `id` | `VarChar(64)`, non nul | Clé primaire opaque. |
| `userId` | `Int`, non nul | FK vers `User`. |
| `createdAt` | `Timestamptz(3)`, non nul | `now()` à la connexion. |
| `expiresAt` | `Timestamptz(3)`, non nul | Expiration fixe. |

L'identifiant contient 256 bits aléatoires encodés en base64url. Il est stocké
dans le cookie, jamais dans une URL ou un journal. Une session dure huit heures
ou trente jours avec « Rester connecté ». Plusieurs sessions par utilisateur
sont autorisées ; la déconnexion supprime seulement la session courante.

La FK vers `User` utilise `onDelete: Cascade`. Des index existent sur
`userId` et `expiresAt`, et une contrainte impose `expiresAt > createdAt`.
Une session expirée est invalide même si sa ligne n'a pas encore été supprimée.
Les commandes d'authentification qui écrivent déjà en base peuvent purger les
sessions expirées de manière opportuniste. Une lecture `GET` n'effectue aucune
purge et aucune tâche périodique dédiée n'est ajoutée à la démonstration.

## 5. Disponibilités

### 5.1 `WeeklyAvailability`

| Champ | Type et nullabilité | Règle |
|---|---|---|
| `id` | `Int`, non nul | Clé primaire auto-incrémentée. |
| `professionalUserId` | `Int`, non nul | FK vers `ProfessionalProfile.userId`. |
| `weekday` | `SmallInt`, non nul | Jour ISO compris entre 1 et 7. |
| `startMinute` | `SmallInt`, non nul | Minute comprise entre 0 et 1439. |
| `endMinute` | `SmallInt`, non nul | Minute comprise entre 1 et 1440. |

`startMinute < endMinute` est obligatoire. Une plage ne traverse pas minuit.
Une exclusion interdit les chevauchements pour un même professionnel et un
même jour ; deux intervalles adjacents restent autorisés. Un index couvre
`(professionalUserId, weekday)`. La FK utilise `onDelete: Cascade`.

### 5.2 `Unavailability`

| Champ | Type et nullabilité | Règle |
|---|---|---|
| `id` | `Int`, non nul | Clé primaire auto-incrémentée. |
| `professionalUserId` | `Int`, non nul | FK vers `ProfessionalProfile.userId`. |
| `startAt` | `Timestamptz(3)`, non nul | Début absolu. |
| `endAt` | `Timestamptz(3)`, non nul | Fin absolue. |
| `reason` | `VarChar(500)`, nullable | Obligatoire seulement si des rendez-vous sont annulés. |
| `createdAt` | `Timestamptz(3)`, non nul | `now()` à la création. |

Une contrainte impose `startAt < endAt`. Une exclusion interdit le
chevauchement de deux indisponibilités du même professionnel. Un index couvre
`(professionalUserId, startAt)`. La FK utilise `onDelete: Cascade`.

## 6. Rendez-vous

### 6.1 `Appointment`

| Champ | Type et nullabilité | Règle |
|---|---|---|
| `id` | `Int`, non nul | Clé primaire auto-incrémentée. |
| `professionalUserId` | `Int`, nullable | FK vers `ProfessionalProfile.userId`, nulle après suppression. |
| `clientUserId` | `Int`, nullable | FK vers `ClientProfile.userId`, nulle pour un invité ou après suppression. |
| `publicCode` | `VarChar(64)`, nullable | Secret unique, nul uniquement après révocation. |
| `clientFirstName` | `VarChar(100)`, nullable | Obligatoire avant une anonymisation. |
| `clientLastName` | `VarChar(100)`, nullable | Obligatoire avant une anonymisation. |
| `clientPhone` | `VarChar(30)`, nullable | Obligatoire avant une anonymisation. |
| `clientEmail` | `VarChar(254)`, nullable | Obligatoire avant une anonymisation. |
| `clientAnonymized` | `Boolean`, non nul | Faux par défaut, vrai après suppression du client. |
| `professionalBusinessName` | `VarChar(150)`, nullable | Obligatoire avant une anonymisation. |
| `professionalAnonymized` | `Boolean`, non nul | Faux par défaut, vrai après suppression du professionnel. |
| `professionalTimezone` | `VarChar(64)`, non nul | Fuseau IANA au moment de la création. |
| `startAt` | `Timestamptz(3)`, non nul | Début absolu. |
| `endAt` | `Timestamptz(3)`, non nul | Fin absolue. |
| `status` | `AppointmentStatus`, non nul | `CONFIRMED` par défaut. |
| `cancellationCause` | `CancellationCause`, nullable | Cause stable, renseignée à l'annulation. |
| `cancellationReason` | `VarChar(500)`, nullable | Facultatif pour le client, requis pour le professionnel. |
| `canceledAt` | `Timestamptz(3)`, nullable | Renseigné à l'annulation. |
| `createdAt` | `Timestamptz(3)`, non nul | `now()` à la création. |
| `updatedAt` | `Timestamptz(3)`, non nul | Mis à jour par Prisma. |

Les deux FK vers les profils utilisent `onDelete: SetNull`. Elles empêchent de
référencer directement le mauvais type de profil. La cohérence entre ce profil
et `User.role` reste l'invariant applicatif transactionnel défini en section
4.1. Le rendez-vous conserve ses instantanés lors d'une modification normale
des profils. À la création,
les quatre coordonnées du client sont requises, même si certains champs sont
physiquement nullables pour permettre leur effacement lors d'une suppression
de compte.

`clientAnonymized = false` impose les quatre coordonnées non nulles ; sa valeur
vraie impose ces coordonnées et `clientUserId` à `NULL`. De même,
`professionalAnonymized = false` impose le nom commercial et
`professionalUserId` non nuls, tandis que sa valeur vraie impose ces deux
champs à `NULL`. Ces booléens distinguent
un invité encore identifiable d'un compte effectivement supprimé.

Le code public possède au moins 128 bits d'entropie, utilise base64url et est
unique via `appointment_public_code_unique`. Une annulation ne le révoque pas.
L'API ne le sélectionne que pour une
partie autorisée qui consulte le détail, pour la réponse de création ou dans le
service qui vérifie `X-Public-Code`. Il n'apparaît jamais dans une liste.

Les contraintes suivantes sont obligatoires :

- à la création, `professionalUserId`, `publicCode` et les coordonnées client
  sont présents ; leur nullabilité ne sert qu'aux invités et suppressions
  explicitement décrites ;
- `professionalUserId` vise un `User` de rôle `PROFESSIONAL` et
  `clientUserId`, lorsqu'il existe, un `User` de rôle `CLIENT` ;
- `endAt = startAt + interval '1 hour'` ;
- `CONFIRMED` implique `canceledAt IS NULL` et
  `cancellationCause IS NULL` ;
- `CANCELED` implique `canceledAt IS NOT NULL` et
  `cancellationCause IS NOT NULL` ;
- `PROFESSIONAL` et `UNAVAILABILITY` imposent un motif non blanc ; `CLIENT`
  l'autorise sans l'exiger ; `SCHEDULE_CHANGED` et `ACCOUNT_DELETED` imposent
  `cancellationReason IS NULL` ;
- aucun chevauchement de deux rendez-vous `CONFIRMED` ayant le même
  `professionalUserId` ;
- index sur `(professionalUserId, startAt)` et `(clientUserId, startAt)`.

Une violation concurrente de l'exclusion est traduite en
`409 APPOINTMENT_CONFLICT`.

La seule transition de statut est `CONFIRMED -> CANCELED`. `CANCELED` est
terminal : une restauration ou une nouvelle confirmation du même rendez-vous
n'existe pas dans la démonstration.

### 6.2 `AppointmentChangeProposal`

| Champ | Type et nullabilité | Règle |
|---|---|---|
| `id` | `Int`, non nul | Clé primaire auto-incrémentée. |
| `appointmentId` | `Int`, non nul | FK vers `Appointment`. |
| `authorParty` | `AppointmentParty`, non nul | Côté ayant proposé. |
| `recipientParty` | `AppointmentParty`, non nul | Côté devant décider. |
| `authorUserId` | `Int`, nullable | Compte auteur, nul pour un client public ou supprimé. |
| `recipientUserId` | `Int`, nullable | Compte destinataire, nul pour un invité ou après suppression. |
| `proposedStartAt` | `Timestamptz(3)`, non nul | Nouveau début proposé. |
| `proposedEndAt` | `Timestamptz(3)`, non nul | Nouveau terme proposé. |
| `status` | `ProposalStatus`, non nul | `PENDING` à la création. |
| `rejectionReason` | `VarChar(500)`, nullable | Autorisé uniquement pour `REJECTED`. |
| `createdAt` | `Timestamptz(3)`, non nul | `now()` à la création. |
| `decidedAt` | `Timestamptz(3)`, nullable | Instant d'entrée dans un état terminal. |

La relation vers le rendez-vous utilise `onDelete: Cascade`. Les relations
vers les utilisateurs utilisent `onDelete: SetNull`.

Les invariants sont les suivants :

- `authorParty <> recipientParty` ;
- la durée proposée est exactement de 60 minutes réelles ;
- une seule proposition `PENDING` existe par rendez-vous, grâce à un index
  unique partiel ;
- `PENDING` implique `decidedAt IS NULL` ; tout état terminal implique
  `decidedAt IS NOT NULL` ;
- `rejectionReason` est nul sauf pour `REJECTED` ;
- à la création, l'utilisateur professionnel correspond au propriétaire du
  rendez-vous et l'utilisateur client, s'il existe, au client rattaché ;
- un accès par code public agit toujours comme la partie `CLIENT` ;
- seul le destinataire accepte ou refuse et seul l'auteur retire ;
- seul le professionnel propriétaire peut forcer une proposition dont il est
  l'auteur et dont la partie destinataire est `CLIENT`.

`authorUserId` et `recipientUserId` décrivent les comptes effectivement
présents lors de la création, pas la destination durable des notifications.
Cette destination est résolue depuis `authorParty` ou `recipientParty` et les
relations courantes de l'`Appointment`. Une action par code garde donc
`authorUserId = NULL` tout en pouvant notifier le client rattaché.

Les transitions autorisées sont uniquement :

```text
PENDING -> ACCEPTED | REJECTED | CANCELED | CONFLICT
```

Un état terminal est immuable. L'annulation du rendez-vous transforme toute
proposition `PENDING` en `CANCELED`, remplit `decidedAt` et écrit l'événement
d'historique dans la même transaction. Le payload distingue un retrait par
l'auteur d'une annulation provoquée par le rendez-vous.

La base ne peut pas exprimer seule la dépendance entre `PENDING` et le statut
de la ligne parente. La création verrouille donc `ProfessionalProfile`, recharge
le rendez-vous `CONFIRMED` et futur dans la transaction, puis insère. Le verrou
est le même que celui de l'annulation et de la suppression ; il n'incrémente pas
`calendarVersion` puisque la proposition ne réserve aucun créneau.

Le créneau proposé n'est pas réservé. À l'acceptation, le service revérifie
la disponibilité sous verrou en ignorant uniquement l'intervalle du rendez-vous
déplacé. La création et le forçage utilisent la même règle. En cas de
concurrence, la proposition passe à `CONFLICT` et le rendez-vous conserve son
créneau initial.

## 7. Historique

### `AppointmentHistory`

| Champ | Type et nullabilité | Règle |
|---|---|---|
| `id` | `Int`, non nul | Clé primaire auto-incrémentée. |
| `appointmentId` | `Int`, non nul | FK vers `Appointment`. |
| `eventType` | `HistoryEventType`, non nul | Événement stable. |
| `actorUserId` | `Int`, nullable | Compte auteur lorsqu'il existe encore. |
| `actorType` | `HistoryActorType`, non nul | Mode d'acteur au moment de l'action. |
| `payload` | `Json`, non nul | Données structurées de l'événement. |
| `createdAt` | `Timestamptz(3)`, non nul | `now()` à l'événement. |

La relation vers `Appointment` utilise `onDelete: Cascade`, celle vers `User`
`onDelete: SetNull`. Un index couvre `(appointmentId, createdAt, id)` pour
obtenir une chronologie déterministe.

Le payload persistant est limité, selon le type, aux anciens et nouveaux
instants, au motif métier, à la cause d'annulation et aux identifiants internes
utiles. Aucun champ structuré ne copie un mot de passe, code public, identifiant
de session, adresse électronique, téléphone ou nom civil du client. Un motif
libre reste toutefois conservé tel que saisi puisqu'il est destiné à la
contrepartie.

La provenance de l'événement est déterministe :

| Événement | `actorType` et `actorUserId` à la création |
|---|---|
| `APPOINTMENT_CREATED` | `CLIENT_USER`, identifiant du client |
| `MANUAL_APPOINTMENT_CREATED` | `PROFESSIONAL_USER`, identifiant du professionnel |
| `APPOINTMENT_CANCELED` | principal réel : utilisateur ou `PUBLIC_CLIENT` |
| `CHANGE_PROPOSED` | principal réel |
| `CHANGE_ACCEPTED` | principal réel du destinataire |
| `CHANGE_REJECTED` | principal réel du destinataire |
| `CHANGE_CANCELED` par l'auteur | principal réel de l'auteur |
| `CHANGE_FORCED` | `PROFESSIONAL_USER`, identifiant du professionnel |
| `CHANGE_CANCELED` automatique | `SYSTEM`, `NULL` |
| `CHANGE_CONFLICT` | `SYSTEM`, `NULL` |
| annulations calendrier, indisponibilité ou compte | `SYSTEM`, `NULL` |

`PUBLIC_CLIENT` utilise toujours `actorUserId = NULL`. Un acteur utilisateur
conserve son type après suppression, mais sa FK passe à `NULL` ; le projecteur
en déduit `actorDeleted = true` uniquement pour `CLIENT_USER` ou
`PROFESSIONAL_USER`. `PUBLIC_CLIENT` et `SYSTEM` gardent toujours
`actorDeleted = false`. Un effet automatique ne réutilise jamais le compte
ayant lancé la commande parente.

La route publique ne renvoie jamais `payload` directement. Un projecteur par
`HistoryEventType` construit une vue en liste blanche contenant seulement :

- le type et la date de l'événement ;
- `CLIENT`, `PROFESSIONAL` ou `SYSTEM` comme code d'auteur ;
- l'indicateur `actorDeleted` ;
- les instants concernés ;
- le motif d'annulation ou de refus destiné à la contrepartie.

Le nom commercial actif peut être montré dans une vue connectée, mais aucune
coordonnée personnelle du client ne l'est. Les libellés statiques d'acteur ne
sont pas persistés : le frontend traduit `actorType` et l'état dérivé de la FK.

## 8. Notifications internes

### `InAppNotification`

| Champ | Type et nullabilité | Règle |
|---|---|---|
| `id` | `Int`, non nul | Clé primaire auto-incrémentée. |
| `recipientUserId` | `Int`, non nul | FK vers le destinataire. |
| `appointmentId` | `Int`, nullable | FK vers le rendez-vous lié. |
| `type` | `NotificationType`, non nul | Type du catalogue. |
| `payload` | `Json`, non nul | Variables structurées pour Vue I18n. |
| `eventKey` | `VarChar(128)`, non nul | Identité déterministe de l'événement. |
| `readAt` | `Timestamptz(3)`, nullable | Nul tant que la notification est non lue. |
| `createdAt` | `Timestamptz(3)`, non nul | `now()` à la création. |

La FK destinataire utilise `onDelete: Cascade`. La FK rendez-vous utilise
`onDelete: SetNull` afin qu'une notification conservée reste lisible sans
lien. Une contrainte unique porte sur `(recipientUserId, eventKey)` et un
index porte sur `(recipientUserId, readAt, createdAt, id)` pour les non-lues.
Un second index sur `(recipientUserId, createdAt, id)` couvre la liste complète
et son tri stable.

La contrainte de déduplication est nommée
`notification_recipient_event_unique`.

L'`eventKey` est dérivée d'un événement de domaine persistant, par exemple
`history:<historyId>:<notificationType>`. Elle empêche de créer deux messages
pour le même événement ; elle ne rend pas, à elle seule, une commande HTTP
entièrement idempotente.

La notification et son historique sont écrits dans la même transaction que
l'action métier. Le payload contient uniquement les valeurs nécessaires à la
traduction et jamais de secret ou coordonnée personnelle. Une notification
n'est accessible qu'à `recipientUserId`.

## 9. Contraintes PostgreSQL manuelles

Une migration `database_constraints` active `btree_gist`, puis ajoute :

- `appointment_no_overlap`, exclusion des rendez-vous confirmés ;
- `weekly_availability_no_overlap`, exclusion des plages hebdomadaires ;
- `unavailability_no_overlap`, exclusion des indisponibilités ;
- `weekly_availability_bounds_check`, bornes de `weekday`, `startMinute`
  et `endMinute` ;
- `weekly_availability_order_check`, ordre des minutes d'une plage ;
- `unavailability_interval_check`, ordre des instants d'une
  indisponibilité ;
- `appointment_duration_check`, durée exacte d'une heure ;
- `appointment_state_check`, cohérence du statut, de la cause et de la date
  d'annulation ;
- `appointment_cancellation_reason_check`, présence ou absence du motif selon
  la cause ;
- `appointment_client_anonymization_check` et
  `appointment_professional_anonymization_check`, cohérence des instantanés et
  des FK après suppression ;
- `proposal_duration_check`, durée exacte d'une heure ;
- `proposal_state_check`, cohérence du statut et de `decidedAt` ;
- `proposal_one_pending`, unicité partielle d'une proposition `PENDING` par
  rendez-vous ;
- `professional_calendar_version_check`, version non négative ;
- `session_expiration_check`, expiration strictement postérieure à la
  création.

Les exclusions utilisent des intervalles `[)` afin d'autoriser deux périodes
exactement adjacentes. Les validations syntaxiques, IANA et d'autorisation
restent dans le service, puis sont testées en plus des contraintes SQL.
Le mapper d'erreurs utilise ces noms stables pour produire respectivement
`APPOINTMENT_CONFLICT`, `WEEKLY_AVAILABILITY_CONFLICT` et
`UNAVAILABILITY_CONFLICT`.

Les autres contraintes exposées au mapper sont :

| Contrainte | Traitement |
|---|---|
| `user_role_email_unique` | `EMAIL_ALREADY_USED` |
| `professional_business_name_unique` | `BUSINESS_NAME_ALREADY_USED` |
| `proposal_one_pending` | `PROPOSAL_ALREADY_PENDING` |
| `notification_recipient_event_unique` | writer en `ON CONFLICT DO NOTHING` |
| `weekly_availability_bounds_check` | `INVALID_INTERVAL` |
| `weekly_availability_order_check` | `INVALID_INTERVAL` |
| `unavailability_interval_check` | `INVALID_INTERVAL` |
| `appointment_public_code_unique` | rollback et `INTERNAL_ERROR` sans détail |

Les autres checks nommés protègent des invariants produits par les services et
ne doivent jamais être atteints après validation. Leur violation est
journalisée avec le nom de contrainte, puis devient `INTERNAL_ERROR` sans
exposer le détail SQL au client. En particulier, la base contrôle la durée
proposée, mais `PROPOSED_SLOT_UNCHANGED` reste une validation transactionnelle
du service après relecture du rendez-vous parent.

## 10. Verrous, version de calendrier et transactions

Toute commande modifiant les règles ou l'occupation d'un calendrier verrouille
la ligne `ProfessionalProfile` correspondante et incrémente
`calendarVersion` dans la même transaction. Cela concerne :

- le remplacement des disponibilités ;
- la création et la suppression d'une indisponibilité ;
- la modification du fuseau du professionnel ;
- la création ou l'annulation d'un rendez-vous ;
- l'acceptation normale ou forcée d'une proposition ;
- les annulations causées par une suppression de compte sur les calendriers
  professionnels conservés.

Une tentative d'acceptation conflictuelle verrouille également le profil pour
faire une lecture cohérente, mais n'incrémente pas la version si le rendez-vous
ne bouge pas et que seule la proposition passe à `CONFLICT`.

Une commande qui suit un aperçu compare d'abord
`expectedCalendarVersion`, recalcule les rendez-vous touchés et vérifie
`impactFingerprint`. Une différence annule toute la transaction et retourne
un conflit sans effet partiel.

Une version différente arrête la commande avant la comparaison d'empreinte et
demande un nouvel aperçu. L'empreinte n'est comparée que sous le verrou obtenu
avec la version attendue correcte.

L'empreinte couvre le type de commande, ses paramètres structurels normalisés,
la version du calendrier et les rendez-vous touchés triés. Le motif descriptif
d'une indisponibilité en est exclu car il ne change pas l'impact ; les plages ou
l'intervalle ne le sont jamais. Elle ne peut donc pas confirmer une autre
modification structurelle produisant par hasard la même liste.

Dans la transaction finale, la commande met à jour les tables métier, annule
les propositions `PENDING` concernées, ajoute les historiques et crée les
notifications. Une erreur à n'importe quelle étape annule l'ensemble.

Une suppression de client peut toucher plusieurs professionnels. Le service
verrouille leurs profils par `userId` croissant afin d'éviter un interblocage.
La contrainte d'exclusion PostgreSQL reste la protection finale contre deux
réservations concurrentes.

Une transaction `Serializable` annulée par `40001` ou `P2034` est rejouée au
maximum deux fois depuis le début. Chaque essai relit les états et versions ;
aucun résultat du premier essai n'est réutilisé. Après trois échecs, la commande
ne conserve aucun effet et retourne `CONCURRENT_MODIFICATION`.

## 11. Suppression d'un utilisateur

La suppression n'est jamais un simple `delete User`. Après vérification du
mot de passe et confirmation de l'aperçu, une transaction applique cet ordre :

1. verrouiller les calendriers concernés dans un ordre déterministe ;
2. passer les propositions `PENDING` concernées à `CANCELED` ;
3. annuler les rendez-vous futurs `CONFIRMED` et libérer leurs créneaux ;
4. créer les historiques et notifications des contreparties authentifiées ;
5. révoquer tous les codes publics liés en mettant `publicCode` à `NULL` ;
6. anonymiser les instantanés et marquer la partie supprimée ;
7. supprimer les rendez-vous sans aucune contrepartie authentifiée restante ;
8. supprimer `User`.

Pour un client supprimé, les quatre coordonnées deviennent `NULL` et
`clientAnonymized` devient vrai. Pour un professionnel supprimé, le nom
commercial devient `NULL` et `professionalAnonymized` devient vrai ; le fuseau
historique reste disponible pour afficher les heures.

Les payloads des notifications conservées chez les contreparties sont aussi
anonymisés : `professionalBusinessName` devient `NULL` et
`professionalDeleted` devient vrai. Les acteurs y sont des codes stables. Les
motifs libres destinés à la contrepartie restent conservés tels qu'ils ont été
saisis.

Un rendez-vous partagé avec un autre `User` est conservé avec la FK supprimée
à `NULL`. Un rendez-vous invité dont le professionnel est supprimé n'a plus de
contrepartie authentifiée : il est supprimé avec ses propositions et son
historique.

Les stratégies de FK sont donc :

| Relation | Suppression |
|---|---|
| Profils, sessions et notifications reçues -> `User` | `Cascade` |
| Rendez-vous client/professionnel -> profil correspondant | `SetNull` |
| Proposition auteur/destinataire -> `User` | `SetNull` |
| Historique acteur -> `User` | `SetNull` |
| Disponibilité -> `ProfessionalProfile` | `Cascade` |
| Proposition et historique -> `Appointment` | `Cascade` |
| Notification -> `Appointment` | `SetNull` |

Il n'existe ni archive, ni restauration, ni export de données.

## 12. Migrations et données de démonstration

Le clone ne contient aucune migration à réutiliser. L'implémentation crée :

1. une migration initiale Prisma avec les tables et FK du domaine ;
2. une migration SQL `database_constraints` pour les checks, index partiels
   et exclusions ;
3. des migrations correctives ultérieures sans réécrire les précédentes.

`prisma migrate dev` crée les migrations en développement. Seule l'image
scripts exécute `prisma migrate deploy` dans Docker. `prisma db push` est
interdit dans le démarrage, la CI et la livraison.

Un seed de démonstration peut créer des utilisateurs, disponibilités et
rendez-vous idempotents. Il est manuel et n'ajoute aucun modèle fonctionnel.
