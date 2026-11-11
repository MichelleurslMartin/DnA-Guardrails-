# Architecture Decision Records

## Overview

This directory contains Architecture Decision Records (ADRs) for the Agentic Adventures project. ADRs are used to document important architectural decisions, their context, and consequences.

## How to Use ADRs

1. Copy `template.md` to create a new ADR
2. Name the file using the format: `NNNN-title-with-hyphens.md` where NNNN is the next available number
3. Fill in all sections of the template
4. Add the ADR to the table below
5. Submit for review as part of a pull request

## Decision Log

| Number | Title | Status | Date | Description |
|--------|-------|--------|------|-------------|
| 0000 | [Using ADRs](template.md) | Accepted | 2025-06-10 | Template for architecture decisions |
| 0001 | [Persist Workbench Records Through a Local PostgreSQL API](0001-local-postgresql-workbench-api.md) | Proposed | 2026-10-29 | Add a loopback Node.js API and PostgreSQL-compatible local persistence without seed data |
| 0002 | [Offer Optional AI Variance Ideas Through Azure OpenAI](0002-optional-azure-openai-variance-ideas.md) | Proposed | 2026-11-09 | Generate anonymized, unverified prompts for DL review without exposing resource identity or comments |
| 0003 | [Register Per-Project Source Links for Portfolio Navigation](0003-portfolio-project-source-links.md) | Proposed | 2026-11-11 | Store project-scoped source URLs and IDs as navigation references, separate from authenticated data connectors |
| 0004 | [Scope Engagement Checks to Portfolio Projects](0004-project-scoped-engagement-checks.md) | Proposed | 2026-11-11 | Store manual AEP/BizApps checks and HVLV reason comments by project to prevent cross-project data leakage |

## ADR Statuses

- **Proposed**: A decision has been proposed but not yet reviewed
- **Accepted**: The decision has been accepted and is being implemented
- **Rejected**: The decision was rejected
- **Deprecated**: The decision was once accepted but is no longer relevant
- **Superseded**: The decision has been replaced by a newer decision