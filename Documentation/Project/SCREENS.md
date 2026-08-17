# Écrans du projet

> Statut : parcours fonctionnel de la démonstration  
> Dernière mise à jour : 17 août 2026  
> Navigation : [`SUMMARY.md`](SUMMARY.md)

## 1. Objectif

Ce document décrit les écrans nécessaires pour démontrer le parcours complet sans transformer le test technique en produit commercial. Les écrans sont regroupés lorsque leurs différences sont faibles et les confirmations simples restent des fenêtres modales plutôt que de nouvelles pages.

L'interface est en français, responsive et utilisable au clavier.

Les règles affichées par ces écrans appartiennent aux documents suivants :

- comptes, sessions et suppression : [`ACCOUNTS_AND_AUTHENTICATION.md`](ACCOUNTS_AND_AUTHENTICATION.md) ;
- créneaux, disponibilités et fuseaux : [`AVAILABILITY_AND_TIMEZONES.md`](AVAILABILITY_AND_TIMEZONES.md) ;
- réservation, annulation et propositions : [`APPOINTMENTS.md`](APPOINTMENTS.md) ;
- cloche et listes de notifications : [`NOTIFICATIONS.md`](NOTIFICATIONS.md).

## 2. Conventions communes

### 2.1 Terminologie visible

- **Restaurateur** est utilisé dans l'interface.
- **Professionnel** reste le terme du modèle métier et de l'API.
- Une réservation est appelée **rendez-vous**.
- L'action sur un rendez-vous existant est **Annuler**, jamais **Supprimer**.
- La suppression désigne uniquement la suppression définitive d'un compte.

### 2.2 En-tête connecté

Les espaces client et restaurateur possèdent un en-tête commun avec :

- le nom ou logo de l'application ;
- les liens adaptés au rôle ;
- une cloche de notifications avec le nombre d'éléments non lus ;
- un accès aux paramètres du compte ;
- un bouton « Se déconnecter ».

La cloche ouvre un panneau des notifications récentes. Un lien « Voir toutes les notifications » conduit vers la page complète.

### 2.3 Retour visuel

- confirmé et sans anomalie : apparence normale ;
- proposition en attente : orange avec une explication ;
- annulé : gris avec le libellé barré lorsque cela reste lisible ;
- conflit ou action devenue impossible : rouge ;
- succès : message de confirmation non bloquant ;
- validation : message placé sous le champ concerné.

Une information affichée au survol est aussi disponible au focus clavier et au toucher. Les fenêtres modales sont réservées aux confirmations importantes ou destructives et aux messages sensibles qui exigent l'attention de l'utilisateur.

## 3. Carte de navigation

```text
Accueil
├── Connexion client
│   ├── Inscription client
│   └── Mot de passe oublié client
├── Connexion restaurateur
│   ├── Inscription restaurateur
│   └── Mot de passe oublié restaurateur
└── Accès à un rendez-vous par code

Espace client
├── Tableau de bord
├── Recherche de restaurateurs
│   └── Créneaux disponibles
│       ├── Confirmation de réservation
│       └── Succès et code public
├── Mes rendez-vous
│   └── Détail et historique
├── Notifications
└── Paramètres du compte

Espace restaurateur
├── Agenda hebdomadaire
│   └── Détail d'un rendez-vous
├── Création manuelle d'un rendez-vous
├── Disponibilités hebdomadaires
├── Indisponibilités exceptionnelles
├── Notifications
└── Paramètres du compte

Accès public
└── Rendez-vous unique par code
```

## 4. Écrans publics

### Écran P-01 — Accueil et connexion

#### But

Donner accès aux trois parcours d'entrée sans mélanger leurs formulaires.

#### Contenu

Un groupe d'onglets accessible propose :

1. **Client**, sélectionné par défaut ;
2. **Restaurateur** ;
3. **Rendez-vous par code**.

#### Onglet Client

- adresse électronique ;
- mot de passe ;
- case « Rester connecté » ;
- bouton « Se connecter » ;
- lien « Mot de passe oublié » ;
- lien « Créer un compte client ».

Une connexion réussie redirige vers le tableau de bord client.

#### Onglet Restaurateur

- adresse électronique ;
- mot de passe ;
- case « Rester connecté » ;
- bouton « Se connecter » ;
- lien « Mot de passe oublié » ;
- lien « Créer un compte restaurateur ».

Une connexion réussie redirige vers l'agenda restaurateur.

#### Onglet Rendez-vous par code

