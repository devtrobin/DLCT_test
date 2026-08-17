# Conception technique

> Statut : référence d'architecture et d'adaptation du starter  
> Dernière mise à jour : 17 août 2026  
> Navigation : [`SUMMARY.md`](SUMMARY.md)

Les conventions applicables à chaque contribution sont définies dans
[`DEV_RULES.md`](DEV_RULES.md). Les modules et cas d'utilisation backend sont
définis dans [`BACKEND_MODULES.md`](BACKEND_MODULES.md). Le contrat HTTP, la
base et Docker possèdent leurs propres documents afin de conserver une seule
source de vérité.

## 1. Arborescence du projet

```text
compose.yaml
.env.example
01_DB/
02_Back-End/
└── ExpressStarterDCT/
03_Front-End/
04_Script/
Documentation/
```

Ces dossiers portent quatre images Docker : PostgreSQL, backend, frontend et
scripts de migration. Leur orchestration appartient à
[`DOCKER_ARCHITECTURE.md`](DOCKER_ARCHITECTURE.md).

Le backend et le frontend restent les deux parties fonctionnelles demandées
par le sujet. La base et le job de migration sont des unités d'exécution, pas
deux applications métier supplémentaires.

## 2. Provenance du backend

Le dossier `02_Back-End/ExpressStarterDCT/` est un clone de :

```text
https://github.com/kevinfavv/ExpressStarterDCT.git
```

Révision figée :

```text
07d6fc6dd274bdf11506ccc6a5aaf3649dffcc7f
```

Le `.git` du clone a été retiré après intégration dans le dépôt unique créé à
la racine du projet. Le SHA ci-dessus conserve sa provenance. Le code, le
`README.md` et le `CLAUDE.md` sont désormais adaptés dans l'historique global.

## 3. Priorité des choix techniques

En cas de concurrence entre deux outils capables de remplir le même rôle :

1. les exigences du sujet et demandes actuelles de l'utilisateur priment ;
2. les décisions explicites du projet sont appliquées ;
3. les composants compatibles du starter sont réutilisés ;
4. la stack de l'annonce reste seulement informative.

Pour le code et le modèle fournis, la règle est **réutiliser avant de
remplacer** : un nom, une structure ou un middleware du starter est conservé
lorsqu'il satisfait le métier sans introduire une fonction hors périmètre. Une
exigence métier explicite peut l'adapter. Un exemple générique inutile n'est pas
conservé uniquement pour éviter un refactoring.

Si le retrait immédiat d'une fonction générique empêche une étape intermédiaire
de démarrer, elle peut rester temporairement isolée, sans route exposée ni
dépendance d'un nouveau module. Cette dette doit être retirée avant que la
fonctionnalité concernée soit déclarée terminée. Aucun élément hors périmètre du
starter n'est indispensable à la cible actuellement définie.

Cette règle impose notamment :

- Luxon, déjà présent dans le starter, pour les dates et fuseaux ;
- Bootstrap à la place de Tailwind CSS ;
- sessions PostgreSQL à la place des JWT et refresh tokens ;
- notifications internes à la place des fournisseurs SMS ou courriel.

Une seule solution est conservée par capacité. L'outil non retenu et ses types
sont retirés des dépendances.

## 4. Socle backend conservé

Le clone fournit réellement les éléments utiles suivants :

- Bun 1.3 comme runtime et gestionnaire de paquets ;
- Express 5 ;
- TypeScript strict en modules ESM ;
- Prisma 7 avec PostgreSQL et `@prisma/adapter-pg` ;
- Zod pour la validation ;
- `cookie-parser`, CORS, Helmet et compression ;
- classes `AppError` et middleware d'erreur central ;
- `prom-client` pour les métriques ;
- Bun test et Supertest ;
- amorce de gestion de `SIGTERM`, à fiabiliser pour attendre réellement la
  fermeture du serveur HTTP puis la déconnexion de Prisma.

Le projet conserve ces concepts, puis les met en conformité avec les règles
de taille, typage, nommage et séparation des couches. L'arrêt cible attend les
deux fermetures avant de terminer le processus et gère les erreurs associées.

## 5. Routage Express

