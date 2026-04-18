-- Run in Supabase SQL Editor after applying 20260418_billing_access_control.sql
-- Expect: fn = true, col = true

SELECT
  EXISTS (
    SELECT 1
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = 'user_has_paid_access'
  ) AS user_has_paid_access_exists,
  EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'users'
      AND column_name = 'is_admin'
  ) AS users_is_admin_exists;
