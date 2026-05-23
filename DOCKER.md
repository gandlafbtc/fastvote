# Docker Deployment Guide

This guide explains how to deploy the FastVote application using Docker and Docker Compose.

## Prerequisites

- Docker installed on your system
- Docker Compose installed on your system

## Quick Start

To start the entire application with both frontend and backend services:

```bash
docker-compose up -d
```

This will:
- Build the backend service (Bun-based WebSocket server)
- Build the frontend service (SvelteKit application)
- Start both services in detached mode
- Create a shared network for inter-service communication

## Accessing the Application

Once the containers are running:

- **Frontend**: http://localhost:3000
- **Backend WebSocket**: ws://localhost:3001/ws

## Docker Compose Commands

### Start services
```bash
docker-compose up -d
```

### Stop services
```bash
docker-compose down
```

### View logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
```

### Rebuild services
```bash
docker-compose up -d --build
```

### Stop and remove containers, networks, and volumes
```bash
docker-compose down -v
```

## Individual Service Deployment

### Backend Only

```bash
cd packages/backend
docker build -t fast-vote-backend .
docker run -p 3001:3001 fast-vote-backend
```

### Frontend Only

```bash
cd packages/frontend
docker build -t fast-vote-frontend .
docker run -p 3000:3000 -e PUBLIC_WS_URL=ws://localhost:3001/ws fast-vote-frontend
```

## Environment Variables

### Frontend
- `NODE_ENV`: Set to `production` in Docker
- `PORT`: Port the frontend runs on (default: 3000)
- `PUBLIC_WS_URL`: WebSocket URL for backend connection (default: ws://localhost:3001/ws)

### Backend
- `NODE_ENV`: Set to `production` in Docker

## Production Deployment

For production deployment, you may want to:

1. **Use a reverse proxy** (nginx, Traefik, etc.) in front of the services
2. **Configure environment variables** for your production domain
3. **Set up SSL/TLS** for secure WebSocket connections (wss://)
4. **Use Docker secrets** for sensitive configuration
5. **Configure resource limits** in docker-compose.yml

Example with resource limits:

```yaml
services:
  backend:
    # ... other config
    deploy:
      resources:
        limits:
          cpus: '0.5'
          memory: 512M
        reservations:
          cpus: '0.25'
          memory: 256M
```

## Troubleshooting

### Container won't start
Check logs:
```bash
docker-compose logs backend
docker-compose logs frontend
```

### Port already in use
Change the port mapping in `docker-compose.yml`:
```yaml
ports:
  - "8080:3000"  # Map to different host port
```

### WebSocket connection issues
Ensure the `PUBLIC_WS_URL` environment variable in the frontend service points to the correct backend URL.

## Architecture

The Docker setup consists of:

- **Backend Container**: Runs the Bun-based WebSocket server on port 3001
- **Frontend Container**: Runs the SvelteKit application on port 3000
- **Network**: Both containers communicate via a shared Docker network

The frontend connects to the backend via WebSocket for real-time voting functionality.
