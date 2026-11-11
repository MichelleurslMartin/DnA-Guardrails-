# [Your Project Name] - Product Requirements Document

> **Template Note**: This is a template for writing product requirements documents for AI-powered applications. Replace all bracketed placeholders with your project-specific content and remove this note.

## Background and Problem Statement

The Delivery Lead's problem is not a lack of information. It is cognitive overload.

**Today**

Fragmented tools and information

→ manual interpretation

→ manual consolidation

→ late signals

→ inconsistent execution

→ the Delivery Lead acts reactively

**With an AI Delivery Lead Companion**

Project context, methodology, and delivery evidence

→ continuous interpretation

→ early warning

→ recommended next-best action

→ relevant templates and guidance

→ the Delivery Lead makes the decision

**Outcome**

Less administration. Earlier intervention. More consistent delivery. More time for leadership and client value.

This positioning complements, rather than competes with, the existing AI Powered Delivery Management strategy, whose stated purpose is to improve productivity, quality, decision-making, client value, and growth outcomes. See *Global Launch: AI Powered Delivery Management SIG (All Regions)*.

The product should not create another repository or another isolated agent. It should be the intelligent front door and daily operating companion for the Delivery Lead.

## Product Vision Statement

**Product Owner:** Revenue and Delivery Lead of CEE ERP (single accountable owner).

Create an intelligent Delivery Lead Companion that continuously understands the project, anticipates what needs attention, and guides the Delivery Lead toward the next best action, while keeping accountability and judgment with the human.

### Product Outcomes

From managing projects individually to learning and optimizing as a portfolio.

**For the project:**

Keep delivery continuously aligned with the client's vision and expected business outcomes, identifying deviations and recommending interventions before they become delivery problems.

**For the ERP portfolio:**

Turn signals from every engagement into comparable portfolio intelligence, enabling earlier leadership intervention, smarter capability allocation, and stronger commercial control.

**For Avanade:**

Create a continuous learning system where every project makes the next project better.

## Architecture

The Companion brings together project context, approved delivery methodology, and current delivery evidence from authorized connected tools. It interprets that information in the context of the project's stage and presents the Delivery Lead with:

- A clear recommended next step, with the reason and relevant guidance.
- A dashboard of flags that need review, prioritized by urgency and potential impact.
- Links from each recommendation or flag to its supporting information and directly to the tool and location where the Delivery Lead should act.

The Delivery Lead reviews the evidence and makes the decision. Where a connected tool supports an approved update flow, the Companion may prepare the required data for review, but it does not submit changes without the Delivery Lead's approval. The connected tool remains the system of record; the Companion provides guidance, context, and navigation rather than becoming another project repository.

At portfolio level, authorized project signals can be normalized for comparison and trend review, while respecting access controls and the source of each signal.

## Agent Definitions

Start with one bounded **Delivery Lead Companion** AI capability, not a separate agent for every project stage or connected tool. The product should provide the reliable workflow, data access, controls, and user interface; AI should be used where interpreting context or language adds value.

### DL Companion AI

- **Purpose:** Help the DL understand what changed, what needs attention, and what to do next, using authorized project context, delivery evidence, and approved methodology.
- **Use AI for:** Summarizing information across sources; explaining why a flag may matter; relating evidence to guidance; identifying possible conflicts or gaps; recommending a next action with reasons; and drafting a status note, decision brief, or proposed update for DL review.
- **Return:** A concise finding, supporting source links, relevant guidance, uncertainty or missing information, a recommended action, and a link to the tool and record where the DL can act.
- **Boundaries:** Distinguish source facts from interpretation. Do not invent policy, silently resolve conflicting evidence, approve decisions, change project baselines, or submit updates without explicit DL approval. Respect source permissions and identify unavailable data.

### The DL's Daily Loop

