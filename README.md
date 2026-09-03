# OpenClaw Office v2

A pixel-art office visualization and chat interface for OpenClaw agents. Features a pixel city with department doors, office rooms with executive agents, text + voice chat, and integrations with OpenProject and SuiteCRM.

## What It Is

A full-stack web app that:
- **Authenticates users** with JWT-based login
- **Visualizes departments** as a pixel city with clickable buildings
- **Provides chat interfaces** to executive agents (text + voice)
- **Integrates with OpenProject** for task tracking (REST API proxy)
- **Integrates with SuiteCRM** for contact management (REST API proxy)
- **Connects to OpenClaw Gateway** via WebSocket for real-time agent communication

## Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   Browser (UI)  │────▶│  Express Backend  │────▶│  OpenClaw GW     │
│                 │     │                  │     │  (WebSocket)     │
│  Pixel City     │     │  - JWT Auth      │     └─────────────────┘
│  Office Rooms   │     │  - Dept CRUD     │
│  Chat Panel     │     │  - OP Proxy      │
│  Voice Control  │     │  - CRM Proxy     │
│                 │     │  - WS Chat Relay  │
└─────────────────┘     └──────────────────┘
```

### Backend (`server/`)
- **Express server** with Helmet security, CORS, and rate limiting
- **JWT authentication** with scrypt password hashing
- **Department management** (CRUD, stored in JSON file)
- **OpenProject proxy** — API keys stored server-side only
- **SuiteCRM proxy** — API keys stored server-side only
- **WebSocket relay** — proxies OpenClaw gateway connections with JWT auth

### Frontend (`src/`)
- **Login view** — JWT-based authentication
- **City view** — Pixel art city with buildings for each department
- **Office view** — Pixel art office + chat panel (text + voice)
- **Settings view** — Department management, API configuration, password change
- **Voice controller** — Web Speech API for STT, SpeechSynthesis for TTS

## Quick Start

```bash
# Clone
git clone https://github.com/cmcintosh/openclaw-office.git
cd openclaw-office

# Install dependencies
npm install

# Start both frontend and backend
npm run dev
```

Frontend: `http://localhost:8843`
Backend: `http://localhost:8844`

### Default Login
- Username: `admin`
- Password: `openclaw2026`
- **⚠️ Change the default password immediately after first login!**

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `8844` | Backend server port |
| `JWT_SECRET` | Random | JWT signing secret (set for persistent sessions) |
| `OPENCLAW_GW` | `ws://127.0.0.1:18789` | OpenClaw gateway WebSocket URL |
| `NODE_ENV` | - | Set to `production` to serve built frontend from backend |

## Security Features

- **JWT-based authentication** — all API endpoints protected
- **Password hashing** — scrypt + salt, never stored in plaintext
- **Rate limiting** — 10 login attempts / 15 min, 120 API calls / min
- **Helmet security headers** — CSP, XSS protection, clickjacking prevention
- **API key isolation** — third-party keys stored server-side, never exposed to frontend
- **WebSocket authentication** — JWT verified on WS connection
- **Input validation** — URL validation, max body size (1MB), field length limits
- **CORS configuration** — configurable origins

## Usage

### 1. Login
Navigate to the app and log in with credentials (default: `admin` / `openclaw2026`).

### 2. Configure Departments
Go to Settings → Departments. Add departments with:
- **Name** (e.g., "Engineering", "Marketing", "Operations")
- **Executive Agent ID** (e.g., "cto", "cmo", "coo" — must match OpenClaw agent ID)
- **Description** (optional)
- **Color** (for visual identification)

### 3. Configure Integrations
In Settings:
- **OpenProject**: Enter your OpenProject URL and API key
- **SuiteCRM**: Enter your SuiteCRM URL and API key
- **OpenClaw Gateway**: Enter your gateway URL and token (stored in browser localStorage)

### 4. Use the Pixel City
- Each department appears as a building in the pixel city
- Click a building's door to enter that department's office
- The office view shows the executive agent and a chat panel

### 5. Chat with Agents
- Type messages in the chat panel
- Use the 🎤 button for voice input (hold to talk, or click to toggle)
- Double-click 🎤 to toggle voice responses (text-to-speech)
- Messages are sent to the agent's OpenClaw session via WebSocket

## Production Deployment

```bash
# Build frontend
npm run build

# Start production server (serves built frontend + API)
NODE_ENV=production PORT=8844 node server/index.js
```

## Browser Support

- **Voice features**: Chrome, Edge, Safari (requires Web Speech API)
- **Text chat**: All modern browsers
- **Pixel art rendering**: All modern browsers (Canvas 2D)

## License

AGPL-3.0-only