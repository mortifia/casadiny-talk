# CasadignyTalk

Objet : plateforme de communication type Twitter

### Fonctionnalités user

- Poster un message (1024 caractères)
- Ajouter un média (optionnel)
- Prévisualisation d'une url linkée (optionnel)
- Répondre à un message (commenter)
- Up/down un message
- Suivre d'autres utilisateurs
- Être notifié
- Modifier son profil
- Supprimer son profil
- Connexion locale + oAuth (Google)
- Supprimer un post
- Récupérer son compte

### Fonctionnalités modérateur

- Désactiver un post (la raison doit être affichée à la place du contenu du post)
- Warn un utilisateur (au bout de 3 warn, l'utilisateur est ban)
- Ban un utilisateur (le rendre silencieux) (Le motif de ban doit être affiché sur le profil)

### Fonctionnalités admin

- Ajouter/Retirer un modérateur (rôle lié au compte user)
- Ajouter/Retirer un admin
- Supprimer un utilisateur (pour les bots)

### Stack tech

- DB : postgres (large commu, fonctionnalités)

- API : Node + Express (Opt : Tests Unitaires + Doc API)
- Persistent File Storage (opt)  : Min.io
- Front : Vue3 - NuxtJs
- Prod : Docker Compose
- Nom de domaine : talk.casidiny.ovh

### Données profil  user

- Image de profil (not required)
- username (unique)
- email (unique)
- password
- First Name
- Last Name
- Phone
- Suivi par / Suis
- Like (posts upped)

### Conditions d'utilisation à définir

- Page Contact
- Mentions Légales

### Tâches prioritaires

- Connexion
- Inscription
- Modif user
- Suppr User
- CRUD Poster un message
- CRUD Commenter un message
