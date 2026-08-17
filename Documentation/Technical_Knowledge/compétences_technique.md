# Compétences techniques et outils demandés

## Compétences déjà maîtrisées

- TypeScript et JavaScript.
- Node.js et Express.js.
- PostgreSQL et MySQL.
- Migrations de base de données.
- Gestion des dates, des fuseaux horaires et des changements d'heure.
- Docker et Docker Compose.
- Git.
- CI/CD et GitHub Actions.
- Codex, Cursor et GitHub Copilot.

Les fiches d'apprentissage concernant les autres sujets sont regroupées dans [`Technical_Knowledge/`](README.md).

## Compétences requises par le sujet et les choix du projet

### Développement backend

- **TypeScript** et **JavaScript**.
- **Bun** avec **Express 5**.
- Utilisation et adaptation du starter [`ExpressStarterDCT`](https://github.com/kevinfavv/ExpressStarterDCT).
- Validation avec **Zod** et journaux structurés centralisés.
- Mesures HTTP avec **Prometheus** et `prom-client`.
- Conception d'une API et de ses endpoints.
- Validation des données entrantes.
- Gestion cohérente des erreurs HTTP.
- Organisation claire de l'architecture backend.

### Développement frontend

- **Vue.js**.
- **Vue Router**, **Pinia**, **Bootstrap** et **Vue I18n**.
- Conception d'une interface permettant au professionnel de gérer ses disponibilités et ses indisponibilités.
- Conception du parcours client de consultation, réservation et annulation.
- Gestion de l'état et des échanges avec l'API.
- Prise en compte de l'expérience utilisateur.

### Base de données

- **PostgreSQL**.
- **Prisma ORM 7** avec `@prisma/adapter-pg`.
- Modélisation des professionnels, disponibilités, indisponibilités et rendez-vous.
- Création et fourniture des migrations.
- Mise en place de contraintes garantissant l'intégrité des données.
- Prévention fiable des rendez-vous qui se chevauchent, y compris lors de requêtes concurrentes.

### Dates et fuseaux horaires

- Manipulation fiable des dates et heures.
- Utilisation de fuseaux horaires explicites, idéalement avec leurs identifiants IANA.
- Conversion des créneaux entre le fuseau du professionnel et celui du client.
- Gestion des transitions entre heure d'été et heure d'hiver.
- Traitement des heures locales ambiguës ou inexistantes.
- Utilisation centralisée de **Luxon**, déjà présent dans le starter.

### Tests et qualité

- Tests automatisés des règles métier importantes.
- Tests des disponibilités, indisponibilités, réservations et annulations.
- Tests des chevauchements et des accès concurrents.
- Tests des fuseaux horaires et changements d'heure.
- Typage, validations et structure de code lisible.
- Documentation des principaux choix techniques.

### Conteneurisation et exécution

- **Docker** et **Docker Compose**.
- Construction des quatre images portées par `01_DB`,
  `02_Back-End/ExpressStarterDCT`, `03_Front-End` et `04_Script`.
- Contrôles de santé et ordre de démarrage entre les conteneurs.
- Application des migrations par l'image de scripts avant le backend.
- Démarrage de toute la démonstration avec :

```sh
docker compose up
```

### Versionnement et documentation

- **Git**.
- Historique de commits permettant de suivre la progression du projet.
- README expliquant l'installation, le lancement et les choix structurants.
- Documentation des hypothèses retenues pour les éléments laissés libres par le sujet.
- Workflow d'intégration continue avec **GitHub Actions**.

## Outils d'intelligence artificielle autorisés

L'utilisation d'outils d'IA est explicitement autorisée, notamment :

- Codex ;
- Claude Code ;
- Cursor ;
- GitHub Copilot ;
- documentation et autres assistants nécessaires.

L'utilisation de ces outils n'est pas une compétence fonctionnelle obligatoire du test. Delicity souhaite surtout pouvoir évaluer la démarche, les décisions prises et la qualité du résultat.

## Technologies mentionnées dans l'annonce du poste

Les technologies suivantes appartiennent à la stack présentée dans l'annonce, mais ne sont pas toutes imposées pour le test :

- **Pinia** ;
- **Capacitor** et **Ionic** ;
- **Tailwind CSS** ;
- **MySQL** ;
- **Redis** ;
- outils et pratiques de **CI/CD**.

Pour ce projet, le starter actuel conduit à utiliser Bun, Express 5, Prisma
7, Zod et `prom-client`. PostgreSQL remplace MySQL, Bootstrap remplace
Tailwind CSS et GitHub Actions assure la CI. Luxon est conservé comme outil
temporel. Redis, BullMQ, JWT, OAuth Google, bcrypt, S3, Ionic et Capacitor
restent écartés sans besoin fonctionnel.
