import type { RequestHandler } from 'express';
import type { Content, GenerateContentParameters } from '@google/genai';

export const DEFAULT_GEMINI_MODEL = 'gemini-flash-latest';
const MAX_PROMPT_LENGTH = 8000;
const MAX_HISTORY_MESSAGES = 12;

export function assistantConfiguration(env: Record<string, string | undefined>) {
  const key = env.GEMINI_API_KEY?.trim();
  return {
    apiKey: key && key !== 'MY_GEMINI_API_KEY' ? key : undefined,
    model: env.GEMINI_MODEL?.trim() || DEFAULT_GEMINI_MODEL,
  };
}

const CUSTOMER_INSTRUCTION = `You are the True Lengths AI Salon Concierge — a warm, cultured, world-class expert consultant specializing in Black hair care, textured hair (Type 3A through 4C), Silk Presses, Protective Styles (Knotless Braids, Fulani Braids, Passion Twists), Locs (Starter locs, retwists, detox), Custom Balayage on textured hair, Microlinks, Scalp Barrier Health, and Melanin-Rich Skin Care.

Your Persona: Warm, empowering, culturally knowledgeable, refined, and empathetic. You celebrate textured hair versatility, healthy growth retention, curl pattern preservation, moisture balance, and radiant melanin skin care.

Key Salon Offerings & Expertise:
- Master Stylist & Founder: Carolyn R.
- Core Hair Services: Silk Press with Thermal Protection ($75+), Knotless Braids ($150+), Starter Locs & Retwists ($95+), Microlinks ($350+), Custom Balayage for Textured Hair ($180+), Protective Style Take-down ($60+).
- Scalp & Hair Treatments: Deep Steam Hydration Mask ($45+), Scalp Detox & Exfoliation ($55+), Rice Water Protein Therapy ($40+), Hot Oil Treatment ($35+).
- Melanin Skin Care & Esthetics: Gold Glow HydraFacial ($110+), Dark Spot & Hyperpigmentation Facial ($95+), Botanical Gentle Peel ($85+).
- Philosophy: Healthy hair retention over quick fixes, heat protection, tension-free styling, scalp barrier nourishing, and glowing melanin skin.

Answer user questions concisely in 2-3 warm, expert sentences with practical, actionable advice.
ALWAYS end your response with 3 logical, interactive follow-up questions tailored directly to Black hair care, protective styles, scalp health, or melanin skin care, formatted at the very end on a new line as:
SUGGESTED_FOLLOWUPS: ["Question 1", "Question 2", "Question 3"]`;

const ownerInstruction = (businessData: unknown) => `You are True Lengths AI Executive Operations Advisor — an elite business intelligence partner for the salon owner.
You analyze revenue trends, stylist productivity, inventory stockouts, client retention rates, and local marketing strategies.
You speak like a seasoned business strategist and luxury brand director: clear, actionable, data-driven, and empowering.

Current Salon Metrics (from live Firestore businessData — never invent numbers):
${JSON.stringify(businessData || {}, null, 2)}

If businessData is empty or zeroed, say that no completed appointments/revenue are recorded yet. Do not invent sample metrics.

CRITICAL INSTRUCTION:
At the end of your response, you MUST provide exactly 3 relevant, actionable follow-up questions or next steps to keep the conversation going and help the owner explore deeper insights.
Format them at the very end of your output after a blank line as:
SUGGESTED_FOLLOWUPS: ["Follow-up option 1", "Follow-up option 2", "Follow-up option 3"]`;

const DEFAULT_SUGGESTIONS = {
  customer: ['How can I protect my hair between appointments?', 'Which salon service fits my needs?', 'How can I prepare for my appointment?'],
  owner: ['Summarize the available revenue data', 'Suggest ways to improve client retention', 'What additional data would help this analysis?'],
};

type AssistantKind = 'customer' | 'owner';
type Generate = (request: GenerateContentParameters) => Promise<{ text?: string }>;

