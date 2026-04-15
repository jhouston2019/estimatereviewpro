# `lib/` inventory (security hardening pass)

This file maps **`lib/` TypeScript modules** to how they are used in the repo.  
**Netlify wizard functions** (`netlify/functions/*.js`) implement the live `/upload` AI flow in JavaScript and do **not** import these TypeScript modules.

---

## Actively used — current `/upload` wizard (client → Netlify)

The wizard calls Netlify endpoints only. The **`lib/`** surface involved from the app is:

| Module | Role |
|--------|------|
| `lib/netlify-function-url.ts` | Resolves `.netlify/functions/*` URLs from the browser. |

---

## Actively used — App Router (dashboard, examples, export)

| Module | Role |
|--------|------|
| `lib/supabaseServer.ts` | Server Component + **Route Handler** Supabase clients (`createSupabaseServerComponentClient`, `createSupabaseRouteHandlerClient`). |
| `lib/supabaseClient.ts` | Browser Supabase client (login/register). |
| `lib/supabase-types.ts` | `Database` typing (e.g. middleware). |
| `lib/report-types.ts` | `Report` types for dashboard/examples/export. |
| `lib/verticalReportUtils.ts` | Report title helper on report detail page. |
| `lib/pdf-generator.ts` | PDF HTML/header helpers for `app/api/reports/[id]/export`. |
| `lib/cost-baseline.ts` | Cost baseline constants for export audit metadata. |
| `lib/report-renderer.ts` | Dynamic import from export route — renders structured report sections. |

---

## Actively used — components

| Module | Role |
|--------|------|
| `lib/supplementGenerator.ts` | `SupplementGenerator` UI. |

---

## Actively used — legacy **Pages Router** API (`pages/api/*`)

These endpoints import a large structural / intelligence stack (see each file’s imports). **v1** also calls `lib/claim-intelligence-engine.ts`.

**`pages/api/claim-intelligence.ts` imports:**  
`structural-unified-report-engine`, `input-normalizer`, `format-detector`, `xactimate-structural-parser`, `dimension-engine`, `report-parser`, `room-aware-deviation-engine`, `photo-analysis-engine`, `claim-intelligence-engine`

**`pages/api/claim-intelligence-v2.ts` imports:**  
`structural-unified-report-engine`, `input-normalizer`, `format-detector`, `xactimate-structural-parser`, `dimension-engine`, `report-parser`, `per-room-deviation-engine`, `photo-analysis-engine`, `audit-trail`, `validation-engine`, `security-guards`, `performance-guards`, `structured-errors`, `output-validator`, `telemetry`

---

## Partially connected

| Area | Notes |
|------|--------|
| **`lib/report-renderer.ts` tree** | Pulls in additional engines/types (`deviation-engine`, `expert-intelligence-engine`, `dimension-engine`, `photo-analysis-engine`, etc.) for export rendering — **used when export runs**, not from the Netlify wizard. |
| **`lib/structural-unified-report-engine.ts` and dependencies** | Heavy stack used by **legacy Pages API** and internally by other structural modules; **not** invoked by the Netlify-based upload wizard. |
| **`lib/billing/*`, `lib/supabaseAdmin.ts`** | Billing helpers exist; **not** referenced from current `app/api/*` TypeScript routes in a quick import survey — may be dead for App Router or used from scripts/docs only. Verify before removal. |
| **`lib/ai-service.ts`, `lib/matching-engine.ts`, etc.** | Substantial “platform” code used by **tests**, **other lib modules**, or **future** wiring; **not** on the minimal Netlify wizard path. |

---

## Used in tests only (or primarily via tests)

- `lib/__tests__/*.test.ts` and `tests/*.test.ts` exercise parsers, intelligence engines, validation, etc.  
- `lib/structural-test-suite.ts` imports `structural-unified-report-engine`.

---

## Unused / disconnected (relative to App Router + Netlify wizard)

The following **`lib/*.ts`** files are **not** imported from `app/` (except `app/api/reports` tree where noted), `components/`, `middleware.ts`, or `pages/api/` in a static import survey. They may still be used **transitively** from `report-renderer`, `structural-unified-report-engine`, **tests**, or **Netlify-adjacent scripts** — treat as **deferred / platform backlog**, not safe to delete without a full dependency graph run.

Examples of typically disconnected product engines (non-exhaustive; re-verify with `rg "from ['\"]@/lib/` and `rg "from '\\.\\./lib"`):

- `lib/adapters/engine-adapters.ts`
- `lib/advanced-xactimate-parser.ts`
- `lib/ai-fallback.ts`, `lib/ai-monitoring.ts`, `lib/ai-retry.ts`, `lib/ai-service.ts`, `lib/ai-validation.ts`
- `lib/audit-trail.ts` *(direct: only pages API v2; also transitive)*
- `lib/billing/checkUsage.ts`, `lib/billing/recoveryGuarantee.ts`
- `lib/carrier-tactic-detector.ts`, `lib/code-upgrade-engine.ts`
- `lib/database/audit-logger.ts`
- `lib/defensibility-scorer.ts`, `lib/depreciation-validator.ts`
- `lib/deviation-engine.ts` *(via report-renderer — **partial**)*
- `lib/enhanced-audit-trail.ts`, `lib/exposure-engine.ts`
- `lib/format-detector.ts` *(pages API)*
- `lib/hardened-ai-overlay.ts`, `lib/height-extraction-engine.ts`
- `lib/input-normalizer.ts` *(pages API)*
- `lib/intelligence/*`
- `lib/labor-rate-validator.ts`, `lib/loss-expectation-engine.ts`
- `lib/matching-engine.ts`, `lib/matterport-adapter.ts`, `lib/multi-format-parser.ts`
- `lib/op-gap-detector.ts`, `lib/parser-validation-layer.ts`
- `lib/performance-monitor.ts` *(distinct from performance-guards used in v2)*
- `lib/pipeline/claimIntelligencePipeline.ts`
- `lib/pricing-validation-engine.ts`
- `lib/report-parser.ts` *(pages API)*
- `lib/report-utils.ts`, `lib/reporting/litigationEvidenceGenerator.ts`
- `lib/room-aware-deviation-engine.ts`, `lib/per-room-deviation-engine.ts` *(pages API)*
- `lib/security-guards.ts`, `lib/settlement-justification-generator.ts`
- `lib/structural-*` modules not pulled by `structural-unified-report-engine` (verify per-file)
- `lib/structured-errors.ts`, `lib/telemetry.ts`, `lib/test-cases.ts`
- `lib/trade-completeness-engine.ts`, `lib/unit-normalizer.ts`
- `lib/unified-report-engine.ts`
- `lib/validation-engine.ts`, `lib/xactimate-parser.ts`, `lib/xactimate-structural-parser.ts`
- `lib/templates/*.ts` (not directly imported from surveyed app surfaces; may be used via engines)
- `lib/engines/*.ts` (many only via other lib or Netlify JS duplicates)

**Maintenance tip:** Regenerate this list after major refactors using workspace-wide import search and `npx madge` (if added).

---

## Source of truth: billing user row

Application billing fields should be read from **`public.users`** (`plan_type`, `team_id`, `stripe_customer_id`, …), not `profiles`. The dashboard was aligned to `users` in the security pass.
