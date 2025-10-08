# Tic-Tac-Toe - Application React + Node.js

Application de jeu de morpion en ligne avec authentification complète et système de gestion de parties multijoueurs.

## Fonctionnalités

### Authentification complète
- Inscription et connexion sécurisées
- JWT (JSON Web Tokens) pour la gestion des sessions
- Hashing de mots de passe avec bcrypt

### Jeu de Morpion multijoueur
- Création de parties en attente
- Système de tour par tour en temps réel
- Détection automatique du gagnant
- Gestion des matchs nuls

### Statistiques utilisateur
- Nombre total de parties
- Victoires, défaites et matchs nuls
- Historique des parties

### Actualisation en temps réel
- Mise à jour automatique de l'état des parties
- Polling automatique pour une expérience fluide

## Architecture

```
.
├── backend/                    # API Node.js + Express
│   ├── middleware/
│   │   └── auth.js            # Middleware d'authentification JWT
│   ├── routes/
│   │   ├── auth.js            # Routes d'authentification
│   │   └── game.js            # Routes de gestion des parties
│   ├── __tests__/             # Tests backend (Jest + Supertest)
│   │   ├── auth.test.js
│   │   └── game.test.js
│   ├── server.js              # Point d'entrée du serveur
│   ├── db.js                  # Configuration PostgreSQL
│   ├── init.sql               # Schéma de base de données
│   └── package.json
│
├── frontend/                   # Application React
│   ├── src/
│   │   ├── components/        # Composants React
│   │   │   ├── Login.js       # Page de connexion
│   │   │   ├── Register.js    # Page d'inscription
│   │   │   ├── GameList.js    # Liste des parties
│   │   │   └── Game.js        # Plateau de jeu
│   │   ├── context/
│   │   │   └── AuthContext.js # Contexte d'authentification
│   │   ├── App.js             # Composant principal avec routage
│   │   └── index.js
│   └── package.json
│
├── .github/
│   └── workflows/
│       └── ci-cd.yml          # Pipeline CI/CD automatisée
│
├── docker-compose.yml          # Configuration Docker Compose
└── README.md
```

## Démarrage rapide

### Avec Docker Compose (recommandé)

```bash
# Construire et démarrer tous les services
docker-compose up --build

# En arrière-plan
docker-compose up -d --build
```

**Accès à l'application :**
- Frontend : http://localhost:3000
- Backend API : http://localhost:3001
- Base de données PostgreSQL : localhost:5432

### Sans Docker

#### 1. Base de données PostgreSQL

Créer une base de données PostgreSQL et exécuter le fichier `backend/init.sql`.

#### 2. Backend

```bash
cd backend
npm install
npm start
```

#### 3. Frontend

```bash
cd frontend
npm install
npm start
```

## Tests

### Tests Backend

```bash
cd backend
npm test
```

Couverture des tests :
- Authentification (inscription, connexion, JWT)
- Création et gestion des parties
- Logique du jeu (coups, détection du gagnant)
- Validation des entrées

### Tests Frontend

```bash
cd frontend
npm test
```

Couverture des tests :
- Composants d'authentification
- Validation des formulaires
- Gestion des erreurs

## API Endpoints

### Authentification (publics)

- `POST /api/auth/register` - Créer un compte utilisateur
- `POST /api/auth/login` - Se connecter

### Parties (protégés - authentification requise)

- `POST /api/games` - Créer une nouvelle partie
- `GET /api/games` - Lister toutes les parties (avec filtres)
- `GET /api/games/:id` - Obtenir les détails d'une partie
- `POST /api/games/:id/join` - Rejoindre une partie
- `POST /api/games/:id/move` - Jouer un coup
- `GET /api/games/stats/me` - Obtenir ses statistiques

### Utilitaire

- `GET /api/health` - Vérifier l'état du serveur

## Base de données

### Tables

- **users** : Comptes utilisateurs avec authentification
- **games** : Parties en cours et terminées
- **game_history** : Historique des parties pour les statistiques

### Schéma complet

Voir `backend/init.sql` pour le schéma détaillé avec commentaires.

## Technologies utilisées

### Backend
- Node.js & Express
- PostgreSQL (base de données)
- JWT (authentification)
- bcrypt (hashing de mots de passe)
- Jest & Supertest (tests)

### Frontend
- React 18
- React Router (navigation)
- Context API (gestion d'état)
- CSS3 (design responsive)
- React Testing Library (tests)

### DevOps
- Docker & Docker Compose
- GitHub Actions (CI/CD)
- Nginx (serveur web de production)

## Variables d'environnement

### Backend (.env)

```env
PORT=3001
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=devdockerdb
POSTGRES_HOST=db
JWT_SECRET=your-secret-key-change-in-production
```

### Frontend

```env
REACT_APP_API_URL=http://localhost:3001
```

## Pipeline CI/CD

Le projet utilise GitHub Actions pour :
- Exécuter les tests backend et frontend automatiquement
- Construire les images Docker
- Pousser les images sur Docker Hub (branches main et develop)
- Générer des rapports de déploiement

Voir `.github/workflows/ci-cd.yml` pour les détails.

## Comment jouer

1. **Créer un compte** : Utilisez la page d'inscription
2. **Se connecter** : Connectez-vous avec vos identifiants
3. **Créer ou rejoindre une partie** :
   - Cliquez sur "Create New Game" pour créer une partie
   - Ou rejoignez une partie en attente
4. **Jouer** : Cliquez sur les cases pour jouer à tour de rôle
5. **Consulter vos statistiques** : Visualisez vos victoires sur la page principale

## Arrêter l'application

```bash
# Arrêter les conteneurs
docker-compose down

# Arrêter et supprimer les volumes (⚠️ supprime les données)
docker-compose down -v
```

## Contribution

Les commits suivent la convention Conventional Commits :
- `feat:` - Nouvelle fonctionnalité
- `fix:` - Correction de bug
- `test:` - Ajout ou modification de tests
- `docs:` - Documentation
- `chore:` - Maintenance
