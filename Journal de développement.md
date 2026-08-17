# Journal de développement

## Première partie — cadrage et documentation

J'ai consacré environ quatre heures, le lundi matin, à la préparation de la
documentation du projet.

Les deux premières heures ont servi à organiser les informations disponibles
dans le dossier `Documentation/Context`, puis à concevoir une première version
du besoin, de l'architecture, de l'API et du modèle de données.

Les deux heures suivantes ont été consacrées à l'étude du starter backend
fourni par Delicity. J'ai comparé son modèle Prisma, ses dépendances et son
organisation avec ma première conception. Cette confrontation a permis de
conserver les éléments pertinents du starter et d'adapter le reste au besoin
métier, sans introduire d'outils redondants.

Ce travail préparatoire a notamment permis de formaliser :

- le périmètre de la démonstration et les parcours utilisateur ;
- les rôles client et restaurateur ;
- le modèle de données et ses contraintes PostgreSQL ;
- le contrat et les points d'entrée de l'API ;
- l'organisation des quatre images Docker ;
- les règles de développement et de découpage du code ;
- les choix techniques issus du starter et de l'annonce LinkedIn ;
- les compromis propres à une démonstration, notamment l'authentification.

Cette phase a également permis de fournir à ChatGPT un contexte structuré et
stable avant l'implémentation. Les décisions importantes restent consultables
dans `Documentation/Project`.

## Deuxième partie — étapes de développement

Le développement a été découpé en commits fonctionnels. Chaque commit
laisse le projet dans un état cohérent et facilite la lecture de l'historique
Git.

### 1. `ea5bb35` — initialisation du socle

**Commit :** `chore: initialize Delicity project foundation`

Création du dépôt global et intégration du starter backend fourni au commit
`07d6fc6`. Mise en place de l'architecture à quatre images, de Compose, des
variables d'environnement, des fichiers d'exclusion Git et Docker, ainsi que
de la CI.

Le modèle Prisma initial, ses migrations, le seed de démonstration, les
contrôles de taille des fichiers et les premiers points d'infrastructure ont
également été ajoutés. Ce commit contient enfin toute la documentation de
cadrage et les squelettes du frontend et des services applicatifs.

### 2. `a1552b0` — authentification et comptes

**Commit :** `feat(auth): add sessions and account management`

Implémentation de l'inscription et de la connexion pour les clients et les
restaurateurs. Les sessions opaques sont conservées dans PostgreSQL et peuvent
être prolongées avec l'option « rester connecté ».

Le commit ajoute également la consultation et la modification du profil, le
changement de mot de passe, la récupération simulée du mot de passe et la
suppression définitive du compte avec aperçu des rendez-vous concernés.

### 3. `0baece8` — calendrier et créneaux

**Commit :** `feat(calendar): add availability and slot generation`

Ajout des plages de disponibilité hebdomadaires, avec plusieurs périodes par
jour, et des indisponibilités exceptionnelles. Les changements destructifs
demandent une confirmation lorsque des rendez-vous sont concernés.

La recherche de restaurateurs et la génération de créneaux sur sept jours ont
été ajoutées. Le calcul s'appuie sur Luxon, les fuseaux IANA et les règles
de disponibilité stockées en base.

### 4. `9362d16` — réservations et annulations

**Commit :** `feat(appointments): add booking and cancellation flows`

Implémentation de la réservation par un client et de la création manuelle par
un restaurateur. Les rendez-vous durent une heure et leur disponibilité est
revérifiée lors de l'écriture.

Ce commit ajoute les listes et détails de rendez-vous, l'agenda du
restaurateur et les parcours d'annulation. Les contraintes PostgreSQL
empêchent deux rendez-vous confirmés de se chevaucher, y compris en cas de
requêtes concurrentes.

### 5. `c6bd241` — propositions et accès public

**Commit :** `feat(proposals): add changes and public appointment access`

Ajout des propositions de déplacement d'un rendez-vous. Une proposition peut
être acceptée, refusée ou retirée ; le restaurateur peut aussi forcer son
acceptation après avoir obtenu directement l'accord du client.

Un code public aléatoire permet par ailleurs de consulter et gérer uniquement
le rendez-vous associé, sans créer de compte et sans exposer les informations
privées des autres utilisateurs.

### 6. `dcef751` — notifications internes

**Commit :** `feat(notifications): add internal notification inbox`

Remplacement des notifications par SMS ou courriel par une messagerie interne
à l'application. Les créations, annulations et changements de rendez-vous
produisent des notifications destinées à la partie concernée.

Le commit ajoute la liste des notifications, leur compteur, la lecture d'un
élément et l'action permettant de tout marquer comme lu.

### 7. `84d5dd3` — interface Vue complète

**Commit :** `feat(frontend): add complete appointment application`

Réalisation de l'interface Vue 3 avec Pinia, Vue Router, Bootstrap, Vue I18n
et Luxon. Les écrans couvrent l'authentification, les tableaux de bord, la
recherche, la réservation, le calendrier, les indisponibilités, les
propositions, l'accès public, les notifications et les paramètres du compte.

Les appels API ont été centralisés, les routes protégées selon le rôle et
le build frontend a été intégré à Docker et à la CI.

### 8. `ec98c61` — changements d'heure

**Commit :** `test(time): cover daylight-saving transitions`

Ajout de tests ciblés sur les passages à l'heure d'été et à l'heure
d'hiver. Ils vérifient qu'une heure locale inexistante est rejetée au
printemps et que les deux occurrences d'une heure répétée sont conservées
en automne.

### Validation finale

La validation finale a été effectuée avec les quatre images Docker :

- migrations et seed exécutés avec succès ;
- backend, frontend et PostgreSQL déclarés sains ;
- compilation TypeScript réussie ;
- limites de 100 lignes par fichier et 80 caractères par ligne respectées ;
- 19 tests backend réussis, sans échec ;
- parcours fonctionnels vérifiés manuellement.
