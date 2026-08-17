# Règles de développement

> Statut : règles obligatoires pour toute contribution  
> Dernière mise à jour : 17 août 2026  
> Navigation : [`SUMMARY.md`](SUMMARY.md)

## 1. Objet et portée

Ce document définit les règles de codage du backend, du frontend, des tests,
des scripts, des migrations et des fichiers de configuration maintenus par
l'équipe.

Les règles métier restent prioritaires et appartiennent aux spécifications
thématiques. La conception générale appartient à
[`TECHNICAL_DESIGN.md`](TECHNICAL_DESIGN.md), et le découpage des cas
d'utilisation backend à [`BACKEND_MODULES.md`](BACKEND_MODULES.md).

Les documents de ce dossier décrivent la cible du projet. Ils priment sur le
code et les conventions historiques du starter. Le `README.md` et le
`CLAUDE.md` locaux du backend ont été adaptés pour rappeler cette priorité.

En cas de contradiction, l'ordre suivant s'applique :

1. exigence explicite du sujet ou demande actuelle de l'utilisateur ;
2. spécifications métier du dossier `Documentation/Project` ;
3. conception technique, contrat API et modèle de données ;
4. présentes règles de développement ;
5. documentation du starter et préférences personnelles.

Une contradiction doit être corrigée dans la documentation avant de coder.

## 2. Technologies retenues

### 2.1 Outils utilisés

- **TypeScript** pour tout le code applicatif.
- **Bun** comme environnement, gestionnaire de paquets et moteur de test.
- **Express.js 5** à partir d'une révision figée de `ExpressStarterDCT`.
- **Zod** pour valider les données externes du backend.
- **Vue.js 3** avec TypeScript et Vite.
- **Vue Router** pour le routage du frontend.
- **Pinia** uniquement pour les états réellement partagés.
- **Bootstrap** pour la grille, les composants et les utilitaires visuels.
- **Vue I18n** pour tout texte destiné à l'utilisateur.
- **Luxon** pour les dates et fuseaux.
- **PostgreSQL** pour la persistance et les contraintes d'intégrité.
- **Prisma 7** et `@prisma/adapter-pg` pour l'accès aux données.
- **prom-client** pour les métriques Prometheus du backend.
- **Helmet**, **CORS**, **compression** et **cookie-parser** pour le pipeline
  HTTP du backend.
- **Docker** et **Docker Compose** pour l'environnement reproductible.
- **Git** pour l'historique du projet.
- **GitHub Actions** pour l'intégration continue.
- **Codex**, **Cursor** et **GitHub Copilot** lorsque leur aide est utile.

### 2.2 Outils volontairement écartés

- **Bun** reste l'unique runtime du backend ; aucun port Node.js n'est prévu.
- **Moment.js** et `moment-timezone` ne sont pas ajoutés : Luxon fournit déjà
  la capacité temporelle requise dans le starter.
- **Tailwind CSS** n'est pas utilisé : Bootstrap est le système de style.
- **MySQL** n'est pas utilisé : PostgreSQL est imposé par le sujet.
- **Redis** et **BullMQ** ne sont pas nécessaires à la démo.
- **Ionic** et **Capacitor** sont hors périmètre, sans application mobile.

Une dépendance supplémentaire exige un besoin concret et documenté. Elle ne
doit pas dupliquer une capacité déjà fournie par la stack retenue.

### 2.3 Adaptation du starter

**START-001 — Obligatoire.** Le starter se trouve dans
`02_Back-End/ExpressStarterDCT`. Sa provenance est le commit
`07d6fc6dd274bdf11506ccc6a5aaf3649dffcc7f` du dépôt officiel. Une
évolution ultérieure du dépôt source ne modifie pas silencieusement la base.

**START-002 — Obligatoire.** Bun, Express 5, TypeScript ESM strict,
Prisma 7, `@prisma/adapter-pg`, Zod, les middlewares HTTP et `prom-client`
sont conservés, car ils sont utiles au projet.

**START-003 — Obligatoire.** Luxon et ses types sont conservés. Les imports
directs sont regroupés dans les adaptateurs Luxon définis dans la section 10.
Moment.js et `moment-timezone` ne sont pas installés.

**START-004 — Obligatoire.** Les modules du starter sans usage dans la démo
sont retirés. Cela concerne Redis, BullMQ, JWT, JOSE, bcrypt, OAuth Google,
AWS S3, `body-parser`, Axios et les exemples associés. La configuration Jest
et `package-lock.json` sont aussi retirés, puisque Bun est utilisé.

**START-005 — Obligatoire.** Le format ESM et les conventions d'import du
starter sont conservés. Un changement demande une justification dans
[`DECISIONS.md`](DECISIONS.md).

**START-006 — Obligatoire.** Le backend et le frontend sont des paquets Bun
indépendants. Chaque paquet possède au plus un `package.json` et un
`bun.lock`. L'image scripts réutilise le paquet Prisma du backend au lieu de
dupliquer ses dépendances. Aucun workspace racine ni lockfile global n'est
supposé. `01_DB` ne contient aucun paquet JavaScript.