- code public du rendez-vous ;
- bouton « Consulter le rendez-vous ».

Un code valide ouvre l'écran P-05. Un code inconnu ou révoqué affiche un message générique sans révéler d'autre information.

Après validation, le frontend conserve le code en mémoire et dans
`sessionStorage` pour permettre un rafraîchissement de P-05. Il ne l'enregistre
ni dans l'URL, ni dans `localStorage`, ni dans un journal. Fermer l'onglet met
fin à cette conservation locale.

Si un utilisateur déjà connecté ouvre cette page, un raccourci vers son espace est affiché sans masquer les trois onglets. Il peut ainsi consulter un autre rendez-vous par code sans se déconnecter.

### Écran P-02 — Inscription client

#### Champs

- prénom ;
- nom ;
- adresse électronique ;
- numéro de téléphone ;
- mot de passe ;
- fuseau horaire préféré, prérempli avec celui du navigateur ;
- bouton « Créer mon compte ».

Les erreurs sont affichées sous les champs. Après succès, un message confirme la création, une session est ouverte et le client est redirigé vers son tableau de bord.

Un avertissement discret commun aux deux inscriptions rappelle que le mot de passe est volontairement géré de manière non sécurisée pour cette démonstration.

### Écran P-03 — Inscription restaurateur

#### Champs

- nom commercial ;
- prénom ;
- nom ;
- adresse électronique ;
- numéro de téléphone ;
- mot de passe ;
- fuseau horaire IANA ;
- bouton « Créer mon compte restaurateur ».

Le fuseau est prérempli depuis le navigateur, mais reste modifiable. Après succès, une session est ouverte et le restaurateur est redirigé vers son agenda.

Le même avertissement de démonstration sur la gestion non sécurisée du mot de passe que sur l'inscription client est affiché.

### Écran P-04 — Mot de passe oublié

Le même composant est utilisé pour les deux rôles ; le rôle sélectionné est clairement rappelé.

#### Contenu

- adresse électronique ;
- bouton « Afficher mon mot de passe » ;
- lien de retour à la connexion.

Si le compte existe pour le rôle demandé, le mot de passe enregistré est affiché directement dans un encadré ou une fenêtre modale avec le message :

> Pour les besoins de cette démonstration, le parcours sécurisé de réinitialisation n'est pas implémenté. Un véritable projet ne doit jamais afficher ni stocker un mot de passe en clair.

Sinon, l'écran affiche « Aucun compte trouvé ».

Il ne prétend jamais qu'un SMS ou un courriel a été envoyé.

### Écran P-05 — Rendez-vous unique par code

#### But

Permettre au détenteur du code, connecté ou non, de gérer uniquement le rendez-vous associé.

#### Contenu

- nom commercial du restaurateur ;
- état du rendez-vous ;
- date, heure et fuseau affiché ;
- durée ;
- aucune coordonnée personnelle du client ;
- proposition en attente éventuelle ;
- comparaison du créneau actuel et du créneau proposé, avec fuseau et décalage UTC ;
- historique sous forme de chronologie ;
- bouton « Proposer un autre créneau », qui ouvre le sélecteur transversal T-04 ;
- bouton « Annuler ma proposition » lorsque le côté client en est l'auteur ;
- boutons « Accepter » et « Refuser » si une proposition du restaurateur attend une réponse ;
- bouton « Annuler le rendez-vous ».

Il n'y a ni emploi du temps hebdomadaire ni navigation vers d'autres rendez-vous. Une fois le rendez-vous annulé, la page reste consultable en lecture seule, sauf si le code est ensuite révoqué par la suppression d'un compte lié.

## 5. Espace client

### Écran C-01 — Tableau de bord

#### Contenu

- recherche rapide par nom commercial ;
- prochain rendez-vous mis en avant, s'il existe ;
- liste courte des rendez-vous à venir ;
- dernières notifications internes ;
- raccourcis « Tous mes rendez-vous » et « Rechercher un restaurateur ».

Les états vides expliquent clairement comment effectuer une première réservation.

### Écran C-02 — Recherche de restaurateurs

#### Contenu

- champ « Nom commercial » ;
- bouton « Rechercher » ;
- liste de résultats triée par nom commercial ;
- pour chaque résultat : nom, fuseau du restaurateur et bouton « Voir les créneaux ».

Une recherche sans résultat affiche un message, sans redirection automatique ni création implicite.

### Écran C-03 — Créneaux disponibles

#### En-tête

