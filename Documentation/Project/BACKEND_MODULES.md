# Modules du backend

> Statut : architecture applicative de référence  
> Dernière mise à jour : 17 août 2026  
> Navigation : [`SUMMARY.md`](SUMMARY.md)

## 1. Objectif

Ce document transforme le contrat HTTP et le modèle Prisma en modules
implémentables dans le starter Bun, Express 5, Prisma 7 et Zod.

Les choix suivants sont figés avant l'implémentation :

- `User` reste l'agrégat d'authentification fourni par le starter ;
- le client Prisma généré est la référence des types persistés ;
- les DTO HTTP restent distincts afin de ne jamais exposer un objet Prisma ;
- un fichier de service porte un seul cas d'utilisation ;
- les transactions sont ouvertes par les services, jamais par les routes ;
- les parcours connecté et par code public réutilisent les mêmes règles ;
- aucun bus d'événements, cache ou service externe n'est nécessaire.

Les champs utiles de `User` sont conservés et adaptés aux rôles du produit.
Les refresh tokens, Google et la réinitialisation générique sont supprimés,
car ils contredisent le périmètre défini dans
[`DATA_MODEL.md`](DATA_MODEL.md). Le terme « compte » de l'API désigne donc un
`User` et non un second modèle concurrent.

## 2. Socle conservé et nettoyage

Le backend conserve les capacités utiles du clone :

- Bun, TypeScript ESM strict et Express 5 ;
- Prisma 7, `@prisma/adapter-pg` et PostgreSQL ;
- Zod pour toutes les entrées externes ;
- CORS, Helmet, compression et `cookie-parser` ;
- `prom-client`, l'amorce de gestion de `SIGTERM` et le principe
  d'`AppError` ;
- Bun test et Supertest.

Le hook `SIGTERM` fourni doit être fiabilisé : le processus attend la fermeture
du serveur HTTP et la déconnexion Prisma avant de sortir.

Les modules et dépendances suivants sont supprimés :

- OAuth Google et `SocialService` ;
- JWT, JOSE, refresh tokens et génération de clés RSA ;
- bcrypt, car le mot de passe en clair est un compromis explicite de la démo ;
- Redis, ioredis, BullMQ et les exemples de file d'attente ;
- AWS S3, Axios serveur, UUID et les exemples associés ;
- les imports Luxon dispersés, remplacés par un adaptateur Luxon commun ;
- `body-parser`, remplacé par `express.json()` ;
- les contrôleurs, routes et services d'exemple.

Ces suppressions n'enlèvent aucun parcours du produit. Le projet ne prévoit
ni SMS, ni courriel, ni fichier distant, ni OAuth, ni tâche asynchrone, ni
WebSocket.

## 3. Arborescence cible

```text
src/
├── app.ts
├── index.ts
├── features/
│   ├── auth/
│   ├── accounts/
│   ├── professionals/
│   ├── availability/
│   ├── appointments/
│   └── notifications/
├── shared/
│   ├── database/
│   ├── errors/
│   ├── events/
│   ├── security/
│   └── time/
└── infrastructure/
    ├── config/
    ├── health/
    ├── http/
    ├── logging/
    └── metrics/
```

Chaque fonctionnalité ajoute seulement les fichiers dont elle a besoin :

```text
features/appointments/
├── appointment.routes.ts
├── public-appointment.routes.ts
├── appointment.controller.ts
├── public-appointment.controller.ts
├── create-appointment.schema.ts
├── create-appointment.service.ts
├── appointment.repository.ts
├── appointment.mapper.ts
├── public-appointment.mapper.ts
└── appointment.types.ts
```

Un second fichier de routes, contrôleur ou schéma est créé avant que le
premier atteigne 100 lignes. Il ne faut pas fabriquer un fichier générique
`helpers.ts` pour contourner cette limite.

## 4. Responsabilité des couches

### 4.1 Routes

Une route déclare uniquement :