**START-007 — Obligatoire.** Le clone brut n'est pas considéré conforme aux
présentes règles. Tout fichier conservé dans le livrable est simplifié,
découpé et testé avant d'être déclaré terminé.

**START-008 — Obligatoire.** Une structure fournie est réutilisée lorsqu'elle
est compatible avec le métier. Le modèle `User` est donc adapté et enrichi.
Les champs, modèles, routes et dépendances liés uniquement à Google, JWT,
marketing ou reset par jeton sont retirés au lieu d'étendre le périmètre.

**START-009 — Obligatoire.** Un élément hors périmètre nécessaire à une étape
de transition reste isolé, sans endpoint cible ni nouvel appel. Il est supprimé
avant de déclarer le module terminé et n'est jamais présenté comme une fonction
du produit.

## 3. Taille et lisibilité

**GEN-001 — Obligatoire.** Un fichier maintenu de source, test, style,
configuration, schéma ou traduction ne dépasse jamais **100 lignes physiques**
après formatage. Une migration modifiée manuellement suit la même règle.

**GEN-002 — Obligatoire.** Les imports, commentaires et lignes vides sont
comptés dans les 100 lignes. Cette mesure empêche de masquer un fichier trop
complexe derrière son formatage.

**GEN-003 — Obligatoire.** Dans un fichier soumis à GEN-001, une ligne ne
dépasse jamais **80 caractères**.

**GEN-004 — Obligatoire.** Il est interdit de contourner ces limites en
compressant plusieurs instructions sur une ligne ou en retirant les espaces
qui rendent le code lisible.

**GEN-005 — Obligatoire.** Un fichier possède une seule responsabilité. Il
est découpé avant d'atteindre sa limite, pas après l'avoir dépassée.

**GEN-006 — Recommandé.** Une fonction vise 20 lignes au maximum. Un
dépassement doit rester plus lisible qu'un découpage artificiel.

**GEN-007 — Recommandé.** Au-delà de trois paramètres, préférer un objet
typé portant un nom métier lorsque cela clarifie l'appel.

**GEN-008 — Recommandé.** Viser deux niveaux d'imbrication au maximum. Les
retours anticipés traitent les erreurs et cas limites en premier.

**GEN-009 — Obligatoire.** Les ternaires imbriqués, les doubles négations et
les expressions volontairement compactes sont interdits.

**GEN-010 — Obligatoire.** Un junior doit comprendre le rôle d'un fichier,
d'une fonction et d'une variable sans devoir reconstruire leur intention.

**GEN-011 — Obligatoire.** Les noms sont complets et décrivent le métier.
Les abréviations sont limitées aux termes usuels comme `id`, `api`, `http`,
`utc` et `dto`.

**GEN-012 — Obligatoire.** Les commentaires expliquent une raison ou une
contrainte surprenante. Ils ne paraphrasent jamais une instruction évidente.

**GEN-013 — Obligatoire.** Le code mort, laissé en commentaire ou inutilisé
est supprimé. Toute duplication significative de logique est aussi retirée.

**GEN-014 — Obligatoire.** Les sources maintenues provenant du starter sont
adaptées aux limites dès qu'elles font partie du projet livré.

**GEN-015 — Obligatoire.** Les fichiers Markdown, courriels sources et
documents binaires ne sont pas des fichiers de code et ne sont pas soumis
aux limites de cette section.

**GEN-016 — Obligatoire.** Les artefacts entièrement générés ne sont pas
soumis aux limites. Cela inclut les lockfiles, le client Prisma, les builds et
les migrations SQL produites automatiquement par Prisma.

**GEN-017 — Obligatoire.** Le schéma Prisma, les configurations et toute
migration SQL modifiée manuellement restent soumis aux limites.

**GEN-018 — Exception Prisma.** Une déclaration `@relation` ou `@@unique`
peut dépasser 80 caractères lorsque Prisma refuse syntaxiquement de répartir
ses arguments sur plusieurs lignes. Cette exception ne s'applique qu'à cette
déclaration, jamais au code TypeScript ni aux autres règles du schéma. Les noms
restent explicites : ils ne sont pas raccourcis artificiellement pour contourner
la limite.

## 4. Nommage et organisation des fichiers

**ORG-001 — Obligatoire.** Les dossiers et fichiers TypeScript ordinaires
utilisent `kebab-case`. Les composables constituent l'exception définie par
ORG-003.

**ORG-002 — Obligatoire.** Les composants et vues Vue utilisent
`PascalCase.vue`.

**ORG-003 — Obligatoire.** Les composables commencent par `use`, par exemple
`useAppointmentForm.ts`.

**ORG-004 — Obligatoire.** Les tests portent le suffixe `.spec.ts`. Le test
d'un composant conserve son nom de base, comme `AppointmentCard.spec.ts`.

**ORG-005 — Obligatoire.** Le rôle d'un fichier est visible dans son nom :

