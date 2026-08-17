# Backend Delicity

> Statut : socle backend adapté, fonctionnalités métier à implémenter.

Ce dossier provient du clone demandé de `ExpressStarterDCT`. Le socle est
nettoyé, conteneurisé et relié au modèle PostgreSQL du projet. Les routes
d'authentification et les cas d'utilisation métier restent à implémenter.

## 1. Sources de vérité

En cas de contradiction, respecter cet ordre :

1. les demandes explicites du sujet et de l'utilisateur ;
2. [`Documentation/Project`](../../Documentation/Project/SUMMARY.md) ;
3. [`DEV_RULES.md`](../../Documentation/Project/DEV_RULES.md) ;
4. ce guide et [`CLAUDE.md`](CLAUDE.md) ;
5. les choix génériques hérités du starter.

La conception cible est décrite dans
[`TECHNICAL_DESIGN.md`](../../Documentation/Project/TECHNICAL_DESIGN.md).
Le découpage des cas d'utilisation appartient à
[`BACKEND_MODULES.md`](../../Documentation/Project/BACKEND_MODULES.md).

## 2. Provenance du starter

- origine : `https://github.com/kevinfavv/ExpressStarterDCT.git` ;
- commit cloné :
  `07d6fc6dd274bdf11506ccc6a5aaf3649dffcc7f` ;
- date du commit : 12 août 2026 ;
- rôle : fournir un socle, et non dicter le périmètre fonctionnel.

Conserver cette provenance dans l'historique du projet. Les évolutions du
dépôt d'origine ne sont pas intégrées automatiquement.

## 3. Socle actuellement conservé

Le socle adapté conserve :

- Bun, Express 5 et TypeScript en modules ESM ;
- Prisma 7 avec l'adaptateur PostgreSQL ;
- Zod pour la validation ;
- Helmet, CORS, compression et les cookies Express ;
- un gestionnaire global d'erreurs ;
- un endpoint de santé et des métriques Prometheus ;
- Supertest et le moteur de test de Bun.

Les exemples et fonctions hors périmètre suivants ont été retirés :

- JWT, clés RSA et jetons de rafraîchissement ;
- OAuth Google et mots de passe hachés avec bcrypt ;
- Redis et BullMQ ;
- stockage AWS S3 ;
- contrôleurs et files d'attente d'exemple ;
- dépendances inutilisées, Jest, le lockfile npm et l'ancien Compose.

