# Persist Workbench Records Through a Local PostgreSQL API

* Status: proposed
* Date: 2026-10-29

## Context and Problem Statement

The approved first release originally kept workbench records in page-session memory and intentionally had no backend or database. The requested integration scope changed to persist work items, engagement notes, project name, and theme preferences while keeping AEP, BizApps Platform, and agent-service connections out of scope. The frontend already had a typed `ApiClient` boundary, but no server routes or schema existed. Azure Static Web Apps alone cannot host this API or database.

## Decision Drivers

* Persist workbench-owned data across refreshes and API restarts.
* Keep database changes repeatable and limited to schema; do not add seed data.
* Preserve the frontend API seam and avoid external platform calls.
* Support local development on the available Windows environment without requiring a separately installed PostgreSQL daemon.
* Avoid implying identity, authorization, or hosted Azure integration that is not implemented.

## Considered Options

* Option 1: Local Node.js API with embedded PGlite.
    * Use PostgreSQL-compatible SQL, a versioned schema migration, and a loopback-only Node.js API.
    * Pros: Requires no external database service; supports persistent local data and the existing typed API seam.
    * Cons: The embedded database and singleton workspace are local-development choices, not a production hosting architecture.

* Option 2: Node.js API with a separately hosted PostgreSQL server.
    * Connect through a PostgreSQL driver and configured database URL.
    * Pros: Uses a conventional database service and supports independent API/database hosting.
    * Cons: Requires database provisioning and credentials that are not available in this local integration environment.

* Option 3: Keep the browser-only session store.
    * Leave all records in memory and make no API or database changes.
    * Pros: No service operations, database configuration, or server security surface.
    * Cons: Does not satisfy the requested persistence behavior and loses changes on refresh.

## Decision Outcome

Chosen option: "Local Node.js API with embedded PGlite"

Justification:
* It provides PostgreSQL-compatible schema migrations and persistent local records without requiring an installed PostgreSQL service.
* A Vite `/api` proxy keeps the frontend on the existing typed client boundary.
* A new database starts empty; no checklist templates, fixtures, or demo rows are inserted.
* The API is explicitly local and does not connect to external business platforms or agent services.

## Consequences

### Positive
* Workbench data survives browser refreshes and API restarts.
* Schema changes have an explicit migration file and repeatable runner.
* Endpoint behavior can be smoke-tested against an empty PostgreSQL-compatible database.

### Negative
* Hosting the API and database in Azure requires a separate deployment and database decision; static hosting alone is insufficient.
* The current single-workspace service has no sign-in or authorization and must not be exposed to untrusted networks.
* The backend duplicates the frontend API types because no shared package exists.

### Risks and Mitigations
* The API has no authentication. It binds to loopback by default; any network exposure requires an approved security design, authentication, and authorization.
* PGlite compatibility does not itself establish a production PostgreSQL hosting plan. Validate the migration against the chosen managed PostgreSQL service before deployment.
* The database contains manually entered engagement details. Keep its local data directory out of version control and do not add external platform credentials.

## Links

* Related ADRs: None.
* References: [Project plan](../../.azure/project-plan.md); [Integration hand-off](../../.azure/integration-plan.md).
* Superseded by: None.