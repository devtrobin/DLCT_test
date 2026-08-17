# Tests et livrables

> Statut : référence qualité et remise du projet  
> Dernière mise à jour : 17 août 2026  
> Navigation : [`SUMMARY.md`](SUMMARY.md)

## 1. Stratégie

Les tests doivent démontrer les risques principaux du sujet plutôt que rechercher une couverture artificielle. L'ordre de priorité est :

1. intégrité des rendez-vous et concurrence ;
2. calcul des disponibilités ;
3. fuseaux horaires et changements saisonniers ;
4. autorisations et isolation entre comptes ;
5. parcours fonctionnels nécessaires à la démonstration.

## 2. Tests métier prioritaires

### Disponibilités et temps

- plusieurs plages dans une journée ;
- deux plages hebdomadaires qui se chevauchent, détectées avant écriture et par
  la contrainte nommée ;
- journée fermée ;
- indisponibilité ponctuelle et sur plusieurs jours ;
- deux indisponibilités concurrentes qui se chevauchent : une seule réussit ;
- créneau d'une heure généré toutes les quinze minutes ;
- heure locale inexistante omise au passage à l'heure d'été ;
- deux occurrences locales distinguées par leur décalage au retour à l'heure d'hiver ;
- bornes hebdomadaires placées dans l'heure répétée, avec validation de
  l'intervalle réel continu de 60 minutes ;
- rejet d'un instant HTTP possédant une précision autre que trois
  millisecondes ;
- refus d'une création client ou professionnelle hors disponibilité.

La règle attendue pour chaque cas appartient à [`AVAILABILITY_AND_TIMEZONES.md`](AVAILABILITY_AND_TIMEZONES.md).

### Rendez-vous et concurrence

- rendez-vous exactement adjacent à un autre ;
- rendez-vous chevauchant partiellement une réservation ;
- deux réservations concurrentes du même créneau : une seule réussit ;
- rollback sérialisable rejoué avec revalidation, puis
  `CONCURRENT_MODIFICATION` sans effet après trois échecs simulés ;
- acceptation d'une proposition devenue indisponible ;
- affichage, création et acceptation d'un déplacement recouvrant partiellement
  l'ancien créneau : seul le rendez-vous déplacé est ignoré, jamais un autre
  rendez-vous concurrent ;
- deux acceptations concurrentes d'une proposition : une seule transitionne
  depuis `PENDING` ;
- création de proposition contre annulation concurrente : aucune proposition
  `PENDING` ne subsiste sur le rendez-vous annulé ;
- deux créations concurrentes de proposition : une seule reste `PENDING` et la
  contrainte `proposal_one_pending` produit `PROPOSAL_ALREADY_PENDING` ;
- annulation d'un rendez-vous avec proposition en attente : les deux états sont
  modifiés dans la même transaction, sans double notification ;
- annulation libérant immédiatement le créneau ;
- cause d'annulation stable et motif libre conforme à chaque origine ;
- réservation créée entre l'aperçu d'un changement de calendrier et sa
  confirmation : conflit de version, nouvel aperçu, puis aucun rendez-vous non
  affiché n'est annulé ;
- version correcte mais empreinte d'une autre mutation :
  `CALENDAR_IMPACT_CHANGED` sans effet.

La règle attendue pour chaque cas appartient à [`APPOINTMENTS.md`](APPOINTMENTS.md).

## 3. Tests fonctionnels

- inscription des deux rôles par `POST /auth/register`, avec création atomique
  de `User`, du bon profil et de la première session ;
- impossibilité de créer un profil professionnel pour un `User` client, et
  inversement ;
- isolation des rendez-vous et notifications entre comptes ;
- refus d'une origine navigateur non autorisée sur `/auth`, session et code
  public, avec absence d'`Origin` acceptée pour Supertest ;
- corps JSON mal formé et corps supérieur à `100kb` avec codes stables ;
- accès valide, inconnu et révoqué par code public ;
- annulation par session et par code public ;
- mêmes droits du côté client par compte lié ou code public, avec acteur
  d'historique distinct et sans élargissement par un cookie présent ;
- refus des transitions de proposition par le mauvais côté ou depuis un état
  autre que `PENDING` ;
- historique public sans donnée personnelle ni identifiant de compte ;
- acteurs d'historique interactifs distincts des effets automatiques `SYSTEM` ;
- création d'une notification dans la transaction métier ;
- absence de doublon lors de la répétition d'un événement de notification ;
- aperçu puis confirmation d'un changement de calendrier qui annule des
  rendez-vous futurs ;
- lecture d'une notification et lecture globale ;
- aperçu de suppression, changement d'impact avant confirmation, puis
  suppression atomique avec révocation des sessions et annulation des
  rendez-vous futurs ;
- conservation anonymisée des rendez-vous partagés après suppression ;
- anonymisation du nom commercial dans les notifications restantes ;
- suppression définitive des rendez-vous invités devenus inaccessibles ;
- affichage des états de chargement, résultat vide, validation et conflit `409` sur les parcours principaux.

## 4. Infrastructure de test