Les mots de passe en clair restent une concession volontaire de la
démonstration, documentée dans la spécification des
[comptes et de l'authentification][accounts].

## 4. Temps, dates et fuseaux horaires

Le starter utilise Luxon. Ce choix est conservé afin de réutiliser l'outil
déjà installé et employé par le code fourni.

La cible est donc :

- conserver `luxon` et `@types/luxon` ;
- isoler les opérations temporelles dans un adaptateur dédié ;
- stocker les instants absolus en UTC dans PostgreSQL ;
- employer des identifiants de fuseau IANA ;
- ne pas ajouter une seconde bibliothèque de dates telle que Moment.js.

Les règles métier complètes se trouvent dans la spécification des
[disponibilités et fuseaux horaires][timezones].

## 5. API cible

Les préfixes du starter sont conservés et complétés :

```text
GET  /health
GET  /metrics
...  /auth/*
...  /v1/*
```

- `/health` expose l'état minimal du backend ;
- `/metrics` expose les métriques Prometheus ;
- `/auth` regroupe l'inscription, la connexion et la session ;
- `/v1` regroupe l'API publique et l'API protégée.

Les routeurs `/auth` et `/v1` sont encore vides dans le socle. Le contrat à
implémenter appartient à
[`API.md`](../../Documentation/Project/API.md).

La route fournie `POST /auth/register` est conservée avec un champ `role`.
`POST /auth/login` et `/auth/logout` gardent également leur famille. Google,
le reset par jeton et les refresh tokens ne font pas partie du contrat cible.

L'API renvoie des codes d'erreur stables. Les messages visibles sont traduits
par Vue I18n dans le frontend.

## 6. Authentification cible

L'authentification finale n'utilise ni JWT ni API key.

- une session opaque est créée à la connexion ;
- la session est conservée dans PostgreSQL ;
- son cookie est `HttpOnly` et `SameSite=Lax` ;
- sa durée fixe est de huit heures par défaut ;
- « Rester connecté » porte cette durée à trente jours ;
- la déconnexion révoque uniquement la session courante ;
- les routes vérifient la session, le rôle et la propriété des ressources.

Les rôles métier sont `CLIENT` et `PROFESSIONAL`. Aucun rôle administrateur
ni connexion Google ne fait partie de la démonstration.

## 7. Base de données

Prisma 7 utilise le générateur `prisma-client` et l'adaptateur PostgreSQL. Les
migrations sont versionnées et constituent la seule manière de faire évoluer
le schéma partagé.

Le modèle `User` fourni, sa clé entière et ses champs compatibles sont
conservés. Les profils, sessions et agrégats métier sont ajoutés autour de
lui. `RefreshToken` a inspiré `Session` sans conserver JWT, et
`ForgotPasswordRequest` est retiré. Le modèle complet appartient à
[`DATA_MODEL.md`](../../Documentation/Project/DATA_MODEL.md).

La cible utilise le schéma multi-fichier de Prisma 7 : `schema.prisma` garde
la configuration commune et `prisma/models` sépare les domaines afin de
respecter la limite de 100 lignes.

La protection contre les chevauchements repose sur une migration SQL
PostgreSQL avec `btree_gist` et une contrainte d'exclusion.

## 8. Images Docker et migrations

Le dépôt global démarre quatre images : base de données, backend, frontend
et scripts. Leur composition est définie par
[l'architecture Docker][docker]. Ce dossier produit uniquement l'image
backend.

La source canonique des migrations reste `prisma/migrations` dans ce backend.
L'image `04_Script` les copie et les exécute comme tâches ponctuelles. Elle
contient une commande de seed manuelle, jamais lancée par défaut. Le backend
attend que la base et les migrations soient prêtes, puis démarre l'API.

Les images backend et scripts génèrent chacune le client Prisma pendant leur
build. L'image scripts en a besoin pour le seed manuel ; sa commande runtime
par défaut reste uniquement `prisma migrate deploy`.

Le build backend exécute `bunx prisma generate` après copie du schéma, puis
avant le typecheck. `src/generated` reste ignoré par Git et aucune génération
n'est relancée au démarrage normal de l'API.

`prisma.config.ts` exige une `DATABASE_URL` pendant cette génération. La
construction emploie une URL factice sans secret, limitée à l'instruction
`generate`, qui ne se connecte pas. Compose injecte séparément l'URL
PostgreSQL réelle au runtime.

## 9. Commandes disponibles

```bash
bun install
bun run dev
bun run start
bun test
bun run typecheck
bun run check:file-limits
bun run seed
bunx prisma generate
bunx prisma migrate dev --name nom_de_migration
bunx prisma migrate deploy
```

## 10. Commandes restant à ajouter

Les contrôles suivants seront ajoutés avec la configuration de qualité :

```bash
bun run format:check
bun run lint
```

Le paquet conserve uniquement `bun.lock`.

## 11. Règles de contribution

- maximum 100 lignes physiques par fichier de code maintenu ;
- maximum 80 caractères par ligne de code ;
- code lisible sans difficulté par un développeur junior ;
- contrôleurs limités au protocole HTTP ;
- logique métier placée dans des services courts ;
- accès Prisma isolés et transactions explicites ;
- schémas Zod séparés par domaine ;
- aucun `any` ajouté sans justification exceptionnelle ;
- tests de concurrence exécutés avec un vrai PostgreSQL.

Le socle TypeScript a été découpé et simplifié. Les déclarations Prisma
impossibles à répartir sur plusieurs lignes suivent l'arbitrage décrit dans les
règles de développement.

## 12. Avant toute implémentation

1. lire le [sommaire du projet](../../Documentation/Project/SUMMARY.md) ;
2. identifier la spécification propriétaire de la règle modifiée ;
3. vérifier si le code observé appartient au socle ou à un module métier ;
4. limiter la modification au périmètre utile ;
5. mettre à jour tests et documentation avec le code.

[accounts]: ../../Documentation/Project/ACCOUNTS_AND_AUTHENTICATION.md
[docker]: ../../Documentation/Project/DOCKER_ARCHITECTURE.md
[timezones]: ../../Documentation/Project/AVAILABILITY_AND_TIMEZONES.md
