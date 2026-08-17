# Luxon

## À quoi cela sert

Luxon manipule les dates, les durées et les fuseaux horaires IANA en utilisant
l'API internationale `Intl` de la plateforme JavaScript.

## Minimum à connaître

- `DateTime.fromISO` lit un instant ISO 8601.
- `DateTime.fromFormat` lit un format local contrôlé.
- `isValid` doit être vérifié après tout parsing externe.
- `toUTC()` produit une représentation UTC.
- `setZone(zone)` convertit l'affichage sans modifier l'instant.
- `IANAZone.isValidZone(zone)` valide un identifiant IANA.
- Les objets `DateTime` sont immuables : chaque opération retourne une
  nouvelle valeur.
- Les heures inexistantes ou répétées lors des changements saisonniers doivent
  faire l'objet de tests dédiés.

## Pour ce projet

Luxon et `@types/luxon` sont déjà présents dans
`02_Back-End/ExpressStarterDCT`. Ils sont conservés.

Le backend et le frontend possèdent chacun un adaptateur temporel typé. En
dehors de ces adaptateurs, les fichiers n'importent pas directement Luxon. Les
instants transitent en ISO 8601 UTC et les règles hebdomadaires conservent le
fuseau IANA du professionnel.

Moment.js et `moment-timezone` ne sont pas ajoutés, afin de ne pas maintenir
deux bibliothèques remplissant la même fonction.

## Documentation officielle

- [Documentation Luxon](https://moment.github.io/luxon/)
- [API Luxon](https://moment.github.io/luxon/api-docs/index.html)
- [Zones et changements d'heure](https://moment.github.io/luxon/#/zones)
