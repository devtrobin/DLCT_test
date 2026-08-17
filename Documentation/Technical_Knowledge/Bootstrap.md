# Bootstrap

## À quoi cela sert

Bootstrap fournit une grille responsive, des composants d'interface et des
classes utilitaires. Le projet utilise la branche 5.3, sans jQuery.

## Minimum à connaître

- Installer `bootstrap` dans le paquet `03_Front-End` avec Bun.
- Importer le CSS une seule fois au point d'entrée de l'application.
- Construire la mise en page avec `container`, `row` et les colonnes `col-*`.
- Utiliser les utilitaires d'espacement, affichage et flex avant du CSS maison.
- Piloter l'état des modales et menus avec Vue.
- Conserver labels, focus clavier et noms accessibles des composants.
- Personnaliser le thème dans les styles globaux.

## Pour ce projet

Bootstrap est utilisé uniquement dans l'image frontend. Il ne doit pas devenir
une dépendance du backend ou de l'image de scripts.

Les styles propres à un composant sont placés dans un fichier CSS voisin et
utilisent un préfixe métier. Tailwind, BootstrapVue, jQuery, les styles inline
et les blocs `<style>` des composants Vue ne sont pas utilisés.

## Documentation officielle

- [Démarrage avec Bootstrap](https://getbootstrap.com/docs/5.3/getting-started/introduction/)
- [Grille Bootstrap](https://getbootstrap.com/docs/5.3/layout/grid/)
- [Composants Bootstrap](https://getbootstrap.com/docs/5.3/components/)
- [Accessibilité](https://getbootstrap.com/docs/5.3/getting-started/accessibility/)
