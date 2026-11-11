# Register Per-Project Source Links for Portfolio Navigation

* Status: proposed
* Date: 2026-11-11

## Context and Problem Statement

The Portfolio view summarizes signals across projects, but the DL needs direct links to each project's source records in MME, DnA/Azure DevOps, AEP, Project SharePoint, myWizzard, and HVLV. The workbench needs a project registry to associate those references with stable project records.

The prototype uses a local Node.js API and PGlite. It has no sign-in, and live connectors to these business systems are not configured. A URL helps navigation but does not authorize or implement data transfer. Project URLs may be sensitive, and credentials or tokens must not be stored in project records.

## Decision Drivers

* Keep source links and external IDs scoped to a stable workbench project ID.
* Let the DL add and maintain links per project through the Portfolio page.
* Validate URLs and keep credentials out of the database.
* Distinguish a saved navigation link from a working data connection or successful sync.
* Allow future approved connectors to map source records back to the portfolio project.

## Considered Options

* Option 1: Persist a project registry with structured per-source links in the local API.
    * Store project name, client name, and a URL/external-ID pair for each supported source.
    * Pros: Supports multiple projects, editing, direct navigation, and future connector mapping.
    * Cons: Links are initially manual and do not provide data synchronization or source authorization.

* Option 2: Store links only in the single engagement workspace JSON.
    * Add all source links to the existing singleton engagement record.
    * Pros: Requires fewer API routes and no project-list view.
    * Cons: Cannot represent multiple projects cleanly and couples portfolio data to a single engagement.

* Option 3: Add no registry until source connectors are available.
    * Wait for approved connectors to supply project URLs and IDs.
    * Pros: Avoids storing manual references before integration design is complete.
    * Cons: Leaves the Portfolio without project navigation and forces DLs to locate source records manually.

## Decision Outcome

Chosen option: "Persist a project registry with structured per-source links in the local API."

Justification:
* The Portfolio needs a stable record per project before it can aggregate cross-project snapshots.
* The registry supports six source references without claiming that the systems are connected.
* Links are validated as HTTPS URLs, and URLs containing credentials or token-like query parameters are rejected.
* Connector authentication and data synchronization remain separate future work requiring approved permissions and secure server-side credentials.

## Consequences

### Positive
* DLs can manage source links and external IDs for multiple projects in one Portfolio area.
* Portfolio rows can link directly to the owning source system.
* Future connectors have a stable project ID and source identifiers for mapping.

### Negative
* The link registry does not read or synchronize MME, DnA/Azure DevOps, AEP, SharePoint, myWizzard, or HVLV data.
* The local API has no sign-in or authorization and remains loopback-only.

### Risks and Mitigations
* A link may be incorrect or stale. Allow DLs to update it and display its last registry update; require connector sync metadata before describing a source as connected.
* Source URLs may contain secrets. Enforce HTTPS, reject credentials and token-like query parameters, and never store API keys.
* Future connectors may need different identifiers. Keep source IDs optional and extend mappings only with source-owner and security approval.

## Links

* Related ADRs: [0001](0001-local-postgresql-workbench-api.md), [0002](0002-optional-azure-openai-variance-ideas.md).
* References: [Project plan](../../.azure/project-plan.md); [Product requirements](../product_requirements_document.md).
* Superseded by: None.