# Périmètre du produit

> Statut : référence de cadrage  
> Dernière mise à jour : 17 août 2026  
> Navigation : [`SUMMARY.md`](SUMMARY.md)

## 1. Objet

Ce document cadre l'application de prise de rendez-vous réalisée pour le test technique Delicity. Le but est de présenter une démonstration complète et robuste sans reproduire toutes les exigences d'un produit en production.

Deux niveaux d'exigence sont utilisés dans la documentation :

- **[Imposé]** : demandé explicitement dans le sujet du test ;
- **[Démo]** : choix fonctionnel ou technique ajouté pour rendre le scénario compréhensible.

En cas de contrainte de temps, les exigences imposées et l'intégrité des réservations priment sur les fonctions de confort.

## 2. Objectifs prioritaires

L'application doit démontrer :

1. le calcul correct des disponibilités d'un professionnel ;
2. la prise et l'annulation d'un rendez-vous ;
3. l'absence de chevauchement, y compris lors de requêtes concurrentes ;
4. la gestion correcte des fuseaux horaires et des changements d'heure ;
5. un parcours client et restaurateur simple à présenter ;
6. une architecture, des migrations et des tests faciles à expliquer ;
7. un démarrage reproductible des quatre images avec Docker Compose.

Les règles détaillées sont réparties entre les documents [`AVAILABILITY_AND_TIMEZONES.md`](AVAILABILITY_AND_TIMEZONES.md), [`APPOINTMENTS.md`](APPOINTMENTS.md) et [`ACCOUNTS_AND_AUTHENTICATION.md`](ACCOUNTS_AND_AUTHENTICATION.md).

## 3. Terminologie

- **Professionnel** : terme utilisé dans le domaine métier et l'API.
- **Restaurateur** : libellé présenté dans l'interface.
- **Client** : personne qui réserve un rendez-vous.
- **Créneau** : heure de début disponible pour un rendez-vous d'une heure.
- **Code public** : identifiant opaque donnant accès à un rendez-vous unique sans connexion.
- **Notification interne** : message conservé et affiché dans l'application à un compte client ou professionnel.

## 4. Acteurs

### Client connecté [Démo]

Le compte client porte le parcours normal de réservation, la consultation de l'ensemble de ses rendez-vous et l'accès à ses notifications internes.

### Professionnel connecté [Démo]

Le professionnel configure ses horaires et indisponibilités, consulte son agenda et gère les rendez-vous qui le concernent.

### Visiteur muni d'un code public [Démo]

Le visiteur agit uniquement sur le rendez-vous correspondant à son code. Il ne possède ni session ni boîte globale de notifications.

Les droits précis de chaque acteur sont définis dans [`ACCOUNTS_AND_AUTHENTICATION.md`](ACCOUNTS_AND_AUTHENTICATION.md).

## 5. Parcours fonctionnels couverts

- inscription et connexion des clients et restaurateurs ;
- configuration des disponibilités et indisponibilités ;
- recherche d'un restaurateur et consultation de ses créneaux ;
- création et annulation d'un rendez-vous ;
- consultation d'un rendez-vous unique par code public ;
- notifications internes ;
- proposition bilatérale de changement de créneau, en objectif secondaire ;
- modification et suppression d'un compte.

La composition et la navigation des interfaces sont décrites uniquement dans [`SCREENS.md`](SCREENS.md).

## 6. Hors périmètre

- SMS, courriels applicatifs et fournisseurs externes de notification ;
- simulation de panne télécom et relance d'envoi ;
- code OTP ou validation par un second canal ;
- notifications push et WebSocket ;
- paiement ;
- rendez-vous de durées variables ;
- rendez-vous récurrents ;
- liste d'attente ;
- synchronisation avec un calendrier externe ;
- export CSV ou autre export de données ;
- archivage et restauration de compte ;
- délai de récupération de 72 heures ;
- scheduler, cron ou image Docker dédiée aux tâches périodiques ;
- authentification de niveau production ;
- application mobile Ionic ou Capacitor ;
- Redis et autres services du starter sans usage dans la démonstration.

Bun n'ajoute aucune fonctionnalité au périmètre, mais reste le runtime du
starter backend actuel. Ce choix d'implémentation appartient à
[`TECHNICAL_DESIGN.md`](TECHNICAL_DESIGN.md).

L'image `04_Script` n'est pas une exception à ce hors-périmètre. Elle exécute
les migrations Prisma une seule fois au démarrage, puis s'arrête normalement.

## 7. Références techniques

- contrat des routes `/auth`, `/v1`, `/health` et `/metrics` :
  [`API.md`](API.md) ;
- schéma Prisma 7 et contraintes PostgreSQL :
  [`DATA_MODEL.md`](DATA_MODEL.md) ;
- modules, services et transactions backend :
  [`BACKEND_MODULES.md`](BACKEND_MODULES.md) ;
- rôles et ordre de démarrage des quatre images :
  [`DOCKER_ARCHITECTURE.md`](DOCKER_ARCHITECTURE.md).
