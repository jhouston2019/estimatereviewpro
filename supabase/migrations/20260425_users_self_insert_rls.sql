-- Allow authenticated users to insert their own public.users row (for serverPageGuards
-- ensure path when the auth trigger did not run or the row is missing). Matches SELECT/UPDATE: auth.uid() = id.
-- Apply in Supabase SQL Editor or via `supabase db push` if you use CLI migrations.

GRANT INSERT ON public.users TO authenticated;

DROP POLICY IF EXISTS "Users can insert own row" ON public.users;
CREATE POLICY "Users can insert own row"
  ON public.users
  FOR INSERT
  WITH CHECK (auth.uid() = id);
