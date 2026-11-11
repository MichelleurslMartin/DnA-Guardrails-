# Project Plan

**Status**: Integrated
**Created**: 2026-10-29
**Mode**: NEW

**Integration scope amendment**: The user requested a local API and SQL-backed integration after approval. The first release now uses the scaffolded Node.js/PGlite service for workbench-owned records. AEP, BizApps Platform, and agent-service integrations remain out of scope.

---

## 1. Project Overview

**Goal**: Build a text-only Avanade-branded DL Support Workbench that turns repository delivery lifecycle guidance into usable checklists, owner/date/evidence tracking, manual AEP and BizApps Platform engagement verification, and predefined agent-style support panels. Workbench-owned records and preferences are stored by the local API in a PostgreSQL-compatible database. The first release has no AEP, BizApps Platform, or agent-service connections and makes no live workflow API calls.

**App Type**: SPA

**API Login**: No

**Mode**: NEW

**Deployment Plan**: No deployment plan found

---

## 2. Frontend — Web App

| Component | Technology |
|-----------|-----------|
| **Language** | TypeScript |
| **Framework** | React + Vite |
| **Package Manager** | npm |
| **Test Runner** | vitest |
| **Mocking Library** | vi.mock |
| **Test Command** | npm test |

The frontend calls the local API for workbench data. Do not imply account identity, AI inference, or external platform connectivity.

---

## 3. Services Required

| Azure Service | Role in App | Environment Variable | Default Value (Local) | Classification |
|---------------|------------|---------------------|----------------------|----------------|
| Azure Static Web Apps | Planned host for the static React SPA and client-side routes | — | `npm run dev` | Essential |
| Local Node.js API with PGlite | Serve workbench endpoints and persist workbench-owned records | `PORT`, `HOST` | `http://127.0.0.1:3001` | Local integration |

The local API uses PostgreSQL-compatible schema migrations and stores work items, engagement details, and theme preferences. No seed data or credentials are stored. There is no live AEP, BizApps Platform, or agent-service integration in the first release; Azure hosting for the API/database is not configured.

---

## 4. Prerequisites

### Run

| Tool | Service(s) | Installed | Version |
|------|------------|-----------|---------|
| Node.js | frontend | ✅ | 24.18.0 |
| npm | frontend | ✅ | 11.16.0 |

### Debug

| Tool | Service(s) | Installed | Version |
|------|------------|-----------|---------|
| Google Chrome | frontend | ✅ | 156.0.8078.48 |

---

## 6. Design System & UI

**Component Library**: Fluent UI v9
**Style Direction**: A restrained, information-dense delivery console with a compact phase rail, scannable action tables, clear ownership and status cues, and modest 4–6px corners. Use Avanade as text only; the palette below is a product interpretation, not a claim about official brand color values.
**Typography**: Segoe UI Variable, Segoe UI, sans-serif

### Color Palette

| Token | Hex | Usage |
|-------|-----|-------|
| `primary` | `#A3424A` | Muted red for the Avanade text accent, primary actions, and selected lifecycle stage |
| `accent` | `#2D766D` | Teal for supporting guidance, secondary emphasis, and verified-state accents |
| `surface` | `#F5F8F6` | Cool, light workbench canvas |
| `text` | `#202B29` | High-contrast action, engagement, and lifecycle copy |
| `muted` | `#62716D` | Supporting descriptions, unassigned labels, and timestamps |
| `border` | `#D8E1DE` | Dividers and control boundaries across forms and tracking tables |

### Pages

| Page | Route | Purpose | Layout |
|------|-------|---------|--------|
| Delivery Workbench | `/` | Show lifecycle progress, next actions, engagement verification status, and contextual guidance marked “Guidance only · not connected.” | `header, sidebar, main, hero, grid, split(table|card-list)` |
| Lifecycle Playbook | `/lifecycle` | Browse Mobilize, Plan and Analyze, Execute Delivery, Prepare for Phase Transition, Recover/Escalate, and Close/Handover; track actions, owners, due dates, evidence, and readiness. | `header, sidebar, main, tabs, table, action-bar` |
| Engagement Checks | `/engagements` | Manually record AEP and matching BizApps Platform DnA engagement names, IDs, and URLs; track verification, access gaps, mismatches, and follow-up. | `header, sidebar, main, two-column(form+form), table, action-bar` |
| Actions & Decisions | `/actions` | Create and maintain actions, RAID items, decisions, and change requests with owner, target date, status, and evidence reference. | `header, sidebar, main, tabs, table, form, action-bar` |

