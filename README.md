# realtime-support-ticket-system

Realtime support ticket platform inspired by Zendesk/Intercom, built as a portfolio-ready full-stack project.

## Stack

- Backend: NestJS, Socket.IO, Redis Pub/Sub, Prisma, PostgreSQL
- Frontend: Next.js (App Router), Tailwind CSS, next-themes, Socket.IO Client
- Infra: Docker, Docker Compose
- Media: Cloudflare R2 (S3 API)
- WhatsApp: Meta WhatsApp Cloud API (webhook + Graph send)
- Architecture: Hexagonal (ports and adapters) on backend

## Key Features

- Create, list and view tickets
- Real-time chat per ticket room
- **Línea de soporte**: inbox estilo WhatsApp Web (listado, hilo, media, replicar, leído, filtros por fecha, cerrar ticket) — requiere rol agente/admin
- Tema claro y oscuro
- Assign ticket to agent
- Change ticket status (`OPEN`, `IN_PROGRESS`, `RESOLVED`, `CLOSED`)
- Live events (Socket.IO; `ticket.message` also refreshes agent dashboard/inbox)
- Live dashboard metrics
- Inbound WhatsApp (text + media) con idempotencia por `wamid`
- Outbound a WhatsApp (texto y enlaces a media vía R2 público; para media el bucket debe ser legible con `R2_PUBLIC_BASE_URL`)
- Presigned GET para ver adjuntos en consola (privado)
- Optional typing indicator via socket event

## Monorepo Structure

```text
realtime-support-ticket-system/
  backend/
  frontend/
  docker-compose.yml
  README.md
```

## Environment variables (backend)

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | PostgreSQL connection string |
| `REDIS_URL` | Redis for pub/sub |
| `JWT_SECRET` | JWT signing |
| `FRONTEND_URL` | CORS and Socket.IO origin (e.g. `http://localhost:3002`) |
| `R2_ACCOUNT_ID` | Cloudflare account ID for R2 |
| `R2_ACCESS_KEY_ID` / `R2_SECRET_ACCESS_KEY` | R2 S3 API keys |
| `R2_BUCKET` | Bucket name |
| `R2_PUBLIC_BASE_URL` | Public base URL to objects (no trailing slash) — needed for Meta to pull media in outbound link messages |
| `R2_SIGNED_TTL` | Presigned URL TTL in seconds (default 3600) |
| `WHATSAPP_PHONE_NUMBER_ID` | From Meta app > WhatsApp > API |
| `WHATSAPP_ACCESS_TOKEN` | System user or long-lived token with `whatsapp_business_messaging` |
| `WHATSAPP_APP_SECRET` | App secret; used to verify `X-Hub-Signature-256` on webhooks (required in production) |
| `WHATSAPP_VERIFY_TOKEN` | Your chosen string; must match Meta webhook verify token |
| `WHATSAPP_GRAPH_VERSION` | Optional, default `v21.0` |
| `NODE_ENV` | `production` enforces `WHATSAPP_APP_SECRET` on webhooks |

## WhatsApp Cloud API (Meta)

1. Create an app, add WhatsApp product, get a test business phone number.
2. Set **Callback URL** to `https://<your-host>/api/whatsapp/webhook` (public HTTPS; use [ngrok](https://ngrok.com) for local dev, e.g. `ngrok http 3001`).
3. **Verify token** = same as `WHATSAPP_VERIFY_TOKEN`.
4. Subscribe to `messages` (and `message_template_status` if you use templates).
5. Send a test message to your test number; inbound messages create/update a `WHATSAPP` ticket and contact.

Media requires R2 configured so inbound files are stored; outbound media to the user needs `R2_PUBLIC_BASE_URL` pointing to a public path or use Meta’s [media upload API](https://developers.facebook.com/docs/whatsapp/cloud-api/reference/media) in a follow-up.

## How to run

### Prerequisites

- Docker Desktop (recommended)

### Start with Docker

```bash
docker compose up --build
```

Services:

- Frontend: [http://localhost:3002](http://localhost:3002) (mapped from container port 3000)
- Backend API: [http://localhost:3001/api](http://localhost:3001/api)
- Health: [http://localhost:3001/api/health](http://localhost:3001/api/health)

The backend runs `prisma migrate deploy` on start. If you had an old database from `prisma db push` before migrations were added, reset the volume once:

```bash
docker compose down -v
docker compose up --build
```

### Local backend (optional)

```bash
cd backend && npm install && npx prisma migrate dev && npm run start:dev
```

## Demo users (seed)

- Agent: `agent@support.local` / `password123` — can open **Línea de soporte** and the WhatsApp inbox API.
- Customer: `customer@support.local` / `password123`

## Backend layout (hexagonal)

- `core/domain`, `core/application` (use cases, ports)
- `core/infrastructure`: Prisma, Redis pub/sub, R2, auth
- `modules/*`: HTTP, WebSocket, WhatsApp webhook

## GitHub remote (example)

```bash
git remote add origin git@github.com:luisdlopera/realtime-support-ticket-system.git
git branch -M main
git push -u origin main
```

## Future improvements

- Granular permissions and multi-tenant
- SLA and escalation
- Full audit UI using `TicketActivity`
- E2E tests (Playwright)
- Socket.IO Redis adapter for horizontal scale
- Resumable upload to Meta for outbound media when R2 is private
