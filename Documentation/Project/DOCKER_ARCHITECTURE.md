# Architecture Docker

> Statut : source de vérité pour les images et le démarrage  
> Dernière mise à jour : 17 août 2026  
> Navigation : [`SUMMARY.md`](SUMMARY.md)

## 1. Arborescence cible

```text
compose.yaml
.env.example
01_DB/
└── Dockerfile
02_Back-End/
└── ExpressStarterDCT/
    ├── Dockerfile
    ├── bun.lock
    └── prisma/
        ├── schema.prisma
        ├── models/
        └── migrations/
03_Front-End/
├── Dockerfile
└── bun.lock
04_Script/
└── Dockerfile
```

Les quatre dossiers correspondent à quatre images Docker distinctes. Le
schéma et les migrations restent canoniques dans le backend et ne sont pas
dupliqués dans `01_DB` ou `04_Script`.

## 2. Services Compose

| Service | Image cible | Responsabilité | Durée de vie |
|---|---|---|---|
| `database` | `delicity-database` | PostgreSQL 18 | permanente |
| `scripts` | `delicity-scripts` | Déployer les migrations | one-shot |
| `backend` | `delicity-backend` | API Bun/Express | permanente |
| `frontend` | `delicity-frontend` | Interface Vue | permanente |

`docker compose up --build` construit et démarre ces quatre services. Le
conteneur `scripts` termine avec le code zéro après les migrations ; cet arrêt
est normal et ne représente pas une panne.

## 3. Image `database`

- Contexte de build : `01_DB/`.
- Image de base : `postgres:18`.
- Volume nommé monté sur `/var/lib/postgresql`, conformément à l'organisation
  des données de l'image PostgreSQL 18.
- Contrôle de santé avec `pg_isready`.
- Port local de développement : `5433` vers `5432`.
- Aucun schéma applicatif dans `docker-entrypoint-initdb.d`.

Prisma reste l'unique propriétaire du schéma applicatif et des migrations.

## 4. Image `scripts`

- Contexte de build Compose : racine du projet.
- Dockerfile : `04_Script/Dockerfile`.
- Base : Bun 1.3 Alpine, alignée sur le backend.
- Fichiers copiés : paquet backend, lockfile, configuration Prisma, schéma et
  migrations, ainsi que la source du seed.
- Installation : `bun install --frozen-lockfile` avec les dépendances Prisma
  nécessaires aux commandes.
- Génération : `bunx prisma generate` pendant la construction avec la même URL
  factice et locale que l'image backend.
- Commande par défaut : `bunx prisma migrate deploy`.
- Dépendance : `database` doit être saine.
- Sortie attendue : code zéro après application des migrations.

Cette image n'est ni un cron, ni un worker métier, ni un conteneur maintenu en
vie artificiellement. Une commande manuelle peut lancer le seed idempotent :

```sh
docker compose run --rm scripts bun run seed
```

Le seed n'est jamais exécuté automatiquement par `docker compose up`.
Le client généré est présent dans cette image pour le seed, mais la commande
runtime par défaut reste uniquement `prisma migrate deploy`.

## 5. Image `backend`

- Contexte de build : `02_Back-End/ExpressStarterDCT/`.
- Runtime : `oven/bun:1.3-alpine`.
- Port interne et exposé : `3000`.
- Publication locale : `3000:3000`.
- Installation : `bun install --frozen-lockfile`.
- Génération : `bunx prisma generate` pendant la construction, après copie du
  schéma et avant le typecheck ou le démarrage.
- Démarrage : API uniquement, sans migration concurrente.
- Contrôle de santé : `GET /health`.
- Dépendance : `scripts` doit avoir terminé avec succès.

Le Dockerfile adapté copie `bun.lock`, et non `bun.lockb*`. L'ancien
`start.sh` a été retiré : le backend démarre seulement l'API et l'image
`scripts` reste l'unique propriétaire de `prisma migrate deploy`.

`src/generated` n'est pas versionné. Chaque image qui importe le client Prisma,
`backend` et `scripts` pour le seed, le génère une seule fois pendant son build.
Il n'est pas régénéré à chaque démarrage.
Comme `prisma.config.ts` exige `DATABASE_URL` même pour `generate`, la commande
de build reçoit une URL PostgreSQL factice, locale à cette seule instruction et
sans secret. `prisma generate` n'ouvre aucune connexion. L'URL réelle utilisant
le service `database` n'est fournie qu'au runtime par Compose.

## 6. Image `frontend`

- Contexte de build : `03_Front-End/`.
- Première étape : build Vue/Vite avec Bun.
- Seconde étape : serveur HTTP statique léger.
- Port local : `5173` vers le port HTTP interne.
- Contrôle de santé : réponse HTTP valide sur `/`.
- Dépendance : `backend` doit être sain.
- URL d'API navigateur : `http://localhost:3000` en développement local,
  configurable par l'environnement de build ou d'exécution.

Le navigateur utilise directement le port publié du backend. Le nom Compose
`backend` ne lui est pas accessible et reste réservé aux échanges entre
conteneurs. CORS et les cookies autorisent uniquement l'origine frontend
configurée, par défaut `http://localhost:5173` en local.

## 7. Ordre de démarrage

```text
database healthy
      │
      ▼
scripts completed successfully
      │
      ▼
backend healthy
      │
      ▼
frontend started
```

Les conditions Compose utilisent `service_healthy` et
`service_completed_successfully`. Un simple `depends_on` sans santé ne suffit
pas à garantir que PostgreSQL accepte déjà les connexions.

## 8. Variables d'environnement

Le fichier `.env.example` racine documente au minimum :

- `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD` ;
- `DATABASE_URL` avec le nom d'hôte `database` entre conteneurs ;
- `NODE_ENV=development` en local ;
- `PORT=3000` ;
- `APP_NAME` pour le préfixe Prometheus ;
- `CORS_ORIGINS` ;
- `COOKIE_DOMAIN`, vide en local par défaut ;
- `SESSION_TTL_HOURS=8` ;
- `PERSISTENT_SESSION_TTL_DAYS=30` ;
- `VITE_API_BASE_URL=http://localhost:3000` pour le build local.

Le nom du cookie est la constante applicative `sessionId`. L'attribut `Secure`
est activé lorsque `NODE_ENV` n'est pas `development`; il n'exige pas une
variable concurrente.

L'attribut `Domain` est omis lorsque `COOKIE_DOMAIN` est vide. S'il est
configuré, la même valeur et les mêmes attributs structurants sont utilisés
pour créer puis supprimer le cookie.

Il ne contient ni clé RSA, ni Redis, ni AWS, ni OAuth. Aucune valeur réelle
n'est versionnée.

## 9. Réseau et volumes

- Les services utilisent le réseau Compose privé par défaut.
- `DATABASE_URL` vise `database:5432`, jamais `localhost`.
- Seul PostgreSQL possède un volume de données persistant.
- Les dépendances installées et sources ne sont pas des volumes de production.
- Redis n'est pas démarré.

## 10. Vérifications attendues

- Les quatre images se construisent sans lockfile concurrent.
- Une base vide reçoit toutes les migrations par `scripts`.
- Un second démarrage ne rejoue aucune migration dangereuse.
- Le backend attend la fin des migrations.
- `/health` devient sain lorsque PostgreSQL est joignable.
- Le frontend atteint l'API avec les cookies de session.
- L'arrêt de Compose laisse le volume PostgreSQL intact.
- `docker compose down -v` reste une action explicite et destructive.