1. **Start the day:** Product logic gathers authorized due dates, changed records, and configured thresholds to show upcoming work and flags. AI summarizes the most important changes and explains why they may need attention.
2. **Review and act:** For each item, the Companion shows the evidence and applicable guidance, recommends a next step, and links to the exact source and action location. The DL decides what to do and completes or approves the action in the connected tool.
3. **Respond to change:** When new evidence arrives or a project record changes, product logic refreshes affected flags. AI can explain what changed and whether the recommendation should be reconsidered.
4. **Prepare the delivery cadence:** AI can draft a status summary, meeting brief, or decision request from current evidence. The DL checks it before sharing; the product tracks the action or approval state.
5. **Manage gates and exceptions:** Product logic presents the applicable checklist and highlights missing or overdue evidence. AI can summarize readiness, open concerns, and options, but accountable stakeholders make gate, recovery, escalation, and closure decisions.

### Product Logic Versus AI

- **Product logic, no agent needed:** Authentication and permissions; reading records through approved connectors; lifecycle checklists; due-date and threshold checks; status and approval tracking; deep links; controlled writes; and audit history. These should be predictable, testable, and rule-based wherever possible.
- **AI is useful:** Interpreting unstructured project material, bringing evidence from several sources together, explaining possible implications, and drafting tailored recommendations or communications. AI output must include evidence and remain reviewable.
- **DL and accountable owners:** Set priorities, accept risks, approve changes, make commitments, escalate, and decide whether a project is ready to move stages.

Do not add specialist agents unless a distinct, measurable need emerges that the single Companion capability cannot meet. A later portfolio analysis capability may help compare trends across engagements, subject to access, data quality, and governance controls.

## Communication Flow

The flow is organized around the Delivery Lead's work, not communication between multiple agents:

1. **Open the Companion:** The DL sees one dashboard of open to-dos, upcoming work, and flags that need review, based on the projects and records they are authorized to access.
2. **Understand the task:** Each item explains what needs attention, why it matters, the supporting evidence, and the relevant Avanade guidance or template. AI may summarize context or recommend a next step, with links to its sources.
3. **Go to the system where work belongs:** Each item links to the relevant record or action in the owning tool. For example, resource and project-plan updates go to MME; project-status updates go to myWizzard; and invoicing checks go to HVLV.
4. **Take action:** The DL reviews the information and makes the update in the destination tool. The destination remains the system of record. Any prepared update requires DL review and approval before submission.
5. **Confirm and track:** Where an approved connection can verify the result, the Companion refreshes the to-do from that source. Otherwise, the DL marks it complete and records a note or evidence link. Opening a destination tool alone does not count as completion.

The Companion should use authenticated, permission-aware connections and direct links where the destination tool supports them. If a link, access right, or completion check is unavailable, it should say so and provide the known destination rather than imply that an action was completed. MME, myWizzard, and HVLV are example destinations; their exact records, links, and integration capabilities must be confirmed with their owners.

## Technical Requirements

### Core System

- **Framework**: The current prototype uses React and TypeScript for the workbench, a Node.js/TypeScript API, and Vite for local development. Keep external tool access behind the API so browser code does not handle tool credentials.
- **AI Integration**: No AI endpoint is configured by default. The financial-governance reason-idea endpoint can call a server-side Azure OpenAI deployment when approved settings are supplied through `AZURE_OPENAI_ENDPOINT`, `AZURE_OPENAI_API_KEY`, and `AZURE_OPENAI_DEPLOYMENT` (optional: `AZURE_OPENAI_API_VERSION`). It receives pay-period dates, hour totals, variance, and reconciliation status only; consultant names, enterprise IDs, cost collectors, and DL comments are excluded. Ideas are unverified hypotheses, and AI must not determine a cause, change MME, approve a change request, or submit updates.
- **State Management**: Connected business tools remain the systems of record. The Companion tracks only information needed to manage its workflow, such as task status, source links, approvals, and audit history. Show where each fact came from and when it was last checked.
- **Portfolio Project Registry**: Store each project with direct links and optional source IDs for MME, DnA/Azure DevOps, AEP, Project SharePoint, myWizzard, and HVLV. Mark saved links as navigation-only until an approved connector is configured. Never store credentials or tokens in project URLs.
- **Project Engagement Checks**: Scope manual AEP and BizApps Platform DnA verification records and HVLV variance-reason comments to a Portfolio project. Switching project tabs must load and save only that project's records. Preserve the legacy unassigned workspace separately until its records are explicitly associated with a project.
- **Data Storage**: The prototype currently uses PGlite for local storage. Choose the production data store through security and architecture review. Store the minimum needed; avoid copying full project records when a secure link or reference will do.
- **Real-time Updates**: Real-time updates are not needed for the first release. Start with refresh when the DL opens the dashboard and show the last sync time. Add scheduled or event-based updates when connected tools support them, with a clear warning when data is stale or a sync fails.
- **Security and Operations**: Require approved sign-in and role-based access. Respect each source tool's permissions, protect secrets, and record important access and user-approved actions for audit.

