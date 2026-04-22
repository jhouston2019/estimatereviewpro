-- Allow 'essential' on users.plan_type and teams.plan_type
ALTER TABLE public.users
  DROP CONSTRAINT IF EXISTS users_plan_type_check;

ALTER TABLE public.users
  ADD CONSTRAINT users_plan_type_check
  CHECK (
    plan_type IS NULL
    OR plan_type IN ('single', 'essential', 'professional', 'enterprise', 'premier')
  );

ALTER TABLE public.teams
  DROP CONSTRAINT IF EXISTS teams_plan_type_check;

ALTER TABLE public.teams
  ADD CONSTRAINT teams_plan_type_check
  CHECK (plan_type IN ('essential', 'professional', 'enterprise', 'premier'));
