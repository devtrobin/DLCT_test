J'ai passé le lundi matin envoron 4h à faire le dossier documentation.
2h pour faire une documentation propre avec un modèle de donnée que j'ai conçut avec les information que je disposais avec le dossier contexte.
2h pour revoir la documentation que j'avais faite avec le code du back-end qui a été fourni tout en méttant en concurrence les deux modèle de donnée pour avoir une documentation propre et compatible entre ce que j'avais conçu et le back-end donnée.
Ces étapes à permit de prendre un maximum de contexte et de donnée par ChatGPT, avec une documentation complète, définition des modèle de donnée, les points d'apis, les image docker, l'utilisation des librairies et outils donnée par l'annonce du post linkdin.

## Développement

- Authentification et comptes : inscription client/restaurateur, connexion,
  déconnexion, sessions PostgreSQL, récupération de mot de passe de démo,
  consultation/modification/suppression du compte et tests d'intégration.
- Calendrier professionnel : recherche, disponibilités hebdomadaires,
  indisponibilités, contrôle de version, aperçu des annulations et génération
  de créneaux sur sept jours avec Luxon.
- Rendez-vous : réservation client, création manuelle restaurateur, listes,
  détail, historique initial, code public et annulation transactionnelle.
- Modification de rendez-vous : propositions bilatérales, acceptation,
  refus, retrait, forçage restaurateur, détection des conflits et accès limité
  par code public.
