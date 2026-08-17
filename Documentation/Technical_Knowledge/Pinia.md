# Pinia

## À quoi cela sert

Pinia est la bibliothèque officielle couramment utilisée pour gérer l'état global d'une application Vue. Un store contient un état, des valeurs dérivées et des actions.

## Minimum à connaître

- `state` contient les données partagées.
- Les `getters` correspondent à des valeurs calculées.
- Les `actions` regroupent les opérations qui modifient l'état ou appellent une API.
- Un store ne doit être créé que pour un état réellement partagé entre plusieurs composants ou pages.
- Un état local simple doit rester dans le composant ou dans un composable Vue.

## Pour ce projet

Pinia est retenu uniquement pour la session et les notifications partagées
entre plusieurs écrans. Les formulaires, filtres et autres états propres à un
écran restent dans le composant ou dans un composable.

## Documentation officielle

- [Introduction à Pinia](https://pinia.vuejs.org/introduction.html)
- [Démarrage](https://pinia.vuejs.org/getting-started.html)
- [Concepts fondamentaux](https://pinia.vuejs.org/core-concepts/)
