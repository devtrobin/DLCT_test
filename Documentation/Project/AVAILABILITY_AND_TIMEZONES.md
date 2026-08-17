# Disponibilités, créneaux et fuseaux horaires

> Statut : spécification thématique pour la démonstration  
> Dernière mise à jour : 17 août 2026  
> Navigation : [`SUMMARY.md`](SUMMARY.md)

## 1. Objet et périmètre

Ce document est la source de vérité pour les disponibilités hebdomadaires, les indisponibilités exceptionnelles, la génération des créneaux et les conversions de fuseau horaire. Il porte les règles temporelles **[Imposé]** du test.

Le cycle de vie d'un rendez-vous, la contrainte anti-chevauchement en base, le contenu des notifications, le modèle physique et les routes HTTP restent définis dans leurs thèmes respectifs.

## 2. Conventions temporelles [Imposé]

- Une plage ou un rendez-vous utilise l'intervalle semi-ouvert `[début, fin)`.
- Les fuseaux sont des identifiants IANA valides, jamais de simples décalages fixes.
- Le backend est l'autorité pour les conversions et le calcul des créneaux.
- Les horaires hebdomadaires sont des jours de semaine et des heures locales du professionnel.
- Les rendez-vous et indisponibilités sont des instants absolus conservés avec le type PostgreSQL `timestamptz`.
- Les écrans affichent l'heure locale ainsi que le nom ou l'abréviation du fuseau utilisé.
- Le fuseau d'affichage du client est initialisé depuis son profil ou son navigateur et peut être changé pour une recherche.
- La durée d'un rendez-vous est fixée à 60 minutes réelles à partir de son instant de début, y compris pendant une transition saisonnière.

## 3. Disponibilités hebdomadaires [Imposé]

Le professionnel définit zéro, une ou plusieurs plages pour chacun des sept jours de la semaine.

Exemple :

```text
lundi : 09:00-12:00 et 14:00-18:00
mardi : fermé
```

Règles retenues :

- les heures sont interprétées dans le fuseau IANA du professionnel ;
- le début doit être strictement antérieur à la fin ;
- deux plages d'une même journée ne peuvent pas se chevaucher ;
- les plages adjacentes restent distinctes ;
- une plage ne traverse pas minuit et doit, si nécessaire, être divisée entre deux jours ;
- un chevauchement retourne `WEEKLY_AVAILABILITY_CONFLICT`, y compris s'il
  est détecté par la contrainte PostgreSQL ;
- aucune limite arbitraire du nombre de plages n'est imposée ;
- un jour sans plage représente une fermeture ;
- la semaine complète est enregistrée dans une seule transaction ;
- un conflit d'édition concurrente retourne `409 Conflict`.

