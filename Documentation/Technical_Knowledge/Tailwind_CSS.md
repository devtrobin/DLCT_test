# Tailwind CSS

## À quoi cela sert

Tailwind est un framework CSS fondé sur des classes utilitaires telles que `flex`, `p-4` ou `text-sm`. Il génère au moment de la compilation le CSS correspondant aux classes présentes dans les fichiers du projet.

## Minimum à connaître

- Composer l'apparence directement dans les attributs `class`.
- Utiliser les variantes responsives comme `sm:` et `md:`.
- Utiliser les variantes d'état comme `hover:`, `focus:` et `disabled:`.
- Conserver des composants Vue pour les motifs répétés au lieu de copier de longues séries de classes.
- Définir les couleurs et autres design tokens dans le thème lorsque le projet possède une identité visuelle.

## Pour ce projet

Tailwind n'est pas utilisé. Bootstrap 5.3 fournit le système de grille, les
composants et les utilitaires afin d'éviter deux frameworks CSS concurrents.
Cette fiche reste utile uniquement pour comprendre la stack de l'annonce.

## Documentation officielle

- [Installation avec Vite](https://tailwindcss.com/docs/installation/using-vite)
- [Classes utilitaires et états](https://tailwindcss.com/docs/hover-focus-and-other-states)
- [Variables de thème](https://tailwindcss.com/docs/theme)
