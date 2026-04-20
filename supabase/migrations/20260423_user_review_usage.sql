-- Optional payment recovery flags (used by /api/recover-payment-state)
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS payment_verification_status TEXT,
  ADD COLUMN IF NOT EXISTS is_paid BOOLEAN DEFAULT FALSE;

-- Per-user review counts for dashboard /api/usage (complements team usage_tracking)
CREATE TABLE IF NOT EXISTS public.user_review_usage (
  user_id UUID PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  reviews_used INTEGER NOT NULL DEFAULT 0,
  reviews_limit INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_user_review_usage_updated ON public.user_review_usage (updated_at);

ALTER TABLE public.user_review_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own review usage"
  ON public.user_review_usage FOR SELECT
  USING (auth.uid() = user_id);
