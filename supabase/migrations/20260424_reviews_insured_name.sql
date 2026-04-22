-- Persist insured name on completed wizard reviews
ALTER TABLE public.reviews
  ADD COLUMN IF NOT EXISTS insured_name TEXT;
