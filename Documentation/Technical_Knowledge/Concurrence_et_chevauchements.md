# Concurrence et chevauchements

## Le problème

Deux clients peuvent lire le même créneau disponible puis tenter de le réserver presque simultanément. Une vérification applicative suivie d'un `INSERT` ne suffit pas : les deux requêtes peuvent réussir entre la lecture et l'écriture.

## Minimum à connaître

- Une transaction regroupe plusieurs opérations de façon atomique.
- Le niveau d'isolation détermine ce que deux transactions concurrentes peuvent observer.
- Une contrainte de base de données constitue la dernière ligne de défense, quel que soit le nombre d'instances du backend.
- PostgreSQL possède des types d'intervalles comme `tstzrange` et l'opérateur de chevauchement `&&`.
- Une contrainte `EXCLUDE USING gist` peut interdire deux intervalles qui se chevauchent pour le même professionnel.
- L'extension `btree_gist` permet de combiner l'égalité sur l'identifiant du professionnel avec le chevauchement d'un intervalle.
- Les intervalles `[début, fin)` autorisent un rendez-vous commençant exactement à la fin du précédent.
- Une violation de contrainte doit être convertie en réponse métier claire, généralement HTTP `409 Conflict`.

## Stratégie recommandée pour ce projet

1. Valider la disponibilité du professionnel dans le service métier.
2. Créer le rendez-vous dans une transaction.
3. Laisser PostgreSQL refuser tout chevauchement concurrent au moyen d'une contrainte.
4. Retourner une erreur de conflit compréhensible au client.
5. Écrire un test lançant deux tentatives de réservation concurrentes sur le même créneau.

## Documentation officielle

- [PostgreSQL — types range](https://www.postgresql.org/docs/current/rangetypes.html)
- [PostgreSQL — contraintes d'exclusion](https://www.postgresql.org/docs/current/ddl-constraints.html#DDL-CONSTRAINTS-EXCLUSION)
- [Extension btree_gist](https://www.postgresql.org/docs/current/btree-gist.html)
- [Transactions Prisma](https://www.prisma.io/docs/orm/prisma-client/queries/transactions)