Le montage fourni par `src/app.ts` devient :

```text
GET /health
GET /metrics
/auth/*                 routes publiques d'authentification
/v1/*                   routes métier publiques
/v1/* + session         routes métier protégées
middleware d'erreur
```

Les routeurs métier restent vides dans le socle initial. Le contrat complet est
défini dans [`API.md`](API.md).

Le clone expose actuellement `POST /auth/register`, `/auth/login` et
`/auth/logout`. Ces trois routes utiles sont conservées, avec des DTO et un
comportement adaptés aux rôles `CLIENT` et `PROFESSIONAL`. Les routes Google,
mot de passe oublié par jeton et réinitialisation appartiennent au boilerplate
et ne sont pas exposées par la cible. Le parcours de récupération propre à la
démo utilise une route distincte définie dans le document API.

Express 5 propage les erreurs des contrôleurs asynchrones au middleware
central. Un contrôleur ne transforme donc pas indistinctement toutes les
erreurs en `400` et n'ajoute pas de `try/catch` sans traitement local utile.

## 6. Validation et erreurs

Zod reste l'outil unique de validation. Le middleware exemple doit être adapté
car il utilise actuellement `any`, ignore la valeur parsée et retourne le
statut non standard `419`.

La version cible :

- valide `body`, `query`, `params`, en-têtes et environnement ;
- transmet la valeur transformée et typée ;
- retourne `400` pour une entrée invalide ;
- laisse le middleware central formater les erreurs ;
- expose des codes stables traduits par Vue I18n.

Les classes inspirées de `AppError` portent le statut HTTP, le code métier et
des détails filtrés. Aucun message interne ou stack n'est envoyé en production.

## 7. Authentification adaptée

Le JWT RSA, les refresh tokens, le cookie lisible `isAuthenticated`, Google
OAuth et bcrypt appartiennent au starter générique. Ils ne correspondent pas
aux décisions de la démonstration.

Le modèle `User` du starter est conservé et adapté. Son ancien mécanisme
d'authentification est remplacé par :

- une session opaque conservée dans PostgreSQL ;
- un cookie unique `HttpOnly` et `SameSite=Lax` ;
- une durée fixe de huit heures ou trente jours ;
- une vérification du rôle et de la propriété sur chaque route protégée ;
- le parcours de récupération de mot de passe propre à la démo.

Le stockage en clair du mot de passe reste une concession volontaire et
explicitement signalée, jamais une recommandation de production.

## 8. Temps et fuseaux

Luxon est présent dans le clone et utilisé par le service d'authentification
fourni. La dépendance et `@types/luxon` sont conservés. Les usages temporels
utiles sont centralisés derrière un adaptateur afin de ne pas disperser les
conversions dans les services.

Moment.js et `moment-timezone` ne sont pas ajoutés. Chaque application qui
manipule des dates utilise Luxon derrière son propre adaptateur temporel.

