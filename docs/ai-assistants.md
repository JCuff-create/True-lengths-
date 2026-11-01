# Customer and owner AI assistants

Both chats call the Express backend, which calls Google's Gemini API. The key stays on the server. No Gemini key belongs in a VITE_ variable, browser code, Git, or chat messages.

## Local development in Cursor

1. Install with `npm ci` using Node 22.23.4 (or a newer Node release that supports `--use-env-proxy`).
2. Copy `.env.example` to `.env.local` if that file does not already exist. Enter a Gemini API key securely in the local file. Do not overwrite existing settings. These files are ignored by Git.
3. Run `npm run dev` from the repository root. This starts **Express and Vite together** on port 3000. Running Vite alone or using `npm run preview` only serves frontend assets; it does not provide the chat API.
4. Restart the server after changing the key or model. Process-injected settings take precedence over `.env.local`, then `.env`. The dev/start commands and Docker entrypoint enable Node’s environment-proxy support; in managed cloud environments this is necessary for proxy-injected credentials and egress routing. Keep TLS verification enabled. If running the server directly, use `node --use-env-proxy --import tsx server.ts` or `node --use-env-proxy dist/server.cjs`.
5. Sign in and ask each chat a question and a contextual follow-up. Both chats send a Firebase ID token. Only active owners may use the owner advisor or Marketing copy generation. The owner advisor loads aggregated appointment metrics from its verified salon on the server; browser-supplied metrics and salon identifiers are ignored. It does not load customer names, contact details, client lists, inventory or purchasing data.

## Authentication, authorization and usage enforcement

The server uses Firebase Admin `verifyIdToken(token, true)` on every generation request, including revoked-token/disabled-user checks. It then reads the current user profile from the configured named Firestore database. Request bodies and token role claims cannot grant owner access or choose a salon. Missing profiles, pending/disabled accounts and malformed salon memberships are denied. Legacy customer profiles may omit status/salon ID; staff and owners must be explicitly active. Missing salon IDs use the application's existing `truelengths-main` legacy scope.

All generation routes (`/api/ai/customer-assistant`, `/api/ai/owner-assistant`, `/api/marketing/copy`) share server-only counters in `aiUsage`. Existing default-deny Firestore rules prevent all client access to these counters, including owner clients. A single transaction checks and reserves both the user's and salon's minute/day allowances, rereads the user's permissions, and fails closed if the quota store fails. Limits persist across processes/restarts; simultaneous requests cannot overspend them. User limits follow the UID even if salon membership changes. No in-memory fallback or client-controlled quota override exists.

Default limits:

| Scope | Requests per UTC minute | Requests per UTC day | Reserved units per UTC day |
| --- | --- | --- | --- |
| User | 6 | 50 | 500,000 |
| Salon | 60 | 500 | 5,000,000 |

Minute limits use fixed UTC minute buckets, not a rolling window. Each admitted attempt reserves its bounded conversation's UTF-8 JSON bytes plus a 6,000-byte system/context allowance and 1,024 output units. These conservative units are an application allowance, not provider-reported token counts or a dollar billing meter. Both daily request and unit caps are enforced; whichever runs out first stops generation with HTTP 429 and `Retry-After`. Reservations remain charged for provider errors and timeouts so retries cannot reset the cap. Authentication/validation failures and missing provider configuration do not reserve usage. Owner data or provider failures after admission retain their reservation. `expiresAt` is available for optional Firestore TTL cleanup; enforcement does not depend on deletion.

The provider receives at most 1,024 output tokens. Serialized conversation input is capped at 18,000 UTF-8 bytes, with at most 12 history entries and 2,000 characters per retained entry. Owner context uses a server query restricted by the verified profile's salon ID, projecting only status, price, service name and date. The analysis rejects salons with more than 1,000 matching appointments instead of presenting incomplete metrics. Legacy appointments without a salon ID are excluded from that query. The complete operation has a 30-second deadline across authentication, quota checks, data loading and generation, with an abort signal forwarded to Gemini; HTTP 504 is returned even if an underlying operation ignores cancellation. An already-started quota commit may still finish after timeout; it cannot trigger late generation.

Override limits with the server-side `AI_USER_REQUESTS_PER_MINUTE`, `AI_SALON_REQUESTS_PER_MINUTE`, `AI_USER_REQUESTS_PER_DAY`, `AI_SALON_REQUESTS_PER_DAY`, `AI_USER_UNITS_PER_DAY`, `AI_SALON_UNITS_PER_DAY`, and `AI_REQUEST_TIMEOUT_MS` settings shown in `.env.example`. Values must be positive safe integers; the deadline cannot exceed 30,000 ms. Malformed or zero settings fail startup rather than silently disabling enforcement. Do not expose these settings through `VITE_` variables.

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
| AI_AUTH_REQUIRED | Sign in again; anonymous, expired and revoked sessions are rejected. |
| AI_OWNER_REQUIRED / AI_ACCESS_DENIED | Use an authorized active account; roles and salon membership are verified server-side. |
| AI_QUOTA_EXHAUSTED | User/salon daily allowance is exhausted; wait until midnight UTC. |
| AI_INPUT_TOO_LARGE / AI_DATA_LIMIT | Start a shorter conversation or contact support about the supported analysis size. |
| AI_NOT_CONFIGURED | Set the server key and restart. |
| AI_CONFIGURATION_ERROR | Google rejected the request configuration; check the key, model, and API setup. |
| AI_CREDENTIALS_REJECTED | Verify key permissions/restrictions and Gemini API access for the Google project. A proxy domain denial can also return 403; verify network policy. |
| AI_MODEL_UNAVAILABLE | Select a model available to the key's project. |
| AI_RATE_LIMITED | Wait for the server's Retry-After interval; upstream Google limits may also require quota/billing review. |
| AI_TIMEOUT / AI_NETWORK_ERROR / AI_UNAVAILABLE | Check API egress, server availability, and provider status. |
| AI_INVALID_RESPONSE | Confirm requests reach Express, not a static frontend-only host, and that the provider returned text. |

Missing configuration and provider failures return non-2xx HTTP responses, not scripted replies disguised as working AI. The UI keeps the question ready to resend and shows a clear error without inventing an answer. Requests have timeouts and do not automatically retry rejected credentials.

## Checks

Run `npm run lint`, `npm run test:ai`, `npm run test:rules`, and `npm run build`. The emulator suite exercises actual HTTP routes with Firestore profiles/counters and an injected verifier/provider: signed-out/invalid/expired/revoked sessions; customer/stylist denial on owner features; server-only salon metrics; per-user/per-salon rate, daily request and unit caps; concurrent reservations across service instances; failed generation charging; quota storage failures; hard deadlines; and client denial on usage documents. Unit tests also cover clients attaching tokens and stripping client business metrics. These tests do not call paid Gemini services and do not validate real credentials. Live signed-out requests must return 401; authenticated validation requires a Firebase session with the appropriate profile.