- `*.controller.ts` pour l'adaptation HTTP ;
- `*.service.ts` pour les cas d'utilisation du backend ;
- `*.api.ts` pour l'accès HTTP du frontend ;
- `*.adapter.ts` pour isoler une bibliothèque externe ;
- `*.repository.ts` pour la persistance ;
- `*.schema.ts` pour la validation ;
- `*.routes.ts` pour les routes Express ;
- `*.types.ts` pour les types partagés ;
- `*.mapper.ts` pour les transformations entre représentations ;
- `*.function.ts` pour une fonction pure nommée par son comportement.

**ORG-006 — Obligatoire.** Les fichiers `index.ts` ne masquent pas un graphe
de dépendances complexe. Un export direct est préféré lorsqu'il est plus
facile à suivre.

**ORG-007 — Obligatoire.** Le composant, son test et son style portent un
même nom de base et restent proches dans l'arborescence.

## 5. TypeScript

**TS-001 — Obligatoire.** TypeScript compile avec le mode `strict` activé.

**TS-002 — Obligatoire.** `any` est interdit. Une donnée inconnue utilise
`unknown`, puis une validation ou un garde de type.

**TS-003 — Obligatoire.** Les entrées et sorties des fonctions exportées,
services, contrôleurs et repositories sont typées explicitement.

**TS-004 — Obligatoire.** L'inférence reste autorisée pour les variables
locales dont le type est immédiatement évident.

**TS-005 — Obligatoire.** Les types métier utilisent des noms explicites.
Les génériques complexes et abstractions sans bénéfice direct sont évités.

**TS-006 — Obligatoire.** `const` est utilisé par défaut. Une mutation doit
être locale, courte et évidente.

**TS-007 — Obligatoire.** Une erreur capturée est traitée comme `unknown`.
Elle est transformée en erreur métier ou technique connue.

**TS-008 — Obligatoire.** `@ts-ignore` est interdit. Un `@ts-expect-error`
exceptionnel contient une justification et une référence de suivi.

**TS-009 — Obligatoire.** Les variables d'environnement sont validées une
fois au démarrage et exposées par une configuration typée.

**TS-010 — Recommandé.** Préférer les unions de chaînes lisibles aux
valeurs numériques ou aux constantes magiques.

## 6. Architecture backend

Une fonctionnalité backend utilise toujours route, contrôleur et service.
Les autres fichiers sont ajoutés uniquement lorsque leur rôle est utile :

```text
features/appointments/
├── appointment.routes.ts
├── appointment.controller.ts
├── appointment.schema.ts
├── appointment.service.ts
├── appointment.repository.ts
├── appointment.mapper.ts
├── appointment-conflict.function.ts
└── appointment.types.ts
```

**BACK-001 — Obligatoire.** Une route associe une URL, ses middlewares et un
contrôleur. Elle ne contient aucune règle métier.

**BACK-002 — Obligatoire.** Un contrôleur reçoit une entrée validée,
appelle un service et construit la réponse HTTP. Il reste mince.

**BACK-003 — Obligatoire.** Un service ne dépend pas de `Request` ou
`Response`. Il exprime un cas d'utilisation avec des types métier.

**BACK-004 — Obligatoire.** Les règles métier appartiennent aux services
ou à de petites fonctions métier pures.

**BACK-005 — Obligatoire.** L'accès Prisma est isolé dans les repositories.
Un contrôleur ne connaît jamais Prisma.

**BACK-006 — Obligatoire.** Zod valide les paramètres, requêtes, corps,
en-têtes et variables d'environnement avant leur usage.

**BACK-007 — Obligatoire.** Les erreurs métier ont un code stable. Un
middleware central les traduit en statut et réponse HTTP.

**BACK-008 — Obligatoire.** Une opération qui modifie plusieurs entités est
atomique et utilise une transaction au niveau du cas d'utilisation.

**BACK-009 — Obligatoire.** Le SQL brut reste limité aux migrations et aux
contraintes que Prisma ne sait pas représenter proprement.

**BACK-010 — Obligatoire.** L'heure courante provient d'un service d'horloge
injectable afin de rendre les tests déterministes.

**BACK-011 — Obligatoire.** Un adaptateur unique produit des journaux
structurés. Aucun `console.log` n'est appelé hors de cet adaptateur.

**BACK-012 — Obligatoire.** Express 5 transmet les erreurs des fonctions
asynchrones au middleware central. Un contrôleur n'ajoute pas de `try/catch`
qui transforme toutes les erreurs en réponse `400`.

**BACK-013 — Obligatoire.** Le résultat produit par Zod remplace l'entrée
brute. Une valeur nettoyée, transformée ou convertie ne doit pas être perdue.

**BACK-014 — Obligatoire.** Les erreurs attendues étendent une erreur
applicative typée inspirée de `AppError`. Le middleware central masque les
détails internes et conserve un code stable pour Vue I18n.

**BACK-015 — Obligatoire.** `/health` reste léger et utilisable par Docker.
`/metrics` expose les métriques `prom-client` sans donnée personnelle ni
secret.

