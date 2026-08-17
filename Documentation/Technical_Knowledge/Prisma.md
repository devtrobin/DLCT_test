# Prisma ORM

## À quoi cela sert

Prisma est l'ORM imposé entre le backend TypeScript et PostgreSQL. Le starter
utilise Prisma 7 avec l'adaptateur `@prisma/adapter-pg` et un client généré.
Il ne fournit encore aucune migration versionnée : la migration initiale du
modèle métier devra être créée avant le premier déploiement.

## Minimum à connaître

- Définir les modèles, relations, index et contraintes simples dans les
  fichiers de schéma `.prisma`.
- Générer Prisma Client après une modification du schéma.
- Utiliser le client pour `findMany`, `findUnique`, `create`, `update` et `delete`.
- Éviter de créer une nouvelle instance de Prisma Client à chaque requête.
- Utiliser `$transaction()` lorsque plusieurs opérations doivent réussir ou échouer ensemble.
- Comprendre que Prisma ne remplace pas toutes les capacités de PostgreSQL : une migration SQL personnalisée peut être nécessaire pour une contrainte d'exclusion.
- Avec Prisma 7, fournir une `DATABASE_URL` à `prisma.config.ts`.
- Pour une migration et au runtime, utiliser l'URL réelle de l'environnement
  lors de la création de `PrismaPg`.
- Configurer explicitement le dossier de sortie du générateur
  `prisma-client`.
- Utiliser le schéma multi-fichier de Prisma 7 pour séparer les domaines sans
  dupliquer les modèles.

## Pour ce projet

Le schéma métier et les migrations canoniques restent dans
`02_Back-End/ExpressStarterDCT/prisma`. `schema.prisma` contient la
configuration commune et `models/*.prisma` sépare les domaines. Le
`prisma.config.ts` vise le dossier `prisma` et conserve les migrations à côté
du fichier principal.

Le schéma d'authentification fourni est une base à adapter : `User`, sa clé et
ses champs communs compatibles sont conservés. Les profils, sessions,
disponibilités et rendez-vous sont ajoutés. Les modèles JWT, Google et reset par
jeton sont retirés puisqu'ils ne servent aucun parcours. `01_DB` contient
uniquement la construction de l'image PostgreSQL et ne duplique pas le schéma
applicatif.

L'image `04_Script` copie le schéma et les migrations du paquet backend,
applique `prisma migrate deploy`, puis s'arrête avec succès. Le backend
démarre ensuite et utilise un singleton Prisma configuré avec `PrismaPg`. Un
seed reste une commande explicite et n'est pas exécuté automatiquement à
chaque démarrage.

La génération du client pendant le build exige aussi que la variable existe,
mais n'ouvre aucune connexion. Elle utilise donc une URL factice sans secret,
limitée à cette instruction. Compose injecte l'URL réelle seulement aux
commandes et processus qui accèdent à PostgreSQL.

## Commandes essentielles

```sh
bunx prisma generate
bunx prisma migrate dev --name nom_de_la_migration
bunx prisma migrate deploy
bunx prisma studio
```

`migrate dev` sert au développement. `migrate deploy` applique les migrations déjà créées dans un environnement de déploiement ou au démarrage du conteneur.

## Documentation officielle

- [Présentation de Prisma ORM](https://www.prisma.io/docs/orm)
- [Modélisation des données](https://www.prisma.io/docs/orm/core-concepts/data-modeling)
- [Prisma Migrate](https://www.prisma.io/docs/orm/prisma-migrate)
- [Schéma Prisma multi-fichier](https://www.prisma.io/docs/orm/prisma-schema/overview/location)
- [Transactions Prisma](https://www.prisma.io/docs/orm/prisma-client/queries/transactions)
- [Adaptateurs de pilotes](https://www.prisma.io/docs/orm/core-concepts/supported-databases/database-drivers)
- [Connecteur PostgreSQL](https://www.prisma.io/docs/orm/core-concepts/supported-databases/postgresql)
