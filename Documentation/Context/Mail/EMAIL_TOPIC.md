Bonjour Thomas,

Comme convenu, voici le test technique que je te propose.

L’objectif n’est pas de te tester sur ta capacité à coder sans assistance : tu peux utiliser librement les outils d’IA que tu utilises habituellement (Claude Code, Codex, Cursor, Copilot, etc.), ainsi que toute documentation nécessaire.

L’idée est surtout de voir comment tu abordes un problème, les choix techniques que tu fais et la qualité globale de ton implémentation.

Projet
L’objectif est de développer une petite application de prise de rendez-vous, deux repos :

un backend basé sur notre starter Express/TypeScript :
https://github.com/kevinfavv/ExpressStarterDCT
un frontend en Vue.js
Un professionnel doit pouvoir :

définir ses horaires de disponibilité habituels pour chaque jour de la semaine
avoir plusieurs plages horaires dans une même journée
définir des indisponibilités exceptionnelles, ponctuelles ou sur plusieurs jours
disposer d’un fuseau horaire
Un client doit pouvoir :

consulter les créneaux disponibles d’un professionnel sur une période donnée
consulter ces créneaux dans le fuseau horaire de son choix
réserver un rendez-vous
annuler un rendez-vous
Un rendez-vous ne doit pouvoir être pris que lorsque le professionnel est réellement disponible et deux rendez-vous ne doivent pas pouvoir se chevaucher.

Contraintes techniques
Backend basé sur ExpressStarterDCT
Frontend en Vue.js
Utiliser PostgreSQL / Prisma pour la persistance
Gérer correctement les fuseaux horaires, y compris les changements heure d’été / heure d’hiver
Fournir les migrations nécessaires
Ajouter les tests qui te semblent pertinents
Historique Git
L’ensemble du back-end doit pouvoir être lancé simplement avec :

docker compose up
Pour le reste — modèle de données, architecture, endpoints, validations, UX, gestion des dates, contraintes en base, organisation du frontend, etc. — les choix sont volontairement laissés libres.

Ajoute simplement un petit README expliquant comment lancer le projet et, si nécessaire, les principaux choix que tu as faits.

Une fois le test terminé, on prendra également un moment ensemble pour parcourir ton implémentation et discuter de tes choix.

Bon courage et à bientôt,

Kevin