### Sample Content

The records below are examples for the workbench experience, not claims about a real client or connected system. They are not database seed data; a new local database starts with no work items or engagement values recorded.

Delivery Workbench — readiness item:
| Item | Owner | Due date | Status |
|------|-------|----------|--------|
| Verify project engagement in AEP | Unassigned | Not set | Not started |
| Match DnA engagement in BizApps Platform | Unassigned | Not set | Not started |
| Review initial RAID and decision logs | Unassigned | Not set | Not started |

Lifecycle Playbook — guided action:
| Stage | Action | Evidence to record | Status |
|-------|--------|-------------------|--------|
| Mobilize | Review contract, statement of work, assumptions, and acceptance terms | Contract review reference | Not started |
| Mobilize | Verify AEP and BizApps Platform engagement names or IDs | Both IDs and URLs; access or mismatch follow-up | Not started |
| Plan and Analyze | Baseline scope, acceptance criteria, dependencies, and responsibilities | Approved baseline reference | Not started |

Engagement Checks — manual platform record:
| Record | Identifier | URL | Verification |
|--------|------------|-----|--------------|
| AEP engagement | Not recorded | Not recorded | Not verified |
| BizApps Platform DnA engagement | Not recorded | Not recorded | Not verified |
| Cross-platform client/project match | Not checked | AEP and BizApps URLs required | Follow-up not started |

Actions & Decisions — work item:
| Item | Owner | Target date | Status |
|------|-------|-------------|--------|
| Request access or correction if an engagement is missing or mismatched | Unassigned | Not set | Not started |
| Confirm delivery approach and environment responsibilities | Unassigned | Not set | Not started |
| Record the next governance decision and its impact | Unassigned | Not set | Not started |

Workbench defaults: client/project name: blank · AEP ID and URL: blank · BizApps DnA ID and URL: blank · owner: unassigned · due date: unset. The support panel presents curated prompts and relevant repository guidance only; it must state that no agent service is connected and must not suggest that a prompt was sent or a platform record was checked.

The UI supports actions through the local API: create and update work items, assign owners and due dates, record evidence links, and mark follow-up status. Changes are stored in the local database. No development-only mock state switcher is present.

---

## 7. Project Structure

```text
project-root/
├── .azure/
│   ├── project-plan.md
│   └── .preview-temp/              # Temporary approval preview; not application code
├── apps/
│   ├── dl-support-api/
│   │   ├── migrations/             # PostgreSQL-compatible schema only
│   │   └── src/                    # API routes, database access, migration runner
│   └── dl-support-workbench/
│       ├── index.html
│       ├── package.json
│       ├── vite.config.ts
│       └── src/
│           ├── app/                # Routes and Fluent UI provider/theme
│           ├── components/         # Shared shell, status, and guidance panels
│           ├── features/
│           │   ├── actions/        # Action, RAID, decision, and change tracking
│           │   ├── engagements/    # Manual AEP/BizApps verification
│           │   ├── lifecycle/      # Six-stage guide and readiness checklists
│           │   └── support/        # Curated, non-connected guidance panels
│           ├── api/                # Live typed API client and frontend contract
│           └── styles/
└── apps/dl-support-workbench/src/  # Vitest tests for API workflows and app flows
```

---

## 8. Route Definitions

The routes below are client-side SPA pages. API endpoints and integration checks are recorded in `.azure/integration-plan.md`.

These are client-side SPA routes served by the static host; they are not API endpoints.

| # | Method | Path | Description | Request Body | Response Body | Status Codes |
|---|--------|------|-------------|-------------|--------------|--------------|
| 1 | GET | `/` | Delivery Workbench dashboard and guidance-only support panels | — | Workbench page | 200 |
| 2 | GET | `/lifecycle` | Six-stage lifecycle playbook and readiness tracking | — | Lifecycle page | 200 |
| 3 | GET | `/engagements` | Manual AEP and BizApps Platform engagement verification | — | Engagement checks page | 200 |
| 4 | GET | `/actions` | Locally stored action, RAID, decision, and change log | — | Actions and decisions page | 200 |

---

## 9. Next Steps

1. Integration is complete: the local API, schema migration, frontend HTTP client, and browser proxy have been verified.
2. Run `npm --prefix apps/dl-support-api run dev` and `npm --prefix apps/dl-support-workbench run dev` for local use.
3. Azure hosting is not configured. A deployment must include an API/database hosting decision; static hosting alone does not provide the local API.
4. AEP, BizApps Platform, and agent-service integrations remain outside this release.