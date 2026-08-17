# Redis

## À quoi cela sert

Redis est un serveur de structures de données en mémoire. Il est souvent utilisé comme cache, stockage de sessions, compteur, mécanisme de limitation de débit ou support de files et d'événements.

## Minimum à connaître

- Une clé Redis possède une valeur et peut avoir une durée de vie avec `TTL`.
- Les types principaux sont les chaînes, hashes, listes, ensembles, ensembles triés et streams.
- Les données en cache peuvent être absentes ou périmées : PostgreSQL doit rester la source de vérité pour les rendez-vous.
- Une invalidation incorrecte du cache peut afficher des disponibilités obsolètes.
- Redis ne doit pas être utilisé comme unique protection contre les doubles réservations lorsque PostgreSQL peut garantir l'invariant.

## Pour ce projet

Redis n'est pas demandé. Ne l'ajouter que si un besoin mesuré apparaît, par exemple pour mettre en cache des recherches coûteuses, puis invalider ce cache après chaque réservation ou modification de disponibilité.

## Documentation officielle

- [Documentation Redis](https://redis.io/docs/latest/)
- [Types de données](https://redis.io/docs/latest/develop/data-types/)
- [Expiration des clés](https://redis.io/docs/latest/commands/expire/)
