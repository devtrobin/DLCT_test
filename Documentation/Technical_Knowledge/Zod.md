# Zod

## À quoi cela sert

Zod décrit et valide des données inconnues à l'exécution tout en permettant
à TypeScript d'en déduire un type. Le starter utilise Zod pour protéger les
entrées de l'API.

## Minimum à connaître

- Construire un schéma avec `z.object`, `z.string`, `z.number` et les autres
  types utiles.
- Utiliser `parse` lorsque l'échec doit lever une `ZodError`.
- Utiliser `safeParse` pour obtenir un résultat discriminé sans `try/catch`.
- Réutiliser la valeur validée retournée par Zod, notamment après une
  transformation ou l'application d'une valeur par défaut.
- Déduire un type avec `z.infer<typeof schema>` lorsque cela évite une
  duplication sans masquer le domaine.
- Convertir les erreurs de validation en une réponse HTTP `400` stable.

## Pour ce projet

Les schémas du backend valident les corps, paramètres de chemin, query strings,
en-têtes et variables d'environnement. Le middleware transmet uniquement les
données parsées aux contrôleurs.

Zod valide la forme d'une entrée. Les règles métier, les autorisations et les
contraintes concurrentes restent dans les services et PostgreSQL.

## Documentation officielle

- [Documentation Zod](https://zod.dev/)
- [Utilisation de base](https://zod.dev/basics)
- [API des schémas](https://zod.dev/api)
