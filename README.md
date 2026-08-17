# Test technique Delicity

> Statut : démonstration fonctionnelle prête à être exécutée.

Ce projet contient une démonstration de prise de rendez-vous composée d'une
API Bun/Express, d'une interface Vue, d'une base PostgreSQL et d'un job de
migrations.

## Fonctionnalités

- inscription et connexion client ou restaurateur avec sessions PostgreSQL ;
- recherche de restaurateurs et consultation des créneaux sur sept jours ;
- horaires hebdomadaires et indisponibilités exceptionnelles ;
- réservation client et création manuelle par un restaurateur ;
- agenda, historique, annulation et propositions de nouveau créneau ;
- consultation et gestion d'un rendez-vous par code public ;
- notifications internes et gestion du compte ;
- contraintes PostgreSQL contre les chevauchements concurrents ;
- tests d'intégration backend et contrôles automatiques de structure.

Le clone backend correspond au commit :

```text
07d6fc6dd274bdf11506ccc6a5aaf3649dffcc7f
```

Source : <https://github.com/kevinfavv/ExpressStarterDCT>.

## Architecture cible

```text
01_DB/                              image PostgreSQL
02_Back-End/ExpressStarterDCT/      image API Bun/Express
03_Front-End/                       image interface Vue
04_Script/                          image one-shot de migrations
Documentation/                      contexte et spécifications
```

L'ordre de démarrage attendu est : base saine, migrations terminées, backend
sain, puis frontend. L'image scripts s'arrête normalement avec le code `0` ;
elle n'est ni un cron ni un worker métier.

## Choix structurants

- Bun, Express 5, TypeScript ESM, Prisma 7, PostgreSQL et Zod ;
- modèle Prisma `User` du starter conservé et adapté, complété par les
  profils et agrégats métier utiles ;
- Vue 3, Pinia, Bootstrap et Vue I18n ;
- Luxon, déjà présent dans le starter, pour les dates et fuseaux ;
- sessions opaques conservées dans PostgreSQL, sans JWT ;
- notifications internes, sans SMS ni courriel ;
- quatre images démarrées par un fichier Compose racine.

Le socle du starter a été adapté. Ses exemples JWT, Google OAuth, bcrypt,
Redis, BullMQ et S3 ont été retirés du code cible.

## Documentation

- [sommaire du projet](Documentation/Project/SUMMARY.md) ;
- [conception technique](Documentation/Project/TECHNICAL_DESIGN.md) ;
- [modules du backend](Documentation/Project/BACKEND_MODULES.md) ;
- [contrat API](Documentation/Project/API.md) ;
- [modèle de données](Documentation/Project/DATA_MODEL.md) ;
- [architecture Docker](Documentation/Project/DOCKER_ARCHITECTURE.md) ;
- [règles de développement](Documentation/Project/DEV_RULES.md) ;
- [contexte du recrutement](Documentation/Context/Context.md).

## Démarrage

Créer l'environnement local depuis l'exemple si `.env` n'existe pas, puis
lancer les quatre images :

```sh
docker compose up --build
```

Le job `scripts` applique les migrations puis s'arrête normalement avec le
code `0`. Le backend est disponible sur `http://localhost:3000` et le frontend
sur `http://localhost:5173`.

Le seed de démonstration est manuel et idempotent :

```sh
docker compose run --rm scripts bun run seed
```

Il crée les comptes suivants :

| Rôle | Adresse | Mot de passe |
|---|---|---|
| Client | `client@example.test` | `Password` |
| Restaurateur | `restaurant@example.test` | `Password` |

Le restaurateur de démonstration possède des horaires du lundi au vendredi,
de 09:00 à 18:00 dans le fuseau `Europe/Paris`.

Les variables disponibles sont documentées dans `.env.example`. Le fichier
`.env` local est ignoré par Git.

## Parcours fonctionnels complets

Les parcours suivants commencent sur `http://localhost:5173` après le
démarrage de Compose et, pour utiliser les comptes fournis, l'exécution du
seed.

### Créer un compte

1. Depuis la page d'accueil, sélectionner **Créer un compte**.
2. Choisir le rôle **Client** ou **Restaurateur**.
3. Renseigner l'identité, les coordonnées, le mot de passe et le fuseau IANA.
4. Pour un restaurateur, renseigner également un nom commercial unique.
5. Valider avec **S'inscrire**.
6. La session est créée et le tableau de bord correspondant au rôle s'ouvre.

### Se connecter et se déconnecter

1. Sur la page d'accueil, choisir le rôle du compte.
2. Saisir l'adresse électronique et le mot de passe.
3. Cocher éventuellement **Rester connecté** pour prolonger la session.
4. Sélectionner **Se connecter** pour ouvrir le tableau de bord.
5. Utiliser **Déconnexion** dans la barre de navigation pour fermer la
   session courante.

### Simuler la récupération d'un mot de passe

1. Sélectionner **Mot de passe oublié** sur la page de connexion.
2. Choisir le rôle et saisir l'adresse électronique du compte.
3. Sélectionner **Réinitialiser**.
4. Pour cette démonstration uniquement, le mot de passe enregistré est
   affiché directement. Aucun courriel réel n'est envoyé.

### Réserver un rendez-vous comme client

