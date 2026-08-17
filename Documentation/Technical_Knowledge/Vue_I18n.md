# Vue I18n

## À quoi cela sert

Vue I18n centralise les textes d'interface et permet de les traduire sans
modifier les composants.

## Minimum à connaître

- Installer `vue-i18n` dans le paquet `03_Front-End`.
- Créer l'instance avec `legacy: false` pour la Composition API.
- Définir le français comme locale active et langue de repli.
- Appeler `useI18n` au début de `<script setup>`.
- Utiliser des clés contextualisées comme `appointments.cancel.confirm`.
- Employer l'interpolation et la pluralisation au lieu de concaténer.
- Traduire les labels, erreurs, confirmations et attributs ARIA.

## Pour ce projet

Les traductions françaises sont séparées par domaine dans
`03_Front-End/src/i18n/fr`. Le backend retourne des codes et des données
structurées ; le frontend choisit le texte affiché. Les valeurs saisies par
les utilisateurs ne sont jamais traduites.

## Documentation officielle

- [Démarrage Vue I18n](https://vue-i18n.intlify.dev/guide/essentials/started)
- [Composition API](https://vue-i18n.intlify.dev/guide/advanced/composition)
- [Pluralisation](https://vue-i18n.intlify.dev/guide/essentials/pluralization)