**BACK-016 — Obligatoire.** Un repository appelé dans une transaction reçoit
le même `Prisma.TransactionClient`. Il n'ouvre ni transaction ni client
concurrent de sa propre initiative.

**BACK-017 — Obligatoire.** Une commande touchant plusieurs calendriers les
verrouille par identifiant professionnel croissant. Cet ordre unique évite les
interblocages entre suppression de compte et réservation.

**BACK-018 — Obligatoire.** Les autorisations utilisent les côtés métier
`CLIENT_SIDE` et `PROFESSIONAL_SIDE`, puis enregistrent séparément l'acteur réel
`CLIENT_USER`, `PUBLIC_CLIENT`, `PROFESSIONAL_USER` ou `SYSTEM`.

**BACK-019 — Obligatoire.** Seul `TransactionRunner` rejoue une transaction
`Serializable` annulée par `40001` ou `P2034`, avec trois tentatives totales.
Chaque essai réexécute les lectures et validations ; une erreur métier n'est
jamais rejouée.

**BACK-020 — Obligatoire.** La création d'une proposition verrouille le profil
professionnel, recharge le rendez-vous et insère dans une même transaction.
Elle n'incrémente pas `calendarVersion`, car elle ne réserve aucun créneau.

## 7. Architecture frontend

L'organisation de base sous `03_Front-End/src` est la suivante :

```text
src/
├── views/
├── components/
├── composables/
├── services/
├── functions/
├── stores/
├── types/
├── i18n/
└── styles/
```

`styles/` contient le thème et les styles globaux. Le CSS propre à un
composant est placé à côté de son fichier Vue.

**FRONT-001 — Obligatoire.** Les composants Vue utilisent
`<script setup lang="ts">`.

**FRONT-002 — Obligatoire.** Une vue orchestre un écran et assemble de petits
composants. Elle ne porte pas les calculs métier du backend.

**FRONT-003 — Obligatoire.** Un composant de présentation ne réalise aucun
appel HTTP direct.

**FRONT-004 — Obligatoire.** Les appels HTTP passent par des services typés
et un client commun responsable de la configuration et des erreurs techniques.

**FRONT-005 — Obligatoire.** Un composable encapsule uniquement un état Vue
réutilisable ou un cycle de vie partagé.

**FRONT-006 — Obligatoire.** Pinia est réservé aux données partagées entre
plusieurs écrans, notamment la session et le compteur de notifications.

**FRONT-007 — Obligatoire.** Un état propre à un seul écran reste local.

**FRONT-008 — Obligatoire.** `defineProps` et `defineEmits` sont typés. Une
prop n'est jamais modifiée directement.

**FRONT-009 — Obligatoire.** `computed` porte les valeurs dérivées. `watch`
est réservé aux effets de bord nécessaires.

**FRONT-010 — Obligatoire.** Une expression complexe quitte le template pour
une fonction ou une propriété calculée nommée.

**FRONT-011 — Obligatoire.** Chaque écran gère explicitement les états qui
peuvent s'y produire : chargement, vide, succès, validation, conflit ou erreur.

**FRONT-012 — Obligatoire.** Le frontend affiche les créneaux fournis par le
backend et ne recalcule jamais leur validité métier.

**FRONT-013 — Obligatoire.** Une transformation pure réutilisable appartient
à `functions/` et porte un nom métier. Les fichiers génériques `utils.ts` et
`helpers.ts` sont interdits. Un adaptateur vers une bibliothèque externe,
comme Luxon, reste dans `services/`.

**FRONT-014 — Obligatoire.** Vue Router déclare la navigation dans des
fichiers dédiés. Une garde reste courte et délègue les règles d'accès.

**FRONT-015 — Obligatoire.** Timers, écouteurs, abonnements et requêtes
actives sont nettoyés au démontage du composant ou du composable.

**FRONT-016 — Obligatoire.** `v-html` est interdit pour toute donnée externe
ou saisie par un utilisateur.

## 8. Bootstrap et styles

**CSS-001 — Obligatoire.** Bootstrap 5.3 est chargé une seule fois au point
d'entrée du frontend. Sa version exacte est figée dans le `bun.lock` du
paquet `03_Front-End`.

**CSS-002 — Obligatoire.** La grille, les composants et les utilitaires
Bootstrap sont utilisés avant d'écrire une règle CSS personnalisée.

**CSS-003 — Obligatoire.** Tailwind CSS et les styles en ligne sont interdits.

**CSS-004 — Obligatoire.** Les styles propres à un composant sont placés
dans un fichier CSS séparé. Les blocs `<style>` des fichiers Vue sont
interdits.

**CSS-005 — Obligatoire.** Les couleurs, espacements et ajustements globaux
sont centralisés dans un thème Bootstrap clairement nommé.

**CSS-006 — Obligatoire.** `!important` est interdit, sauf correctif externe
temporaire accompagné d'une justification.

**CSS-007 — Obligatoire.** Les sélecteurs internes de Bootstrap ne sont pas
surchargés directement. Une classe applicative explicite est utilisée.

**CSS-008 — Obligatoire.** Vue reste la source de vérité de l'état des
modales, menus et panneaux.

