# Bun

## À quoi cela sert

Bun est une boîte à outils JavaScript/TypeScript comprenant un runtime, un gestionnaire de paquets, un exécuteur de tests et un bundler. Il vise une compatibilité importante avec l'écosystème Node.js, sans qu'elle soit totale.

## Minimum à connaître

- `bun install` installe les dépendances.
- `bun run <script>` exécute un script de `package.json`.
- `bunx` joue un rôle proche de `npx`.
- `bun test` exécute les tests avec une API proche de Jest.
- Bun utilise JavaScriptCore, alors que Node.js utilise V8 ; certaines différences de compatibilité restent possibles.

## Pour ce projet

Le backend situé dans `02_Back-End/ExpressStarterDCT` utilise Bun pour
l'exécution, l'installation et les tests. Le projet conserve le commit du
starter dans sa documentation et ne le porte pas vers Node.js.

Le frontend de `03_Front-End` et les scripts TypeScript de `04_Script`
utilisent également Bun lorsqu'un runtime ou un gestionnaire de paquets est
nécessaire. `01_DB` reste une image PostgreSQL et n'exécute pas Bun.

Les commandes sont lancées depuis le paquet concerné ou par les services du
fichier Compose racine. Aucun paquet ou workspace Bun racine n'est nécessaire.
Un lockfile npm ne doit pas coexister avec le `bun.lock` du même paquet.

## Documentation officielle

- [Documentation Bun](https://bun.sh/docs)
- [Runtime Bun](https://bun.sh/docs/runtime)
- [Tests avec Bun](https://bun.sh/docs/test)
- [Workspaces Bun](https://bun.sh/docs/pm/workspaces)
- [Lockfile Bun](https://bun.sh/docs/pm/lockfile)
- [Compatibilité avec Node.js](https://bun.sh/docs/runtime/nodejs-apis)
