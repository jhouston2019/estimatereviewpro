-- Generated letter and type on saved reviews
ALTER TABLE public.reviews
  ADD COLUMN IF NOT EXISTS letter_text TEXT;

ALTER TABLE public.reviews
  ADD COLUMN IF NOT EXISTS letter_type TEXT;
