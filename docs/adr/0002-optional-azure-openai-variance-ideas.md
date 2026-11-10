# Offer Optional AI Variance Ideas Through Azure OpenAI

* Status: proposed
* Date: 2026-11-09

## Context and Problem Statement

Financial Governance compares MME planned resource hours with HVLV submitted hours. A variance is a signal for the Delivery Lead (DL) to investigate, not proof of its cause. The DL needs to record a verified reason and action, while optional AI can suggest neutral questions or possible categories to check.

The API currently has no configured AI provider. The local workbench has no sign-in, and resource names, enterprise IDs, cost collectors, and DL comments can be sensitive. The user has not confirmed an Azure OpenAI deployment or supplied its configuration.

## Decision Drivers

* Keep credentials on the API and disabled when deployment settings are absent.
* Send only pay-period dates, hour totals, variance, and reconciliation status to the model.
* Keep AI output separate from the DL's verified reason comment.
* Do not diagnose capability, approve change requests, change MME, or alter a budget automatically.
* Keep the workbench useful when AI is unavailable.

## Considered Options

* Option 1: Optional Azure OpenAI endpoint behind the API.
    * Configure endpoint, key, and deployment in the API environment; return suggestions only when configured.
    * Pros: Keeps secrets out of the browser and supports an explicitly labeled AI action.
    * Cons: Requires an approved Azure deployment, secret management, and review of data handling before use.

* Option 2: Use fixed prompts or rule-based suggestions.
    * Generate questions from variance types without calling a model.
    * Pros: Works offline and is deterministic.
    * Cons: Must not be presented as AI-generated and cannot adapt ideas to the submitted variance.

* Option 3: Do not provide AI ideas.
    * Keep the DL review trigger and comment field only.
    * Pros: No model dependency or external data transfer.
    * Cons: Provides no AI-assisted investigation prompts.

## Decision Outcome

Chosen option: "Optional Azure OpenAI endpoint behind the API, disabled until configured."

Justification:
* The DL can save a verified reason without AI.
* The AI request excludes names, IDs, cost collectors, and comments.
* Missing configuration returns an unavailable response instead of canned content presented as AI.
* The deployment choice remains proposed until reviewed and approved by the organization.
* The API reads `AZURE_OPENAI_ENDPOINT`, `AZURE_OPENAI_API_KEY`, and `AZURE_OPENAI_DEPLOYMENT` from its server environment; `AZURE_OPENAI_API_VERSION` is optional.

## Consequences

### Positive
* AI ideas can help the DL investigate additional work, contingency use, capability support, faster completion, work done ahead of plan, or delayed reporting.
* The DL remains responsible for confirming the real cause and recording the reason.

### Negative
* AI ideas do not work until the API has an approved Azure OpenAI endpoint, key, and deployment.
* The current local API has no authentication and must not be exposed beyond loopback.

### Risks and Mitigations
* A model may suggest an incorrect cause. Label output as a hypothesis and require DL verification.
* Resource identity or comments could reveal sensitive information. Do not include them in the model request.
* API-key configuration may not meet production identity requirements. Review managed identity and organizational policy before hosted use.

## Links

* Related ADRs: [0001](0001-local-postgresql-workbench-api.md).
* References: [Azure OpenAI REST API reference](https://learn.microsoft.com/en-us/azure/ai-foundry/openai/reference).
* Superseded by: None.