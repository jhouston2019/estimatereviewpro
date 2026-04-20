-- Idempotency for Stripe Checkout session → app session (one row per cs_ session)
CREATE TABLE IF NOT EXISTS public.processed_sessions (
  session_id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users (id) ON DELETE SET NULL,
  processed_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_processed_sessions_user_id
  ON public.processed_sessions (user_id);

ALTER TABLE public.processed_sessions ENABLE ROW LEVEL SECURITY;
