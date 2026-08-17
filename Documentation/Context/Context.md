# Contexte du projet

## Finalité

Ce projet est réalisé par Thomas Robin dans le cadre du recrutement de Delicity pour un poste de **Développeur Fullstack Senior** en CDI, basé à Nice avec une organisation hybride.

Le test doit permettre d'évaluer la manière d'aborder un problème, la pertinence des choix techniques et la qualité globale de l'implémentation. L'utilisation d'assistants et d'agents d'intelligence artificielle est explicitement autorisée et correspond aux pratiques de développement mises en avant par Delicity.

## Interlocuteurs

- **Sophie Younsi** : Responsable Recrutement Réseau Partenaires, à l'origine du premier contact.
- **Kevin Favergeaud** : dirigeant de Delicity et expéditeur du test technique.
- **Thomas Robin** : candidat et auteur du projet.

La chronologie détaillée du processus est disponible dans [`HISTORIQUE.md`](HISTORIQUE.md).

## Projet demandé

Le test consiste à développer une petite application de prise de rendez-vous organisée en deux parties au sein du projet :

1. un backend fondé sur le starter Express/TypeScript [`ExpressStarterDCT`](https://github.com/kevinfavv/ExpressStarterDCT) ;
2. un frontend en Vue.js.

La livraison doit utiliser un dépôt Git unique afin de fournir un historique
cohérent de l'ensemble de l'implémentation. À ce stade, la racine n'est pas
encore un dépôt et le clone backend conserve son propre `.git`. Cette
situation transitoire devra être résolue avant les premiers commits du projet.

L'organisation d'exécution comprend désormais quatre répertoires et quatre
images Docker :

```text
01_DB/                              PostgreSQL
02_Back-End/ExpressStarterDCT/      API Express
03_Front-End/                       interface Vue.js
04_Script/                          migrations et scripts ponctuels
```

L'image de scripts applique les migrations avant le démarrage du backend,
puis s'arrête avec succès. Elle peut aussi exécuter un seed explicitement,
mais ne constitue pas un scheduler ou un service métier périodique.

Le backend est issu du commit
`07d6fc6dd274bdf11506ccc6a5aaf3649dffcc7f` du starter. Le dépôt Git du
rendu reste unique et englobe les quatre répertoires ainsi que la
documentation.

### Besoins du professionnel

Un professionnel doit pouvoir :

- définir ses horaires habituels pour chaque jour de la semaine ;
- configurer plusieurs plages horaires au cours d'une même journée ;
- déclarer des indisponibilités exceptionnelles, ponctuelles ou étendues sur plusieurs jours ;
- disposer de son propre fuseau horaire.

### Besoins du client

Un client doit pouvoir :

- consulter les créneaux disponibles d'un professionnel sur une période donnée ;
- afficher ces créneaux dans le fuseau horaire de son choix ;
- réserver un rendez-vous ;
- annuler un rendez-vous.

### Invariants métier essentiels

- Un rendez-vous ne peut être réservé que pendant une disponibilité réelle du professionnel.
- Une indisponibilité exceptionnelle rend les créneaux concernés non réservables.
- Deux rendez-vous ne peuvent pas se chevaucher.
- La protection contre les chevauchements doit rester fiable en cas de demandes concurrentes.
- Les conversions de dates doivent rester correctes lors des changements d'heure d'été et d'heure d'hiver.

## Contraintes techniques imposées

- Backend Express/TypeScript basé sur le starter fourni.
- Frontend Vue.js.
- Persistance avec PostgreSQL et Prisma.
- Migrations de base de données incluses.
- Tests jugés pertinents pour démontrer la robustesse du projet.
- Historique Git permettant de suivre la construction de la solution.
- Démarrage de l'ensemble du backend avec une seule commande :

```sh
docker compose up
```

- README expliquant le lancement du projet et les principaux choix techniques.

Le modèle de données, l'architecture, les routes HTTP, les validations, l'expérience utilisateur et l'organisation du frontend sont volontairement laissés au choix du candidat.

Pour le rendu, la même commande Compose construit et démarre les quatre
images. PostgreSQL doit être sain avant l'application des migrations, et le
backend ne démarre qu'après la réussite de celles-ci.

## Informations utiles sur l'environnement Delicity

L'annonce du poste mentionne la stack suivante :

- JavaScript et TypeScript ;
- Node.js ou Bun ;
- Vue.js et Pinia ;
- Capacitor et Ionic ;
- Tailwind CSS ;
- MySQL ou PostgreSQL ;
- Redis ;
- Docker et CI/CD.

Pendant l'entretien, les éléments suivants ont été communiqués ou notés :

- hébergement chez OVH au moyen d'images Docker ;
- pic d'activité d'environ 200 requêtes par seconde sur les applications mobile et web ;
- volonté de redonner aux restaurateurs la maîtrise de leur activité et de leurs marges ;
- objectif à long terme de fournir un outil complet de gestion de leurs informations ;
- réflexion autour d'une cartographie locale indépendante des solutions payantes ;
- réflexion autour d'outils d'IA facilitant la gestion des informations en ligne des restaurateurs.

Ces informations donnent du contexte au test, mais elles ne modifient pas ses
contraintes explicites. Redis, Ionic et Capacitor ne sont notamment pas exigés.

Le clone local conduit à conserver Bun, Express 5, TypeScript, Prisma 7 avec
`@prisma/adapter-pg`, Zod, PostgreSQL et les métriques Prometheus fournies par
`prom-client`. Helmet, CORS, la compression et la lecture des cookies restent
utiles à l'API.

Les briques génériques qui ne servent pas la démonstration sont retirées,
notamment Redis, BullMQ, JWT, OAuth Google, bcrypt et S3. Les sessions opaques
sont conservées dans PostgreSQL conformément aux décisions fonctionnelles.

Le modèle Prisma `User` fourni n'est pas remplacé sans nécessité : il reste la
racine des comptes et reçoit les rôles et champs utiles au projet. Les profils
et modèles métier sont ajoutés autour de lui. `RefreshToken`,
`ForgotPasswordRequest` et les champs liés à Google ou au marketing ne sont pas
conservés, car leurs parcours sont hors périmètre.

Luxon reste le choix temporel du projet puisqu'il est déjà présent dans le
starter. Moment.js et `moment-timezone` ne sont pas ajoutés : une seule
bibliothèque de dates doit être utilisée.

## Priorités de réalisation

Le rendu doit en priorité démontrer :

1. la justesse des règles de disponibilité et de réservation ;
2. une stratégie explicite et testée pour les fuseaux horaires et les transitions saisonnières ;
3. une garantie robuste contre les réservations concurrentes et les chevauchements ;
4. une architecture lisible sans complexité non justifiée ;
5. des validations et des réponses d'erreur cohérentes ;
6. une installation reproductible avec Docker et les migrations ;
7. une interface simple permettant de parcourir le scénario fonctionnel complet ;
8. des décisions techniques faciles à expliquer pendant la revue avec Delicity.

## Décisions fonctionnelles principales

- La durée d'un rendez-vous est fixée à une heure.
- L'application gère plusieurs professionnels ainsi que des comptes clients et restaurateurs.
- Le parcours normal de réservation utilise un compte client. Un code public opaque permet aussi de consulter et gérer un rendez-vous unique sans connexion.
- Le client fournit son prénom, son nom, son téléphone et son adresse électronique ; ces données préremplissent ses réservations.
- Les créneaux commencent toutes les quinze minutes et sont consultés par fenêtres de sept jours.
- Le client et le professionnel peuvent proposer un changement de créneau. Une proposition en attente apparaît en orange, doit être acceptée par l'autre partie et reste tracée dans l'historique.
- Le professionnel peut forcer une acceptation après une seconde confirmation et un accord obtenu directement avec le client.
- Une indisponibilité ou une modification d'horaires qui touche des rendez-vous exige un avertissement et une confirmation avant leur annulation.
- Toutes les communications applicatives utilisent désormais des notifications internes persistantes avec états « non lue » et « lue ». Aucun SMS ni courriel n'est envoyé ou simulé.
- Le client et le restaurateur disposent d'une cloche, d'un compteur et d'une liste de notifications. Le détenteur d'un code public consulte les changements dans l'historique de son unique rendez-vous.
- La suppression d'un compte est immédiate et irréversible après nouvelle saisie du mot de passe. Il n'existe ni export CSV, ni archivage, ni restauration à 72 heures, ni tâche planifiée de purge.
- Les rendez-vous futurs du compte supprimé sont annulés et les autres comptes concernés reçoivent une notification interne.
- Les codes publics associés au compte supprimé sont révoqués ; les historiques partagés restent visibles chez l'autre partie sous une identité générique.
- Le fuseau d'un restaurateur ne peut être modifié dans la démonstration tant qu'il possède un rendez-vous futur confirmé, afin d'éviter un workflow de reconversion disproportionné.
- Les opérations connectées sont protégées par une session conservée dans PostgreSQL avec option « Rester connecté », sans JWT.
- Pour la démonstration, le mot de passe est volontairement stocké en clair ; cette vulnérabilité critique est explicitement interdite pour un projet réel.
- Le parcours « Mot de passe oublié » affiche directement le mot de passe enregistré avec un avertissement explicite ; une adresse inconnue produit « Aucun compte trouvé ».
- L'inscription est immédiatement active, sans limitation de débit, et les tentatives de connexion ne sont pas limitées ; ces choix sont réservés à la démonstration.
- Les adresses électroniques et noms commerciaux sont comparés exactement sans normalisation. Une même adresse peut exister une fois par rôle ; les noms commerciaux peuvent être modifiés et réutilisés après suppression définitive.

Les questions désormais évidentes sont tranchées dans les spécifications thématiques. Aucun arbitrage bloquant n'est identifié à ce stade ; toute nouvelle question ne devra rester ouverte que si ses réponses changent réellement le modèle ou le parcours.

Les recommandations techniques non controversées ont été retenues directement : priorité à l'intégrité des réservations, API REST, protection PostgreSQL contre les chevauchements, codes publics cryptographiquement robustes, interface accessible et tests sur PostgreSQL réel.

## Documentation de référence

- Sommaire des spécifications : [`../Project/SUMMARY.md`](../Project/SUMMARY.md)
- Écrans du projet : [`../Project/SCREENS.md`](../Project/SCREENS.md)
- Compétences et outils : [`../Technical_Knowledge/compétences_technique.md`](../Technical_Knowledge/comp%C3%A9tences_technique.md)
- Fiches d'apprentissage : [`../Technical_Knowledge/`](../Technical_Knowledge/README.md)
- Sujet synthétisé : [`Mail/EMAIL_TOPIC.md`](Mail/EMAIL_TOPIC.md)
- Courriel original : [`Mail/[Delicity] Test technique.eml`](Mail/%5BDelicity%5D%20Test%20technique.eml)
- Notes de l'entretien : [`Meeting/RESUME_LAST_MEETING.md`](Meeting/RESUME_LAST_MEETING.md)
- Annonce du poste : [`Linkdin/POST_LINKDIN.md`](Linkdin/POST_LINKDIN.md)
- Conversation de recrutement : [`Linkdin/CONVERSATION_LINKDIN.md`](Linkdin/CONVERSATION_LINKDIN.md)
- Historique des échanges : [`HISTORIQUE.md`](HISTORIQUE.md)
- Fiche entreprise vérifiée : [`Resume_Delicity/delicity_entreprise_verifiee_2026-08-15.md`](Resume_Delicity/delicity_entreprise_verifiee_2026-08-15.md)
- README du clone backend :
  [`../../02_Back-End/ExpressStarterDCT/README.md`](../../02_Back-End/ExpressStarterDCT/README.md)
