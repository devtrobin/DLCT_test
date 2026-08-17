# Comptes et authentification

> Statut : spécification thématique pour la démonstration  
> Dernière mise à jour : 17 août 2026  
> Navigation : [`SUMMARY.md`](SUMMARY.md)

## 1. Objet et périmètre

Ce document est la source de vérité pour les comptes, les modes d'accès, les autorisations, les sessions et la suppression d'un compte. Les règles propres au cycle de vie d'un rendez-vous, au code public, aux notifications, au modèle physique et aux routes HTTP restent dans leurs thèmes respectifs.

Les comptes clients et professionnels sont un choix **[Démo]** destiné à rendre les parcours et les notifications internes faciles à présenter. Aucun rôle administrateur n'est prévu.

Dans le domaine métier et l'API, le terme **professionnel** est utilisé. L'interface emploie le libellé **restaurateur**.

Le mot **compte** reste le terme fonctionnel. Dans Prisma, il correspond au
modèle `User` fourni par le starter et adapté au projet. Aucun second modèle
physique `Account` n'est créé.

## 2. Modes d'accès et droits

### 2.1 Client connecté [Démo]

Un client connecté peut :

- rechercher un restaurateur par son nom commercial ;
- consulter les créneaux dans le fuseau choisi ;
- réserver un rendez-vous ;
- consulter ses rendez-vous à venir, passés ou annulés ;
- annuler un rendez-vous ;
- proposer un changement de créneau ;
- accepter ou refuser une proposition du restaurateur ;
- consulter ses notifications internes ;
- modifier ou supprimer son compte.

Le compte client constitue le parcours normal de réservation. Ses coordonnées préremplissent le formulaire, mais chaque rendez-vous conserve son propre instantané de contact : une modification ultérieure du profil ne réécrit pas les rendez-vous existants.

### 2.2 Professionnel connecté [Démo]

Chaque professionnel possède un compte distinct. Il peut :

- définir ses disponibilités hebdomadaires ;
- créer et retirer des indisponibilités exceptionnelles ;
- consulter son agenda à la semaine ;
- créer manuellement un rendez-vous pour un client ;
- annuler un rendez-vous avec un motif ;
- proposer, accepter ou refuser un changement de créneau ;
- forcer l'acceptation d'une proposition après une seconde confirmation ;
- consulter ses notifications internes ;
- modifier ou supprimer son compte.

### 2.3 Visiteur muni d'un code public [Démo]

Le détenteur d'un code public peut agir uniquement sur le rendez-vous auquel ce code est associé. Il peut :

- consulter le rendez-vous et son historique ;
- annuler le rendez-vous ;
- proposer un nouveau créneau ;
- accepter ou refuser une proposition du restaurateur ;
- retirer une proposition dont le côté client est l'auteur.

Le code agit comme un secret d'accès. Aucun SMS, courriel ou second code de vérification n'est demandé. Le visiteur ne possède pas de boîte de notifications : les changements sont visibles dans l'état et l'historique de son rendez-vous. La génération, la conservation et la révocation du code relèvent de la spécification des rendez-vous.

Pour les autorisations d'une proposition, la session du client rattaché et le
code public valide authentifient le même côté métier `CLIENT_SIDE`. Ils ne
donnent accès qu'au rendez-vous concerné. L'historique distingue toutefois
l'acteur réel `CLIENT_USER` ou `PUBLIC_CLIENT`. Sur une route publique, le
code reste l'unique autorisation même si un cookie de session est aussi présent.

## 3. Données des comptes

### 3.1 Compte client

Les données obligatoires sont :

- le prénom ;
- le nom ;
- l'adresse électronique ;
- le numéro de téléphone ;
- le mot de passe ;
- le fuseau horaire préféré, initialisé depuis le navigateur et modifiable.

### 3.2 Compte professionnel

Les données obligatoires sont :

- le nom commercial ;
- le prénom ;
- le nom ;
- l'adresse électronique ;
- le numéro de téléphone ;
- le mot de passe ;
- le fuseau horaire IANA, par exemple `Europe/Paris`.

Les règles temporelles applicables au fuseau professionnel sont définies dans [Disponibilités et fuseaux horaires](AVAILABILITY_AND_TIMEZONES.md).

## 4. Validation, unicité et inscription

- L'adresse électronique reçoit une validation syntaxique minimale.
- Le téléphone est une chaîne non vide de 30 caractères au maximum ; aucun format national n'est imposé.
- L'adresse électronique est comparée exactement, sans normalisation automatique.
- Son unicité porte sur le couple `(rôle, adresse)` : une même adresse peut donc posséder un compte client et un compte professionnel.
- Le rôle est explicitement choisi lors de la connexion et de la récupération de mot de passe.
- Le nom commercial est comparé caractère par caractère : une différence de casse ou d'accent produit un nom différent.
- Le nom commercial est unique et peut être modifié tant que sa nouvelle valeur respecte cette unicité.
- Un conflit d'unicité retourne `409 Conflict` et identifie le champ concerné.
- Aucune vérification d'identité ou d'adresse électronique n'est réalisée dans cette démonstration.
- L'inscription rend immédiatement le compte actif.
- Les deux écrans d'inscription appellent `POST /auth/register` avec un rôle
  explicite. La création de `User`, de son profil et de sa première session est
  atomique ; une inscription réussie connecte immédiatement l'utilisateur.
