# Contrat API HTTP

> Statut : source de vérité pour les routes, DTO et erreurs HTTP  
> Dernière mise à jour : 17 août 2026  
> Navigation : [`SUMMARY.md`](SUMMARY.md)

## 1. Décisions d'intégration avec le starter

Le montage Express 5 fourni est conservé :

- `/health` et `/metrics` servent l'infrastructure ;
- `/auth` porte l'inscription et la session ;
- `/v1` porte l'API métier publique et protégée.

Le modèle Prisma physique conserve et adapte `User`. L'API n'expose jamais
un enregistrement Prisma : les réponses utilisent uniquement les DTO de ce
document. Le mot `account` dans une route désigne donc l'utilisateur courant,
pas un second modèle concurrent de `User`.

Les éléments utiles du starter sont conservés ou adaptés :

- `POST /auth/register`, `POST /auth/login` et `POST /auth/logout` ;
- le routeur public et le routeur protégé sous `/v1` ;
- `AppError`, le middleware central d'erreur, Zod et Prisma ;
- les routes de santé et de métriques.

Les fonctions suivantes sont explicitement exclues du périmètre :

- Google OAuth et `/auth/social/googleCallback` ;
- JWT, access token, refresh token et rotation de jetons ;
- `/auth/forgotPasswordRequest`, `/auth/resetPassword` et les jetons de
  réinitialisation ;
- les réponses contenant un objet Prisma brut.

