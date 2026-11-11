# Integration Handoff

## Frontend
- Project: `apps/dl-support-workbench`
- Install: `npm --prefix apps/dl-support-workbench install`
- Build: `npm --prefix apps/dl-support-workbench run build`
- Tests: `npm --prefix apps/dl-support-workbench test`
- Dev server: `npm --prefix apps/dl-support-workbench run dev` (Vite; preview-compatible host configuration is in `vite.config.ts`)
- API seam: `src/api/index.ts` selects the live HTTP client in `src/api/client.ts`
- Frontend types: `src/api/types.ts`
- Vite proxies `/api` to `http://127.0.0.1:3001`

## Backend And Routes
- Backend service: `apps/dl-support-api` (Node.js/TypeScript, PGlite/PostgreSQL-compatible)
- Build: `npm --prefix apps/dl-support-api run build`
- Start: `npm --prefix apps/dl-support-api run dev` (default port `3001`)
- Smoke test: `npm --prefix apps/dl-support-api run smoke`
- Health endpoint: `GET /api/health`
- Workbench endpoints: `GET /api/workbench`, `GET|PUT /api/preferences`, `POST /api/work-items`, `PUT /api/work-items/:id`, `PUT /api/engagements`, `PUT /api/project-name`
- Plan routes `/`, `/lifecycle`, `/engagements`, and `/actions` are client-side SPA routes, not HTTP API endpoints. Do not probe them as backend APIs.
- The API stores only workbench-owned data; AEP, BizApps Platform, and agent-service connections remain excluded.

## Data And Migrations
- Database: embedded PGlite with PostgreSQL-compatible SQL
- Migration tool: `src/migrate.ts`; migration directory: `apps/dl-support-api/migrations/`
- Schema migration: `001_initial_schema.sql`; apply with `npm --prefix apps/dl-support-api run migrate`
- No seed data. A new database starts with no work items; blank engagement and preference values are returned as API defaults.
- Work items, engagement details, and theme preferences are stored in the local database.

## Services
- Local integration services: React/Vite frontend and Node.js API with PGlite database.
- Azure Static Web Apps remains the planned static frontend host; hosting the API/database in Azure is not configured by this integration.
- No external platform or agent-service connections.

## Shared Types
- No shared package. Frontend API types are in `src/api/types.ts`; the backend defines its local route contract in `apps/dl-support-api/src/server.ts`.

## Integration Results
- Migration applied successfully; no seed data was created.
- Backend TypeScript build and smoke test passed for health, workbench, work-item create/update, engagements, project name, and preferences.
- Frontend production build and Vitest suite passed; API seam uses the live client and mock client, in-memory storage, and preview-state switcher were removed.
- Browser end-to-end verification through Vite's `/api` proxy: workbench read `200`; preferences read/write/read `200` with the saved value returned.
- Build output includes a Vite warning that the main JavaScript chunk exceeds 500 kB after minification.