Les règles complètes sont définies dans
[`AVAILABILITY_AND_TIMEZONES.md`](AVAILABILITY_AND_TIMEZONES.md) et
[`DEV_RULES.md`](DEV_RULES.md#10-dates-et-fuseaux-avec-luxon).

## 9. Observabilité

Le starter implémente déjà :

- `GET /health` ;
- `GET /metrics` ;
- les métriques système Prometheus ;
- un compteur HTTP ;
- un histogramme de durée des requêtes.

Ces fonctions sont utiles pour Docker et la démonstration. Elles sont
conservées, avec des noms de routes normalisés et sans labels contenant de
données personnelles ou de forte cardinalité.

Le clone n'intègre aucun logger externe fiable. Un petit adaptateur central
produit des journaux structurés sur la sortie standard. Les appels directs à
`console` restent confinés à cet adaptateur.

## 10. Modules retirés

Les fonctions génériques suivantes ne servent aucun parcours retenu :

- Redis, ioredis et BullMQ ;
- AWS S3 ;
- Google OAuth ;
- JWT, jose, jsonwebtoken et génération de clés RSA ;
- bcrypt ;
- Axios côté serveur et UUID si `crypto` suffit ;
- `body-parser`, remplacé par `express.json()` ;
- Jest et sa configuration résiduelle ;
- les contrôleurs, routes et services d'exemple sans usage.

Le retrait concerne la fonctionnalité générique, pas systématiquement toute sa
structure. Par exemple, les champs utiles de `RefreshToken` (`userId`, jeton,
expiration et création) inspirent le modèle `Session`, mais aucun refresh token
JWT n'est conservé. Le modèle `ForgotPasswordRequest` n'est pas nécessaire au
parcours de récupération de la démonstration.

Le `package-lock.json` est également retiré. Le paquet backend conserve son
seul `bun.lock`, régénéré après le nettoyage des dépendances.

## 11. Frontend

Le dossier `03_Front-End/` contiendra :

- Vue 3 avec TypeScript et Vite ;
- Vue Router ;
- Pinia pour la session et les notifications partagées ;
- Bootstrap 5.3 ;
- Vue I18n en Composition API ;
- Luxon derrière un adaptateur ;
- un client HTTP commun avec cookies activés.

Le backend reste l'autorité pour les disponibilités, conflits, permissions et
transactions. Le détail des interfaces appartient à
[`SCREENS.md`](SCREENS.md).

## 12. Persistance et migrations

Le schéma actuel est une base partielle, pas le modèle final :

- `User`, sa clé entière, son adresse, son mot de passe, son rôle et sa date de
  création sont conservés puis adaptés ;
- `name` est séparé en prénom et nom conformément aux écrans ;
- les champs marketing, Google et connexion générique sont retirés ;
- le modèle nommé `RefreshToken` est retiré ; ses champs utiles inspirent une
  session opaque sans JWT ;
- `ForgotPasswordRequest` est retiré ;
- les profils et agrégats métier sont ajoutés autour de `User`.

Le modèle cible, les contraintes SQL, les suppressions et les migrations sont
définis uniquement dans [`DATA_MODEL.md`](DATA_MODEL.md).

Le schéma cible utilise le mode multi-fichier de Prisma 7 sous `prisma/` afin
de séparer comptes, calendriers, rendez-vous et notifications tout en
respectant la limite de 100 lignes par fichier maintenu.

L'image `04_Script` applique `prisma migrate deploy`. Le backend ne lance pas
simultanément les migrations lors de son propre démarrage.

## 13. État initial à corriger pendant l'implémentation

Le clone brut est une base de travail, pas un code déjà conforme :

- aucun endpoint métier n'est implémenté ;
- aucune migration n'est présente ;
- le modèle `User` n'est pas encore adapté et les modèles métier manquent ;
- le seul test vise une route `/` inexistante ;
- plusieurs fichiers dépassent 100 lignes ou 80 caractères par ligne ;
- le code contient des `any`, `@ts-ignore`, imports CommonJS et logs directs ;
- le Dockerfile copie `bun.lockb*` alors que le clone contient `bun.lock` ;
- le port Docker annoncé ne correspond pas toujours au port 3000 ;
- `.env.exemple`, `src/env.d.ts` et `exemple.docker-compose.yml` décrivent
  encore JWT, RSA, AWS ou Redis et sont remplacés par le contrat
  d'environnement et le Compose racine ;
- `scripts/generateAuthKeys.sh` devient inutile avec le retrait de JWT/RSA ;
- l'historique du starter contient encore des guides et exemples obsolètes,
  désormais remplacés par les `README.md` et `CLAUDE.md` locaux.

Ces constats servent de liste d'adaptation. Ils ne créent aucune exception aux
règles de [`DEV_RULES.md`](DEV_RULES.md).

## 14. Sources locales

- clone : `../../02_Back-End/ExpressStarterDCT/` ;
- README du clone : `../../02_Back-End/ExpressStarterDCT/README.md` ;
- instructions IA : `../../02_Back-End/ExpressStarterDCT/CLAUDE.md` ;
- paquet réel : `../../02_Back-End/ExpressStarterDCT/package.json` ;
- schéma initial :
  `../../02_Back-End/ExpressStarterDCT/prisma/schema.prisma`.

Les fichiers réels du clone ont priorité sur ses explications historiques
lorsqu'ils se contredisent. Les décisions du projet restent toutefois
prioritaires sur les deux.
