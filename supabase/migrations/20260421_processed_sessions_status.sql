ALTER TABLE public.processed_sessions
ADD COLUMN IF NOT EXISTS status TEXT,
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;

UPDATE public.processed_sessions
SET
  status = 'completed',
  completed_at = COALESCE(completed_at, processed_at, now())
WHERE status IS NULL;

ALTER TABLE public.processed_sessions
ALTER COLUMN status SET DEFAULT 'pending';
