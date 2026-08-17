# Décisions du projet

> Statut : décisions retenues pour la démonstration  
> Dernière mise à jour : 17 août 2026  
> Navigation : [`SUMMARY.md`](SUMMARY.md)

Ce registre permet de retrouver rapidement les arbitrages déjà rendus. Les règles complètes, les exceptions et les critères techniques restent définis dans les documents propriétaires indiqués ci-dessous.

## Périmètre du produit

Document propriétaire : [`PRODUCT_SCOPE.md`](PRODUCT_SCOPE.md).

- Le parcours normal de réservation nécessite un compte client **[Démo]**.
- Un visiteur non connecté peut seulement accéder au rendez-vous désigné par son code public **[Démo]**.
- L'interface est uniquement proposée en français **[Démo]**.
- Les SMS, courriels applicatifs, OTP, exports de données, archives restaurables, tâches planifiées et applications mobiles sont hors périmètre **[Démo]**.
- Le client recherche un restaurateur par son nom commercial, lequel reste unique **[Démo]**.

## Comptes, sessions et accès public

Document propriétaire : [`ACCOUNTS_AND_AUTHENTICATION.md`](ACCOUNTS_AND_AUTHENTICATION.md).

- Une même adresse électronique peut être utilisée pour un compte client et un compte restaurateur ; le rôle est choisi à la connexion **[Démo]**.
- Le modèle Prisma fourni `User` reste la racine physique des comptes. Il est
  adapté aux rôles `CLIENT` et `PROFESSIONAL` au lieu d'être remplacé par un
  agrégat concurrent nommé `Account` **[Démo]**.
- L'inscription conserve l'unique route `POST /auth/register` du starter avec
  un rôle explicite ; les deux écrans fixent ce rôle sans dupliquer le service
  d'inscription **[Démo]**.
- Les sessions sont conservées dans PostgreSQL et durent huit heures, ou trente jours avec l'option « Rester connecté » **[Démo]**.
- La structure utile de `RefreshToken` est adaptée en `Session`, sans JWT ni
  refresh token. `ForgotPasswordRequest`, Google et les champs marketing sont
  retirés car aucun parcours retenu ne les utilise **[Démo]**.
- L'inscription active immédiatement le compte, sans vérification externe **[Démo]**.
- Les mots de passe sont volontairement stockés en clair et le parcours « Mot de passe oublié » affiche la valeur enregistrée ; cette faiblesse critique doit être explicitement documentée comme une concession de démonstration **[Démo]**.
- La suppression d'un compte est immédiate, irréversible et ne propose ni export ni restauration **[Démo]**.
- Le code public n'expire pas avec le temps, mais il est révoqué lorsqu'un compte lié est supprimé **[Démo]**.
- Le code public autorise, pour son seul rendez-vous, la consultation, l'annulation et les actions liées à une proposition de modification **[Démo]**.
- Pour une proposition, un compte client lié et le code public valide sont deux
  moyens d'authentifier le même côté métier `CLIENT_SIDE`. L'acteur réellement
  utilisé reste enregistré dans l'historique **[Démo]**.
- Aucune seconde vérification par SMS, courriel ou OTP n'est demandée : la session ou le code public constitue l'autorisation **[Démo]**.

## Disponibilités, créneaux et fuseaux horaires

Document propriétaire : [`AVAILABILITY_AND_TIMEZONES.md`](AVAILABILITY_AND_TIMEZONES.md).

- Un rendez-vous dure une heure et les débuts de créneau sont espacés de quinze minutes **[Démo]**.
- Le client consulte sept jours calendaires locaux consécutifs et navigue par blocs de sept jours **[Démo]**.
- L'agenda hebdomadaire du restaurateur commence le lundi **[Démo]**.
- Un créneau passé ne peut pas être réservé **[Démo]**.
- Une plage horaire ne traverse pas minuit : elle doit être découpée sur deux jours **[Démo]**.
- Les plages adjacentes restent distinctes et leur nombre par jour n'est pas artificiellement limité **[Démo]**.
- Un jour sans plage signifie que le professionnel est fermé **[Démo]**.
- Une indisponibilité exceptionnelle est remplacée par suppression puis recréation, sans écran de modification directe **[Démo]**.
- Les instants sont stockés en UTC, tandis que les règles hebdomadaires sont exprimées dans le fuseau IANA du professionnel **[Démo]**.
- Le fuseau d'un professionnel ne peut être modifié que s'il n'a aucun rendez-vous futur confirmé **[Démo]**.