1. Se connecter avec un compte client.
2. Depuis le tableau de bord, sélectionner **Réserver**.
3. Rechercher un restaurateur par son nom commercial.
4. Sélectionner le restaurateur dans les résultats.
5. Parcourir les blocs de sept jours avec **Précédent** et **Suivant**.
6. Sélectionner un créneau disponible dans le fuseau du client.
7. Le rendez-vous d'une heure est créé et sa fiche détaillée s'ouvre.
8. Copier le code public affiché si un accès ultérieur sans connexion est
   souhaité.

Le backend revérifie le créneau au moment de la réservation. Si un autre
client vient de le prendre, l'interface signale le conflit et recharge les
créneaux disponibles.

### Consulter ou annuler un rendez-vous connecté

1. Ouvrir le **Tableau de bord**.
2. Sélectionner la carte du rendez-vous à consulter.
3. Vérifier son état, sa date, son heure et son code public.
4. Sélectionner **Annuler le rendez-vous** puis confirmer.
5. Un restaurateur doit auparavant saisir le motif communiqué au client.

### Consulter un rendez-vous sans compte

1. Sur la page d'accueil, saisir le code dans **Retrouver une réservation**.
2. Sélectionner **Consulter**.
3. La page publique affiche uniquement le rendez-vous correspondant.
4. Depuis cette page, le client peut annuler le rendez-vous, proposer une
   autre date ou répondre à une proposition en attente.

Le code est conservé dans la session du navigateur et n'est pas placé dans
l'URL.

### Définir les disponibilités habituelles

1. Se connecter avec un compte restaurateur.
2. Depuis le tableau de bord, sélectionner **Gérer le calendrier**.
3. Ajouter une ou plusieurs plages, puis choisir le jour et les heures.
4. Retirer les plages devenues inutiles.
5. Sélectionner **Enregistrer**.
6. Si des rendez-vous sont affectés, examiner l'avertissement et confirmer ou
   abandonner la modification.

Après confirmation, les rendez-vous devenus impossibles sont annulés et les
clients concernés reçoivent une notification interne.

### Gérer les indisponibilités exceptionnelles

1. Ouvrir **Gérer le calendrier**, puis **Indisponibilités**.
2. Saisir le début, la fin et, si nécessaire, un motif.
3. Sélectionner **Ajouter**.
4. Si des rendez-vous sont concernés, saisir un motif, puis confirmer leur
   annulation.
5. Pour supprimer une indisponibilité, sélectionner **Retirer** sur la ligne
   correspondante.

Une indisponibilité peut couvrir une partie de journée ou plusieurs jours.

### Créer manuellement un rendez-vous comme restaurateur

1. Se connecter avec un compte restaurateur.
2. Depuis le tableau de bord, sélectionner **Nouveau rendez-vous**.
3. Renseigner le nom, le prénom, l'adresse électronique et le téléphone du
   client.
4. Choisir la date et l'heure du rendez-vous.
5. Sélectionner **Créer**.
6. La disponibilité est contrôlée et la fiche du rendez-vous s'ouvre avec son
   code public.

### Proposer un nouveau créneau

1. Ouvrir la fiche d'un rendez-vous confirmé, avec une session ou son code
   public.
2. Choisir une nouvelle date et une nouvelle heure.
3. Sélectionner **Proposer ce créneau** ou **Proposer**.
4. La proposition apparaît en attente chez les deux parties.
5. Son destinataire peut sélectionner **Accepter** ou **Refuser**.
6. Son auteur peut sélectionner **Retirer**.
7. Lorsqu'il a obtenu l'accord du client par un autre moyen, le restaurateur
   peut sélectionner **Forcer après accord du client** sur sa proposition.

Le créneau est revérifié lors de l'acceptation. Si celui-ci a été réservé
entre-temps, la proposition ne remplace pas le rendez-vous existant.

### Consulter les notifications internes

1. Se connecter puis ouvrir **Notifications** dans la barre de navigation.
2. Consulter les événements liés aux réservations, annulations et
   propositions.
3. Sélectionner une notification pour la marquer comme lue.
4. Utiliser **Tout marquer comme lu** pour traiter la liste entière.

### Modifier ou supprimer son compte

1. Ouvrir **Paramètres** dans la barre de navigation.
2. Modifier le profil ou le fuseau, puis sélectionner
   **Enregistrer le profil**.
3. Pour changer le mot de passe, saisir l'ancien et le nouveau mot de passe,
   puis sélectionner **Modifier le mot de passe**.
4. Pour supprimer le compte, sélectionner
   **Supprimer définitivement mon compte**.
5. Ressaisir le mot de passe, examiner le nombre de rendez-vous concernés et
   confirmer la suppression définitive.

Les rendez-vous futurs concernés sont annulés au cours de la suppression.
Cette opération n'est pas réversible.

## Vérifications

La CI applique les migrations sur une base PostgreSQL, génère le client
Prisma, vérifie TypeScript et les limites de fichiers, puis lance les tests
d'intégration backend et le build frontend.

Les scénarios couvrent notamment les sessions, les calendriers, les
réservations, les propositions, l'accès public, les notifications et les deux
transitions saisonnières du fuseau `Europe/Paris`.

## Avertissement de démonstration

Certaines décisions, notamment le stockage en clair et l'affichage du mot de
passe, sont volontairement limitées à cette démonstration. Elles sont
interdites dans un produit réel et signalées dans les spécifications.
