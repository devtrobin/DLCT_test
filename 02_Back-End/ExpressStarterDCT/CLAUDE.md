# Instructions pour les assistants IA

> Statut : guide spécifique au backend Delicity.

Ce dossier est le socle adapté du starter. Son infrastructure et son modèle
sont en place, mais ses routeurs métier vides ne représentent pas encore les
fonctionnalités finales.

## 1. Priorité des instructions

Appliquer les sources dans cet ordre :

1. demande explicite de l'utilisateur ;
2. [`Documentation/Project`](../../Documentation/Project/SUMMARY.md) ;
3. [`DEV_RULES.md`](../../Documentation/Project/DEV_RULES.md) ;
4. [`README.md`](README.md) et ce fichier ;
5. conventions historiques du starter.

En cas de doute fonctionnel, ne pas inventer une règle à partir du code brut.
Consulter la spécification thématique propriétaire.

## 2. Provenance immuable du socle

- origine : `https://github.com/kevinfavv/ExpressStarterDCT.git` ;
- SHA cloné : `07d6fc6dd274bdf11506ccc6a5aaf3649dffcc7f` ;
- état : socle adapté, pas produit terminé.

Ne pas fusionner automatiquement une nouvelle version du dépôt d'origine.

## 3. Socle à conserver

- Bun comme runtime, gestionnaire de paquets et moteur de test ;
- Express 5 et TypeScript strict en modules ESM ;
- Prisma 7 et PostgreSQL ;
- Zod pour toutes les entrées externes ;
- Helmet, CORS, compression et cookie-parser ;
- erreurs centralisées avec des codes applicatifs stables ;
- `/health`, `/metrics` et `prom-client` ;
- Supertest pour les tests HTTP ;
- hook `SIGTERM` à fiabiliser pour attendre le serveur puis Prisma.

Conserver un seul lockfile : `bun.lock`.

## 4. Éléments retirés à ne pas réintroduire

Sauf nouvelle exigence explicite, ne pas réintroduire :

- JWT, `jose`, `jsonwebtoken` et les clés RSA ;
- refresh tokens et cookies `isAuthenticated` ;
- bcrypt et OAuth Google ;
- Redis, ioredis et BullMQ ;
- AWS S3 et ses exemples ;
- Axios et UUID s'ils restent inutilisés ;
- contrôleurs et services d'exemple ;
- Jest, `package-lock.json` et les configurations obsolètes.

Les anciens `.env.exemple`, `src/env.d.ts`, Compose d'exemple et script de
clés RSA ont également été retirés.

Ne pas ajouter de SMS, courriel, WebSocket ou fournisseur externe. Les
notifications sont des enregistrements PostgreSQL consultés par l'API.

## 5. Choix temporel obligatoire

Luxon est conservé, car il est déjà installé et utilisé par le starter.

- conserver Luxon et ses types ;
- centraliser les conversions dans un adaptateur temporel ;
- employer des fuseaux IANA ;
- conserver les instants absolus en UTC ;
- utiliser des intervalles semi-ouverts `[début, fin)` ;
- exploiter l'immuabilité des valeurs `DateTime` ;
- ne pas calculer une règle métier avec `Date` directement.

Moment.js et `moment-timezone` ne sont pas ajoutés au projet.

## 6. Routage cible

Conserver les familles de routes du starter :

```text
GET  /health
GET  /metrics
...  /auth/*
...  /v1/*
```

- `/auth` porte les comptes et sessions ;
- `/v1` porte les routes publiques et protégées ;
- le code public arrive dans `X-Public-Code`, jamais dans l'URL ;
- les routeurs métier actuellement vides doivent être construits par domaine.

Le contrat détaillé reste dans
[`API.md`](../../Documentation/Project/API.md).

Conserver `POST /auth/register`, `/auth/login` et `/auth/logout` lorsqu'ils
sont adaptés aux DTO cibles. Ne pas conserver les routes Google ou reset par
jeton uniquement parce qu'elles existent dans le clone.

## 7. Sessions et autorisations

Ne pas réutiliser l'authentification JWT du starter.

- générer un identifiant de session opaque avec une source aléatoire sûre ;
- conserver la session et son expiration dans PostgreSQL ;
- transmettre uniquement l'identifiant dans un cookie `HttpOnly` ;
- utiliser `SameSite=Lax` et une durée fixe de 8 heures ou 30 jours ;
- charger le compte à chaque route protégée ;
- vérifier le rôle et la propriété de chaque ressource ;
- révoquer la seule session courante lors de la déconnexion.