La récupération de mot de passe est remplacée par le parcours de démonstration
décrit en [section 6.5](#65-récupération-de-mot-de-passe-démo).

## 2. Conventions de transport

### 2.1 JSON et validation

- Les corps et réponses utilisent `application/json; charset=utf-8`, sauf
  `/metrics`.
- Les schémas Zod sont stricts : une propriété inconnue est refusée.
- Un champ facultatif absent n'est pas transformé en `null`.
- `null` n'est accepté que lorsque le présent document l'indique.
- Les identifiants de route sont des entiers strictement positifs.
- Les booléens de query acceptent uniquement `true` et `false`.
- Les curseurs sont des chaînes opaques et ne sont jamais interprétés par le
  frontend.
- La taille maximale d'un corps JSON est de `100kb`.

Les limites partagées avec le modèle physique sont :

| Valeur | Validation HTTP |
|---|---|
| adresse électronique | syntaxe minimale, 254 caractères au maximum |
| mot de passe | de 8 à 255 caractères |
| prénom et nom | de 1 à 100 caractères, avec un caractère non blanc |
| téléphone | de 1 à 30 caractères, avec un caractère non blanc |
| nom commercial | de 1 à 150 caractères, avec un caractère non blanc |
| fuseau IANA | 64 caractères au maximum et identifiant valide |
| motif | 500 caractères au maximum |

Aucune valeur textuelle n'est passée en minuscules, nettoyée ou tronquée. Le
trim sert seulement à vérifier qu'une valeur obligatoire n'est pas blanche ;
la valeur originale est persistée. Un motif obligatoire contient au moins un
caractère autre qu'un espace.

Une erreur Zod utilise `VALIDATION_ERROR`. Ses détails contiennent uniquement
les chemins et codes de validation, jamais les valeurs reçues.

### 2.2 Dates, heures et fuseaux

Les types scalaires du contrat sont :

```text
UtcInstant = chaîne UTC canonique YYYY-MM-DDTHH:mm:ss.SSSZ
LocalDate = chaîne YYYY-MM-DD
LocalTime = chaîne HH:mm comprise entre 00:00 et 23:59
AvailabilityEndTime = LocalTime ou valeur spéciale 24:00
IanaTimezone = identifiant IANA valide, par exemple Europe/Paris
UtcOffset = chaîne ±HH:mm
```

Pour un rendez-vous ou une proposition, les instants envoyés sont en UTC. Le
backend calcule toujours `endAt` à partir de `startAt` et de la durée fixe de
60 minutes. Il refuse un `endAt` éventuellement ajouté à ces commandes.

`UtcInstant` contient exactement trois chiffres de milliseconde. Une précision
différente est refusée au lieu d'être silencieusement arrondie par PostgreSQL.
Toutes les réponses réutilisent cette forme canonique. Tout instant participant
à la canonicalisation d'une empreinte ou encodé dans un curseur est d'abord
normalisé de la même manière.

Un intervalle affichable possède cette forme :

```ts
type TimeRangeView = {
  startAt: UtcInstant;
  endAt: UtcInstant;
  timezone: IanaTimezone;
  localStartDate: LocalDate;
  localStartTime: LocalTime;
  localEndDate: LocalDate;
  localEndTime: LocalTime;
  startUtcOffset: UtcOffset;
  endUtcOffset: UtcOffset;
};
```

Les champs locaux sont des projections d'affichage. `startAt` et `endAt`
restent les seules valeurs faisant autorité pour une écriture.

Le fuseau de projection est déterministe :

- les créneaux utilisent la query `timezone` ;
- horaires, indisponibilités, impacts et agenda professionnel utilisent le
  fuseau courant du professionnel ;
- un rendez-vous connecté et ses notifications utilisent le fuseau du profil
  de l'utilisateur courant ;
- une consultation par code utilise le fuseau professionnel figé dans le
  rendez-vous ;
- une liste client peut remplacer le fuseau du profil avec sa query
  `timezone`.

Les payloads persistants conservent les instants UTC. Leur projection locale
est reconstruite pour la réponse et n'est pas une copie d'un objet JSON en
base.

### 2.3 Succès et erreurs

Une réponse de succès renvoie directement le DTO annoncé. Une route en `204`
n'a aucun corps.

Toutes les erreurs ont la même enveloppe compatible avec `AppError` :

```json
{
  "error": "APPOINTMENT_CONFLICT",
  "details": {
    "field": "startAt"
  }
}
```

`error` est un code stable traduit par Vue I18n. `details` est facultatif et
ne contient que les données explicitement décrites dans ce contrat. Aucune
trace, requête SQL, valeur secrète ou phrase interne n'est renvoyée.

Les `details` métier nécessaires au frontend sont renvoyés dans tous les
environnements. Contrairement au middleware exemple du starter, leur présence
ne dépend pas de `NODE_ENV` ; les détails internes ne sont jamais attachés à
l'`AppError` destiné au transport.

### 2.4 Cache

- Les routes authentifiées et celles utilisant un code public répondent avec
  `Cache-Control: no-store`.
- `/auth/demo-password-recovery` répond avec
  `Cache-Control: no-store, private`, `Pragma: no-cache` et `Vary: Origin`.
- Les réponses publiques de recherche et de créneaux utilisent
  `Cache-Control: no-cache` afin d'être revalidées.

## 3. Session et contrôle d'accès

### 3.1 Cookie de session

L'authentification utilise un seul cookie opaque `sessionId`. Sa valeur
correspond à une session conservée dans PostgreSQL.

Le cookie est configuré avec :

- `HttpOnly` ;
- `SameSite=Lax` ;
- `Path=/` ;
- `Secure` en dehors du développement local ;
- une durée de huit heures, ou trente jours avec `rememberMe`.

L'attribut `Domain` est absent en local lorsque `COOKIE_DOMAIN` est vide. Il
n'est ajouté que pour une valeur explicitement configurée. La déconnexion
emploie les mêmes `Path`, `Domain`, `SameSite` et `Secure` afin que le navigateur
supprime bien le cookie créé.

Le frontend ne lit pas de cookie miroir. `GET /auth/session` est l'unique
source de vérité de son état de connexion.

### 3.2 Niveaux d'accès

| Nom | Autorisation exacte |
|---|---|
| public | Aucune session nécessaire. |
| compte | Session valide d'un `User` actif. |
| client | Compte dont le rôle est `CLIENT`. |
| professionnel | Compte `PROFESSIONAL` propriétaire de la ressource. |
| code public | `X-Public-Code` valide pour un seul rendez-vous. |

Une ressource qui existe mais n'appartient pas au compte courant répond `404`
et non `403`. Cette règle évite de révéler son existence.

Pour une proposition, les autorisations utilisent deux parties métier :
`CLIENT` et `PROFESSIONAL`. Un client connecté lié au rendez-vous et le
détenteur de son code public représentent tous deux la partie `CLIENT`. Le
mode d'accès ne change donc pas le droit d'accepter, refuser ou retirer une
proposition de cette partie.

## 4. DTO communs

### 4.1 Utilisateur et session

```ts
type UserRole = "CLIENT" | "PROFESSIONAL";

type UserView = {
  id: number;
  role: UserRole;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  timezone: IanaTimezone;
  businessName: string | null;
  calendarVersion: number | null;
  createdAt: UtcInstant;
};

type AuthenticatedSessionView = {
  authenticated: true;
  user: UserView;
  expiresAt: UtcInstant;
};

type AnonymousSessionView = {
  authenticated: false;
};
```

`businessName` et `calendarVersion` sont non nuls uniquement pour un
professionnel. La version permet au profil professionnel d'envoyer une
modification de fuseau avec contrôle de concurrence. `timezone` projette
`ClientProfile.preferredTimezone` ou `ProfessionalProfile.timezone` selon le
rôle ; les autres champs de profil suivent la même règle.

### 4.2 Professionnel et calendrier

```ts
type ProfessionalSummaryView = {
  id: number;
  businessName: string;
  timezone: IanaTimezone;
};

type AvailabilityPeriodView = {
  id: number;
  weekday: 1 | 2 | 3 | 4 | 5 | 6 | 7;
  startTime: LocalTime;
  endTime: AvailabilityEndTime;
};

type WeeklyAvailabilityView = {
  timezone: IanaTimezone;
  calendarVersion: number;
  periods: AvailabilityPeriodView[];
};

type UnavailabilityView = {
  id: number;
  range: TimeRangeView;
  reason: string | null;
  createdAt: UtcInstant;
};

type SlotView = {
  range: TimeRangeView;
};

type SlotDayView = {
  localDate: LocalDate;
  slots: SlotView[];
};
```

L'`id` de `ProfessionalSummaryView`, ainsi que tout `professionalId` reçu par
l'API, est directement le `User.id` du professionnel. Aucun identifiant de
profil supplémentaire n'est introduit.

`periods` est trié par `weekday`, puis `startTime`. Les indisponibilités et
créneaux sont triés par `startAt`.

### 4.3 Rendez-vous, proposition et historique

```ts
type AppointmentStatus = "CONFIRMED" | "CANCELED";
type CancellationCause =
  | "CLIENT"
  | "PROFESSIONAL"
  | "SCHEDULE_CHANGED"
  | "UNAVAILABILITY"
  | "ACCOUNT_DELETED";
type ProposalStatus =
  | "PENDING"
  | "ACCEPTED"
  | "REJECTED"
  | "CANCELED"
  | "CONFLICT";
type AppointmentParty = "CLIENT" | "PROFESSIONAL";
type HistoryActorType =
  | "CLIENT_USER"
  | "PROFESSIONAL_USER"
  | "PUBLIC_CLIENT"
  | "SYSTEM";

type ProposalView = {
  id: number;
  status: ProposalStatus;
  authorParty: AppointmentParty;
  recipientParty: AppointmentParty;
  proposedRange: TimeRangeView;
  rejectionReason: string | null;
  createdAt: UtcInstant;
  decidedAt: UtcInstant | null;
};

type HistoryEventView = {
  id: number;
  eventType: HistoryEventType;
  actorType: HistoryActorType;
  actorDeleted: boolean;
  payload: Record<string, unknown>;
  createdAt: UtcInstant;
};

type PublicHistoryEventView = {
  id: number;
  eventType: HistoryEventType;
  actor: "CLIENT" | "PROFESSIONAL" | "SYSTEM";
  actorDeleted: boolean;
  payload: Record<string, unknown>;
  createdAt: UtcInstant;
};
```

Les codes `HistoryEventType` sont :

```text
APPOINTMENT_CREATED
MANUAL_APPOINTMENT_CREATED
APPOINTMENT_CANCELED
CHANGE_PROPOSED
CHANGE_ACCEPTED
CHANGE_REJECTED
CHANGE_CANCELED
CHANGE_CONFLICT
CHANGE_FORCED
SCHEDULE_CANCELLATION
UNAVAILABILITY_CANCELLATION
ACCOUNT_DELETION_CANCELLATION
```

Les payloads d'historique autorisés sont :

| Événement | Payload |
|---|---|
| `APPOINTMENT_CREATED` | `{ source: "CLIENT" }` |
| `MANUAL_APPOINTMENT_CREATED` | `{ source: "PROFESSIONAL" }` |
| `APPOINTMENT_CANCELED` | `{ cause: "CLIENT" | "PROFESSIONAL", reason }` |
| `CHANGE_PROPOSED` | `{ proposalId, proposedRange }` |
| `CHANGE_ACCEPTED` | `{ proposalId, previousRange, newRange }` |
| `CHANGE_REJECTED` | `{ proposalId, reason }` |
| `CHANGE_CANCELED` | `{ proposalId, cause: "AUTHOR" | "APPOINTMENT_CANCELED" }` |
| `CHANGE_CONFLICT` | `{ proposalId, proposedRange }` |
| `CHANGE_FORCED` | `{ proposalId, previousRange, newRange }` |
| `SCHEDULE_CANCELLATION` | `{ cause: "SCHEDULE_CHANGED" }` |
| `UNAVAILABILITY_CANCELLATION` | `{ reason }` |
| `ACCOUNT_DELETION_CANCELLATION` | `{ cause: "ACCOUNT_DELETED" }` |

`reason` est `string | null` uniquement pour les événements qui autorisent un
motif facultatif. Les vues publiques retirent toute donnée personnelle d'un
payload avant de le renvoyer.

Le mapping stable entre chaque événement, `actorType` et `actorUserId` est
défini dans la [section historique du modèle](DATA_MODEL.md#7-historique).

```ts
type AppointmentView = {
  id: number;
  status: AppointmentStatus;
  professional: {
    userId: number | null;
    businessName: string | null;
    deleted: boolean;
    timezone: IanaTimezone;
  };
  client: {
    userId: number | null;
    firstName: string | null;
    lastName: string | null;
    phone: string | null;
    email: string | null;
    deleted: boolean;
  };
  range: TimeRangeView;
  publicCode: string | null;
  cancellationCause: CancellationCause | null;
  cancellationReason: string | null;
  pendingProposal: ProposalView | null;
  history: HistoryEventView[];
  createdAt: UtcInstant;
  updatedAt: UtcInstant;
  canceledAt: UtcInstant | null;
};

type AppointmentSummaryView = {
  id: number;
  status: AppointmentStatus;
  professionalBusinessName: string | null;
  professionalDeleted: boolean;
  clientDisplayName: string | null;
  clientDeleted: boolean;
  range: TimeRangeView;
  cancellationCause: CancellationCause | null;
  cancellationReason: string | null;
  hasPendingProposal: boolean;
  canceledAt: UtcInstant | null;
};
```

`AppointmentView` est réservé à une partie connectée autorisée. Le client
voit son propre instantané de contact ; le professionnel voit celui nécessaire
à la gestion du rendez-vous. Un compte supprimé produit des valeurs personnelles
nulles et un booléen `deleted`; le frontend traduit cet état. L'historique est trié par
`createdAt`, puis `id`, du plus ancien au plus récent.

```ts
type PublicAppointmentView = {
  status: AppointmentStatus;
  professional: {
    businessName: string;
    timezone: IanaTimezone;
  };
  range: TimeRangeView;
  cancellationCause: CancellationCause | null;
  cancellationReason: string | null;
  pendingProposal: ProposalView | null;
  history: PublicHistoryEventView[];
  createdAt: UtcInstant;
  canceledAt: UtcInstant | null;
};
```

Cette vue n'expose ni identifiant de compte, ni coordonnées du client, ni
code public. Son projecteur regroupe `CLIENT_USER` et `PUBLIC_CLIENT` sous
`CLIENT`, calcule `actorDeleted` et construit chaque payload avec la liste
blanche du tableau précédent. Le frontend traduit `actor` et l'état supprimé.

### 4.4 Notification

```ts
type NotificationActor = "CLIENT" | "PROFESSIONAL" | "SYSTEM";

type NotificationView = {
  id: number;
  type: NotificationType;
  payload: Record<string, unknown>;
  appointmentId: number | null;
  appointmentAccessible: boolean;
  readAt: UtcInstant | null;
  createdAt: UtcInstant;
};
```

Le type et le payload sont retournés sans phrase prétraduite. Les types sont
ceux de [`NOTIFICATIONS.md`](NOTIFICATIONS.md#3-catalogue-des-événements).
Le contrat minimal des payloads est :

| Types | Payload |
|---|---|
| `APPOINTMENT_CREATED` | `{ professionalBusinessName, professionalDeleted, range }` |
| `MANUAL_APPOINTMENT_CREATED` | `{ professionalBusinessName, professionalDeleted, range }` |
| `APPOINTMENT_CANCELED` | `{ actor, reason, range }` |
| `CHANGE_PROPOSED` | `{ actor, proposalId, proposedRange }` |
| `CHANGE_ACCEPTED` | `{ actor, proposalId, newRange }` |
| `CHANGE_REJECTED` | `{ actor, proposalId, reason }` |
| `CHANGE_CANCELED` | `{ actor, proposalId }` |
| `CHANGE_FORCED` | `{ proposalId, newRange }` |
| `CHANGE_CONFLICT` | `{ proposalId, proposedRange }` |
| `SCHEDULE_CANCELLATION` | `{ cause: "SCHEDULE_CHANGED", range }` |
| `UNAVAILABILITY_CANCELLATION` | `{ reason, range }` |
| `ACCOUNT_DELETION_CANCELLATION` | `{ cause: "ACCOUNT_DELETED", range }` |

Dans ces payloads, `actor` vaut uniquement `CLIENT`, `PROFESSIONAL` ou
`SYSTEM`. Le frontend traduit ces codes. `professionalBusinessName` est une
valeur métier, nullable uniquement après anonymisation, et non un texte UI.

## 5. Infrastructure

### 5.1 `GET /health`

- Accès : public.
- Requête : aucun paramètre.
- Succès : `200` avec le DTO suivant.

```json
{
  "status": "ok",
  "database": "up",
  "timestamp": "2026-08-17T12:00:00.000Z"
}
```

Si PostgreSQL est injoignable, la route répond `503` avec
`DATABASE_UNAVAILABLE`. Elle ne renvoie jamais un faux `200` dégradé.

### 5.2 `GET /metrics`

- Accès : public pour la démonstration.
- Requête : aucun paramètre.
- Succès : `200`, type `text/plain; version=0.0.4`.

Les métriques Prometheus ne contiennent aucun secret, code public, adresse,
téléphone, mot de passe ou identifiant de session.

## 6. Authentification

### 6.1 Vue d'ensemble

| Méthode | Route | Accès | Succès |
|---|---|---|---|
| `POST` | `/auth/register` | public | `201` |
| `POST` | `/auth/login` | public | `200` |
| `POST` | `/auth/logout` | public | `204` |
| `GET` | `/auth/session` | public | `200` |
| `POST` | `/auth/demo-password-recovery` | public | `200` |

### 6.2 Inscription

`POST /auth/register` reçoit une union discriminée par `role`.

```ts
type ClientRegistrationBody = {
  role: "CLIENT";
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone: string;
  timezone: IanaTimezone;
};

type ProfessionalRegistrationBody = {
  role: "PROFESSIONAL";
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone: string;
  timezone: IanaTimezone;
  businessName: string;
};
```

Les chaînes de nom ne sont pas blanches. Le mot de passe contient au moins
huit caractères, règle utile déjà présente dans le starter. Le téléphone est
non blanc et limité à 30 caractères.

Le succès crée le `User`, son profil métier et sa session de huit heures dans
une transaction, pose le cookie et retourne `AuthenticatedSessionView` avec
le statut `201`.

Conflits :

- `409 EMAIL_ALREADY_USED`, avec `{ field: "email" }` ;
- `409 BUSINESS_NAME_ALREADY_USED`, avec `{ field: "businessName" }`.

L'unicité de l'adresse suit exactement la règle du modèle de données. Le rôle
reçu n'est jamais déduit d'un autre champ.

### 6.3 Connexion

`POST /auth/login` reçoit :

```ts
type LoginBody = {
  role: UserRole;
  email: string;
  password: string;
  rememberMe?: boolean;
};
```

`rememberMe` vaut `false` par défaut.

Le succès pose le cookie et retourne `AuthenticatedSessionView`. Une adresse,
un rôle ou un mot de passe incorrect retourne le même code
`401 INVALID_CREDENTIALS` afin de ne pas révéler lequel est incorrect.

### 6.4 Déconnexion et lecture de session

`POST /auth/logout` n'a ni corps ni query. Si le cookie désigne une session,
elle est supprimée. Le cookie est ensuite effacé avec les mêmes attributs que
lors de sa création. Une session absente ou expirée répond aussi `204` : la
déconnexion est volontairement idempotente.

`GET /auth/session` n'a aucun paramètre et retourne :

- `AuthenticatedSessionView` si la session est valide ;
- `AnonymousSessionView` avec `200` si elle est absente ou expirée.

Cette route `GET` ne modifie jamais la base. Les commandes `POST`
d'inscription, de connexion et de déconnexion peuvent purger des sessions
expirées de manière opportuniste.

### 6.5 Récupération de mot de passe démo

`POST /auth/demo-password-recovery` reçoit :

```ts
type DemoPasswordRecoveryBody = {
  role: UserRole;
  email: string;
};
```

Pour un compte trouvé, le statut est `200` et le DTO est :

```ts
type DemoPasswordRecoveryView = {
  warning: "DEMO_PLAINTEXT_PASSWORD";
  password: string;
};
```

Pour un couple rôle-adresse inconnu, le statut est `404` avec
`ACCOUNT_NOT_FOUND`. La valeur du mot de passe n'est jamais journalisée. Cette
route ne crée ni jeton, ni courriel, ni session.

## 7. Compte courant

### 7.1 Routes

| Méthode | Route | Accès | Entrée | Succès |
|---|---|---|---|---|
| `GET` | `/v1/account` | compte | aucune | `200 UserView` |
| `PATCH` | `/v1/account` | compte | `AccountUpdateBody` | `200 UserView` |
| `PATCH` | `/v1/account/password` | compte | `PasswordBody` | `204` |
| `POST` | `/v1/account/deletion-preview` | compte | `{ password }` | `200` |
| `DELETE` | `/v1/account` | compte | `AccountDeletionBody` | `204` |

### 7.2 Modification du profil

```ts
type AccountUpdateBody = {
  email?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  timezone?: IanaTimezone;
  businessName?: string;
  expectedCalendarVersion?: number;
};
```

Au moins un champ est obligatoire. `businessName` est accepté uniquement pour
un professionnel. `expectedCalendarVersion` est obligatoire, et accepté
uniquement, lorsqu'un professionnel modifie `timezone`. La modification
incrémente cette version. Une version obsolète retourne
`409 CALENDAR_VERSION_CONFLICT`.

Une modification du fuseau professionnel avec un rendez-vous futur confirmé
retourne `409 PROFESSIONAL_TIMEZONE_LOCKED`.

Les conflits d'adresse et de nom commercial réutilisent les codes de
l'inscription. Les instantanés des rendez-vous existants ne sont pas modifiés.

```ts
type PasswordBody = {
  currentPassword: string;
  newPassword: string;
  newPasswordConfirmation: string;
};
```

Une confirmation différente retourne `400 PASSWORD_CONFIRMATION_MISMATCH`.
Un mot de passe actuel incorrect retourne `403 PASSWORD_INVALID`.

### 7.3 Aperçu et suppression

`POST /v1/account/deletion-preview` reçoit :

```ts
type AccountDeletionPreviewBody = {
  password: string;
};
```

Après vérification du mot de passe, il retourne :

```ts
type AccountDeletionPreviewView = {
  futureAppointmentCount: number;
  impactFingerprint: string;
};
```

L'empreinte opaque couvre l'utilisateur, les rendez-vous futurs et
propositions en attente concernés, ainsi que les versions des calendriers à
modifier. Elle ne contient aucune donnée personnelle décodable.

`DELETE /v1/account` reçoit :

```ts
type AccountDeletionBody = {
  password: string;
  confirm: true;
  impactFingerprint: string;
};
```

Le backend recalcule l'impact dans la transaction. Si celui-ci a changé, rien
n'est supprimé et la réponse est `409 ACCOUNT_DELETION_IMPACT_CHANGED` avec :

```ts
type AccountDeletionImpactDetails = {
  futureAppointmentCount: number;
  impactFingerprint: string;
};
```

Les calendriers professionnels concernés sont verrouillés dans l'ordre
croissant de leur identifiant afin de limiter les interblocages. Le succès
applique les règles du modèle de données, révoque toutes les sessions, efface
le cookie courant et répond `204`.

## 8. Professionnels et calendriers

### 8.1 Recherche de professionnels

`GET /v1/professionals` est public.

Query :

```ts
type ProfessionalSearchQuery = {
  businessName: string;
  limit?: number;
  cursor?: string;
};
```

`businessName` est non vide. `limit` vaut 20 par défaut et ne peut dépasser
50. La recherche contient la chaîne demandée et reste sensible à la casse,
comme les choix de la démonstration. Le tri est `businessName`, puis `id`.

Réponse `200` :

```ts
type ProfessionalSearchView = {
  items: ProfessionalSummaryView[];
  nextCursor: string | null;
};
```

### 8.2 Créneaux publics

`GET /v1/professionals/:id/slots` est public.

Query obligatoire :

```ts
type SlotQuery = {
  from: LocalDate;
  timezone: IanaTimezone;
};
```

`from` est la première date dans le fuseau d'affichage demandé. La réponse
contient toujours exactement sept dates locales consécutives, même lorsque
certains jours ne possèdent aucun créneau. Un créneau est placé dans le jour
de son instant de début projeté dans `timezone`.

Réponse `200` :

```ts
type SlotSearchView = {
  professional: ProfessionalSummaryView;
  from: LocalDate;
  timezone: IanaTimezone;
  calendarVersion: number;
  days: [
    SlotDayView,
    SlotDayView,
    SlotDayView,
    SlotDayView,
    SlotDayView,
    SlotDayView,
    SlotDayView
  ];
};
```

Le backend omet les instants passés et applique les règles DST de
[`AVAILABILITY_AND_TIMEZONES.md`](AVAILABILITY_AND_TIMEZONES.md).
Un professionnel inconnu retourne `404 PROFESSIONAL_NOT_FOUND`.

### 8.3 Disponibilités hebdomadaires

| Méthode | Route | Accès | Succès |
|---|---|---|---|
| `GET` | `/v1/professional/weekly-availability` | professionnel | `200` |
| `PUT` | `/v1/professional/weekly-availability` | professionnel | `200` |

Le `GET` n'a aucun paramètre et retourne `WeeklyAvailabilityView`.

Le `PUT` reçoit la semaine complète :

```ts
type WeeklyAvailabilityUpdateBody = {
  expectedCalendarVersion: number;
  periods: Array<{
    weekday: 1 | 2 | 3 | 4 | 5 | 6 | 7;
    startTime: LocalTime;
    endTime: AvailabilityEndTime;
  }>;
  confirmCancellations: boolean;
  impactFingerprint?: string;
};
```

Les `id` existants ne sont pas envoyés : la collection est remplacée dans une
transaction. Une version obsolète retourne `409 CALENDAR_VERSION_CONFLICT`
avec `{ calendarVersion, restartPreview: true }`. Le succès retourne
`WeeklyAvailabilityView` avec la nouvelle version.

Deux périodes qui se chevauchent pour une même journée retournent
`409 WEEKLY_AVAILABILITY_CONFLICT`, qu'elles soient détectées avant l'écriture
ou par la contrainte PostgreSQL nommée.

### 8.4 Indisponibilités

| Méthode | Route | Accès | Succès |
|---|---|---|---|
| `GET` | `/v1/professional/unavailabilities` | professionnel | `200` |
| `POST` | `/v1/professional/unavailabilities` | professionnel | `201` |
| `DELETE` | `/v1/professional/unavailabilities/:id` | professionnel | `200` |

Le `GET` accepte :

```ts
type UnavailabilityQuery = {
  from?: UtcInstant;
  to?: UtcInstant;
};
```

Sans borne, toutes les indisponibilités sont retournées. Chaque borne peut être
fournie seule. Le filtre conserve tout intervalle semi-ouvert qui recoupe la
fenêtre : `endAt > from` lorsque `from` existe et `startAt < to` lorsque `to`
existe. Si les deux bornes sont présentes, `from < to` est obligatoire. La
réponse est :

```ts
type UnavailabilityListView = {
  calendarVersion: number;
  items: UnavailabilityView[];
};
```

Le `POST` reçoit :

```ts
type UnavailabilityCreationBody = {
  startAt: UtcInstant;
  endAt: UtcInstant;
  reason?: string;
  expectedCalendarVersion: number;
  confirmCancellations: boolean;
  impactFingerprint?: string;
};
```

Ici `endAt` est nécessaire, car une indisponibilité n'a pas une durée fixe.
Le succès retourne `{ calendarVersion, unavailability }` avec le statut `201`.

Le `DELETE` reçoit la query obligatoire
`{ expectedCalendarVersion: number }` et aucun corps. Le succès retourne
`{ calendarVersion: number }`. Une indisponibilité inconnue ou appartenant à
un autre professionnel retourne `404 UNAVAILABILITY_NOT_FOUND`.

### 8.5 Confirmation d'un impact calendrier

Le premier `PUT` ou `POST` envoie `confirmCancellations: false`. Si des
rendez-vous futurs sont touchés, la réponse est
`409 CALENDAR_CHANGE_CONFIRMATION_REQUIRED` avec :

```ts
type CalendarImpactDetails = {
  calendarVersion: number;
  impactFingerprint: string;
  appointments: Array<{
    id: number;
    clientDisplayName: string;
    range: TimeRangeView;
  }>;
};
```

L'empreinte couvre le type d'opération, la mutation canonique demandée
(plages hebdomadaires ou intervalle d'indisponibilité), la version du calendrier
et les identifiants, états et horaires des rendez-vous touchés, triés. Le motif
d'indisponibilité, qui ne change pas la liste destructive, et le passage de
`confirmCancellations` de `false` à `true` sont exclus de cette canonicalisation.

Après confirmation visuelle, le frontend répète la même mutation structurelle
avec `confirmCancellations: true` et l'empreinte reçue. Pour une indisponibilité qui
annule au moins un rendez-vous, `reason` devient obligatoire et peut être saisi
dans la fenêtre de confirmation sans invalider l'empreinte. Une modification
de l'intervalle exige en revanche un nouvel aperçu.

Le backend compare d'abord `expectedCalendarVersion`. Si elle est obsolète,
aucune écriture n'a lieu et `CALENDAR_VERSION_CONFLICT` demande au frontend de
relancer la même mutation avec `confirmCancellations: false` et la version
courante. Ce nouvel aperçu affiche alors la liste actuelle avant toute nouvelle
confirmation.

Si la version correspond, le backend verrouille le calendrier, recalcule
l'impact et compare l'empreinte. Une empreinte différente retourne
`409 CALENDAR_IMPACT_CHANGED` avec un nouveau `CalendarImpactDetails`. Ce cas
couvre notamment une mutation structurelle différente présentée avec une
ancienne empreinte ; il n'est pas utilisé à la place d'un conflit de version.

## 9. Rendez-vous connectés

### 9.1 Routes

| Méthode | Route | Accès | Succès |
|---|---|---|---|
| `POST` | `/v1/appointments` | client | `201` |
| `POST` | `/v1/professional/appointments` | professionnel | `201` |
| `GET` | `/v1/appointments` | compte | `200` |
| `GET` | `/v1/appointments/:id` | partie connectée | `200` |
| `POST` | `/v1/appointments/:id/cancel` | partie connectée | `200` |
| `GET` | `/v1/appointments/:id/proposal-slots` | partie connectée | `200` |
| `POST` | `/v1/appointments/:id/proposals` | partie connectée | `201` |
| `POST` | `/v1/appointments/:id/proposals/:proposalId/accept` | destinataire | `200` |
| `POST` | `/v1/appointments/:id/proposals/:proposalId/reject` | destinataire | `200` |
| `POST` | `/v1/appointments/:id/proposals/:proposalId/cancel` | auteur | `200` |
| `POST` | `/v1/appointments/:id/proposals/:proposalId/force` | professionnel | `200` |

Une « partie connectée » est soit le client lié, soit le professionnel
propriétaire. Pour tout autre compte, la ressource est invisible et retourne
`404 APPOINTMENT_NOT_FOUND`.

### 9.2 Réservation par un client

`POST /v1/appointments` reçoit :

```ts
type ClientAppointmentCreationBody = {
  professionalId: number;
  startAt: UtcInstant;
};
```

Le prénom, le nom et le téléphone sont copiés depuis `ClientProfile`, et
l'adresse depuis `User.email`. Le backend calcule la fin, vérifie le calendrier
dans une transaction et retourne
`AppointmentView`. Le code public est inclus pour l'écran de confirmation.

Un créneau passé ou hors disponibilité retourne
`409 APPOINTMENT_SLOT_UNAVAILABLE`. Une collision avec une réservation
concurrente retourne `409 APPOINTMENT_CONFLICT`.

### 9.3 Création manuelle par un professionnel

`POST /v1/professional/appointments` reçoit :

```ts
type ManualAppointmentCreationBody = {
  startAt: UtcInstant;
  client: {
    firstName: string;
    lastName: string;
    phone: string;
    email: string;
  };
};
```

Une adresse correspondant exactement à un `User` de rôle `CLIENT` rattache
ce compte ; sinon le rendez-vous reste invité. L'instantané utilise toujours
les quatre valeurs du corps. Le rattachement ne réécrit ni cet instantané ni
le profil client. La réponse `201` est :

```ts
type ManualAppointmentCreationView = {
  appointment: AppointmentView;
  clientLinked: boolean;
};
```

Le code public contenu dans `appointment` est toujours affichable par le
professionnel afin qu'il puisse le transmettre.

### 9.4 Listes client et professionnelle

`GET /v1/appointments` utilise une query discriminée par le rôle de la
session. Les paramètres de l'autre rôle sont refusés.

Pour un client :

```ts
type ClientAppointmentListQuery = {
  view?: "UPCOMING" | "HISTORY";
  limit?: number;
  cursor?: string;
  timezone?: IanaTimezone;
};
```

`view` vaut `UPCOMING` par défaut. `UPCOMING` contient les rendez-vous
confirmés dont le début n'est pas passé, triés par `startAt ASC, id ASC`.
`HISTORY` contient les rendez-vous annulés et les rendez-vous confirmés passés,
triés par `startAt DESC, id DESC`. Le curseur opaque encode les deux valeurs de
tri de la vue choisie. `limit` vaut 20 par défaut et 50 au maximum.
`timezone` vaut celui du profil client par défaut.

Réponse :

```ts
type ClientAppointmentListView = {
  view: "UPCOMING" | "HISTORY";
  items: AppointmentSummaryView[];
  nextCursor: string | null;
};
```

Pour un professionnel :

```ts
type ProfessionalAgendaQuery = {
  from: LocalDate;
  includeCanceled?: boolean;
};
```

`from` désigne le lundi de la semaine civile dans le fuseau du professionnel.
Une autre journée retourne `400 VALIDATION_ERROR`. `includeCanceled` vaut
`false` par défaut. La réponse contient exactement sept dates locales
consécutives :

```ts
type ProfessionalAgendaView = {
  from: LocalDate;
  timezone: IanaTimezone;
  calendarVersion: number;
  days: Array<{
    localDate: LocalDate;
    appointments: AppointmentSummaryView[];
  }>;
};
```

`days` contient exactement sept éléments. Les rendez-vous de chaque jour sont
triés par `startAt`, puis `id`.

### 9.5 Détail et annulation

`GET /v1/appointments/:id` n'a aucun paramètre supplémentaire et retourne
`AppointmentView`.

`POST /v1/appointments/:id/cancel` reçoit :

```ts
type AppointmentCancellationBody = {
  reason?: string;
};
```

Le motif est obligatoire pour un professionnel et facultatif pour un client.
Le backend fixe `cancellationCause` à `CLIENT` ou `PROFESSIONAL` depuis le
principal ; le corps ne peut pas fournir ce code. Le succès retourne
l'`AppointmentView` annulé. Si le rendez-vous est déjà
annulé, la route retourne son état actuel en `200` sans nouvel historique ni
notification : l'annulation est idempotente.

Un rendez-vous confirmé dont `startAt` n'est plus strictement futur retourne
`409 APPOINTMENT_NOT_MODIFIABLE` avec `{ reason: "PAST" }`.

Toute proposition `PENDING` est passée à `CANCELED` dans la même transaction.

### 9.6 Création d'une proposition

`GET /v1/appointments/:id/proposal-slots` accepte la même `SlotQuery` que la
recherche publique et retourne un `SlotSearchView`. Le rendez-vous doit être
confirmé, futur et visible par la partie connectée.

Cette lecture évalue le calendrier comme si le rendez-vous courant libérait
son propre intervalle. Elle ignore uniquement cet `Appointment` : toutes les
autres réservations, indisponibilités et règles hebdomadaires restent prises
en compte. Elle peut donc proposer un déplacement qui chevauche l'ancien
intervalle sans traiter le rendez-vous comme son propre conflit.

La réponse couvre exactement sept dates selon les règles de la section 8.2.
Elle ne réserve rien et ne remplace pas les validations transactionnelles de
la création puis de l'acceptation.

Les routes de proposition reçoivent toujours un `proposalId` appartenant au
rendez-vous de la route. Une discordance est traitée comme une ressource
inconnue.

`POST /v1/appointments/:id/proposals` reçoit :

```ts
type ProposalCreationBody = {
  proposedStartAt: UtcInstant;
};
```

Le backend calcule la fin et retourne `ProposalView` avec le statut `201`.
Le rendez-vous doit être confirmé et futur. Le backend vérifie que le nouveau
créneau est disponible au moment de la proposition, mais ne le réserve pas.
Cette vérification réutilise l'évaluateur contextuel avec
`excludedAppointmentId = appointment.id`, comme le sélecteur.

La création est une transaction sérialisable qui verrouille le profil
professionnel sans incrémenter `calendarVersion`, puis recharge le rendez-vous
et la proposition active. Une annulation ou suppression concurrente gagne donc
avant l'insertion ou attend celle-ci, sans laisser de `PENDING` sur un
rendez-vous annulé.

Erreurs spécifiques :

- `400 PROPOSED_SLOT_UNCHANGED` si l'instant est celui du rendez-vous actuel ;
- `409 PROPOSED_SLOT_UNAVAILABLE` si le créneau est déjà indisponible ;
- `409 PROPOSAL_ALREADY_PENDING` s'il existe une proposition en attente ;
- `409 APPOINTMENT_NOT_MODIFIABLE` si le rendez-vous est annulé ou passé.

La création d'une proposition est autorisée pour chacune des deux parties.
Elle fait de l'autre partie son destinataire.

### 9.7 Transitions d'une proposition

`accept` et `cancel` n'ont pas de corps. `reject` reçoit :

```ts
type ProposalRejectionBody = {
  reason?: string;
};
```

`force` reçoit obligatoirement :

```ts
type ProposalForceBody = {
  confirm: true;
};
```

Les règles exactes sont :

- seul le destinataire peut accepter ou refuser une proposition `PENDING` ;
- seul l'auteur peut retirer sa proposition `PENDING` ;
- seul le professionnel propriétaire peut forcer une proposition qu'il a
  adressée à la partie cliente ;
- aucune transition n'est possible si le rendez-vous est passé ou annulé ;
- une acceptation ou un forçage recalcule la disponibilité dans la transaction
  avec `excludedAppointmentId = appointment.id` ;
- la contrainte PostgreSQL reste la protection finale contre un chevauchement.

Une partie valide mais non autorisée pour l'action demandée reçoit
`403 PROPOSAL_ACTION_FORBIDDEN`. Une proposition d'un autre rendez-vous ou
une ressource non visible reçoit `404 PROPOSAL_NOT_FOUND`.

Une acceptation réussie retourne :

```ts
type ProposalAcceptedView = {
  appointment: AppointmentView;
  proposal: ProposalView;
};
```

Un refus ou un retrait retourne `ProposalView`.

Si le créneau est devenu indisponible, la proposition passe à `CONFLICT`, le
rendez-vous ne change pas et la réponse est `409 PROPOSED_SLOT_UNAVAILABLE`
avec `{ proposal: ProposalView }` dans `details`.

Une acceptation, un refus, un retrait ou un forçage déjà accompli par la même
partie retourne le DTO actuel avec `200`, sans doubler historique ou
notification. Une acceptation ayant produit `CONFLICT` répète le même
`409 PROPOSED_SLOT_UNAVAILABLE` et le même état terminal. Toute autre
transition sur une proposition terminale retourne
`409 PROPOSAL_NOT_PENDING`.

## 10. Rendez-vous par code public

### 10.1 En-tête et confidentialité

Toutes les routes de cette section exigent `X-Public-Code`. Il contient une
chaîne opaque compatible URL possédant au moins 128 bits d'entropie. Le schéma
d'en-tête accepte de 22 à 64 caractères de l'alphabet base64url
`A-Z`, `a-z`, `0-9`, `_` et `-`, sans espace ni padding.

Un en-tête absent retourne `400 PUBLIC_CODE_REQUIRED`. Un code inconnu,
révoqué ou lié à un rendez-vous supprimé retourne toujours
`404 PUBLIC_APPOINTMENT_NOT_FOUND`. Le code n'apparaît jamais dans une URL,
une query, une métrique ou un journal. Les routes publiques ne le renvoient et
ne le recopient jamais ; seules les réponses connectées explicitement autorisées
des sections 9.2, 9.3 et 9.5 peuvent contenir `publicCode`.

Sur ces routes, un cookie connecté éventuellement présent est ignoré pour
l'autorisation. Seul `X-Public-Code` construit le principal et il ne donne
accès qu'au rendez-vous unique auquel il est associé.

### 10.2 Routes

| Méthode | Route | Entrée | Succès |
|---|---|---|---|
| `GET` | `/v1/public/appointment` | aucune | `200 PublicAppointmentView` |
| `POST` | `/v1/public/appointment/cancel` | `AppointmentCancellationBody` | `200` |
| `GET` | `/v1/public/appointment/proposal-slots` | `SlotQuery` | `200 SlotSearchView` |
| `POST` | `/v1/public/appointment/proposals` | `ProposalCreationBody` | `201` |
| `POST` | `/v1/public/appointment/proposals/:proposalId/accept` | aucune | `200` |
| `POST` | `/v1/public/appointment/proposals/:proposalId/reject` | `ProposalRejectionBody` | `200` |
| `POST` | `/v1/public/appointment/proposals/:proposalId/cancel` | aucune | `200` |

Les réponses d'annulation et de proposition utilisent respectivement
`PublicAppointmentView` et `ProposalView`. Une acceptation retourne :

```ts
type PublicProposalAcceptedView = {
  appointment: PublicAppointmentView;
  proposal: ProposalView;
};
```

La route publique `proposal-slots` applique exactement le calcul contextuel
de la section 9.6. Le code public identifie le rendez-vous à ignorer ; aucun
identifiant de rendez-vous n'est accepté dans l'URL, la query ou le corps.

Le code représente la partie `CLIENT` : il peut retirer une proposition de
cette partie ou accepter et refuser une proposition du professionnel. Il ne
peut pas agir à la place du professionnel. Les règles d'état, de conflit et
d'idempotence de la [section 9](#97-transitions-dune-proposition) s'appliquent.

## 11. Notifications internes

### 11.1 Routes

| Méthode | Route | Accès | Entrée | Succès |
|---|---|---|---|---|
| `GET` | `/v1/notifications` | compte | query | `200` |
| `GET` | `/v1/notifications/unread-count` | compte | aucune | `200` |
| `PATCH` | `/v1/notifications/:id/read` | compte | aucune | `200` |
| `POST` | `/v1/notifications/read-all` | compte | aucune | `200` |

### 11.2 Liste paginée

`GET /v1/notifications` accepte :

```ts
type NotificationListQuery = {
  limit?: number;
  cursor?: string;
  unreadOnly?: boolean;
};
```

`limit` vaut 20 par défaut, 50 au maximum. Le panneau de la cloche utilise
`limit=5`. `unreadOnly` vaut `false` par défaut. Le tri stable est
`createdAt DESC, id DESC` et le curseur encode ces deux valeurs.

Réponse :

```ts
type NotificationListView = {
  items: NotificationView[];
  nextCursor: string | null;
};
```

### 11.3 Lecture

`GET /v1/notifications/unread-count` retourne :

```json
{
  "count": 3
}
```

`PATCH /v1/notifications/:id/read` retourne `NotificationView`. Une
notification déjà lue conserve son premier `readAt` et retourne `200`.

`POST /v1/notifications/read-all` retourne :

```ts
type ReadAllNotificationsView = {
  updatedCount: number;
  readAt: UtcInstant;
};
```

Une répétition retourne `updatedCount: 0`. Une notification inconnue ou
appartenant à un autre compte retourne `404 NOTIFICATION_NOT_FOUND`.

## 12. Idempotence et concurrence

Le périmètre ne nécessite pas de table générique de commandes ni d'en-tête
`Idempotency-Key`. Les règles retenues sont volontairement limitées :

- la déconnexion, l'annulation, les transitions déjà atteintes et les actions
  de lecture de notification sont idempotentes comme décrit plus haut ;
- les notifications utilisent leur `eventKey` pour empêcher un doublon, sans
  prétendre rendre toute requête HTTP idempotente ;
- les créations de rendez-vous, d'indisponibilité et de proposition ne sont
  pas rejouées automatiquement par le frontend après une erreur réseau
  ambiguë ; le frontend recharge d'abord la ressource ;
- les écritures calendrier utilisent `calendarVersion` et, lorsqu'elles
  annulent des rendez-vous, `impactFingerprint` ;
- une transaction sérialisable annulée par PostgreSQL est rejouée au plus deux
  fois par le backend, avec relecture et revalidation complètes ;
- après trois échecs de sérialisation, aucun effet n'est conservé et
  `CONCURRENT_MODIFICATION` demande un rechargement manuel ;
- les conflits de réservation restent tranchés par PostgreSQL.

Cette approche couvre les doubles clics et répétitions visibles dans la
démonstration sans ajouter une infrastructure hors périmètre.

## 13. Catalogue des erreurs

### 13.1 Codes généraux

| Statut | Code | Usage |
|---|---|---|
| `400` | `VALIDATION_ERROR` | Corps, route, query ou en-tête invalide. |
| `400` | `INVALID_TIMEZONE` | Fuseau IANA inconnu. |
| `400` | `INVALID_INTERVAL` | Bornes ou plage locale invalides. |
| `400` | `PASSWORD_CONFIRMATION_MISMATCH` | Confirmation différente. |
| `400` | `PUBLIC_CODE_REQUIRED` | En-tête public absent. |
| `401` | `UNAUTHENTICATED` | Session requise, absente ou expirée. |
| `401` | `INVALID_CREDENTIALS` | Échec de connexion. |
| `403` | `ROLE_FORBIDDEN` | Rôle incompatible avec la route. |
| `403` | `PASSWORD_INVALID` | Nouvelle saisie incorrecte. |
| `403` | `PROPOSAL_ACTION_FORBIDDEN` | Partie non autorisée à décider. |
| `403` | `ORIGIN_FORBIDDEN` | Origine présente mais non autorisée. |
| `404` | `ACCOUNT_NOT_FOUND` | Récupération démo inconnue. |
| `404` | `PROFESSIONAL_NOT_FOUND` | Professionnel public inconnu. |
| `404` | `APPOINTMENT_NOT_FOUND` | Rendez-vous invisible ou inconnu. |
| `404` | `PROPOSAL_NOT_FOUND` | Proposition invisible ou incohérente. |
| `404` | `UNAVAILABILITY_NOT_FOUND` | Indisponibilité invisible. |
| `404` | `NOTIFICATION_NOT_FOUND` | Notification invisible. |
| `404` | `PUBLIC_APPOINTMENT_NOT_FOUND` | Code inconnu ou révoqué. |
| `404` | `ROUTE_NOT_FOUND` | Méthode ou URL sans route déclarée. |
| `413` | `PAYLOAD_TOO_LARGE` | Corps supérieur à `100kb`. |
| `500` | `INTERNAL_ERROR` | Erreur inattendue sans détail exposé. |
| `503` | `DATABASE_UNAVAILABLE` | PostgreSQL indisponible sur `/health`. |

### 13.2 Codes de conflit métier

| Statut | Code | Détails éventuels |
|---|---|---|
| `409` | `EMAIL_ALREADY_USED` | `{ field: "email" }` |
| `409` | `BUSINESS_NAME_ALREADY_USED` | `{ field: "businessName" }` |
| `409` | `PROFESSIONAL_TIMEZONE_LOCKED` | `{ futureAppointmentCount }` |
| `409` | `CALENDAR_VERSION_CONFLICT` | `{ calendarVersion, restartPreview }` |
| `409` | `CALENDAR_CHANGE_CONFIRMATION_REQUIRED` | `CalendarImpactDetails` |
| `409` | `CALENDAR_IMPACT_CHANGED` | `CalendarImpactDetails` |
| `409` | `ACCOUNT_DELETION_IMPACT_CHANGED` | `AccountDeletionImpactDetails` |
| `409` | `CONCURRENT_MODIFICATION` | `{ resource: "CALENDAR" }` |
| `409` | `WEEKLY_AVAILABILITY_CONFLICT` | aucun |
| `409` | `UNAVAILABILITY_CONFLICT` | aucun |
| `409` | `APPOINTMENT_SLOT_UNAVAILABLE` | `{ startAt }` |
| `409` | `APPOINTMENT_CONFLICT` | `{ startAt }` |
| `409` | `APPOINTMENT_NOT_MODIFIABLE` | `{ reason: "CANCELED" | "PAST" }` |
| `409` | `PROPOSAL_ALREADY_PENDING` | aucun ; le détail est rechargé |
| `409` | `PROPOSAL_NOT_PENDING` | `{ status }` |
| `409` | `PROPOSED_SLOT_UNAVAILABLE` | `{ startAt }` ou `{ proposal }` |

`400 PROPOSED_SLOT_UNCHANGED` complète ce tableau pour une proposition égale
au créneau actuel. Une contrainte SQL connue est traduite vers l'un de ces
codes ; son nom, son message PostgreSQL et sa pile ne sont jamais exposés.
`CALENDAR_VERSION_CONFLICT` est réservé aux commandes qui fournissent une
`expectedCalendarVersion` ; il ne remplace pas un conflit de réservation.
`restartPreview` vaut `true` pour une mutation possédant
`confirmCancellations`, et `false` pour un changement de fuseau ou une
suppression simple d'indisponibilité.

## 14. CORS, origine et secrets

- L'origine frontend autorisée vient de l'environnement.
- CORS utilise `credentials: true` et une liste plate d'origines.
- Le frontend envoie les cookies avec `credentials: "include"`.
- Toute écriture navigateur sous `/auth` ou `/v1`, avec session ou code public,
  refuse un en-tête `Origin` absent de la liste configurée. Un en-tête absent
  reste accepté pour les clients non-navigateurs et les tests.
- `X-Public-Code` et `Content-Type` figurent dans les en-têtes CORS autorisés.
- `X-Public-Code`, `Cookie`, `Set-Cookie`, `password` et
  `impactFingerprint` sont filtrés des journaux.
- Les mots de passe ne sont jamais renvoyés, sauf par la route de récupération
  explicitement marquée comme démonstration.