**CSS-009 — Obligatoire.** Toute intégration du JavaScript Bootstrap est
isolée dans un composant adaptateur qui nettoie son instance au démontage.

**CSS-010 — Obligatoire.** Une couleur n'est jamais le seul moyen de signaler
un état. Un texte ou une icône accessible l'accompagne.

**CSS-011 — Obligatoire.** jQuery, BootstrapVue et un second framework CSS ne
sont pas ajoutés sans décision d'architecture explicite.

**CSS-012 — Obligatoire.** Une classe CSS propre à un composant porte un nom
métier préfixé, par exemple `appointment-card__warning`, afin d'éviter les
collisions globales.

## 9. Internationalisation avec Vue I18n

**I18N-001 — Obligatoire.** Même si la démo est française, aucun texte
statique d'interface n'est écrit directement dans un template ou composant.
Les données métier saisies par les utilisateurs ne sont pas traduites.

**I18N-002 — Obligatoire.** Les traductions utilisent Vue I18n et sont
réparties par domaine dans `03_Front-End/src/i18n/fr/`.

**I18N-003 — Obligatoire.** Les clés décrivent leur contexte, par exemple
`appointments.cancel.confirm`.

**I18N-004 — Obligatoire.** Une phrase n'est jamais créée en concaténant
des traductions. Vue I18n gère l'interpolation et la pluralisation.

**I18N-005 — Obligatoire.** Les fichiers de traduction ne contiennent pas de
HTML et respectent eux aussi les limites de 100 lignes et 80 caractères.

**I18N-006 — Obligatoire.** Labels, aides, erreurs, états vides,
confirmations et attributs ARIA passent par le système de traduction.

**I18N-007 — Obligatoire.** Le backend retourne des codes d'erreur stables. Le
frontend les associe à des clés I18n.

**I18N-008 — Obligatoire.** Le français est la langue de repli.

**I18N-009 — Obligatoire.** Les journaux backend et les données métier ne
sont pas traduits.

**I18N-010 — Obligatoire.** Vue I18n utilise la Composition API avec
`legacy: false` et `useI18n`.

**I18N-011 — Obligatoire.** Le backend renvoie les notifications sous forme
de type et de données structurées. Le frontend traduit leur titre et message.

## 10. Dates et fuseaux avec Luxon

**TIME-001 — Obligatoire.** Luxon est l'unique bibliothèque utilisée pour les
dates, durées et identifiants de fuseau IANA.

**TIME-002 — Obligatoire.** Chaque application possède son propre adaptateur
Luxon. Seuls ces adaptateurs importent `luxon` ; tous les autres fichiers
utilisent leurs fonctions typées.

**TIME-003 — Obligatoire.** L'API reçoit et renvoie les instants au format
ISO 8601 UTC. Une date ou heure locale n'est jamais interprétée sans un fuseau
explicite dans le DTO ou déterminé sans ambiguïté par le contexte de la route.

**TIME-004 — Obligatoire.** Les identifiants IANA sont validés avant toute
conversion. Un simple décalage UTC ne remplace jamais un fuseau.

**TIME-005 — Obligatoire.** Le parsing est strict lorsque le format attendu
est connu. Une entrée invalide produit une erreur explicite.

**TIME-006 — Obligatoire.** Aucun calcul métier de durée ou de fuseau n'est
réalisé avec l'objet natif `Date` ou par calcul manuel de décalage.

**TIME-007 — Obligatoire.** Un objet Luxon `DateTime` n'est jamais conservé en
base, dans Pinia ou dans une réponse API. Seules des chaînes ISO ou valeurs
simples sont stockées et transportées.

**TIME-008 — Obligatoire.** Les objets Luxon sont immuables. Une conversion,
un changement de fuseau ou un ajout de durée utilise toujours la valeur
retournée par l'opération.

**TIME-009 — Obligatoire.** Dans le frontend, la locale appliquée avec Luxon
suit celle de Vue I18n. Le backend ne produit aucun texte temporel localisé.

**TIME-010 — Obligatoire.** Deux heures locales répétées sont distinguées
par leur décalage UTC dans l'affichage et dans les tests.

**TIME-011 — Obligatoire.** Le frontend formate les instants dans le fuseau
choisi, mais le backend reste l'autorité pour les disponibilités et conflits.

**TIME-012 — Obligatoire.** Tout parsing, formatage ou calcul reçoit UTC ou
un fuseau IANA explicite. Le fuseau implicite de la machine est interdit.

**TIME-013 — Obligatoire.** L'adaptateur importe uniquement `luxon` et valide
les fuseaux avec `IANAZone.isValidZone`. Moment.js et `moment-timezone` sont
interdits afin de ne pas dupliquer cette capacité.

**TIME-014 — Obligatoire.** Un instant HTTP utilise exactement la forme UTC
`YYYY-MM-DDTHH:mm:ss.SSSZ`. Une précision supérieure ou inférieure à la
milliseconde est refusée avant tout calcul, empreinte ou accès Prisma.

