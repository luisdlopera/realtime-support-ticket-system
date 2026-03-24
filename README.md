# realtime-support-ticket-system

Realtime support ticket platform inspired by Zendesk/Intercom, built as a portfolio-ready full-stack project.

## Stack

- Backend: NestJS, Socket.IO, Redis Pub/Sub, Prisma, PostgreSQL
- Frontend: Next.js (App Router), Tailwind CSS, HeroUI, Socket.IO Client
- Infra: Docker, Docker Compose
- Architecture: Hexagonal (ports and adapters) on backend

## Key Features

- Create, list and view tickets
- Real-time chat per ticket room
- Assign ticket to agent
- Change ticket status (`OPEN`, `IN_PROGRESS`, `RESOLVED`, `CLOSED`)
- Live notifications/events:
  - `ticket.created`
  - `ticket.assigned`
  - `ticket.message`
  - `ticket.status.changed`
- Live dashboard metrics
- Optional typing indicator via socket event

## Monorepo Structure

```text
realtime-support-ticket-system/
  backend/
  frontend/
  docker-compose.yml
  README.md
```

## Backend Architecture (Hexagonal)

- `core/domain`: entities and domain event contracts
- `core/application`: use cases + ports
- `core/infrastructure`: Prisma repositories, Redis publisher/subscriber, auth adapters
- `modules/*`: Nest controllers, modules and websocket gateway

Flow:
1. HTTP request reaches controller.
2. Controller executes use case.
3. Use case persists data via repository port.
4. Use case publishes domain event via event publisher port.
5. Redis subscriber forwards event to Socket.IO rooms.
6. Frontend updates in real time.

## How to Run

### Prerequisites

- Docker Desktop

### Start everything

```bash
docker compose up --build
```

Services:
- Frontend: [http://localhost:3000](http://localhost:3000)
- Backend API: [http://localhost:3001/api](http://localhost:3001/api)
- Health: [http://localhost:3001/api/health](http://localhost:3001/api/health)

## Demo Users (seed)

- Agent: `agent@support.local` / `password123`
- Customer: `customer@support.local` / `password123`

## Suggested Screenshots for GitHub

1. Login page
2. Live dashboard metrics
3. Ticket list
4. Ticket detail with real-time chat
5. Status change reflected without refresh

## Future Improvements

- Granular permissions and organization/tenant support
- SLA policies and escalation rules
- File attachments in messages
- Full activity timeline/audit panel
- End-to-end tests (Playwright + API tests)
- Socket.IO Redis adapter for multi-instance horizontal scaling

## GitHub Remote Setup

```bash
git remote add origin git@github.com:luisdlopera/realtime-support-ticket-system.git
git branch -M main
git push -u origin main
```
