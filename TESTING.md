Testing Strategy and How to run

This document contains the testing strategy for the backend of realtime-support-ticket-system.

Local developer steps (backend)

1. Install dependencies and generate prisma client

   npm install
   npx prisma generate

2. Run unit tests

   npm run test

3. Run e2e tests (requires Postgres and Redis running, see docker-compose.dev.yml)

   npm run test:e2e

What was added

- Jest config (ts-jest) with basic setup
- Example unit tests for JwtTokenService, TicketsGateway and WhatsappInboundService
- Example e2e test for /api/health endpoint using Nest Test module and Supertest
- CI step to run tests in GitHub Actions

Notes

Due to environment constraints the repository does not ship a lockfile aligned with the added devDependencies in this branch. Run `npm install` locally to update package-lock.json before CI runs.
