# Tests Vue

## Outils principaux

- **Vitest** exécute les tests unitaires dans un projet fondé sur Vite.
- **Vue Test Utils** monte un composant Vue et permet d'interagir avec son rendu.

## Minimum à connaître

- Structurer les tests en préparation, action et vérification.
- Tester les entrées et sorties observables plutôt que les détails internes du composant.
- Monter un composant avec `mount()`.
- Trouver un élément stable, idéalement à l'aide d'un attribut `data-test`.
- Simuler une saisie avec `setValue()` et une action avec `trigger()`.
- Attendre les mises à jour asynchrones avec `await`.
- Simuler les réponses de l'API sans appeler le véritable backend dans les tests unitaires.

## Pour ce projet

Les tests frontend les plus utiles couvrent l'affichage des créneaux, le choix du fuseau, les états de chargement et d'erreur, la réservation et l'annulation. Les règles métier critiques doivent surtout être testées dans le backend et la base.

## Documentation officielle

- [Recommandations de test de Vue.js](https://vuejs.org/guide/scaling-up/testing.html)
- [Vue Test Utils pour Vue 3](https://test-utils.vuejs.org/)
- [Prise en main de Vue Test Utils](https://test-utils.vuejs.org/guide/essentials/a-crash-course.html)
- [Guide Vitest](https://vitest.dev/guide/)
