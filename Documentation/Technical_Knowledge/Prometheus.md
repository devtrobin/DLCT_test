# Prometheus et prom-client

## À quoi cela sert

Prometheus collecte des séries temporelles exposées par une application.
`prom-client`, déjà présent dans le starter, produit les métriques du backend
au format attendu par Prometheus.

## Minimum à connaître

- Un compteur mesure un total croissant, par exemple le nombre de requêtes.
- Une jauge représente une valeur qui peut augmenter ou diminuer.
- Un histogramme répartit des observations, comme une durée, dans des classes.
- Un registre regroupe les métriques exposées par `GET /metrics`.
- Les noms utilisent une unité de base et un suffixe explicite, comme
  `_seconds` ou `_total`.
- Une valeur non bornée telle qu'un identifiant, une adresse ou une URL brute
  ne doit jamais devenir un label.

## Pour ce projet

Le backend de `02_Back-End/ExpressStarterDCT` conserve un registre unique, les
métriques de processus, un compteur HTTP et un histogramme de durée. Les
routes `/health` et `/metrics` sont exclues de la mesure HTTP.

Les labels restent bornés : méthode, route normalisée et statut. Ils ne
contiennent ni donnée personnelle, ni code public, ni valeur de paramètre.
L'observabilité ne remplace pas les tests ou les journaux applicatifs.

## Documentation officielle

- [prom-client](https://github.com/siimon/prom-client)
- [Types de métriques](https://prometheus.io/docs/concepts/metric_types/)
- [Nommage des métriques](https://prometheus.io/docs/practices/naming/)