1. la méthode et le chemin ;
2. la résolution du principal, si nécessaire ;
3. le middleware Zod ;
4. le contrôleur.

Les routeurs de fonctionnalité sont montés explicitement dans `app.ts`.
Les anciens `PublicRouter` et `ApiRouter` vides ne deviennent pas des
conteneurs de logique.

### 4.2 Schémas Zod

Un schéma valide et transforme `body`, `params`, `query` ou les en-têtes. Le
résultat parsé remplace la valeur brute dans `res.locals.input`. Le type
d'entrée vient de `z.infer`, sans interface dupliquée.

Le code public possède un schéma d'en-tête dédié. Il n'est jamais copié dans
une URL, un message d'erreur ou un journal.

### 4.3 Contrôleurs

Un contrôleur lit une entrée validée et un `Principal`, appelle un cas
d'utilisation, passe son résultat au mapper HTTP puis fixe le statut. Il ne
connaît ni Prisma, ni Luxon, ni les règles d'autorisation.

### 4.4 Services

Un service correspond à un verbe métier, par exemple
`accept-change-proposal.service.ts`. Il reçoit ses dépendances dans son
constructeur ou une fonction de fabrique simple. Aucun conteneur d'injection
de dépendances n'est ajouté.

Le service :

- applique les politiques et invariants ;
- ouvre la transaction lorsque l'action écrit plusieurs données ;
- appelle les repositories avec le même client de transaction ;
- écrit l'historique et les notifications avant le commit ;
- retourne un résultat métier, jamais une réponse Express.

### 4.5 Repositories et mappers

Les repositories sont les seuls fichiers applicatifs qui importent le client
Prisma généré. Ils utilisent des `select` explicites et des opérations Prisma
simples. Aucun repository générique n'est créé au-dessus de Prisma.

Les mappers ont deux usages distincts :

- adapter une projection Prisma vers un type métier lorsque c'est utile ;
- produire le DTO HTTP autorisé pour un écran.

Le mapper public d'un rendez-vous est différent du mapper connecté. Il ne
reçoit pas un booléen ambigu et ne peut donc pas exposer accidentellement les
coordonnées du client.

## 5. Modules et cas d'utilisation

| Module | Cas d'utilisation principaux |
|---|---|
| `auth` | Inscrire, connecter, déconnecter, lire la session, récupération démo |
| `accounts` | Lire/modifier le compte, changer le mot de passe, aperçu et suppression |
| `professionals` | Rechercher un professionnel et lire son profil public |
| `availability` | Horaires, indisponibilités, créneaux, impact calendrier |
| `appointments` | Créer, lister, lire, annuler et gérer les propositions |
| `notifications` | Lister, compter et marquer comme lu |
| `infrastructure` | Configuration, santé, métriques, HTTP et journaux |

Les dépendances restent dirigées :

- `auth` utilise les repositories de `User`, profils et sessions ;
- `accounts` orchestre la suppression via les ports de rendez-vous et
  d'événements ;
- `availability` utilise l'évaluateur de créneaux et l'annulation interne ;
- `appointments` utilise l'évaluateur de disponibilité et les writers ;
- `notifications` ne dépend d'aucun autre module métier ;
- tous peuvent dépendre de `shared`, jamais l'inverse.

Un service ne doit pas appeler le contrôleur ou le service public d'un autre
module. Une opération interne partagée, comme annuler un rendez-vous dans une
transaction existante, est exposée par un petit port métier qui accepte le
client de transaction.

## 6. Composants partagés obligatoires

### 6.1 Base et transactions

`database-client.types.ts` définit le type commun :

```ts
type DatabaseClient = PrismaClient | Prisma.TransactionClient;
```

Chaque méthode de repository reçoit ce client en premier paramètre. Pour une
lecture simple, le service fournit le singleton Prisma. Dans une transaction,
il fournit exclusivement le `Prisma.TransactionClient` reçu.

`transaction-runner.ts` est le seul composant applicatif qui appelle
`prisma.$transaction` :