- nom commercial du restaurateur ;
- fuseau d'affichage du client, prérempli depuis son profil ou son navigateur ;
- sélection d'un autre fuseau IANA ;
- période de sept jours ;
- boutons « 7 jours précédents » et « 7 jours suivants ».

Le bouton précédent est désactivé lorsqu'il conduirait à une période entièrement passée.

#### Liste

- regroupement des créneaux par date locale ;
- heures de début clairement sélectionnables ;
- nom ou abréviation du fuseau affiché ;
- décalage UTC affiché lorsque deux occurrences possèdent la même heure locale au retour à l'heure d'hiver ;
- message pour les journées sans créneau ;
- bouton « Continuer » après sélection.

Aucun créneau passé n'est cliquable. L'heure courante est arrondie au prochain quart d'heure.

### Écran C-04 — Confirmation de réservation

#### Contenu

- récapitulatif du restaurateur ;
- date, heure, fuseau et durée ;
- prénom, nom, téléphone et adresse électronique préremplis en lecture seule depuis le compte ;
- lien « Modifier mes coordonnées » vers les paramètres ;
- bouton « Confirmer le rendez-vous » ;
- lien « Choisir un autre créneau ».

Si le créneau a été réservé entre la sélection et la confirmation, un message rouge l'explique et renvoie à la liste actualisée.

### Écran C-05 — Réservation réussie

#### Contenu

- confirmation du rendez-vous ;
- récapitulatif ;
- code public affiché de manière visible ;
- bouton « Copier le code » ;
- avertissement demandant de conserver ce code comme un secret ;
- bouton « Voir le rendez-vous » ;
- bouton « Retour à mon espace ».

Aucun QR code, fichier ou envoi externe n'est prévu.

### Écran C-06 — Mes rendez-vous

Deux sections ou onglets présentent :

1. les rendez-vous à venir, du plus proche au plus lointain ;
2. les rendez-vous passés et annulés, du plus récent au plus ancien.

Chaque ligne affiche le restaurateur, la date, l'heure, le fuseau, l'état et un bouton « Voir le détail ». Cette page n'utilise pas une navigation par semaines : elle liste uniquement les rendez-vous du client connecté.

### Écran C-07 — Détail d'un rendez-vous client

#### Contenu

- récapitulatif complet ;
- code public avec bouton « Copier » ;
- état actuel ;
- proposition en attente éventuelle ;
- comparaison côte à côte du créneau actuel et du créneau proposé, avec fuseau et durée ;
- historique sous forme de chronologie ;
- actions autorisées selon l'état.

#### Actions

- « Proposer un autre créneau », qui ouvre le sélecteur transversal T-04 ;
- « Annuler ma proposition » si le client en est l'auteur ;
- « Accepter » ou « Refuser » une proposition du restaurateur ;
- « Annuler le rendez-vous » après confirmation.

Un rendez-vous annulé reste consultable, sans action de modification.

### Écran C-08 — Notifications client

#### Contenu

- compteur de notifications non lues ;
- bouton « Tout marquer comme lu » ;
- bouton « Actualiser » ;
- liste de la plus récente à la plus ancienne ;
- titre, message, date et indicateur lu/non lu ;
- lien vers le rendez-vous concerné lorsqu'il existe.

Les notifications ne peuvent pas être supprimées manuellement dans la démonstration.

### Écran C-09 — Paramètres du compte client

#### Sections

- identité et coordonnées ;
- fuseau horaire préféré ;
- mot de passe ;
- suppression du compte.

Chaque section possède son bouton d'enregistrement et affiche ses erreurs d'unicité près des champs. Le changement de mot de passe demande l'ancien mot de passe, le nouveau et sa confirmation. Après un changement d'adresse électronique, cette nouvelle adresse est utilisée à la prochaine connexion.

La zone destructive exige une nouvelle saisie du mot de passe. Elle demande
d'abord l'aperçu à l'API, puis affiche une confirmation indiquant le nombre de
rendez-vous futurs annulés, le caractère immédiat de la suppression et
l'absence de restauration ou d'export. Si l'impact change avant la confirmation,
la suppression est interrompue et le nouvel aperçu est affiché.

## 6. Espace restaurateur

### Écran R-01 — Agenda hebdomadaire

#### Contenu

- semaine civile du lundi au dimanche ;
- boutons semaine précédente, aujourd'hui et semaine suivante ;
- nom et fuseau du restaurateur ;
- grille des rendez-vous ;
- case « Afficher les rendez-vous annulés », désactivée par défaut ;
- bouton « Créer un rendez-vous » ;
- accès à la gestion des disponibilités et indisponibilités.