Les règles temporelles complètes sont définies dans
[`AVAILABILITY_AND_TIMEZONES.md`](AVAILABILITY_AND_TIMEZONES.md).

## 11. API, PostgreSQL et Prisma

**DATA-001 — Obligatoire.** L'authentification utilise `/auth` et les routes
métier utilisent `/v1`. Les routes d'infrastructure `/health` et `/metrics`
ne sont pas versionnées. Le contrat appartient à [`API.md`](API.md).

**DATA-002 — Obligatoire.** Les entrées HTTP sont validées puis converties
en types internes avant d'atteindre la logique métier.

**DATA-003 — Obligatoire.** Les réponses ne renvoient que les champs utiles.
Les objets Prisma ne sont jamais exposés directement.

**DATA-004 — Obligatoire.** Une migration versionnée accompagne tout
changement de schéma ou de contrainte.

**DATA-005 — Obligatoire.** Une migration partagée n'est pas réécrite. Une
nouvelle migration corrige le comportement.

**DATA-006 — Obligatoire.** Les invariants critiques, notamment les
chevauchements, restent protégés par PostgreSQL.

**DATA-007 — Obligatoire.** Lorsqu'ils sont prévus par la règle métier, la
modification, son historique et ses notifications partagent une transaction.

**DATA-008 — Obligatoire.** Les requêtes sélectionnent uniquement les champs
nécessaires et évitent les chargements en boucle.

**DATA-009 — Obligatoire.** Les erreurs Prisma sont traduites en erreurs
métier stables avant d'atteindre le contrôleur.

**DATA-010 — Obligatoire.** Les données sensibles ne figurent jamais dans une
URL, un message d'erreur ou un journal.

**DATA-011 — Obligatoire.** Le code public est transmis dans l'en-tête
`X-Public-Code`. Il n'est placé ni dans le chemin ni dans la query string.

**DATA-012 — Obligatoire.** CORS autorise uniquement l'origine frontend
configurée. Le client active `credentials` et le backend accepte les cookies
de session ainsi que l'en-tête `X-Public-Code`.

**DATA-013 — Obligatoire.** Le client Prisma 7 utilise le générateur
`prisma-client`, `@prisma/adapter-pg` et la connexion PostgreSQL validée au
démarrage. Le modèle cible appartient à [`DATA_MODEL.md`](DATA_MODEL.md).

**DATA-014 — Obligatoire.** `prisma migrate dev` crée les migrations en
développement. Seule l'image scripts exécute `prisma migrate deploy` dans
Docker. `prisma db push` est interdit dans le démarrage et la CI.

**DATA-015 — Obligatoire.** Le schéma Prisma utilise plusieurs fichiers par
domaine sous `prisma/models`. Chaque fichier respecte les limites générales ;
`schema.prisma` ne contient que le générateur et la datasource.

**DATA-016 — Obligatoire.** Toute écriture qui change l'occupation ou les
règles du calendrier sérialise d'abord l'accès par `calendarVersion` dans sa
transaction. Une confirmation refuse une version ou une empreinte d'impact
devenue obsolète.

**DATA-017 — Obligatoire.** Les objets Prisma restent internes aux
repositories et mappers. Les DTO du [`contrat API`](API.md) sont des types
distincts ; renommer ou adapter une colonne ne modifie pas implicitement le
contrat HTTP.

## 12. Tests

**TEST-001 — Obligatoire.** Le backend utilise `bun test`. Une configuration
Jest résiduelle du starter est supprimée si elle n'est pas utilisée.

**TEST-002 — Obligatoire.** Le frontend utilise Vitest et Vue Test Utils.
Supertest teste les routes Express avec le moteur de test Bun.

**TEST-003 — Obligatoire.** Les fichiers de test respectent les limites de
100 lignes et 80 caractères. Ils sont divisés par comportement si nécessaire.

**TEST-004 — Obligatoire.** Un test suit clairement les phases préparation,
action et vérification.

**TEST-005 — Obligatoire.** Le nom d'un test décrit le comportement attendu,
pas la fonction interne appelée.

**TEST-006 — Obligatoire.** L'heure courante est figée ou injectée. Un test
ne dépend de l'heure réelle de la machine.

**TEST-007 — Obligatoire.** L'aléatoire est injecté ou utilise une graine
connue. Un test doit donner le même résultat à chaque exécution.

**TEST-008 — Obligatoire.** Les contraintes, migrations et accès concurrents
sont testés sur un PostgreSQL réel.

**TEST-009 — Obligatoire.** Une correction de bug commence par un test qui
reproduit le problème lorsque cela est techniquement possible.

**TEST-010 — Obligatoire.** Les snapshots ne remplacent pas des assertions
métier explicites.

La liste des scénarios prioritaires appartient à
[`TESTS_AND_DELIVERABLES.md`](TESTS_AND_DELIVERABLES.md).

## 13. Accessibilité

**A11Y-001 — Obligatoire.** Un élément HTML est choisi selon sa fonction.
Une action utilise un bouton, jamais une `div` cliquable.