```ts
type TransactionWork<T> = (
  database: Prisma.TransactionClient,
) => Promise<T>;

interface TransactionRunner {
  run<T>(work: TransactionWork<T>): Promise<T>;
}
```

Une variante `runSerializable` est utilisée pour les écritures de calendrier,
la création ou l'acceptation d'une proposition et la suppression d'un compte.
Il n'existe pas de transaction imbriquée. Une fonction interne reçoit le
client courant.

`runSerializable` rejoue au maximum deux fois une transaction entièrement
annulée par PostgreSQL avec `40001` ou Prisma avec `P2034`, soit trois
tentatives au total. Chaque tentative recharge les données et réexécute les
validations métier. Une `AppError` ou une contrainte connue n'est jamais
rejouée.

### 6.2 Horloge et Luxon

`clock.ts` expose uniquement `now(): Date`. Les tests injectent une horloge
fixe. Aucune fonction métier n'appelle directement `new Date()` pour obtenir
l'instant courant.

`luxon-time.adapter.ts` est le seul import direct de `luxon`. Il :

- valide un identifiant IANA ;
- convertit un instant UTC pour l'affichage ;
- résout une heure locale en zéro, un ou deux instants lors d'un changement
  saisonnier ;
- ajoute une durée réelle de 60 minutes ;
- fournit les informations de décalage nécessaires aux DTO de créneau.

La génération des quarts d'heure reste une fonction métier testable qui
utilise cet adaptateur. Aucun modèle Prisma ne stocke un objet `DateTime`.

### 6.3 Identifiants opaques

`public-code.generator.ts` utilise `crypto.randomBytes(16)` au minimum puis
un encodage base64url. La contrainte unique reste la protection finale. Une
collision, considérée irréaliste avec 128 bits, annule toute la transaction et
devient une erreur interne ; le repository ne tente jamais de continuer dans
une transaction PostgreSQL déjà invalidée.

`session-id.generator.ts` utilise 256 bits, soit `crypto.randomBytes(32)`,
dans un fichier distinct. Leur séparation empêche de confondre durée de
session et code de rendez-vous.

### 6.4 Historique et notifications

`appointment-history.writer.ts` et `notification.writer.ts` reçoivent le
client de transaction et un événement typé. Ils écrivent directement en base
sans file d'attente.

Les writers ne décident pas qui doit être notifié. Le service résout le compte
depuis le côté métier et les relations de l'`Appointment`, et non depuis le
canal public ou `authorUserId`, puis leur transmet un destinataire autorisé et
un payload du catalogue. La clé suit la forme
`history:<historyId>:<notificationType>`. Elle empêche deux lignes identiques,
mais ne rend pas toute commande HTTP automatiquement idempotente.

### 6.5 Erreurs

`database-error.mapper.ts` traduit uniquement les contraintes nommées :

- `user_role_email_unique` vers `EMAIL_ALREADY_USED` ;
- `professional_business_name_unique` vers
  `BUSINESS_NAME_ALREADY_USED` ;
- `appointment_no_overlap` vers `APPOINTMENT_CONFLICT` ;
- `weekly_availability_no_overlap` vers
  `WEEKLY_AVAILABILITY_CONFLICT` ;
- `unavailability_no_overlap` vers `UNAVAILABILITY_CONFLICT` ;
- `proposal_one_pending` vers `PROPOSAL_ALREADY_PENDING` ;
- `weekly_availability_bounds_check`,
  `weekly_availability_order_check`,
  `unavailability_interval_check` vers `INVALID_INTERVAL` ;
- `appointment_public_code_unique` vers `INTERNAL_ERROR`, sans détail ;
- version obsolète d'une commande munie de `expectedCalendarVersion` vers
  `CALENDAR_VERSION_CONFLICT` ;
- conflit de sérialisation encore présent après trois tentatives vers
  `CONCURRENT_MODIFICATION` ;