Les rendez-vous confirmés utilisent l'apparence normale. Une proposition en attente ajoute un indicateur orange. Les rendez-vous annulés peuvent apparaître en gris si leur affichage est activé. Le rouge est réservé aux conflits et erreurs véritables.

Un rendez-vous s'ouvre dans un panneau latéral ou une modale de détail ; une nouvelle route n'est pas obligatoire.

### Écran R-02 — Détail d'un rendez-vous restaurateur

#### Contenu

- identité et coordonnées enregistrées pour le client ;
- date, heure, fuseau, durée et état ;
- proposition en attente éventuelle ;
- comparaison côte à côte du créneau actuel et du créneau proposé, avec fuseau et durée ;
- historique en chronologie.

#### Actions

- proposer un autre créneau avec le sélecteur transversal T-04 ;
- accepter ou refuser une proposition du client ;
- annuler sa propre proposition ;
- forcer une acceptation après une seconde confirmation ;
- annuler le rendez-vous avec motif obligatoire.

### Écran R-03 — Création manuelle d'un rendez-vous

#### Contenu minimal

- choix de la date et d'un créneau réellement disponible ;
- prénom du client ;
- nom du client ;
- téléphone ;
- adresse électronique ;
- récapitulatif ;
- bouton « Créer le rendez-vous ».

Après succès, le rendez-vous est immédiatement confirmé et le code public est affiché avec un bouton « Copier ».

Le formulaire ne propose pas deux modes différents : si l'adresse saisie correspond exactement à un compte client, le rendez-vous lui est automatiquement rattaché et une notification interne est créée. Sinon, il reste invité et le restaurateur transmet directement le code public. Dans tous les cas, seuls les créneaux réellement disponibles sont proposés et un conflit concurrent retourne à la liste actualisée.

### Écran R-04 — Disponibilités hebdomadaires

#### Contenu

- sept sections, du lundi au dimanche ;
- état « Fermé » pour une journée sans plage ;
- ajout et retrait de plusieurs plages ;
- champs heure de début et heure de fin ;
- bouton « Enregistrer la semaine ».

Les chevauchements et plages traversant minuit sont signalés avant l'envoi. Si
un changement touche des rendez-vous futurs, une fenêtre affiche la liste et
demande confirmation. La cause `SCHEDULE_CHANGED` y est traduite par Vue I18n
en « Modification des horaires du restaurateur ».

### Écran R-05 — Indisponibilités exceptionnelles

#### Contenu

- liste des indisponibilités futures ;
- date et heure de début ;
- date et heure de fin ;
- aperçu avec le fuseau du restaurateur ;
- motif facultatif tant qu'aucun rendez-vous n'est touché ;
- bouton « Ajouter l'indisponibilité » ;
- action « Supprimer » sur une indisponibilité existante.

Si des rendez-vous sont concernés, l'interface les liste, rend le motif obligatoire et demande une confirmation explicite. Il n'existe pas d'écran d'édition : il faut supprimer puis recréer.

Pour ces deux écrans, si l'impact change avant la confirmation finale,
l'opération est interrompue. La fenêtre affiche la nouvelle liste et demande
une nouvelle confirmation ; aucun rendez-vous absent de l'aperçu n'est annulé.

### Écran R-06 — Notifications restaurateur

Même structure que l'écran C-08, avec notamment les nouvelles réservations, annulations et propositions de clients.

### Écran R-07 — Paramètres du compte restaurateur

#### Sections

- nom commercial ;
- identité et coordonnées ;
- fuseau horaire IANA ;
- mot de passe ;
- suppression du compte.

Le fuseau n'est modifiable que s'il n'existe aucun rendez-vous futur confirmé. Sinon, l'écran explique pourquoi le champ est bloqué.

Chaque section possède son bouton d'enregistrement et affiche les erreurs d'unicité près des champs. Le changement de mot de passe demande l'ancien mot de passe, le nouveau et sa confirmation. Après un changement d'adresse électronique, cette nouvelle adresse est utilisée à la prochaine connexion.

La suppression exige une nouvelle saisie du mot de passe et un aperçu fourni
par l'API. La confirmation destructive indique le nombre de rendez-vous futurs
annulés. Si ce nombre ou la liste change, elle doit être confirmée de nouveau.
La suppression est immédiate et ne propose ni export, ni archivage, ni
restauration.

