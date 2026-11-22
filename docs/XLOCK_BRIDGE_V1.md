# XLock ↔ StarrLign: read-only task bridge (v1)

## Canonical data
StarrLign/Turso owns committed tasks, projects, dependencies, deadlines, statuses and completion. XLock owns lock sessions, the focus timer, capture and attention telemetry. This feature creates no duplicate writable task database.

## Authenticated route
GET /api/xlock/tasks?limit=8
- Server-to-server only, with Authorization: Bearer <server-side key>.
- Returns at most 12 small task projections, ranked deterministically using existing status, priority, parseable due dates and dependency/unlock counts.
- Excludes archived/completed tasks; does not disclose notes, financial records or whole app state.
- Includes sourceTaskId and generatedAt so XLock can identify canonical records and data freshness.
- Fails closed with 503 if the bridge key is not configured.
- POST is not supported.

## Server secret
In StarrLign deployment, set STARRLIGN_XLOCK_BRIDGE_KEY to an independently generated random secret of at least 32 characters.
In the XLock Vercel backend deployment, set STARRLIGN_BRIDGE_API_KEY to the same secret and STARRLIGN_API_URL to the HTTPS StarrLign origin.

Never use NEXT_PUBLIC_ or VITE_ for either server-to-server credential. Never commit the credential. Never expose it in browser code. The XLock backend proxy must authenticate the requester separately.

## Existing legacy API caution
The existing StarrLign POST /api/db replaces entire task collections. Do NOT use this endpoint to write from XLock. It also has no route-level authentication in the current source, so inspect the deployment access boundary and harden the legacy route before treating the data as private. The new bridge's key does not secure the legacy route.

To implement write-back safely:
1. Replace/reconcile whole-snapshot saves to avoid stale writes overwriting targeted PATCH updates.
2. Add an authenticated granular task PATCH endpoint with a strict allowed-field list and concurrency protection.
3. Keep progress/completion status in StarrLign; store XLock focus telemetry keyed to sourceTaskId.
4. Verify idempotent completion, stale-client conflicts, and no duplicate task status.

## Acceptance checks for this phase
- Missing key: 503; incorrect key: 401; valid key: 200.
- Empty/missing database: 503 without leaking internals.
- Only bounded, active task projections; no financial data or private notes.
- Invalid legacy due labels do not become invented timestamps.
- Read-only: POST responds 405 without database changes.
- Do not promote this to production until Vercel env secrets are set, auth is verified, and the existing legacy endpoint's exposure is reviewed.