**A11Y-002 — Obligatoire.** Chaque champ possède un label et relie ses aides
ou erreurs avec `aria-describedby`.

**A11Y-003 — Obligatoire.** Les erreurs utilisent `aria-invalid` et les
messages asynchrones importants utilisent une zone `aria-live`.

**A11Y-004 — Obligatoire.** Toutes les actions sont utilisables au clavier et
conservent un focus visible.

**A11Y-005 — Obligatoire.** Une modale se ferme avec `Escape`, piège le focus
tant qu'elle est ouverte et le rend ensuite à son déclencheur.

**A11Y-006 — Obligatoire.** Une information disponible au survol est aussi
accessible au focus et au toucher.

**A11Y-007 — Obligatoire.** Les couleurs Bootstrap utilisées respectent un
contraste suffisant et sont accompagnées d'un libellé.

**A11Y-008 — Obligatoire.** Tout bouton limité à une icône possède un nom
accessible explicite.

**A11Y-009 — Obligatoire.** Le document déclare sa langue. Chaque page garde
un titre principal et une hiérarchie de titres sans saut arbitraire.

**A11Y-010 — Obligatoire.** Les zones principales utilisent les landmarks
HTML. Les onglets, menus et panneaux Bootstrap ont un nom accessible.

**A11Y-011 — Obligatoire.** Un chargement expose un texte accessible ou
`aria-busy`, pas uniquement une animation visuelle.

## 14. Sécurité propre à la démonstration

**SEC-001 — Obligatoire.** Aucun secret réel ni donnée personnelle réelle
n'est utilisé dans la démonstration, les tests ou les prompts d'un outil IA.

**SEC-002 — Obligatoire.** Les secrets et paramètres variables proviennent de
l'environnement. `.env.example` ne contient que des valeurs factices.

**SEC-003 — Obligatoire.** Mot de passe, identifiant de session et code public
ne sont jamais écrits dans les journaux.

**SEC-004 — Obligatoire.** Les compromis de sécurité demandés pour la démo
restent isolés et accompagnés d'un avertissement visible.

**SEC-005 — Obligatoire.** Une concession de démonstration ne devient pas une
abstraction réutilisée silencieusement comme une pratique normale.

**SEC-006 — Obligatoire.** Aucune route `GET` ne modifie l'état métier ou
n'écrit en base. La collecte technique des métriques HTTP reste autorisée. Une
écriture refuse tout `Origin` présent qui n'appartient pas à la liste
configurée, y compris sous `/auth` et avec un code public. L'absence d'`Origin`
reste admise pour les clients non-navigateurs. Le cookie utilise
`SameSite=Lax`. La production ajouterait une protection CSRF dédiée.

## 15. Git, CI et assistants IA

**TOOL-001 — Obligatoire.** Les commits sont petits, cohérents et expliquent
une intention unique.

**TOOL-002 — Recommandé.** Les messages utilisent les préfixes `feat:`,
`fix:`, `test:`, `docs:` ou `refactor:`.

**TOOL-003 — Obligatoire.** Code, test, migration et documentation d'un même
comportement sont livrés ensemble lorsqu'ils sont concernés.

**TOOL-004 — Obligatoire.** Aucun secret, `.DS_Store`, dépendance installée,
répertoire de build ou rapport de couverture n'est versionné.

**TOOL-005 — Obligatoire.** La version de Bun suit la révision figée du
starter. Chaque paquet Bun conserve son propre `bun.lock` et aucun lockfile
npm n'est ajouté en parallèle.

**TOOL-006 — Obligatoire.** Codex, Cursor et GitHub Copilot sont autorisés,
mais tout code proposé est relu, compris, adapté et testé par son auteur.

**TOOL-007 — Obligatoire.** Une suggestion IA n'introduit pas de dépendance,
de règle métier ou de changement d'architecture sans justification humaine.

**TOOL-008 — Obligatoire.** Aucun secret ni donnée réelle n'est transmis à
un assistant IA.

**TOOL-009 — Obligatoire.** Le workflow GitHub Actions
`.github/workflows/ci.yml` échoue si le formatage, le lint, le typecheck, le
contrôle de taille ou les tests requis échouent.

**TOOL-010 — Obligatoire.** La CI installe la version de Bun retenue puis
exécute `bun install --frozen-lockfile` dans chaque paquet concerné avant ses
contrôles.

## 16. Docker et migrations

L'architecture détaillée appartient à
[`DOCKER_ARCHITECTURE.md`](DOCKER_ARCHITECTURE.md).

**DOCKER-001 — Obligatoire.** Compose démarre les quatre services
`database`, `scripts`, `backend` et `frontend` depuis la racine du projet.

**DOCKER-002 — Obligatoire.** `database` fournit PostgreSQL, son volume et
son healthcheck. Il n'applique aucune migration applicative par un script
d'initialisation implicite.

**DOCKER-003 — Obligatoire.** `scripts` est un job one-shot. Il attend une
base saine, exécute uniquement `prisma migrate deploy`, puis sort avec le
code `0`. Il n'est ni un cron ni un worker métier.