- concurrence pendant une suppression vers un nouvel aperçu
  `ACCOUNT_DELETION_IMPACT_CHANGED` ;
- ligne absente lors d'une transition conditionnelle vers le code d'état
  métier correspondant.

Les checks `appointment_duration_check`, `appointment_state_check`,
`appointment_cancellation_reason_check`,
`appointment_client_anonymization_check`,
`appointment_professional_anonymization_check`, `proposal_duration_check`,
`proposal_state_check`, `professional_calendar_version_check` et
`session_expiration_check` valident des valeurs construites par les services.
Leur violation devient une erreur interne journalisée, jamais une erreur de
saisie attribuée au client. Le cas `PROPOSED_SLOT_UNCHANGED` est détecté dans
le service sous verrou, car un check SQL ne peut pas comparer la proposition
avec la ligne de rendez-vous parente.

Le writer de notification utilise directement une insertion équivalente à
`ON CONFLICT DO NOTHING` sur `notification_recipient_event_unique`. Il ne
provoque donc pas une violation qui invaliderait la transaction courante.

`http-error.middleware.ts` transforme ensuite une `AppError` en
`{ error, details? }`. Une erreur inconnue devient `500 INTERNAL_ERROR` et est
journalisée sans secret. Le contrôleur n'effectue pas ce mapping.
Le parseur JSON mappe un corps mal formé vers `VALIDATION_ERROR` et la limite
de `100kb` vers `PAYLOAD_TOO_LARGE`. Le middleware d'origine produit
`ORIGIN_FORBIDDEN` avant les contrôleurs.

## 7. Principaux et autorisation

Le middleware produit une union discriminée :

```ts
type Principal =
  | { kind: 'ANONYMOUS' }
  | { kind: 'USER'; userId: number; role: UserRole }
  | { kind: 'PUBLIC_APPOINTMENT'; appointmentId: number };
```

Les routes connectées n'acceptent que le principal `USER`. Les routes
`/v1/public/appointment` construisent uniquement `PUBLIC_APPOINTMENT` depuis
`X-Public-Code`. Cette séparation évite une priorité implicite entre cookie et
code public.

Les politiques centrales sont :

- `require-account-role.policy.ts` ;
- `read-appointment.policy.ts` ;
- `act-on-appointment.policy.ts` ;
- `act-on-proposal.policy.ts` ;
- `manage-professional-calendar.policy.ts`.

Une ressource d'un autre compte est répondue comme introuvable. Un rôle
incorrect sur une route connue produit `403`.

### 7.1 Notion de `CLIENT_SIDE`

`CLIENT_SIDE` est le nom de la politique correspondant à
`AppointmentParty.CLIENT`. Elle regroupe :

- le compte client lié au rendez-vous ;
- le détenteur du code public de ce même rendez-vous.

`PROFESSIONAL_SIDE` correspond à `AppointmentParty.PROFESSIONAL` et désigne
uniquement le professionnel propriétaire. Les politiques comparent les champs
`authorParty` et `recipientParty`, et non le canal d'accès. Ainsi, une
proposition adressée au client peut être traitée avec sa session ou avec le
code public valide.

`HistoryActorType` enregistre le canal exact dans l'historique :
`CLIENT_USER`, `PUBLIC_CLIENT`, `PROFESSIONAL_USER` ou `SYSTEM`.
L'auteur et le destinataire d'une proposition sont déduits comme suit :

| `HistoryActorType` du principal | `AppointmentParty` |
|---|---|
| `CLIENT_USER` ou `PUBLIC_CLIENT` | `CLIENT` |
| `PROFESSIONAL_USER` | `PROFESSIONAL` |
| `SYSTEM` | aucune partie interactive |

Seul le destinataire peut accepter ou refuser. Seul l'auteur peut retirer sa
proposition. Le forçage appartient exclusivement au professionnel du
rendez-vous et exige `confirm: true`.

## 8. Transactions et ordre de concurrence

Toute commande modifiant le calendrier suit cet ordre :

