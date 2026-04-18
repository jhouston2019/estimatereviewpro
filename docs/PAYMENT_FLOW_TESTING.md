# Payment flow testing (no real charges)

This guide walks through testing Estimate Review Pro as a real user using **Stripe Test mode**, the **Stripe CLI**, and optional **dev bypass**.

## 1. Stripe Test mode keys

- In the [Stripe Dashboard](https://dashboard.stripe.com), toggle **Test mode** (top right).
- Copy **Publishable key** (`pk_test_…`) and **Secret key** (`sk_test_…`).

Set in `.env.local`:

- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` → must start with `pk_test_`
- `STRIPE_SECRET_KEY` → must start with `sk_test_`

Validate without exposing secrets:

```bash
npm run test:check-stripe
```

If keys are not test keys, replace them with the Test mode keys from the dashboard (do not commit real keys).

## 2. Stripe CLI webhook forwarding

Install the [Stripe CLI](https://stripe.com/docs/stripe-cli) if needed (`stripe --version`).

Forward events to the Next.js webhook (same handler as `/api/webhook`):

```bash
npm run stripe:listen
```

This runs:

`stripe listen --forward-to localhost:3000/api/webhooks/stripe`

Copy the **webhook signing secret** (`whsec_…`) printed by the CLI into `.env.local` as `STRIPE_WEBHOOK_SECRET`, then restart `next dev`. The app verifies every event with `STRIPE_WEBHOOK_SECRET` before updating Supabase.

**Note:** The legacy path `/api/webhook` still works; `/api/webhooks/stripe` is provided for the common CLI URL pattern.

## 3. Test card

Use Stripe’s standard test card:

| Field   | Value              |
|--------|---------------------|
| Number | `4242 4242 4242 4242` |
| Expiry | Any future date     |
| CVC    | Any 3 digits        |

No real money is charged in Test mode.

## 4. Test user seed

With `.env.local` containing `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`:

```bash
npm run test:seed-user
```

Optional env overrides:

- `TEST_USER_EMAIL` (default `dev-test@estimatereviewpro.local`)
- `TEST_USER_PASSWORD` (default `DevTestPassword123!`)

Then sign in at `/login` with that email and password. Re-running the script resets the password if the user already exists.

## 5. Dev bypass flag

In `.env.local` for **local UI testing without checkout**:

```env
NODE_ENV=development
BYPASS_PAYMENT=true
```

When both are set, middleware skips the paywall (see `lib/billing/devBypass.ts`). If `BYPASS_PAYMENT` is set while `NODE_ENV=production`, the app redirects away from protected routes (misconfiguration guard).

## 6. Success redirect and Supabase

After checkout, the app does **not** trust query parameters alone. The dashboard and upload flows poll **`GET /api/billing/status`**, which reads **`user_has_paid_access()`** in Supabase (see `components/billing/PaymentActivationNotice.tsx`).

## 7. Paywall and access checklist (reference)

| Area | Check |
|------|--------|
| Pages `/dashboard`, `/upload`, `/estimate-review` | Middleware + `user_has_paid_access` RPC (unless dev bypass) |
| `/admin/*` | Session + `users.is_admin` from DB |
| `POST /api/webhook`, `POST /api/webhooks/stripe` | Stripe signature via `STRIPE_WEBHOOK_SECRET` |
| `GET /api/billing/status` | Session + DB entitlement |
| `POST /api/create-review`, export, claim-intelligence, etc. | Server-side auth / billing checks (see prior security pass) |

Admin must never be determined by client-sent flags; only **`users.is_admin`** (and service-role checks where applicable).

## Remaining gaps

- **Netlify Functions** (e.g. wizard/analyze) are not behind Next middleware; align them with the same billing rules if they perform paid work.
- **Production** must use **live** keys and a Dashboard webhook URL pointing to your deployed `/api/webhook` or `/api/webhooks/stripe`.
