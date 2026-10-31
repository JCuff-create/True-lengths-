# Branch validation — October 30, 2026

All reviewed branch changes are represented in the current application code on `main` at `da97d8afb15e6e838edaa0efbaedd9266c858ef2`.

| Local branch | Reviewed commit | TypeScript | Production build | Unit/API tests |
| --- | --- | --- | --- | --- |
| `feature/inventory-restocking` | `7928782` | Pass | Pass | 20 passed |
| `fix/AI-Chatbot` | `fdb901c` | Pass | Pass | 24 passed |
| `fix/customer-notifications` | `81f9da9` | Pass | Pass | 13 passed |
| `fix/password-reset` | `e4df708` | Pass | Pass | 17 passed |
| `release/requested-branches-20261028` | `8812f1e` | Pass | Pass | 53 passed |
| `fix/marketing-delivery-20261028` | `0360abc` | Pass | Pass | 60 passed |

The Marketing branch's complete file tree matches `main`. Its lint, build, unit/API and emulator checks were therefore run against that same tree in the integration checkout.

Local histories were reconciled in an isolated integration checkout. Duplicate CI and package-script conflicts were resolved by retaining the newer versions on `main`. After those merges, `git diff --quiet origin/main HEAD` passed: the integration introduced no application-file changes. Local integration commits are `5695062` and `1db90c0`; this report records validation rather than republishing those local-only commit identities.

The integrated tree passed:

- `npm run lint` (`tsc --noEmit`).
- `npm run build` (Vite frontend and bundled Express server).
- `node --import tsx --test tests/*.test.ts`: 60 passed, zero failures.
- `npm run test:rules`: 97 passed, zero failures, using the local Firestore emulator.
- `git diff --check`: no whitespace errors.

Vite reports its existing large-bundle advisory; the build completes successfully. These automated checks do not certify every possible runtime behavior or validate live external messaging credentials.

The original workspace's uncommitted edits were preserved and excluded from this branch verification. No secrets, deployment, production database changes, or real customer campaigns are included in this commit.
