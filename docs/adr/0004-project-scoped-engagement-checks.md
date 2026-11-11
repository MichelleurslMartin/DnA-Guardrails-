# Scope Engagement Checks to Portfolio Projects

* Status: proposed
* Date: 2026-11-11

## Context and Problem Statement

The workbench is moving from one project workspace to a Portfolio of projects. Manual AEP and BizApps Platform DnA verification, and DL comments about HVLV variances, must not be shared between projects. Existing engagement checks are stored as a single workspace record, while Portfolio projects have stable IDs.

The prototype has no sign-in or live source connectors. The project-scoped records are manually maintained workbench data; they are not proof that the external source record exists or is synchronized.

## Decision Drivers

* Scope engagement checks and financial variance comments to a stable Portfolio project ID.
* Preserve legacy unassigned workspace records without silently assigning them to a project.
* Reuse the current EngagementWorkspace schema and manual verification rules.
* Keep source platforms as systems of record; do not imply that navigation links verify data.
* Support project deletion without orphaning project-scoped engagement records.

## Considered Options

* Option 1: Store one engagement JSON record per Portfolio project and include project ID in HVLV comment keys.
    * Use a project-keyed table for engagement records and a project ID in the HVLV comment composite key.
    * Pros: Clear project isolation, simple project-tab loading, and referential cleanup with project deletion.
    * Cons: Adds a migration and project-aware API routes; legacy records remain separate until explicitly associated.

* Option 2: Keep one global engagement record and add a selected project field in the UI.
    * Continue storing all manual checks in the singleton workspace.
    * Pros: Minimal schema change.
    * Cons: Project tabs could display or overwrite another project's checks; ownership is ambiguous.

* Option 3: Store all project checks in one JSON document keyed by project ID.
    * Keep all records in a single JSONB object.
    * Pros: Fewer relational tables.
    * Cons: Harder to validate, update, and constrain per-project records; concurrent writes can replace unrelated projects.

## Decision Outcome

Chosen option: "Store one engagement record per Portfolio project and scope HVLV comments by project ID."

Justification:
* A relational primary key makes project ownership explicit.
* Existing manual verification behavior is reused for every project's AEP/BizApps records.
* HVLV reason reads and writes include project ID in addition to pay period, enterprise ID, and cost collector.
* The old singleton workspace remains available as an unassigned tab and is not copied into a project without DL action.

## Consequences

### Positive
* Each Portfolio tab loads and saves only that project's checks.
* Projects can reuse the same resource ID or cost collector without sharing reason comments.
* Deleting a Portfolio project cascades to its engagement-check record.

### Negative
* The legacy current-workspace record is not automatically assigned to any new project.
* Project-scoped records remain manual until approved connectors are implemented.

### Risks and Mitigations
* A DL can still record incorrect manual verification. Keep the manual-only label and require source/evidence review.
* Older HVLV comments use the empty legacy project ID. Do not silently attach them to a project; migrate only with an explicit project association.
* The local API is unauthenticated. Keep it loopback-only until approved authentication and authorization are designed.

## Links

* Related ADRs: [0001](0001-local-postgresql-workbench-api.md), [0003](0003-portfolio-project-source-links.md).
* References: [Project plan](../../.azure/project-plan.md); [Product requirements](../product_requirements_document.md).
* Superseded by: None.