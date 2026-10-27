import type { ChatMessage, RevenueMetric } from '../types';

type AssistantReply = { text: string; suggestions: string[] };

export class AssistantRequestError extends Error {
  constructor(public readonly code: string, message: string) { super(message); }
}

export async function requestAssistant(
  kind: 'customer' | 'owner',
  input: { prompt: string; history: ChatMessage[]; businessData?: RevenueMetric },
  fetcher: typeof fetch = fetch,
): Promise<AssistantReply> {
  let response: Response;
  try {
    response = await fetcher(`/api/ai/${kind}-assistant`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
      signal: AbortSignal.timeout(35000),
    });
  } catch (error) {
    const timedOut = error instanceof Error && ['TimeoutError', 'AbortError'].includes(error.name);
    throw new AssistantRequestError(timedOut ? 'AI_TIMEOUT' : 'AI_NETWORK_ERROR', timedOut
      ? 'The AI service took too long to respond. Please try again.'
      : 'Could not connect to the chat service. Check your connection and try again.');
  }
  let data: { text?: unknown; suggestions?: unknown; error?: { code?: unknown; message?: unknown } };
  try { data = await response.json(); }
  catch { throw new AssistantRequestError('AI_INVALID_RESPONSE', 'The chat service is unavailable. Please try again shortly.'); }
  if (!response.ok) {
    const code = typeof data?.error?.code === 'string' ? data.error.code : `HTTP_${response.status}`;
    const message = typeof data?.error?.message === 'string' ? data.error.message : 'The AI assistant is unavailable. Please try again.';
    throw new AssistantRequestError(code, message);
  }
  if (!data || typeof data.text !== 'string' || !data.text.trim()) {
    throw new AssistantRequestError('AI_INVALID_RESPONSE', 'The AI assistant returned an empty response. Please try again.');
  }
  return { text: data.text, suggestions: Array.isArray(data.suggestions)
    ? data.suggestions.filter((entry): entry is string => typeof entry === 'string' && Boolean(entry.trim())).slice(0, 3) : [] };
}