export function parseAssistantReply(text: string, kind: AssistantKind) {
  const marker = 'SUGGESTED_FOLLOWUPS:';
  const index = text.indexOf(marker);
  const cleanText = (index < 0 ? text : text.slice(0, index)).trim();
  if (!cleanText) throw new Error('Empty model response');
  let suggestions = DEFAULT_SUGGESTIONS[kind];
  if (index >= 0) {
    try {
      const parsed: unknown = JSON.parse(text.slice(index + marker.length).trim());
      if (Array.isArray(parsed)) {
        const valid = parsed.filter((entry): entry is string => typeof entry === 'string' && Boolean(entry.trim()))
          .map((entry) => entry.trim().slice(0, 200)).slice(0, 3);
        if (valid.length) suggestions = valid;
      }
    } catch { /* Reply text remains usable if follow-up formatting is malformed. */ }
  }
  return { text: cleanText, suggestions };
}

function conversationContents(history: unknown, prompt: string): Content[] {
  const contents: Content[] = [];
  if (Array.isArray(history)) {
    for (const entry of history.slice(-MAX_HISTORY_MESSAGES)) {
      if (!entry || typeof entry.text !== 'string' || !entry.text.trim()) continue;
      if (entry.sender !== 'user' && entry.sender !== 'assistant') continue;
      // Initial UI greetings are not conversation turns from the provider.
      if (contents.length === 0 && entry.sender === 'assistant') continue;
      contents.push({ role: entry.sender === 'user' ? 'user' : 'model', parts: [{ text: entry.text.slice(0, MAX_PROMPT_LENGTH) }] });
    }
  }
  contents.push({ role: 'user', parts: [{ text: prompt }] });
  return contents;
}

export function assistantFailure(error: unknown) {
  const source = error as { status?: number; code?: number; name?: string } | undefined;
  const status = source?.status ?? source?.code;
  if (status === 429) return { status: 429, code: 'AI_RATE_LIMITED', message: 'The AI service has reached its request limit. Please try again later.' };
  if (status === 400) return { status: 503, code: 'AI_CONFIGURATION_ERROR', message: 'The AI service configuration was rejected. Please contact salon support.' };
  if (status === 401 || status === 403) return { status: 503, code: 'AI_CREDENTIALS_REJECTED', message: 'The AI service could not verify its configuration. Please contact salon support.' };
  if (status === 404) return { status: 503, code: 'AI_MODEL_UNAVAILABLE', message: 'The configured AI model is unavailable. Please contact salon support.' };
  if (source?.name === 'AbortError' || source?.name === 'TimeoutError' || status === 408 || status === 504) {
    return { status: 504, code: 'AI_TIMEOUT', message: 'The AI service took too long to respond. Please try again.' };
  }
  return { status: 502, code: 'AI_UNAVAILABLE', message: 'The AI assistant is temporarily unavailable. Please try again shortly.' };
}

export function createAssistantHandler(kind: AssistantKind, options: { model: string; generate: Generate | null }): RequestHandler {
  return async (req, res) => {
    const { prompt, history, businessData } = req.body ?? {};
    if (typeof prompt !== 'string' || !prompt.trim() || prompt.length > MAX_PROMPT_LENGTH) {
      res.status(400).json({ error: { code: 'INVALID_PROMPT', message: 'Enter a question of 8,000 characters or fewer.' } });
      return;
    }
    if (!options.generate) {
      res.status(503).json({ error: { code: 'AI_NOT_CONFIGURED', message: 'The AI assistant has not been connected yet. Please contact salon support.' } });
      return;
    }
    try {
      const response = await options.generate({
        model: options.model,
        contents: conversationContents(history, prompt.trim()),
        config: {
          systemInstruction: kind === 'customer' ? CUSTOMER_INSTRUCTION : ownerInstruction(businessData),
          temperature: kind === 'customer' ? 0.7 : 0.6,
          abortSignal: AbortSignal.timeout(25000),
        },
      });
      res.json(parseAssistantReply(response.text ?? '', kind));
    } catch (error) {
      const failure = assistantFailure(error);
      // Never log provider messages: they can contain request URLs, keys or prompt data.
      console.error(`AI ${kind}: ${failure.code}`);
      res.status(failure.status).json({ error: { code: failure.code, message: failure.message } });
    }
  };
}
