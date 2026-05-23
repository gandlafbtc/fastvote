# FastVote

A real-time voting application built with SvelteKit and Bun, featuring WebSocket-based communication for instant updates.

## Features

- 🚀 Real-time voting with WebSocket connections
- 📊 Live results and participant tracking
- ⏱️ Configurable lobby and voting timers
- 💡 User suggestions for vote items
- 📱 Responsive design with QR code sharing
- 🎨 Modern UI with Tailwind CSS and DaisyUI

## Quick Start

### Using Docker (Recommended)

The easiest way to run FastVote is using Docker Compose:

```bash
docker-compose up -d
```

Access the application at:
- Frontend: http://localhost:3000
- Backend WebSocket: ws://localhost:3001/ws

For detailed Docker deployment instructions, see [DOCKER.md](./DOCKER.md).

### Local Development

#### Prerequisites
- [Bun](https://bun.sh) runtime installed
- Node.js 20+ (for frontend)

#### Install Dependencies

```bash
bun install
```

#### Run Development Servers

Run both frontend and backend:
```bash
bun run dev
```

Or run them separately:
```bash
# Backend only
bun run dev:backend

# Frontend only
bun run dev:frontend
```

## Project Structure

```
fast-vote/
├── packages/
│   ├── backend/          # Bun WebSocket server
│   │   ├── index.ts      # Main server file
│   │   ├── Dockerfile    # Backend Docker configuration
│   │   └── package.json
│   └── frontend/         # SvelteKit application
│       ├── src/          # Source code
│       ├── Dockerfile    # Frontend Docker configuration
│       └── package.json
├── docker-compose.yml    # Docker orchestration
└── DOCKER.md            # Docker deployment guide
```

## Deployment

See [DOCKER.md](./DOCKER.md) for comprehensive deployment instructions including:
- Docker Compose setup
- Individual service deployment
- Production configuration
- Troubleshooting guide

## Technology Stack

- **Frontend**: SvelteKit, Tailwind CSS, DaisyUI
- **Backend**: Bun, WebSocket
- **Deployment**: Docker, Docker Compose

## License

MIT
