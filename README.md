# Application Node.js + React avec Docker

Application simple de gestion d'utilisateurs avec :
- **Backend** : Node.js + Express
- **Frontend** : React
- **Containerisation** : Docker & Docker Compose

## Structure du projet

```
.
├── backend/
│   ├── server.js
│   ├── package.json
│   ├── Dockerfile
│   └── .dockerignore
├── frontend/
│   ├── src/
│   │   ├── App.js
│   │   ├── App.css
│   │   ├── index.js
│   │   └── index.css
│   ├── public/
│   │   └── index.html
│   ├── package.json
│   ├── Dockerfile
│   ├── nginx.conf
│   └── .dockerignore
├── docker-compose.yml
└── README.md
```

## Fonctionnalités

- API REST pour gérer des utilisateurs (GET, POST)
- Interface React pour afficher et ajouter des utilisateurs
- Communication entre frontend et backend
- Containerisation complète avec Docker

## Démarrage rapide

### Avec Docker Compose (recommandé)

```bash
# Construire et démarrer les conteneurs
docker-compose up --build

# En arrière-plan
docker-compose up -d --build
```

Accéder à l'application :
- **Frontend** : http://localhost:3000
- **Backend API** : http://localhost:3001

### Sans Docker

#### Backend
```bash
cd backend
npm install
npm start
```

#### Frontend
```bash
cd frontend
npm install
npm start
```

## API Endpoints

- `GET /api/health` - Vérifier l'état du serveur
- `GET /api/users` - Récupérer tous les utilisateurs
- `POST /api/users` - Créer un nouvel utilisateur

## Arrêter l'application

```bash
docker-compose down

# Avec suppression des volumes
docker-compose down -v
```

## Technologies utilisées

- **Backend** : Node.js, Express, CORS
- **Frontend** : React 18, CSS3
- **Serveur web** : Nginx (pour le frontend en production)
- **Containerisation** : Docker, Docker Compose