1. ouvrir une transaction `Serializable` ;
2. lire les identifiants et versions minimales concernés ;
3. trier les `professionalUserId` par ordre croissant ;
4. verrouiller chaque profil par une mise à jour Prisma conditionnelle avec
   `calendarVersion: { increment: 0 }` ;
5. recharger rendez-vous, plages et indisponibilités dans la transaction ;
6. vérifier propriété, état, disponibilité et empreinte d'impact ;
7. incrémenter la version si le calendrier change, puis appliquer les
   écritures conditionnelles ;
8. écrire historiques puis notifications ;
9. valider la transaction.

Pour une commande munie de `expectedCalendarVersion`, le verrou porte la
condition exacte attendue. Pour les autres commandes, la mise à jour de zéro
acquiert le verrou de ligne sans changer la valeur. Un nombre de lignes
modifié différent de un provoque `409 CALENDAR_VERSION_CONFLICT` uniquement
si une version attendue faisait partie de la commande. Cette technique reste
dans l'API Prisma et n'ajoute aucun SQL brut au code applicatif.

Pour une commande de confirmation, la version est prioritaire sur l'empreinte.
En cas de mismatch, le service lit la version courante et retourne
`restartPreview: true` sans calcul destructif. Le frontend relance une commande
non confirmante. `CALENDAR_IMPACT_CHANGED` n'est évalué qu'après verrouillage
avec la version attendue correcte, si l'empreinte ne correspond pas à la
mutation et à l'impact recalculés. Les autres commandes versionnées renvoient
`restartPreview: false`.

Après un rollback sérialisable, le nouvel essai refait les contrôles. Une
réservation concurrente validée devient ainsi `APPOINTMENT_CONFLICT` par
relecture ou exclusion. Une acceptation devenue impossible persiste
`CHANGE_CONFLICT` avant de retourner `PROPOSED_SLOT_UNAVAILABLE`. Si les trois
tentatives sont interrompues, aucun effet n'est conservé et
`CONCURRENT_MODIFICATION` demande au frontend de recharger ; ce cas n'est pas
présenté comme un conflit métier qui n'a pas été constaté.

Le tri est obligatoire lors d'une suppression de compte qui touche plusieurs
professionnels. Il évite que deux transactions revendiquent les calendriers
dans un ordre opposé.

L'incrémentation a lieu pour :

- créer ou annuler un rendez-vous ;
- accepter ou forcer une proposition ;
- remplacer les horaires ;
- créer ou supprimer une indisponibilité ;
- modifier le fuseau professionnel ;
- annuler des rendez-vous pendant une suppression de compte.

Une proposition créée, refusée ou retirée ne réserve aucun créneau et
n'incrémente pas la version. Une acceptation qui découvre un conflit garde le
verrou jusqu'au commit, mais ne change pas la version puisque le rendez-vous
ne bouge pas. La contrainte d'exclusion PostgreSQL reste la dernière protection
si deux commandes concurrentes atteignent l'écriture.

La création d'une proposition acquiert néanmoins le même verrou de profil avec
un incrément de zéro. Elle recharge ensuite le rendez-vous `CONFIRMED` et futur,
la proposition active et la disponibilité avant l'insertion. Elle ne peut donc
pas insérer une nouvelle `PENDING` après une annulation ou une suppression qui
aurait déjà traité les propositions existantes.

Une transition d'état utilise toujours une condition dans la requête, par
exemple `where: { id, status: 'PENDING' }`. Relire puis mettre à jour sans
condition est interdit.

### 8.1 Aperçus destructifs

`POST /v1/account/deletion-preview` revalide le mot de passe et retourne
`futureAppointmentCount` et `impactFingerprint`. L'empreinte couvre au
minimum le compte, les rendez-vous futurs triés et les versions de leurs
calendriers.