- Les conventions et outils de test suivent [`DEV_RULES.md`](DEV_RULES.md).
- Les cas d'utilisation et frontières transactionnelles testés suivent
  [`BACKEND_MODULES.md`](BACKEND_MODULES.md).
- Le backend utilise `bun test` et Supertest.
- Le frontend utilise Vitest et Vue Test Utils.
- Les tests unitaires isolent les fonctions de génération et de validation lorsque cela apporte de la lisibilité.
- Les tests d'intégration utilisent l'API et une base PostgreSQL réelle.
- Une base en mémoire ne suffit pas à valider la contrainte d'exclusion.
- Les tests de concurrence envoient réellement plusieurs écritures pour le même créneau.
- Les migrations sont appliquées depuis un état de base vide dans le pipeline de test.
- Le pipeline valide le schéma avec Prisma 7 avant d'appliquer les migrations.
- Le pipeline exécute `bunx prisma generate` avant le typecheck et les tests ;
  il ne dépend jamais d'un client généré suivi par Git.
- La génération reçoit une `DATABASE_URL` factice sans secret si la
  configuration Prisma l'exige, sans connexion réseau à PostgreSQL.
- Le job `scripts` exécute `prisma migrate deploy`, termine avec le code zéro
  et peut être relancé sans modifier une migration déjà appliquée.
- L'image `scripts` génère son client au build afin que sa commande manuelle de
  seed fonctionne, mais sa commande de démarrage reste `migrate deploy` seule.
- Aucun test ou démarrage reproductible ne repose sur `prisma db push`.
- Les données de démonstration sont indépendantes des fixtures de test.

La conception de la base et des migrations se trouve dans
[`DATA_MODEL.md`](DATA_MODEL.md).

## 5. Qualité de l'interface

Les parcours décrits dans [`SCREENS.md`](SCREENS.md) doivent prévoir :

- une interface responsive en français ;
- une navigation au clavier ;
- des libellés associés aux champs ;
- des erreurs de validation placées près des champs ;
- des états de chargement, résultat vide et erreur réseau ;
- une indication accessible des états qui ne repose pas uniquement sur la couleur ;
- des fenêtres modales limitées aux confirmations importantes ou destructives.

## 6. Livrables

- `01_DB/Dockerfile` pour l'image PostgreSQL 18 ;
- `02_Back-End/ExpressStarterDCT/Dockerfile` pour le backend
  Bun/Express/TypeScript fondé sur le commit `07d6fc6…` ;
- `03_Front-End/Dockerfile` pour le frontend Vue.js ;
- `04_Script/Dockerfile` pour le job one-shot de migrations ;
- schéma Prisma 7 et migrations PostgreSQL dans
  `02_Back-End/ExpressStarterDCT/prisma` ;
- tests automatisés pertinents ;
- `compose.yaml` racine démarrant les quatre images ;
- `.env.example` sans secret réel ;
- README de lancement et d'architecture ;
- lockfile propre à chaque paquet Bun, sans workspace racine ;
- commande de seed idempotente documentée ;
- workflow GitHub Actions `.github/workflows/ci.yml` ;
- historique Git lisible.

La commande de seed fournit des comptes, horaires et rendez-vous de
démonstration sans s'exécuter automatiquement au démarrage normal.

Le contrat HTTP livré suit [`API.md`](API.md). Le modèle physique suit
[`DATA_MODEL.md`](DATA_MODEL.md) et la composition des images suit
[`DOCKER_ARCHITECTURE.md`](DOCKER_ARCHITECTURE.md).

## 7. Vérification avant remise

- chaque fichier visé respecte les limites de GEN-001 et GEN-003 ;
- formatage, lint, typecheck et contrôle automatique des limites réussissent ;
- le client Prisma a été généré depuis le schéma canonique avant le typecheck ;
- le workflow GitHub Actions exécute ces contrôles et les tests requis ;
- `docker compose build` construit exactement les images `database`,
  `scripts`, `backend` et `frontend` ;
- depuis un volume PostgreSQL vide, `docker compose up` attend la santé de la
  base, termine les migrations, puis rend le backend et le frontend sains ;
- l'arrêt avec le code zéro du conteneur `scripts` est considéré comme le
  résultat normal du job one-shot ;
- un second démarrage n'altère ni le schéma ni les données existantes ;
- `/health` répond avec succès lorsque PostgreSQL est joignable ;
- `/metrics`, `/auth` et `/v1` respectent le contrat documenté ;
- le navigateur chargé sur `localhost:5173` atteint l'API publiée sur le port
  `3000` avec les cookies de session et la configuration CORS ;
- aucun service Redis ou worker périodique n'est requis ;
- le README permet de lancer la démonstration sans connaissance implicite ;
- les parcours client, restaurateur et code public sont réalisables ;
- les tests prioritaires sont exécutables par une commande documentée ;
- aucun secret réel ni donnée personnelle réelle n'est livré ;
- les compromis de sécurité propres à la démonstration sont clairement signalés ;
- toutes les règles obligatoires de [`DEV_RULES.md`](DEV_RULES.md) sont
  respectées.