**DOCKER-004 — Obligatoire.** `backend` attend la réussite de `scripts` et
n'exécute pas les migrations une seconde fois. Il écoute sur le port `3000`
et fournit un healthcheck par `/health`.

**DOCKER-005 — Obligatoire.** `frontend` attend un backend sain. Il sert
l'application Vue. Dans la démonstration locale, le navigateur appelle le
port `3000` publié par le backend au moyen de `VITE_API_BASE_URL`. Le nom
Compose `backend` n'est jamais envoyé comme URL au navigateur.

**DOCKER-006 — Obligatoire.** Les migrations et le schéma Prisma ont une
source unique sous `02_Back-End/ExpressStarterDCT/prisma`. L'image scripts
les copie ; elle n'en maintient pas une seconde version.

**DOCKER-007 — Obligatoire.** Un Dockerfile copie `bun.lock`, jamais
`bun.lockb`, et utilise une installation figée. Un conteneur terminé n'est
pas maintenu artificiellement par `tail -f`.

**DOCKER-008 — Obligatoire.** `DATABASE_URL` utilise le nom de service
`database` entre conteneurs. `localhost` désigne uniquement le conteneur
lui-même et n'est donc pas utilisé pour cette connexion.

**DOCKER-009 — Obligatoire.** Le client Prisma ignoré par Git est produit par
`bunx prisma generate` pendant le build de chaque image qui l'importe, après
copie du schéma et avant le typecheck. Il n'est jamais généré au démarrage d'un
conteneur.

**DOCKER-010 — Obligatoire.** Si Prisma exige `DATABASE_URL` pendant
`generate`, le build utilise une URL factice sans secret limitée à cette
instruction. Elle ne devient jamais la configuration runtime de l'image et la
génération ne contacte aucune base.

## 17. Contrôles automatiques

Les scripts suivants doivent exister dans les paquets concernés. Ils sont
lancés avec `bun run` :

```text
format:check
lint
typecheck
check:file-limits
test
test:integration
```

**AUTO-001 — Obligatoire.** Prettier utilise `printWidth: 80`.

**AUTO-002 — Obligatoire.** ESLint contrôle TypeScript, Vue, les imports,
le code mort et les expressions difficiles à lire.

**AUTO-003 — Obligatoire.** `check:file-limits` parcourt les sources, tests,
styles, configurations, schémas, migrations manuelles et traductions du projet.

**AUTO-004 — Obligatoire.** Ce script échoue au-delà de 100 lignes par
fichier ou de 80 caractères par ligne.

**AUTO-005 — Obligatoire.** Les exclusions automatiques correspondent à
GEN-015 et GEN-016. Une liste de chemins précise est préférée à l'exclusion
d'une extension complète.

**AUTO-006 — Obligatoire.** Une exception automatique est locale, motivée et
temporaire. Elle ne peut jamais contourner GEN-001 ou GEN-003. Une exception
permanente aux autres règles exige une décision écrite.

## 18. Définition de terminé

Une contribution est terminée uniquement lorsque :

- chaque fichier soumis à GEN-001 et GEN-003 respecte leurs limites ;
- la séparation contrôleur, service, repository et présentation est claire ;
- le formatage, le lint et le typecheck réussissent ;
- le client Prisma est généré depuis le schéma canonique avant le typecheck ;
- les tests utiles sont ajoutés et réussissent ;
- les migrations s'appliquent depuis une base vide si elles sont concernées ;
- les quatre services Compose respectent leur ordre de démarrage ;
- le job `scripts` se termine avec succès après les migrations ;
- les textes visibles passent par Vue I18n ;
- les dates utilisent les adaptateurs Luxon et des fuseaux IANA ;
- Bootstrap est utilisé sans style inline ni duplication inutile ;
- les états accessibles de chargement, erreur et confirmation sont présents ;
- la documentation et les décisions sont à jour ;
- aucun secret, fichier local ou code généré inutile n'est ajouté ;
- le code peut être expliqué simplement à un développeur junior.

## 19. Sources techniques

- conception du projet : [`TECHNICAL_DESIGN.md`](TECHNICAL_DESIGN.md) ;
- contrat HTTP : [`API.md`](API.md) ;
- modèle de données : [`DATA_MODEL.md`](DATA_MODEL.md) ;
- conteneurs : [`DOCKER_ARCHITECTURE.md`](DOCKER_ARCHITECTURE.md) ;
- starter backend : [dépôt officiel `ExpressStarterDCT`][starter-backend] ;
- styles : [documentation officielle Bootstrap][bootstrap-docs] ;
- traductions : [Composition API de Vue I18n][vue-i18n-docs] ;
- dates : [documentation officielle Luxon][luxon-docs].

[starter-backend]: https://github.com/kevinfavv/ExpressStarterDCT
[bootstrap-docs]: https://getbootstrap.com/docs/5.3/
[vue-i18n-docs]: https://vue-i18n.intlify.dev/guide/advanced/composition
[luxon-docs]: https://moment.github.io/luxon/