`DELETE /v1/account` répète le mot de passe, l'empreinte et `confirm: true`.
Le service revendique les versions, recalcule la liste et compare
l'empreinte avant toute suppression. Une différence retourne
`409 ACCOUNT_DELETION_IMPACT_CHANGED` avec un nouvel aperçu.

Le même principe s'applique aux confirmations d'horaires et
d'indisponibilité définies dans [`API.md`](API.md).

Pour ces commandes, l'empreinte inclut le type d'opération, les paramètres
structurels normalisés, la version du calendrier et les rendez-vous touchés
triés. Modifier les horaires ou l'intervalle invalide donc l'aperçu, même si la
liste obtenue reste identique. Le motif descriptif peut être ajouté dans la
confirmation, car il n'affecte pas cette liste.

## 9. Machines d'états

### 9.1 Rendez-vous

```text
création ──> CONFIRMED ── annulation ──> CANCELED
                       │
                       └─ proposition acceptée : reste CONFIRMED
                          avec de nouveaux startAt et endAt
```

`CANCELED` est terminal. Toute nouvelle commande de modification retourne
`409 APPOINTMENT_NOT_MODIFIABLE` avec la raison `CANCELED`. Une annulation
répétée est l'exception idempotente et retourne l'état actuel en `200`, sans
nouvel historique ni notification. Un rendez-vous passé utilise le même code
avec la raison `PAST`.

Lors d'une annulation, toutes les propositions `PENDING` du rendez-vous
passent à `CANCELED` dans la même transaction avant l'événement
d'annulation du rendez-vous.

Le service reçoit une `CancellationCause` structurée. La route volontaire la
déduit du principal ; les ports internes fournissent `SCHEDULE_CHANGED`,
`UNAVAILABILITY` ou `ACCOUNT_DELETED`. Seuls les motifs réellement saisis sont
conservés dans `cancellationReason`.

### 9.2 Propositions

```text
               ┌──> ACCEPTED
               ├──> REJECTED
PENDING ──────├──> CANCELED
               └──> CONFLICT
```

Tous les états de sortie sont terminaux :

- `ACCEPTED` déplace le rendez-vous dans la même transaction ;
- `REJECTED` est choisi par le destinataire ;
- `CANCELED` est choisi par l'auteur ou provoqué par l'annulation du
  rendez-vous ;
- `CONFLICT` conserve le rendez-vous initial lorsque le nouveau créneau
  n'est plus disponible.

La répétition par la même partie d'une transition vers `ACCEPTED`, `REJECTED`
ou `CANCELED` retourne le DTO courant en `200`, sans nouvel événement. Une
acceptation répétée après `CONFLICT` retourne le même conflit de créneau. Toute
autre transition depuis un état terminal retourne
`409 PROPOSAL_NOT_PENDING`.

Le forçage suit la transition `PENDING -> ACCEPTED`. La proposition doit être
émise par `AppointmentParty.PROFESSIONAL` et destinée à
`AppointmentParty.CLIENT`. Il ne contourne ni les disponibilités, ni les
indisponibilités, ni la contrainte de chevauchement.

## 10. Dépendances des cas d'utilisation

| Groupe | Repositories | Politiques et adaptateurs |
|---|---|---|
| Inscription et connexion | `User`, profil, session | horloge, générateur de session |
| Session et déconnexion | session, compte | horloge, cookie HTTP au contrôleur |
| Profil | `User`, profil, calendrier, rendez-vous | propriété, Luxon pour le fuseau |
| Suppression de compte | `User`, calendrier, rendez-vous, proposition | transaction, writer, empreinte |
| Recherche professionnelle | profil professionnel | mapper public |
| Lecture de créneaux | calendrier, rendez-vous | horloge, Luxon, générateur de créneaux |
| Mutation de calendrier | calendrier, rendez-vous, proposition | transaction, version, empreinte, writer |
| Création de rendez-vous | compte, calendrier, rendez-vous | disponibilité, code public, writer |
| Annulation | calendrier, rendez-vous, proposition | politique de partie, transaction, writer |
| Proposition | rendez-vous, proposition, calendrier | politique de partie, disponibilité contextuelle, writer |
| Notifications | notification | propriété du destinataire, horloge |