Les changements prennent effet immédiatement. Leur effet éventuel sur des rendez-vous futurs est traité une seule fois dans la section [Impact sur les rendez-vous confirmés](#6-impact-sur-les-rendez-vous-confirmés).

## 4. Indisponibilités exceptionnelles [Imposé]

Le professionnel peut créer une indisponibilité de quelques minutes ou heures, d'une journée entière ou de plusieurs jours.

Règles retenues :

- la saisie et l'aperçu utilisent le fuseau du professionnel et en affichent le nom ;
- le début doit être strictement antérieur à la fin ;
- une indisponibilité est autorisée même hors des horaires habituels ;
- deux indisponibilités qui se chevauchent sont refusées pour garder le comportement lisible ;
- ce refus utilise `UNAVAILABILITY_CONFLICT`, y compris pour une création
  concurrente détectée par PostgreSQL ;
- sa suppression recalcule immédiatement les créneaux ;
- sa modification directe est hors périmètre : le professionnel la supprime puis la recrée.

Son effet éventuel sur des rendez-vous futurs est traité dans la section suivante.

## 5. Paramètres de consultation des créneaux

- La génération utilise la durée réelle définie dans les [conventions temporelles](#2-conventions-temporelles-imposé).
- Pas entre deux heures de début proposées : **15 minutes**.
- Fenêtre affichée : **sept journées calendaires locales consécutives dans le
  fuseau d'affichage demandé**.
- Le paramètre `from` est une date `YYYY-MM-DD` dans ce même fuseau, jamais un
  instant UTC ambigu.
- Premier affichage : à partir de la date locale de la visite dans le fuseau
  d'affichage choisi.
- Navigation : blocs précédent et suivant, sans horizon futur maximal dans la démonstration.
- Aucun créneau antérieur à l'instant présent n'est réservable.
- Pour le jour courant, le premier départ est le prochain quart d'heure strictement postérieur à l'instant présent ; à 10:15 exactement, il s'agit donc de 10:30.
- Aucun délai minimal supplémentaire n'est imposé avant une réservation.

Un résultat vide affiche un message explicite et laisse l'utilisateur naviguer manuellement. L'application ne saute pas vers la prochaine semaine disponible.

Pour une proposition de déplacement, la génération reçoit l'identifiant du
rendez-vous autorisé et ignore uniquement son intervalle actuel. Ce contexte
n'est disponible que par les routes de proposition authentifiées ou protégées
par le code public ; la recherche publique générale ne permet jamais de
soustraire arbitrairement un rendez-vous.

Le même paramètre interne est obligatoire lors de la création, de
l'acceptation et du forçage de la proposition. Ces étapes recalculent les
contraintes au lieu de faire confiance au résultat précédemment affiché.

## 6. Impact sur les rendez-vous confirmés

Lorsqu'une modification des horaires hebdomadaires ou une indisponibilité rend des rendez-vous futurs impossibles :

1. l'interface affiche les rendez-vous concernés ;
2. aucune annulation n'a lieu avant une confirmation explicite du professionnel ;
3. les rendez-vous sont annulés atomiquement avec la modification du calendrier ;
4. leur éventuelle proposition `PENDING` devient `CANCELED` dans la même
   transaction ;
5. chaque client concerné possédant un compte reçoit une notification interne ;
6. un visiteur sans compte retrouve l'annulation et sa cause dans l'état et l'historique accessibles par son code public.

Si le calendrier change entre l'aperçu et la confirmation, aucune modification
n'est appliquée. Un conflit de version fait relancer automatiquement une
requête d'aperçu non confirmante ; l'interface affiche alors la nouvelle liste
et demande une nouvelle confirmation afin de ne jamais annuler un rendez-vous
non présenté.

La cause dépend de l'opération :

- une modification des horaires utilise la cause stable `SCHEDULE_CHANGED`,
  traduite par Vue I18n ; aucun motif français n'est persisté ;
- une indisponibilité utilise la cause `UNAVAILABILITY` et, si elle recouvre au
  moins un rendez-vous, exige un motif saisi par le professionnel et communiqué
  aux clients concernés.

Les statuts et l'historique d'annulation appartiennent à [Rendez-vous et changements de créneau](APPOINTMENTS.md). Le format et la conservation des messages appartiennent aux [Notifications internes](NOTIFICATIONS.md).

## 7. Algorithme de génération des créneaux [Imposé]

Pour chaque date demandée, le backend :

1. interprète les plages hebdomadaires dans le fuseau du professionnel ;
2. les projette en instants absolus en tenant compte de l'heure d'été ou d'hiver ;
3. génère les débuts possibles toutes les quinze minutes ;
4. retire les créneaux qui dépassent une plage ;
5. retire ceux touchés par une indisponibilité ;
6. retire ceux chevauchant un rendez-vous confirmé ;
7. retourne les instants ainsi que les informations nécessaires à leur affichage dans le fuseau choisi par le client.

Le backend examine toutes les dates locales du professionnel dont les instants
recouvrent les sept dates demandées. Cette règle évite de perdre un créneau
lorsque le client et le professionnel ne sont pas dans le même jour civil.

Une création de rendez-vous, qu'elle provienne d'un client ou d'un professionnel, doit appliquer ces mêmes règles et les vérifier de nouveau au moment de l'écriture.

## 8. Changements d'heure saisonniers [Imposé]

- Une heure locale inexistante lors du passage à l'heure d'été ne produit aucun créneau.
- Une heure locale répétée lors du retour à l'heure d'hiver produit deux instants distincts lorsqu'ils appartiennent tous les deux à la plage disponible.
- Dans ce second cas, l'interface affiche le décalage UTC afin de distinguer les occurrences, par exemple `02:30 UTC+02` et `02:30 UTC+01`.
- Ces comportements sont couverts par des tests utilisant des dates et des fuseaux IANA connus.

Une plage hebdomadaire ne choisit pas arbitrairement une « première » ou une
« seconde » occurrence pour ses bornes. Elle définit un ensemble d'instants :
un instant appartient à la plage si sa projection aller-retour stricte dans le
fuseau professionnel conserve la date locale et si sa minute murale appartient
à l'intervalle semi-ouvert `[startMinute, endMinute)`. Une heure inexistante ne
peut donc jamais être décalée silencieusement ; les deux occurrences d'une
heure répétée satisfont séparément le prédicat.

Le générateur résout chaque libellé de départ au quart d'heure en zéro, un ou
deux instants. Il conserve une occurrence seulement si tout l'intervalle réel
`[startAt, startAt + 60 minutes)` reste dans un même segment absolu continu de
la plage. Cette règle traite aussi les cas où `startTime` ou `endTime` tombe
elle-même dans l'heure répétée.

## 9. Modification du fuseau professionnel [Démo]

Pour garder la démonstration maîtrisable, le fuseau d'un professionnel n'est modifiable que s'il ne possède aucun rendez-vous futur confirmé.

Le service verrouille le profil professionnel, vérifie de nouveau cette
absence, incrémente `calendarVersion`, puis modifie le fuseau dans une seule
transaction. Une version attendue obsolète retourne `409 Conflict`.

Les minutes murales de `WeeklyAvailability` ne changent pas et sont donc
réinterprétées dans le nouveau fuseau. Les `Unavailability` restent les mêmes
instants UTC ; seul leur affichage local change. Les rendez-vous passés ou
annulés conservent leurs instants et leur snapshot `professionalTimezone`
d'origine.

Cette restriction remplace un workflow de conversion et d'acceptation individuelle trop complexe pour le test. Dans une application réelle, un changement pourrait proposer de conserver soit les instants absolus, soit les heures locales, avec analyse des conflits et validation des clients concernés.
