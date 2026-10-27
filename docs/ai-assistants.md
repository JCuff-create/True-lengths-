# Customer and owner AI assistants

Both chats call the Express backend, which calls Google's Gemini API. The key stays on the server. No Gemini key belongs in a VITE_ variable, browser code, Git, or chat messages.

## Local development in Cursor

1. Install with `npm ci` using Node 22.23.4 (or a newer Node release that supports `--use-env-proxy`).
2. Copy `.env.example` to `.env.local` if that file does not already exist. Enter a Gemini API key securely in the local file. Do not overwrite existing settings. These files are ignored by Git.
3. Run `npm run dev` from the repository root. This starts **Express and Vite together** on port 3000. Running Vite alone or using `npm run preview` only serves frontend assets; it does not provide the chat API.
4. Restart the server after changing the key or model. Process-injected settings take precedence over `.env.local`, then `.env`. The dev/start commands and Docker entrypoint enable Node’s environment-proxy support; in managed cloud environments this is necessary for proxy-injected credentials and egress routing. Keep TLS verification enabled. If running the server directly, use `node --use-env-proxy --import tsx server.ts` or `node --use-env-proxy dist/server.cjs`.
5. Ask each chat a question and a contextual follow-up. The owner advisor uses the supplied revenue metrics; it has no automatic access to client lists, inventory, purchasing, or other datasets not supplied to it.

## Runtime configuration

- `GEMINI_API_KEY`: a server-side key from Google AI Studio with access to the Gemini API. The example placeholder is not a valid credential. Check key restrictions and the project's Gemini API quota/billing if Google rejects requests.
- `GEMINI_MODEL`: optional; defaults to `gemini-flash-latest`, the Flash alias used in Google's official JavaScript SDK README: https://github.com/googleapis/js-genai#quickstart . Set an explicit supported model if your project requires one. The old hard-coded `gemini-3.8-flash` identifier has been removed.
- HTTPS egress must permit `generativelanguage.googleapis.com`.

For a deployed app, configure the key securely on the host running `dist/server.cjs`, then restart/redeploy through your normal release process. Publishing a development environment or pushing Git commits does not configure the live website's key.

The Codex cloud environment draft contains a GEMINI_API_KEY secret requirement scoped to generativelanguage.googleapis.com and a GEMINI_MODEL suggestion. Values must be entered securely in environment settings. A configured key is not proof that Google has accepted it; verify an actual response before calling the integration ready.

## Diagnose failures

The server logs only the assistant role and error code, never the key, prompt, provider request URL, or raw provider error message.

| Code | Action |
| --- | --- |
| AI_NOT_CONFIGURED | Set the server key and restart. |
| AI_CONFIGURATION_ERROR | Google rejected the request configuration; check the key, model, and API setup. |
| AI_CREDENTIALS_REJECTED | Verify key permissions/restrictions and Gemini API access for the Google project. A proxy domain denial can also return 403; verify network policy. |
| AI_MODEL_UNAVAILABLE | Select a model available to the key's project. |
| AI_RATE_LIMITED | Check Google project quota/billing and retry later. |
| AI_TIMEOUT / AI_NETWORK_ERROR / AI_UNAVAILABLE | Check API egress, server availability, and provider status. |
| AI_INVALID_RESPONSE | Confirm requests reach Express, not a static frontend-only host, and that the provider returned text. |

Missing configuration and provider failures return non-2xx HTTP responses, not scripted replies disguised as working AI. The UI keeps the question ready to resend and shows a clear error without inventing an answer. Requests have timeouts and do not automatically retry rejected credentials.

## Checks

Run `npm run lint`, `npm run test:ai`, and `npm run build`. Automated tests cover both HTTP routes with an injected provider and both clients, including conversation history, missing credentials, invalid model, authentication errors, quota, timeouts, HTML responses and empty replies. These tests do not call paid Gemini services and do not validate real credentials. Live validation requires an authorized key and network access.