## Rendez-vous

Document propriétaire : [`APPOINTMENTS.md`](APPOINTMENTS.md).

- Une réservation confirmée ne peut chevaucher aucune autre réservation confirmée du même professionnel, y compris en cas de requêtes concurrentes **[Imposé]**.
- L'ajout d'une indisponibilité qui touche des rendez-vous requiert un avertissement et une confirmation ; les rendez-vous concernés sont ensuite annulés de manière transactionnelle **[Démo]**.
- Le motif d'annulation est facultatif pour le client et obligatoire pour le restaurateur **[Démo]**.
- Une annulation change l'état du rendez-vous et conserve son historique au lieu de supprimer l'enregistrement **[Démo]**.
- Une proposition de modification ne réserve pas le nouveau créneau ; sa
  disponibilité est contrôlée lors de la proposition puis de nouveau dans la
  transaction d'acceptation **[Démo]**.
- Une seule proposition peut être en attente à la fois, sans date d'expiration ni limite sur le nombre de propositions successives **[Démo]**.
- Toute annulation d'un rendez-vous annule sa proposition en attente dans la
  même transaction **[Démo]**.
- Le restaurateur peut forcer l'acceptation après une seconde confirmation, à condition que le nouveau créneau soit encore disponible **[Démo]**.
- Un client peut avoir des rendez-vous simultanés chez des professionnels différents **[Démo]**.
- Un rendez-vous saisi manuellement par le restaurateur représente un accord déjà obtenu et est immédiatement confirmé **[Démo]**.
- Lors d'une saisie manuelle, une adresse correspondant exactement à un compte rattache ce client ; sinon le rendez-vous reste invité et son code public est remis au restaurateur **[Démo]**.
- Les coordonnées copiées dans un rendez-vous ne sont pas modifiées rétroactivement lors d'une mise à jour du profil **[Démo]**.

## Notifications internes

Document propriétaire : [`NOTIFICATIONS.md`](NOTIFICATIONS.md).

- Les événements métier créent uniquement des notifications internes ; aucun SMS ou courriel applicatif n'est envoyé **[Démo]**.
- Une notification est enregistrée dans la même transaction que l'action métier correspondante **[Démo]**.
- `eventKey` empêche deux notifications pour un même événement métier ; il ne
  promet pas à lui seul l'idempotence de toute requête HTTP **[Démo]**.
- Une notification peut être marquée comme lue, mais ne peut pas être supprimée individuellement **[Démo]**.
- Les notifications sont conservées jusqu'à la suppression du compte destinataire, sans purge périodique **[Démo]**.
- Aucun WebSocket n'est nécessaire : les données sont actualisées à l'ouverture des pages, après une action métier ou à la demande de l'utilisateur **[Démo]**.

## Interface

Document propriétaire : [`SCREENS.md`](SCREENS.md).

- La vue hebdomadaire suffit pour l'agenda du restaurateur **[Démo]**.
- Les états en attente sont orange, les rendez-vous annulés sont gris et le rouge est réservé aux conflits ou erreurs réelles **[Démo]**.

## Conception technique et livraison

Documents propriétaires : [`TECHNICAL_DESIGN.md`](TECHNICAL_DESIGN.md),
[`BACKEND_MODULES.md`](BACKEND_MODULES.md),
[`API.md`](API.md), [`DATA_MODEL.md`](DATA_MODEL.md),
[`DOCKER_ARCHITECTURE.md`](DOCKER_ARCHITECTURE.md),
[`DEV_RULES.md`](DEV_RULES.md) et
[`TESTS_AND_DELIVERABLES.md`](TESTS_AND_DELIVERABLES.md).