Les rôles sont `CLIENT` et `PROFESSIONAL`. Le mot de passe reste en clair
pour la démonstration uniquement. Ne pas banaliser cet écart de sécurité.

## 8. Prisma et transactions

Le schéma multi-fichier conserve `User`, sa clé entière et ses champs communs
compatibles. Les champs Google, marketing, JWT et reset ont été retirés. Les
profils, sessions et agrégats suivent
[`DATA_MODEL.md`](../../Documentation/Project/DATA_MODEL.md).

Utiliser le mode multi-fichier de Prisma 7 sous `prisma/models`. Ne pas
concentrer tout le domaine dans le `schema.prisma` brut du starter.

Exigences importantes :

- migrations Prisma versionnées ;
- instants absolus mappés vers `timestamptz` ;
- sessions PostgreSQL indexées par expiration ;
- unicité des comptes sur le couple rôle et adresse ;
- notifications créées dans la transaction métier ;
- exclusion PostgreSQL empêchant les chevauchements ;
- version de calendrier incrémentée par toute écriture modifiant un
  créneau ;
- aperçu d'annulation revérifié avant une confirmation destructive ;
- traduction des violations concurrentes en `409 Conflict`.

Le découpage des services, repositories, autorisations et transactions est
défini dans
[`BACKEND_MODULES.md`](../../Documentation/Project/BACKEND_MODULES.md).
Tous les repositories d'un cas d'utilisation transactionnel reçoivent le même
`Prisma.TransactionClient`.

Ne jamais remplacer cette garantie par une simple vérification applicative.

## 9. Validation, erreurs et textes

- typer les schémas Zod, sans `schema: any` ;
- valider séparément body, query, params et headers ;
- utiliser la valeur produite par Zod après validation ;
- retourner `400`, jamais le statut non standard `419` ;
- laisser les erreurs parvenir au middleware global ;
- utiliser `401`, `403`, `404` et `409` selon leur sens ;
- ne pas exposer de trace ou secret dans une réponse ou un journal.

Le backend renvoie un code d'erreur stable et un payload. Vue I18n traduit les
textes visibles. Ne créer un système i18n backend que si une exigence nouvelle
le demande.

## 10. Structure et lisibilité

- maximum 100 lignes physiques par fichier de code maintenu ;
- maximum 80 caractères par ligne de code ;
- fonctions courtes, vocabulaire métier explicite ;
- contrôleurs sans logique métier ;
- services séparés des accès Prisma ;
- schémas, types et adaptateurs dans des fichiers dédiés ;
- maximum deux niveaux d'imbrication ;
- pas de duplication pour contourner les limites.

Le code importé doit être refactorisé s'il dépasse encore ces limites.

## 11. Docker et scripts

Le projet global possède quatre images : DB, backend, frontend et scripts.
Leur composition est décrite dans
[`DOCKER_ARCHITECTURE.md`](../../Documentation/Project/DOCKER_ARCHITECTURE.md).

- ce dossier construit uniquement le backend ;
- `prisma/migrations` reste la source canonique des migrations ;
- l'image `04_Script` copie et applique les migrations par défaut ;
- le seed reste une commande manuelle et idempotente de cette image ;
- le backend ne doit pas lancer une migration concurrente au démarrage final ;
- l'API attend la disponibilité de PostgreSQL et la fin des migrations ;
- Redis ne fait pas partie du Compose final.

## 12. Commandes actuelles

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

Ne pas annoncer une commande comme disponible avant de l'avoir ajoutée au
`package.json` et testée.

## 13. Commandes qualité restant à ajouter

```bash
bun run format:check
bun run lint
```

Le formatage et le lint feront partie du prochain socle de CI. Le typecheck,
les limites et le test d'infrastructure sont déjà exécutables.

## 14. Méthode de modification

Avant de modifier le code :

1. lire la spécification propriétaire ;
2. vérifier les fichiers déjà modifiés par l'utilisateur ;
3. distinguer le socle initial d'une fonctionnalité métier terminée ;
4. concevoir une modification limitée et lisible ;
5. ajouter les tests proportionnés au risque ;
6. exécuter formatage, lint, types, limites et tests disponibles ;
7. mettre à jour les guides concernés.

Ne jamais restaurer un exemple supprimé simplement parce que le dépôt source
du starter le contenait.
