# Deployment Guide

## Quick Start with Pre-built Images

This guide explains how to deploy the application using pre-built Docker images from Docker Hub.

### Prerequisites

- Docker and Docker Compose installed
- Access to the repository (for `backend/init.sql`)

### Deployment Steps

1. **Clone the repository or download required files:**
   ```bash
   git clone <repository-url>
   cd Dev-Docker-TD1
   ```

   Or manually download:
   - `docker-compose.prod.yml`
   - `backend/init.sql`
   - `.env.prod.example`

2. **Configure environment variables:**
   ```bash
   cp .env.prod.example .env
   ```

   Edit `.env` and set:
   ```bash
   DOCKER_USERNAME=your_dockerhub_username
   POSTGRES_PASSWORD=secure_password_here
   ```

3. **Pull and start the application:**
   ```bash
   docker compose -f docker-compose.prod.yml pull
   docker compose -f docker-compose.prod.yml up -d
   ```

4. **Verify deployment:**
   ```bash
   docker compose -f docker-compose.prod.yml ps
   ```

   Access the application at:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:3001
   - Health check: http://localhost:3001/api/health

### Available Images

The following images are published to Docker Hub:

- **Backend**: `${DOCKER_USERNAME}/dev-docker-backend:latest`
- **Frontend**: `${DOCKER_USERNAME}/dev-docker-frontend:latest`

### Managing the Application

**Stop the application:**
```bash
docker compose -f docker-compose.prod.yml down
```

**View logs:**
```bash
docker compose -f docker-compose.prod.yml logs -f
```

**Update to latest images:**
```bash
docker compose -f docker-compose.prod.yml pull
docker compose -f docker-compose.prod.yml up -d
```

**Remove everything (including data):**
```bash
docker compose -f docker-compose.prod.yml down -v
```

### Customization

You can customize the deployment by modifying the `.env` file:

| Variable | Default | Description |
|----------|---------|-------------|
| `DOCKER_USERNAME` | - | Docker Hub username (required) |
| `POSTGRES_USER` | `appuser` | Database user |
| `POSTGRES_PASSWORD` | `apppassword` | Database password |
| `POSTGRES_DB` | `appdb` | Database name |
| `BACKEND_PORT` | `3001` | Backend port |
| `FRONTEND_PORT` | `3000` | Frontend port |
| `REACT_APP_API_URL` | `http://localhost:3001` | Backend API URL |

### Troubleshooting

**Issue: Cannot pull images**
- Ensure `DOCKER_USERNAME` in `.env` matches the Docker Hub account
- Check if images are public or login: `docker login`

**Issue: Database connection failed**
- Wait for PostgreSQL to be healthy: `docker compose -f docker-compose.prod.yml logs postgres`
- Check that `backend/init.sql` is present

**Issue: Frontend can't reach backend**
- Verify `REACT_APP_API_URL` in `.env` matches your backend URL
- Rebuild frontend if API URL changed: requires rebuilding the image

### Development vs Production

- **Development**: Use `docker-compose.yml` (builds images locally)
- **Production**: Use `docker-compose.prod.yml` (pulls pre-built images)
