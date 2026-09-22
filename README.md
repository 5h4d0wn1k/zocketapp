# Zocket — AI Task Management

Zocket is a full-stack **AI task management** platform built with **TypeScript**
and **Next.js** on the frontend and **Go (Fiber)** on the backend. It combines
collaborative task tracking, JWT-authenticated APIs, real-time WebSocket
updates, and an OpenAI-powered assistant to help teams organize work and stay
productive.

[![Stars](https://img.shields.io/github/stars/5h4d0wn1k/zocketapp)](https://github.com/5h4d0wn1k/zocketapp)
[![Last commit](https://img.shields.io/github/last-commit/5h4d0wn1k/zocketapp)](https://github.com/5h4d0wn1k/zocketapp)
[![Issues](https://img.shields.io/github/issues/5h4d0wn1k/zocketapp)](https://github.com/5h4d0wn1k/zocketapp)
[![TypeScript](https://img.shields.io/badge/TypeScript-code-blue.svg)](https://www.typescriptlang.org)

## Why Zocket

Teams lose hours switching between chat, spreadsheets, and half-finished task
apps. Zocket is designed as a modern AI-powered alternative: a clean Next.js
workspace, a type-safe Go API layer, and an assistant that turns a rough prompt
into an organized task plan. Everything is wired end-to-end — authentication,
task CRUD, comments, dashboards, and live updates — so it also serves as a
reference architecture for a TypeScript + Go + PostgreSQL product stack.

## Features

- **Next.js frontend** — App Router, Tailwind CSS, shadcn/ui-style components, and Supabase-powered dashboard
- **Go Fiber backend** — JWT-protected REST API with structured routing and middleware
- **Authentication** — register/login flows + protected route middleware (client and server)
- **Task management** — full CRUD with status, priority, category, due date, and assignees
- **Comments** — per-task discussion threads backed by PostgreSQL
- **AI assistant** — OpenAI GPT-3.5 task analysis and suggestions (`/api/ai/chat`, `/api/ai/analyze`, `/api/ai/suggestions`)
- **Real-time updates** — WebSocket hub for live task feed (`/ws/tasks`)
- **PostgreSQL schema** — `users`, `tasks`, `task_comments` with status/pivot tables
- **Dockerized services** — compose files for the backend and Postgres

## Quickstart

```bash
# Frontend (Next.js dev server)
cd frontend
# Set Next.js env: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY,
# and OPENAI_API_KEY (used by /api/ai/chat)
npm install
npm run dev

# Backend (Go Fiber API + Postgres)
cd task-ai-backend
cp .env.example .env   # DB_HOST/DB_USER/DB_PASSWORD/DB_NAME, JWT_SECRET, OPENAI_API_KEY
go run main.go

# Or start the backend + Postgres together
docker-compose up
```

## Project structure

- `frontend/` — Next.js 13 app: `src/app`, `src/components`, `src/hooks`, `src/types`
- `task-ai-backend/` — Go Fiber API: `handlers/`, `routes/`, `services/`, `db/`, `middleware/`, `websocket/`

## Contributing

Contributions are welcome — open an issue or pull request to propose changes.

## License

This project is provided as-is for learning and development. No LICENSE file is
bundled; reach out before redistributing.