- Le projet cible un dépôt Git unique organisé dans `01_DB`, `02_Back-End`,
  `03_Front-End` et `04_Script` **[Démo]**.
- Les paquets Bun restent indépendants et possèdent chacun leur lockfile ;
  aucun workspace Bun n'est créé à la racine **[Démo]**.
- L'image `scripts` réutilise les dépendances Prisma et le lockfile du backend
  au lieu de maintenir un paquet concurrent **[Démo]**.
- Le backend est fondé sur le commit
  `07d6fc6dd274bdf11506ccc6a5aaf3649dffcc7f` du starter officiel
  **[Démo]**.
- Le backend conserve Bun, Express 5, TypeScript ESM, Prisma 7, PostgreSQL,
  l'adaptateur `@prisma/adapter-pg` et Zod **[Démo]**.
- Une structure du starter est privilégiée si elle reste compatible avec le
  métier. Un élément hors périmètre ne peut subsister que temporairement,
  isolé et sans route cible ; aucun n'est nécessaire dans le livrable final
  actuellement défini **[Démo]**.
- Le schéma et les migrations Prisma restent canoniques dans
  `02_Back-End/ExpressStarterDCT/prisma` **[Démo]**.
- Le schéma Prisma est divisé par domaine avec le mode multi-fichier afin de
  respecter les limites de lisibilité **[Démo]**.
- Le modèle `User` du starter est conservé puis adapté : ses champs communs
  utiles restent, tandis que ses rôles, son profil, son mécanisme JWT et ses
  relations génériques hors périmètre sont remplacés par les sessions
  PostgreSQL et les modèles métier de la démo **[Démo]**.
- Les DTO HTTP, autorisations, transitions et transactions sont définis avant
  l'implémentation et ne dépendent jamais de la forme d'un objet Prisma
  **[Démo]**.
- Les quatre images sont `database`, `scripts`, `backend` et `frontend` ;
  Redis ne constitue pas une cinquième image **[Démo]**.
- L'image `scripts` exécute `prisma migrate deploy` une seule fois puis
  s'arrête ; elle n'est ni un cron ni un worker périodique **[Démo]**.
- `prisma db push` est exclu du démarrage, de la CI et du déploiement ; les
  migrations sont créées en développement puis versionnées **[Démo]**.
- Le contrat HTTP conserve les préfixes réels du starter : `/auth` pour
  l'authentification, `/v1` pour le métier, `/health` et `/metrics` pour
  l'infrastructure **[Démo]**.
- Les confirmations d'annulation fondées sur un aperçu sont protégées par une
  version de calendrier et une empreinte d'impact **[Démo]**.
- Bootstrap est utilisé pour le style et remplace Tailwind CSS **[Démo]**.
- Vue I18n porte tous les textes visibles, avec le français comme langue de
  repli **[Démo]**.
- Luxon, déjà présent dans le starter, est l'unique bibliothèque de
  manipulation des dates et fuseaux ; Moment.js n'est pas ajouté **[Démo]**.
- Le code public est transmis dans un en-tête HTTP et n'apparaît jamais dans
  l'URL **[Démo]**.
- GitHub Actions exécute l'intégration continue du projet **[Démo]**.
- En local, le frontend est publié sur le port `5173` et appelle le backend
  publié sur le port `3000` avec CORS et cookies **[Démo]**.
- Les fichiers maintenus visés par les règles de taille ne dépassent pas
  100 lignes ni 80 caractères par ligne **[Démo]**.
- Les tests de concurrence et de contraintes s'exécutent sur un PostgreSQL
  réel **[Démo]**.
- Les données de démonstration sont créées par une commande de seed
  idempotente et documentée, jamais automatiquement au démarrage normal
  **[Démo]**.

## Arbitrages restant à rendre

Aucun arbitrage bloquant n'est identifié. Une nouvelle question ne doit être ajoutée que si ses réponses possibles changent le modèle de données, une règle métier ou un parcours de démonstration.
