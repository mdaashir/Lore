# Kno

> AI-powered note-taking platform. Organize, search, and summarize your knowledge.

[![CI](https://github.com/YOUR_ORG/kno/actions/workflows/ci.yml/badge.svg)](https://github.com/YOUR_ORG/kno/actions/workflows/ci.yml)
[![Security](https://github.com/YOUR_ORG/kno/actions/workflows/security.yml/badge.svg)](https://github.com/YOUR_ORG/kno/actions/workflows/security.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-purple.svg)](LICENSE)

## Features

- **AI-powered notes** — automatic summarization, smart tagging, semantic search, AI Q&A
- **Workspaces** — team collaboration with role-based access (OWNER, ADMIN, MEMBER, VIEWER)
- **Note sharing** — granular permissions (read, comment, write)
- **Version history** — automatic snapshots on content changes
- **Audit logs** — complete action trail for compliance
- **Semantic search** — find notes using AI vector embeddings
- **Rich markdown editor** — live preview, keyboard-friendly

## Tech Stack

| Layer | Stack |
|---|---|
| **Backend** | Node.js 20 + Express 5 + TypeScript + Prisma 7 + PostgreSQL |
| **Frontend** | React 19 + TypeScript + Vite + Tailwind CSS 4 + React Router |
| **AI** | OpenAI GPT-4o-mini (summarization, tagging, Q&A) + text-embedding-3-small |
| **Auth** | JWT + bcryptjs |
| **Infrastructure** | Docker + Docker Compose |

## Quick Start

```bash
# 1. Clone and start PostgreSQL
docker compose up -d db

# 2. Set up environment
cp backend/.env.example backend/.env
# Edit .env with your OpenAI API key for AI features

# 3. Push database schema
cd backend
npm run db:push

# 4. Start dev servers
npm run dev              # backend → localhost:4000
cd ../frontend && npm run dev  # frontend → localhost:3000
```

### Production

```bash
docker compose up -d --build
```

- Frontend: http://localhost:3000
- API: http://localhost:4000

## Project Structure

```
kno/
├── backend/                    # Express API
│   ├── src/
│   │   ├── config/             # Env, Prisma client
│   │   ├── middleware/         # Auth, validation, error handling
│   │   ├── routes/             # Auth, workspaces, notes, AI, search, audit
│   │   ├── services/           # OpenAI, embeddings
│   │   └── utils/              # JWT, bcrypt, audit log
│   ├── prisma/schema.prisma    # Database schema (7 models)
│   └── tests/                  # Vitest + supertest
├── frontend/                   # React SPA
│   ├── src/
│   │   ├── components/         # Layout, shared components
│   │   ├── contexts/           # Auth context
│   │   ├── pages/              # Login, Register, Workspaces, Notes, Editor
│   │   ├── lib/                # Axios API client
│   │   └── types/              # TypeScript interfaces
│   └── public/                 # Static assets
└── docker-compose.yml          # PostgreSQL + API + Web
```

## API Overview

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Register |
| POST | `/api/auth/login` | Login |
| GET | `/api/auth/me` | Current user |
| GET/POST | `/api/workspaces` | List / Create |
| GET/POST | `/api/notes` | List / Create |
| GET/PUT/DELETE | `/api/notes/:id` | Read / Update / Delete |
| POST | `/api/ai/notes/:id/summarize` | AI summarize |
| POST | `/api/ai/notes/:id/tags` | AI generate tags |
| POST | `/api/ai/notes/:id/ask` | AI Q&A |
| GET | `/api/search` | Keyword + semantic search |
| GET | `/api/audit` | Audit logs |

## Scripts

### Backend
```bash
npm run dev          # Start dev server with hot reload
npm run build        # Compile TypeScript
npm run test         # Run tests
npm run lint         # Type-check
npm run format:fix   # Format code
```

### Frontend
```bash
npm run dev          # Start Vite dev server
npm run build        # Production build
npm run lint         # Lint with oxlint
npm run format:fix   # Format code
```

## CI/CD

- **CI** — lint, type-check, test on every push/PR
- **Security** — CodeQL analysis on schedule and push
- **Dependabot** — automated dependency PRs with auto-merge
- **Deploy** — Docker build and push on main

## License

MIT
