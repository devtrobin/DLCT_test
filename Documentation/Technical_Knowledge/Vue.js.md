# Vue.js et Vite

## À quoi cela sert

Vue.js est le framework frontend imposé par le test. Une application Vue est composée de composants `.vue` réunissant généralement un template HTML, une logique TypeScript et des styles. Vite fournit le serveur de développement et la compilation du projet.

## Minimum à connaître

- Utiliser Vue 3 avec la **Composition API** et `<script setup lang="ts">`.
- Déclarer un état local avec `ref()` ou `reactive()`.
- Produire une valeur dérivée avec `computed()` et réagir à un changement avec `watch()`.
- Passer des données avec les props et remonter des événements avec `defineEmits()`.
- Afficher des listes avec `v-for`, des conditions avec `v-if` et lier un formulaire avec `v-model`.
- Appeler le backend avec `fetch`, puis gérer chargement, succès et erreur.
- Ne pas placer toute la logique métier dans les composants : isoler les appels API et les fonctions réutilisables.
- Lancer un contrôle TypeScript avec `vue-tsc`, car Vite transpile TypeScript sans nécessairement vérifier tous les types.

## Pour ce projet

Prévoir au minimum des écrans ou composants pour gérer les disponibilités, déclarer les indisponibilités, rechercher des créneaux et réserver ou annuler un rendez-vous.

## Documentation officielle

- [Guide Vue.js](https://vuejs.org/guide/introduction.html)
- [Vue avec TypeScript](https://vuejs.org/guide/typescript/overview)
- [Composition API avec TypeScript](https://vuejs.org/guide/typescript/composition-api)
- [Création d'un projet Vue](https://vuejs.org/guide/quick-start.html)