### [Domain-Specific System Name]

[Add domain-specific technical requirements]

- **[Component Name]**: [Specific requirements]
- **[Integration Name]**: [Integration specifications]
- **[Performance Metric]**: [Performance requirements]

### User Interface

- **[Interface Type]**: [Primary interaction method]
- **[Display Component]**: [Visual representation requirements]
- **[Visualization Tool]**: [Data visualization needs]
- **[Media Gallery]**: [Media storage and display requirements]
- **[Feedback System]**: [User feedback mechanisms]
- **[History Management]**: [Session and data persistence]

## Workflows

### [Primary Workflow Name]

[Describe your main user workflow]

1. [Step 1 description]
2. [Step 2 description]
3. [Step 3 description]
4. [Step 4 description]
5. [Step 5 description]

### [Secondary Workflow Name]

[Describe supporting workflows]

1. [Process step]
2. [Agent coordination step]
3. [Data processing step]
4. [User interaction step]
5. [Output generation step]

### [Additional Workflow Name]

[Add more workflows as needed]

1. [Workflow step]
2. [Integration point]
3. [Decision point]
4. [Processing step]
5. [Result delivery]

## User Stories

### [Primary User Type] Stories

- As a [user type], I want to [action] so that [benefit]
- As a [user type], I want to [action] so that [benefit]
- As a [user type], I want to [action] so that [benefit]

### [Secondary User Type] Stories

- As a [user type], I want to [action] so that [benefit]
- As a [user type], I want to [action] so that [benefit]
- As a [user type], I want to [action] so that [benefit]

## Implementation Phases

### Phase 1: [Foundation Phase Name]

- [Core requirement 1]
- [Core requirement 2]
- [Core requirement 3]
- [Core requirement 4]

### Phase 2: [Enhancement Phase Name]

- [Enhanced feature 1]
- [Enhanced feature 2]
- [Enhanced feature 3]
- [Enhanced feature 4]

### Phase 3: [Advanced Phase Name]

- [Advanced feature 1]
- [Advanced feature 2]
- [Advanced feature 3]
- [Advanced feature 4]

### Phase 4: [Integration Phase Name]

- [Integration feature 1]
- [Integration feature 2]
- [Integration feature 3]
- [Integration feature 4]

### Phase 5: [Optimization Phase Name]

- [Optimization feature 1]
- [Optimization feature 2]
- [Optimization feature 3]
- [Optimization feature 4]

## Compliance and Legal

[Add any compliance requirements specific to your domain]

- [Legal requirement 1]
- [Compliance standard 1]
- [Attribution requirement]
- [Terms of use considerations]

## Success Metrics

[Define how you will measure success]

- [Metric 1] (e.g., user engagement duration)
- [Metric 2] (e.g., task completion rates)
- [Metric 3] (e.g., system performance metrics)
- [Metric 4] (e.g., user satisfaction scores)
- [Metric 5] (e.g., quality assessment criteria)
- [Metric 6] (e.g., response times and stability)

## Conclusion

[Summarize your product vision and approach]

[Write a brief conclusion that:
- Summarizes the product approach
- Reinforces the value proposition
- Highlights key differentiators
- Connects to user benefits
- Emphasizes the technical strategy]