Le calcul de disponibilité est une seule capacité partagée par la liste des
créneaux, la création manuelle, la réservation et l'acceptation. Aucun de ces
services ne recode ses propres règles temporelles.

## 11. Routes vers cas d'utilisation

### 11.1 Infrastructure et authentification

| Route | Cas d'utilisation |
|---|---|
| `GET /health` | `get-health.service.ts` |
| `GET /metrics` | `get-metrics.service.ts` |
| `POST /auth/register` | `register-user.service.ts` |
| `POST /auth/login` | `login.service.ts` |
| `POST /auth/logout` | `logout.service.ts` |
| `GET /auth/session` | `get-session.service.ts` |
| `POST /auth/demo-password-recovery` | `recover-demo-password.service.ts` |

Le schéma d'inscription est une union discriminée par `role` ; le service crée
le profil `ClientProfile` ou `ProfessionalProfile` correspondant. L'inscription
et la connexion créent une session. Seul le contrôleur pose ou efface le
cookie ; le service retourne l'identifiant opaque et son expiration.

`get-session.service.ts` reste une lecture pure : une session expirée produit
un état anonyme sans suppression. Les services `POST` d'inscription, de
connexion et de déconnexion peuvent appeler une purge opportuniste.

### 11.2 Compte et professionnels

| Route | Cas d'utilisation |
|---|---|
| `GET /v1/account` | `get-current-account.service.ts` |
| `PATCH /v1/account` | `update-current-account.service.ts` |
| `PATCH /v1/account/password` | `change-password.service.ts` |
| `POST /v1/account/deletion-preview` | `preview-account-deletion.service.ts` |
| `DELETE /v1/account` | `delete-account.service.ts` |
| `GET /v1/professionals` | `search-professionals.service.ts` |

La modification du fuseau d'un professionnel reste dans
`update-current-account.service.ts`, mais délègue la validation calendaire à
une petite fonction du module `availability`.

### 11.3 Disponibilités

| Route | Cas d'utilisation |
|---|---|
| `GET /v1/professionals/:id/slots` | `list-available-slots.service.ts` |
| `GET /v1/professional/weekly-availability` | `get-weekly-availability.service.ts` |
| `PUT /v1/professional/weekly-availability` | `replace-weekly-availability.service.ts` |
| `GET /v1/professional/unavailabilities` | `list-unavailabilities.service.ts` |
| `POST /v1/professional/unavailabilities` | `create-unavailability.service.ts` |
| `DELETE /v1/professional/unavailabilities/:id` | `delete-unavailability.service.ts` |

### 11.4 Rendez-vous connectés

| Route | Cas d'utilisation |
|---|---|
| `POST /v1/appointments` | `create-client-appointment.service.ts` |
| `POST /v1/professional/appointments` | `create-manual-appointment.service.ts` |
| `GET /v1/appointments` | `list-appointments.service.ts` |
| `GET /v1/appointments/:id` | `get-appointment.service.ts` |
| `POST /v1/appointments/:id/cancel` | `cancel-appointment.service.ts` |
| `GET /v1/appointments/:id/proposal-slots` | `list-proposal-slots.service.ts` |
| `POST /v1/appointments/:id/proposals` | `propose-appointment-change.service.ts` |
| `POST /v1/appointments/:id/proposals/:proposalId/accept` | `accept-change-proposal.service.ts` |
| `POST /v1/appointments/:id/proposals/:proposalId/reject` | `reject-change-proposal.service.ts` |
| `POST /v1/appointments/:id/proposals/:proposalId/cancel` | `cancel-change-proposal.service.ts` |
| `POST /v1/appointments/:id/proposals/:proposalId/force` | `force-change-proposal.service.ts` |

`GET /v1/appointments` utilise une query discriminée :