- Les inscriptions et tentatives de connexion ne sont pas limitées dans cette démonstration.

## 5. Sessions

- L'authentification utilise une session opaque conservée dans PostgreSQL, sans JWT.
- Le cookie de session est `HttpOnly` et `SameSite=Lax`.
- Une session ordinaire expire huit heures après la connexion.
- L'option « Rester connecté » porte cette durée à trente jours.
- L'expiration est fixe à partir de la connexion, sans prolongation à chaque requête.
- Plusieurs sessions simultanées sont autorisées.
- La déconnexion révoque uniquement la session courante.
- Chaque route protégée vérifie la session, le rôle et la propriété de la ressource.

Le modèle `Session` reprend la structure utile du `RefreshToken` fourni
(`userId`, jeton opaque, expiration et date de création), mais ne contient ni
JWT ni mécanisme de rafraîchissement. `ForgotPasswordRequest` et les routes de
réinitialisation par jeton ne sont pas utilisés.

Les statuts HTTP et les formes de réponse sont centralisés dans le
[`contrat API`](API.md#13-catalogue-des-erreurs).

## 6. Modification d'un compte

- Chaque section du profil est enregistrée explicitement.
- Une nouvelle adresse électronique doit respecter les mêmes règles de validation et d'unicité que lors de l'inscription.
- Après son enregistrement, la nouvelle adresse est utilisée lors de la prochaine connexion.
- Un changement de mot de passe exige l'ancien mot de passe, le nouveau et sa confirmation.
- Une modification des coordonnées du client ne réécrit pas les instantanés des rendez-vous existants.
- La modification du fuseau professionnel suit les restrictions définies dans [`AVAILABILITY_AND_TIMEZONES.md`](AVAILABILITY_AND_TIMEZONES.md#9-modification-du-fuseau-professionnel-démo).

## 7. Compromis de sécurité propres à la démonstration

Pour limiter volontairement le parcours d'authentification de la démonstration :

- le mot de passe est stocké en clair ;
- la page « Mot de passe oublié » affiche directement le mot de passe enregistré après saisie de l'adresse et sélection du rôle ;
- une adresse inconnue pour ce rôle affiche « Aucun compte trouvé ».

Un avertissement visible précise que ce comportement est strictement réservé à la démonstration. Dans un projet réel, aucun mot de passe existant ne doit être lisible ou affiché. Il faudrait au minimum employer un algorithme adaptatif de hachage avec sel, un jeton de réinitialisation temporaire à usage unique, une vérification de l'adresse, une limitation des tentatives et des protections contre les abus.

## 8. Suppression d'un compte [Démo]

La suppression est immédiate et irréversible. Il n'existe ni export, ni archivage, ni restauration, ni suppression différée.

L'opération suit une seule transaction métier :

1. l'utilisateur saisit à nouveau son mot de passe pour demander un aperçu ;
2. l'API retourne le nombre de rendez-vous futurs concernés et une empreinte ;
3. la confirmation destructive répète le mot de passe et cette empreinte ;
4. le backend verrouille les calendriers concernés dans l'ordre de leur
   identifiant et recalcule l'impact ;
5. si l'impact a changé, rien n'est supprimé et un nouvel aperçu est demandé ;
6. les propositions encore en attente sont annulées ;
7. les rendez-vous futurs sont annulés ;
8. les comptes encore actifs concernés reçoivent une notification interne ;
9. tous les codes publics liés au compte supprimé sont révoqués ;
10. le `User`, son profil, ses sessions et ses propres notifications sont
    supprimés.

Ces annulations utilisent `cancellationCause = ACCOUNT_DELETED` et aucun texte
français persistant.

Les rendez-vous partagés avec une contrepartie authentifiée restent visibles
dans l'historique de son compte. Leur clé étrangère devient nulle, leurs données
personnelles deviennent nulles et un indicateur d'anonymisation est activé. Le
frontend traduit cet état en « Client supprimé » ou « Restaurateur supprimé » ;
ces phrases ne sont pas persistées. Les auteurs d'historique suivent la même
règle à partir de leur type et de leur FK devenue nulle.

Si un professionnel supprimé ne possédait qu'un rendez-vous invité, il n'existe aucune contrepartie authentifiée à prévenir ou à laquelle conserver un historique. Après révocation du code, ce rendez-vous et son historique sont donc supprimés définitivement dans la même transaction.

Ce mécanisme ne permet ni connexion ni restauration et ne constitue pas une archive du compte. Une notification conservée reste lisible si sa ressource liée n'est plus accessible, mais n'affiche alors aucun lien.

Les états de rendez-vous, les instantanés conservés et les effets précis de l'annulation sont définis dans [Rendez-vous et changements de créneau](APPOINTMENTS.md). Les relations nullables et les stratégies de suppression sont définies dans le [modèle de données](DATA_MODEL.md#11-suppression-dun-utilisateur).
