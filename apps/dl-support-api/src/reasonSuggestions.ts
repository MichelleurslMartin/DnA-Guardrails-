export interface ReasonIdeaRequest {
  payPeriodStart: string;
  payPeriodEnd: string;
  plannedHours: number;
  submittedHours: number | null;
  varianceHours: number | null;
  status: 'submitted' | 'awaiting' | 'unplanned';
}

export class AzureOpenAIConfigurationError extends Error {}

function parseIdeas(content: string): string[] {
  return content
    .split(/\r?\n/)
    .map((line) => line.replace(/^\s*(?:\d+[.)]|[-*])\s*/, '').trim())
    .filter((line) => line.length > 0)
    .slice(0, 5)
    .map((line) => line.slice(0, 400));
}

export async function generateReasonIdeas(input: ReasonIdeaRequest): Promise<string[]> {
  const endpoint = process.env.AZURE_OPENAI_ENDPOINT?.replace(/\/+$/, '');
  const apiKey = process.env.AZURE_OPENAI_API_KEY;
  const deployment = process.env.AZURE_OPENAI_DEPLOYMENT;
  const apiVersion = process.env.AZURE_OPENAI_API_VERSION ?? '2024-10-21';

  if (!endpoint || !apiKey || !deployment) {
    throw new AzureOpenAIConfigurationError('AI reason ideas are unavailable until Azure OpenAI is configured on the API.');
  }

  let endpointUrl: URL;
  try {
    endpointUrl = new URL(endpoint);
  } catch {
    throw new AzureOpenAIConfigurationError('The Azure OpenAI endpoint is not a valid URL.');
  }
  if (endpointUrl.protocol !== 'https:') {
    throw new AzureOpenAIConfigurationError('The Azure OpenAI endpoint must use HTTPS.');
  }

  const response = await fetch(
    `${endpointUrl.origin}/openai/deployments/${encodeURIComponent(deployment)}/chat/completions?api-version=${encodeURIComponent(apiVersion)}`,
    {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'api-key': apiKey },
      signal: AbortSignal.timeout(20_000),
      body: JSON.stringify({
        temperature: 0.2,
        max_tokens: 350,
        messages: [
          {
            role: 'system',
            content: 'Help a Delivery Lead investigate a variance between a planned resource plan and submitted time. Return up to five concise, neutral questions or possible categories to verify. Never state a cause as fact, judge an individual\'s capability, or recommend changing MME or budget without DL review. Consider additional work/change request, contingency use, capability or support needs, faster completion, work done ahead of schedule, MME plan not updated, late submission, and whether an MME replan keeps the forecast budget stable only as hypotheses. Output a numbered list only.',
          },
          {
            role: 'user',
            content: JSON.stringify({
              payPeriodStart: input.payPeriodStart,
              payPeriodEnd: input.payPeriodEnd,
              plannedHours: input.plannedHours,
              submittedHours: input.submittedHours,
              varianceHours: input.varianceHours,
              status: input.status,
            }),
          },
        ],
      }),
    },
  );

  if (!response.ok) throw new Error(`Azure OpenAI returned HTTP ${response.status}.`);
  const payload: unknown = await response.json();
  if (typeof payload !== 'object' || payload === null || !('choices' in payload) || !Array.isArray(payload.choices)) {
    throw new Error('Azure OpenAI returned an unexpected response.');
  }
  const firstChoice: unknown = payload.choices[0];
  if (typeof firstChoice !== 'object' || firstChoice === null || !('message' in firstChoice)) {
    throw new Error('Azure OpenAI returned no reason ideas.');
  }
  const message: unknown = firstChoice.message;
  if (typeof message !== 'object' || message === null || !('content' in message) || typeof message.content !== 'string') {
    throw new Error('Azure OpenAI returned no reason ideas.');
  }

  const ideas = parseIdeas(message.content);
  if (!ideas.length) throw new Error('Azure OpenAI returned no reason ideas.');
  return ideas;
}