- client : `view=UPCOMING|HISTORY`, `cursor`, `limit` et `timezone` ;
- professionnel : `from=YYYY-MM-DD` et `includeCanceled` pour sept dates
  locales dans son fuseau.

### 11.5 Accès par code public

| Route | Cas d'utilisation partagé |
|---|---|
| `GET /v1/public/appointment` | `get-appointment.service.ts` |
| `POST /v1/public/appointment/cancel` | `cancel-appointment.service.ts` |
| `GET /v1/public/appointment/proposal-slots` | `list-proposal-slots.service.ts` |
| `POST /v1/public/appointment/proposals` | `propose-appointment-change.service.ts` |
| `POST /v1/public/appointment/proposals/:proposalId/accept` | `accept-change-proposal.service.ts` |
| `POST /v1/public/appointment/proposals/:proposalId/reject` | `reject-change-proposal.service.ts` |
| `POST /v1/public/appointment/proposals/:proposalId/cancel` | `cancel-change-proposal.service.ts` |

Les contrôleurs et mappers HTTP sont distincts, mais le service reçoit le
`Principal` et reste unique. Cette réutilisation empêche deux machines d'états
de diverger.

`list-proposal-slots.service.ts` réutilise la fonction pure de génération des
créneaux avec un seul `excludedAppointmentId`, obtenu après autorisation. Le
contrôleur public ne lit jamais cet identifiant depuis une entrée cliente.
`propose-appointment-change.service.ts`, `accept-change-proposal.service.ts`
et `force-change-proposal.service.ts` appellent le même évaluateur avec
`appointment.id`; aucun service ne recode cette exception.

### 11.6 Notifications

| Route | Cas d'utilisation |
|---|---|
| `GET /v1/notifications` | `list-notifications.service.ts` |
| `GET /v1/notifications/unread-count` | `count-unread-notifications.service.ts` |
| `PATCH /v1/notifications/:id/read` | `read-notification.service.ts` |
| `POST /v1/notifications/read-all` | `read-all-notifications.service.ts` |

## 12. Composition de l'application

`app.ts` construit les repositories et adaptateurs une seule fois, puis monte
les routeurs. Le singleton Prisma n'est pas importé depuis les contrôleurs.
Une petite fabrique par module suffit ; aucun framework d'injection n'est
justifié pour cette démonstration.

Le pipeline Express est, dans l'ordre :

1. Helmet, CORS et cookies ;
2. garde d'origine pour les méthodes d'écriture ;
3. JSON limité à `100kb`, puis compression des réponses ;
4. métriques HTTP sans valeurs personnelles ;
5. `/health` et `/metrics` ;
6. routes `/auth` ;
7. routes publiques `/v1` ;
8. routes connectées `/v1` ;
9. route introuvable ;
10. middleware d'erreur central.

La résolution de session est optionnelle sur `/auth/session`, obligatoire sur
les routes de compte et absente des routes par code public. Le healthcheck
effectue une requête PostgreSQL légère par un repository d'infrastructure.

## 13. Règles de simplicité

- Un fichier maintenu reste sous 100 lignes et chaque ligne sous 80 caractères.
- Un service public correspond à un seul cas d'utilisation nommé.
- Une fonction dépassant trois paramètres reçoit un objet typé explicite.
- Les dépendances sont listées au début du fichier, sans registre magique.
- `any`, les repositories génériques et les classes de domaine vides sont
  interdits.
- Les enums Prisma sont réutilisés pour la persistance ; une union métier
  n'est ajoutée que pour une notion absente, comme `CLIENT_SIDE`.
- Les constantes de durée, pas, pagination et cookie portent un nom.
- Les fonctions pures couvrent les calculs ; les services couvrent
  l'orchestration ; les repositories couvrent les entrées/sorties SQL.
- Une fonctionnalité hors écran, hors API et hors modèle n'est pas anticipée.

Cette architecture constitue le niveau de détail nécessaire pour commencer
l'implémentation sans réintroduire les fonctionnalités génériques du starter.
