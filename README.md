# Test technique Delicity

> Statut : socle technique initialisé, fonctionnalités métier à développer.

Ce projet accueillera une démonstration de prise de rendez-vous composée d'une
API Bun/Express, d'une interface Vue, d'une base PostgreSQL et d'un job de
migrations.

## État actuel

- le projet utilise un dépôt Git unique à la racine ;
- le `.git` imbriqué du starter a été retiré après conservation de son SHA ;
- les quatre images Docker sont définies dans `compose.yaml` ;
- le frontend Vue minimal et l'infrastructure backend se construisent ;
- les migrations installent le modèle et les contraintes PostgreSQL ;
- `/health`, `/metrics` et la page d'accueil répondent ;
- les routes d'authentification et les fonctionnalités métier restent à
  implémenter selon les spécifications.

Le clone backend correspond au commit :

```text
07d6fc6dd274bdf11506ccc6a5aaf3649dffcc7f
```

Source : <https://github.com/kevinfavv/ExpressStarterDCT>.

## Architecture cible

```text
01_DB/                              image PostgreSQL
02_Back-End/ExpressStarterDCT/      image API Bun/Express
03_Front-End/                       image interface Vue
04_Script/                          image one-shot de migrations
Documentation/                      contexte et spécifications
```

L'ordre de démarrage attendu est : base saine, migrations terminées, backend
sain, puis frontend. L'image scripts s'arrête normalement avec le code `0` ;
elle n'est ni un cron ni un worker métier.

## Choix structurants

- Bun, Express 5, TypeScript ESM, Prisma 7, PostgreSQL et Zod ;
- modèle Prisma `User` du starter conservé et adapté, complété par les profils
  et agrégats métier utiles ;
- Vue 3, Pinia, Bootstrap et Vue I18n ;
- Luxon, déjà présent dans le starter, pour les dates et fuseaux ;
- sessions opaques conservées dans PostgreSQL, sans JWT ;
- notifications internes, sans SMS ni courriel ;
- quatre images démarrées par un fichier Compose racine.

Le socle du starter a été adapté. Ses exemples JWT, Google OAuth, bcrypt,
Redis, BullMQ et S3 ont été retirés du code cible.

## Documentation

- [sommaire du projet](Documentation/Project/SUMMARY.md) ;
- [conception technique](Documentation/Project/TECHNICAL_DESIGN.md) ;
- [modules du backend](Documentation/Project/BACKEND_MODULES.md) ;
- [contrat API](Documentation/Project/API.md) ;
- [modèle de données](Documentation/Project/DATA_MODEL.md) ;
- [architecture Docker](Documentation/Project/DOCKER_ARCHITECTURE.md) ;
- [règles de développement](Documentation/Project/DEV_RULES.md) ;
- [contexte du recrutement](Documentation/Context/Context.md).

## Démarrage

Créer l'environnement local depuis l'exemple si `.env` n'existe pas, puis
lancer les quatre images :

```sh
docker compose up --build
```

Le job `scripts` applique les migrations puis s'arrête normalement avec le
code `0`. Le backend est disponible sur `http://localhost:3000` et le frontend
sur `http://localhost:5173`.

Le seed de démonstration est manuel et idempotent :

```sh
docker compose run --rm scripts bun run seed
```

Les variables disponibles sont documentées dans `.env.example`. Le fichier
`.env` local est ignoré par Git.

## Avertissement de démonstration

Certaines décisions, notamment le stockage en clair et l'affichage du mot de
passe, sont volontairement limitées à cette démonstration. Elles sont
interdites dans un produit réel et signalées dans les spécifications.
