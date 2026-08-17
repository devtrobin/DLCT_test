# Sommaire du projet

> Statut : index documentaire de la démonstration  
> Dernière mise à jour : 17 août 2026

## Rôle de ce dossier

Ce dossier contient les spécifications fonctionnelles et techniques de l'application de prise de rendez-vous réalisée pour le test technique Delicity.

Les exigences demandées dans le sujet sont signalées par **[Imposé]**. Les choix ajoutés pour disposer d'un parcours démontrable sont signalés par **[Démo]**. En cas de contrainte de temps, les exigences imposées et l'intégrité des réservations restent prioritaires.

## Convention documentaire

- les documents sont rédigés en français ;
- leurs noms sont en anglais, en caractères ASCII et au format `UPPER_SNAKE_CASE.md` ;
- chaque règle détaillée possède un seul document propriétaire ;
- les autres documents créent un lien vers cette source au lieu de recopier la règle ;
- les décisions transversales sont recensées dans [`DECISIONS.md`](DECISIONS.md), sans remplacer les spécifications thématiques.

## Ordre de lecture recommandé

1. [`PRODUCT_SCOPE.md`](PRODUCT_SCOPE.md) — finalité, priorités, acteurs, terminologie et périmètre de la démonstration.
2. [`AVAILABILITY_AND_TIMEZONES.md`](AVAILABILITY_AND_TIMEZONES.md) — disponibilités, indisponibilités, calcul des créneaux et fuseaux horaires.
3. [`APPOINTMENTS.md`](APPOINTMENTS.md) — création, consultation, annulation et modification des rendez-vous.
4. [`ACCOUNTS_AND_AUTHENTICATION.md`](ACCOUNTS_AND_AUTHENTICATION.md) — comptes, sessions, accès public et compromis de sécurité propres à la démonstration.
5. [`NOTIFICATIONS.md`](NOTIFICATIONS.md) — notifications internes et événements qui les déclenchent.
6. [`SCREENS.md`](SCREENS.md) — navigation, écrans et états d'interface attendus.
7. [`TECHNICAL_DESIGN.md`](TECHNICAL_DESIGN.md) — architecture et adaptation du starter backend.
8. [`BACKEND_MODULES.md`](BACKEND_MODULES.md) — modules, services,
   repositories, autorisations et transactions.
9. [`DATA_MODEL.md`](DATA_MODEL.md) — modèle Prisma, contraintes PostgreSQL et migrations.
10. [`API.md`](API.md) — routes publiques et protégées, validation et erreurs.
11. [`DOCKER_ARCHITECTURE.md`](DOCKER_ARCHITECTURE.md) — quatre images, ordre de démarrage et variables.
12. [`DEV_RULES.md`](DEV_RULES.md) — règles de codage, organisation du code et contrôles automatiques.
13. [`TESTS_AND_DELIVERABLES.md`](TESTS_AND_DELIVERABLES.md) — stratégie de test, livrables et conditions de présentation.
14. [`DECISIONS.md`](DECISIONS.md) — registre synthétique des arbitrages déjà rendus.

## Accès par thème

| Besoin | Document de référence |
|---|---|
| Comprendre ce qui doit être démontré | [`PRODUCT_SCOPE.md`](PRODUCT_SCOPE.md) |
| Déterminer si un horaire est disponible | [`AVAILABILITY_AND_TIMEZONES.md`](AVAILABILITY_AND_TIMEZONES.md) |
| Implémenter le cycle de vie d'un rendez-vous | [`APPOINTMENTS.md`](APPOINTMENTS.md) |
| Gérer un compte, une session ou un accès par code | [`ACCOUNTS_AND_AUTHENTICATION.md`](ACCOUNTS_AND_AUTHENTICATION.md) |
| Déclencher et afficher une notification | [`NOTIFICATIONS.md`](NOTIFICATIONS.md) |
| Concevoir une page ou un parcours utilisateur | [`SCREENS.md`](SCREENS.md) |
| Adapter le starter backend | [`TECHNICAL_DESIGN.md`](TECHNICAL_DESIGN.md) |
| Implémenter un service ou une transaction backend | [`BACKEND_MODULES.md`](BACKEND_MODULES.md) |
| Concevoir la base ou une migration | [`DATA_MODEL.md`](DATA_MODEL.md) |
| Implémenter une route ou une erreur HTTP | [`API.md`](API.md) |
| Construire ou démarrer les quatre images | [`DOCKER_ARCHITECTURE.md`](DOCKER_ARCHITECTURE.md) |
| Écrire ou relire une contribution | [`DEV_RULES.md`](DEV_RULES.md) |
| Vérifier le projet et préparer sa livraison | [`TESTS_AND_DELIVERABLES.md`](TESTS_AND_DELIVERABLES.md) |
| Retrouver l'origine d'un choix | [`DECISIONS.md`](DECISIONS.md) |

## Sources du projet

- état et démarrage du dépôt : [`../../README.md`](../../README.md) ;
- clone backend : [`../../02_Back-End/ExpressStarterDCT/README.md`](../../02_Back-End/ExpressStarterDCT/README.md) ;
- instructions IA du clone : [`../../02_Back-End/ExpressStarterDCT/CLAUDE.md`](../../02_Back-End/ExpressStarterDCT/CLAUDE.md).