## 7. Écrans et états transversaux

### Écran T-01 — Notifications récentes

Panneau partagé accessible depuis la cloche :

- cinq notifications récentes ;
- mise en évidence des non-lues ;
- ouverture du rendez-vous lié ;
- action individuelle « Marquer comme lu » ;
- bouton « Actualiser » pour voir les événements produits depuis le chargement de la page ;
- lien vers la liste complète.

Si la ressource liée n'est plus accessible, le texte de la notification reste visible mais aucun lien n'est affiché.

### Écran T-02 — Session expirée

Un message explique que la session a expiré et renvoie vers le bon onglet de connexion. Une action en cours n'est pas présentée comme réussie.

### Écran T-03 — Page introuvable

Message simple et lien de retour vers l'accueil ou l'espace connecté.

### Écran T-04 — Sélection d'un nouveau créneau

Ce panneau ou cette page réutilise le calcul de disponibilités de l'écran C-03 en mode « proposition ».

Il appelle la route contextuelle du rendez-vous connecté ou son équivalent
protégé par `X-Public-Code`. Le calcul ignore uniquement le rendez-vous déplacé
et ne transmet jamais son identifiant par le parcours public.

- période de sept jours navigable ;
- fuseau d'affichage et décalage UTC si nécessaire ;
- créneaux réellement disponibles au moment du chargement ;
- rappel du créneau actuel ;
- comparaison finale entre créneau actuel et créneau proposé ;
- bouton « Envoyer la proposition ».

La sélection ne réserve pas le nouveau créneau. Le backend vérifie sa
disponibilité lors de l'envoi afin de refuser une proposition déjà impossible,
puis la vérifie de nouveau lors de l'acceptation.

### États à prévoir sur tous les écrans de données

- chargement ;
- aucun résultat ;
- erreur réseau ;
- erreur de validation ;
- conflit `409` ;
- accès interdit ou session expirée.

Lorsqu'un résumé renvoie `clientDeleted` ou `professionalDeleted`, ou que le
détail renvoie le booléen `deleted` de la partie, le frontend affiche la
traduction correspondante et ne tente pas de reconstruire un nom à partir des
champs devenus `null`.

## 8. Décisions d'interface déjà tranchées

| Question | Décision |
|---|---|
| Faut-il trois pages d'accueil séparées ? | Non, un seul écran avec trois onglets accessibles. |
| Quel onglet est sélectionné au départ ? | Client. |
| Que faire si l'utilisateur est déjà connecté ? | Afficher un raccourci vers son espace tout en laissant l'accès aux trois onglets. |
| Faut-il l'option « Rester connecté » pour les deux rôles ? | Oui. |
| Faut-il envoyer le mot de passe oublié par courriel ? | Non, il est affiché directement avec l'avertissement de démo. |
| Comment afficher les erreurs de formulaire ? | Près des champs, pas dans une succession de fenêtres modales. |
| Comment chercher un restaurateur ? | Par nom commercial. |
| Quelle vue de calendrier restaurateur ? | Une vue semaine du lundi au dimanche. |
| Quelle vue pour les rendez-vous client ? | Une liste séparant à venir et passés/annulés. |
| La page publique affiche-t-elle une semaine ? | Non, uniquement son rendez-vous. |
| Comment présenter l'historique ? | Sous forme de chronologie. |
| Faut-il un QR code ou télécharger le code public ? | Non, un bouton Copier suffit. |
| Faut-il une page de notifications ? | Oui, complétée par un panneau depuis la cloche. |
| Les notifications sont-elles en temps réel ? | Non, elles sont rechargées avec les pages, après les actions ou via « Actualiser ». |
| Faut-il pouvoir supprimer une notification ? | Non dans la démonstration. |
| Où utiliser des fenêtres modales ? | Pour les confirmations importantes ou destructives. |
| Quelle couleur utiliser pour une proposition en attente ? | Orange. |
| Quelle couleur utiliser pour une annulation ? | Gris. |
| Que signifie le rouge ? | Un conflit ou une erreur réelle, pas une attente. |
| L'interface est-elle multilingue ? | Non, français uniquement. |

## 9. Questions d'écran restant à arbitrer

Aucun arbitrage bloquant n'est identifié à ce stade. Les décisions déjà rendues sont recensées dans [`DECISIONS.md`](DECISIONS.md) ; leurs règles complètes restent dans les documents thématiques liés en introduction.
