-- Billing access control, admin flag, Stripe webhook idempotency, and paid-access RPC.
-- Apply after existing user/teams migrations.

-- ---------------------------------------------------------------------------
-- Admin flag (never trust client — enforced server-side + RLS)
-- ---------------------------------------------------------------------------
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS is_admin BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS users_is_admin_idx ON public.users(is_admin) WHERE is_admin = true;

COMMENT ON COLUMN public.users.is_admin IS 'When true, user may read all users via RLS; set only in DB.';

-- Admins can read all user rows (still subject to service role for writes)
DROP POLICY IF EXISTS "Admins can read all users" ON public.users;
CREATE POLICY "Admins can read all users"
  ON public.users
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid() AND u.is_admin = true
    )
  );

-- ---------------------------------------------------------------------------
-- Stripe webhook idempotency (service role inserts only)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.stripe_webhook_events (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  received_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS stripe_webhook_events_received_at_idx
  ON public.stripe_webhook_events(received_at DESC);

ALTER TABLE public.stripe_webhook_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "No client access to stripe_webhook_events" ON public.stripe_webhook_events;

-- No client access; service role bypasses RLS
CREATE POLICY "No client access to stripe_webhook_events"
  ON public.stripe_webhook_events
  FOR ALL
  USING (false)
  WITH CHECK (false);

-- ---------------------------------------------------------------------------
-- Subscription status mirror (updated from Stripe webhooks)
-- ---------------------------------------------------------------------------
ALTER TABLE public.teams
  ADD COLUMN IF NOT EXISTS stripe_subscription_status TEXT;

COMMENT ON COLUMN public.teams.stripe_subscription_status IS 'Mirrors Stripe Subscription.status; updated by webhooks only.';

-- ---------------------------------------------------------------------------
-- Paid access: evaluated on each request via RPC (not JWT claims)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.user_has_paid_access()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
DECLARE
  uid UUID := auth.uid();
BEGIN
  IF uid IS NULL THEN
    RETURN false;
  END IF;

  -- New pricing model: active usage row
  IF EXISTS (
    SELECT 1
    FROM public.user_review_usage uru
    WHERE uru.user_id = uid
      AND uru.is_active = true
      AND uru.billing_period_end > NOW()
  ) THEN
    RETURN true;
  END IF;

  -- Legacy / teams model
  RETURN EXISTS (
    SELECT 1
    FROM public.users u
    LEFT JOIN public.teams t ON t.id = u.team_id
    WHERE u.id = uid
      AND (
        u.plan_type IS NOT NULL
        OR (
          u.team_id IS NOT NULL
          AND t.id IS NOT NULL
          AND COALESCE(t.stripe_subscription_status, 'active') IN (
            'active', 'trialing', 'past_due'
          )
        )
      )
  );
END;
$$;

REVOKE ALL ON FUNCTION public.user_has_paid_access() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.user_has_paid_access() TO authenticated;
GRANT EXECUTE ON FUNCTION public.user_has_paid_access() TO service_role;
