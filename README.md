# Test technique Delicity

> Statut : démonstration fonctionnelle prête à être exécutée.

Ce projet contient une démonstration de prise de rendez-vous composée d'une
API Bun/Express, d'une interface Vue, d'une base PostgreSQL et d'un job de
migrations.

## Fonctionnalités

- inscription et connexion client ou restaurateur avec sessions PostgreSQL ;
- recherche de restaurateurs et consultation des créneaux sur sept jours ;
- horaires hebdomadaires et indisponibilités exceptionnelles ;
- réservation client et création manuelle par un restaurateur ;
- agenda, historique, annulation et propositions de nouveau créneau ;
- consultation et gestion d'un rendez-vous par code public ;
- notifications internes et gestion du compte ;
- contraintes PostgreSQL contre les chevauchements concurrents ;
- tests d'intégration backend et contrôles automatiques de structure.

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

Il crée les comptes suivants :

| Rôle | Adresse | Mot de passe |
|---|---|---|
| Client | `client@example.test` | `Password` |
| Restaurateur | `restaurant@example.test` | `Password` |

Le restaurateur de démonstration possède des horaires du lundi au vendredi,
de 09:00 à 18:00 dans le fuseau `Europe/Paris`.

Les variables disponibles sont documentées dans `.env.example`. Le fichier
`.env` local est ignoré par Git.

## Vérifications

La CI applique les migrations sur une base PostgreSQL, génère le client
Prisma, vérifie TypeScript et les limites de fichiers, puis lance les tests
d'intégration backend et le build frontend.

Les scénarios couvrent notamment les sessions, les calendriers, les
réservations, les propositions, l'accès public, les notifications et les deux
transitions saisonnières du fuseau `Europe/Paris`.

## Avertissement de démonstration

Certaines décisions, notamment le stockage en clair et l'affichage du mot de
passe, sont volontairement limitées à cette démonstration. Elles sont
interdites dans un produit réel et signalées dans les spécifications.
