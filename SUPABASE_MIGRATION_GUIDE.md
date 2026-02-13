# SUPABASE MIGRATION GUIDE

## ⚠️ IMPORTANT: Run Migrations in Order

You need to run **TWO** migration files in the correct order.

---

## 🚀 STEP-BY-STEP INSTRUCTIONS

### Step 1: Go to Supabase SQL Editor
1. Open your Supabase project: https://supabase.com/dashboard/project/kptombohsrxxmaalnwmv
2. Click **SQL Editor** in the left sidebar
3. Click **New query**

---

### Step 2: Run First Migration (Create Users Table)

**File:** `supabase/migrations/00_create_users_table.sql`

1. Copy the **entire contents** of `00_create_users_table.sql`
2. Paste into the SQL Editor
3. Click **Run** (or press Ctrl+Enter)
4. Wait for "Success. No rows returned"

**What this does:**
- ✅ Creates `public.users` table
- ✅ Links to Supabase Auth (`auth.users`)
- ✅ Sets up RLS policies
- ✅ Creates automatic user profile creation trigger
- ✅ Adds indexes for performance

---

### Step 3: Run Second Migration (Pricing Schema)

**File:** `supabase/migrations/20260210_pricing_schema.sql`

1. Click **New query** again
2. Copy the **entire contents** of `20260210_pricing_schema.sql`
3. Paste into the SQL Editor
4. Click **Run** (or press Ctrl+Enter)
5. Wait for "Success. No rows returned"

**What this does:**
- ✅ Creates `teams` table
- ✅ Creates `reports` table
- ✅ Creates `usage_tracking` table
- ✅ Sets up RLS policies for all tables
- ✅ Creates PostgreSQL functions:
  - `get_team_usage()`
  - `increment_team_usage()`
  - `can_create_review()`
- ✅ Creates indexes for performance

---

## ✅ VERIFICATION

After running both migrations, verify the tables exist:

### Check Tables
Run this query in SQL Editor:
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('users', 'teams', 'reports', 'usage_tracking')
ORDER BY table_name;
```

**Expected result:** 4 rows
- `reports`
- `teams`
- `usage_tracking`
- `users`

### Check Functions
Run this query:
```sql
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN ('get_team_usage', 'increment_team_usage', 'can_create_review')
ORDER BY routine_name;
```

**Expected result:** 3 rows
- `can_create_review`
- `get_team_usage`
- `increment_team_usage`

---

## 🐛 TROUBLESHOOTING

### Error: "relation 'users' does not exist"
**Cause:** You ran the second migration before the first one.

**Fix:**
1. Run `00_create_users_table.sql` first
2. Then run `20260210_pricing_schema.sql`

---

### Error: "relation 'auth.users' does not exist"
**Cause:** Supabase Auth is not enabled.

**Fix:**
1. Go to **Authentication** in Supabase Dashboard
2. Make sure Auth is enabled
3. Try the migration again

---

### Error: "duplicate key value violates unique constraint"
**Cause:** Migration was already run.

**Fix:**
- This is fine! The migration uses `CREATE TABLE IF NOT EXISTS`
- Tables already exist, no action needed

---

### Error: "function already exists"
**Cause:** Functions were already created.

**Fix:**
- This is fine! The migration uses `CREATE OR REPLACE FUNCTION`
- Functions will be updated, no action needed

---

## 📊 WHAT GETS CREATED

### Tables

**`public.users`**
- Links to `auth.users` (Supabase Auth)
- Stores: `stripe_customer_id`, `plan_type`, `team_id`, `role`

**`teams`**
- Stores: `name`, `owner_id`, `plan_type`, `stripe_subscription_id`, `review_limit`, `overage_price`

**`reports`**
- Stores: `user_id`, `team_id`, `estimate_name`, `result_json`, `paid_single_use`, `expires_at`

**`usage_tracking`**
- Stores: `team_id`, `month_year`, `review_count`, `overage_count`

### Functions

**`get_team_usage(p_team_id UUID)`**
- Returns current month usage and limits for a team

**`increment_team_usage(p_team_id UUID)`**
- Increments review count and overage count if over limit

**`can_create_review(p_user_id UUID)`**
- Checks if user can create a review based on plan and usage

### RLS Policies

**All tables have Row Level Security enabled:**
- Users can only see their own data
- Team members can see team data
- Service role can access all data (for API routes)

---

## 🔒 SECURITY

### RLS is Enabled
All tables have Row Level Security policies:
- ✅ Users table: Users can read/update their own data
- ✅ Teams table: Team members can read team data, owners can update
- ✅ Reports table: Users can read their own reports, team members can read team reports
- ✅ Usage tracking: Team members can read usage data

### Service Role Access
Your API routes use `SUPABASE_SERVICE_ROLE_KEY` which bypasses RLS:
- ✅ This is correct for server-side operations
- ✅ Never expose service role key client-side
- ✅ Always validate user permissions in API routes

---

## 📝 AFTER MIGRATION

Once migrations are complete:

1. **Test user signup**
   - Create a test account
   - Verify user profile is created automatically
   - Check `public.users` table has a row

2. **Test in your app**
   - Deploy to Netlify with environment variables
   - Try creating an account
   - Try uploading an estimate
   - Verify data appears in Supabase tables

3. **Monitor logs**
   - Check Supabase logs for any errors
   - Check Netlify function logs
   - Verify RLS policies are working

---

## 🎯 MIGRATION ORDER SUMMARY

```
1. Run: 00_create_users_table.sql
   ↓
2. Run: 20260210_pricing_schema.sql
   ↓
3. Verify tables and functions exist
   ↓
4. Deploy to Netlify
   ↓
5. Test end-to-end
```

---

## ✅ CHECKLIST

- [ ] Ran `00_create_users_table.sql` successfully
- [ ] Ran `20260210_pricing_schema.sql` successfully
- [ ] Verified 4 tables exist (users, teams, reports, usage_tracking)
- [ ] Verified 3 functions exist (get_team_usage, increment_team_usage, can_create_review)
- [ ] RLS is enabled on all tables
- [ ] Tested user signup (profile created automatically)

---

## END OF MIGRATION GUIDE
