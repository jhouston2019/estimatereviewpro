-- Idempotent: ensure Stripe webhook idempotency table exists (dedupe by event id).
-- Safe if 20260418_billing_access_control.sql already created this object.

CREATE TABLE IF NOT EXISTS public.stripe_webhook_events (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  received_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS stripe_webhook_events_received_at_idx
  ON public.stripe_webhook_events (received_at DESC);

ALTER TABLE public.stripe_webhook_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "No client access to stripe_webhook_events" ON public.stripe_webhook_events;

CREATE POLICY "No client access to stripe_webhook_events"
  ON public.stripe_webhook_events
  FOR ALL
  USING (false)
  WITH CHECK (false);
