# Quick Fix: Load Example Reports

## The Problem
Your `/examples` page is empty because the sample reports haven't been loaded into your Supabase database yet.

## The Solution (Takes 2 minutes)

### Step 1: Open Supabase Dashboard
1. Go to: **https://supabase.com/dashboard**
2. Click on your project: **kptombohsrxxmaalnwmv**

### Step 2: Open SQL Editor
1. Click **"SQL Editor"** in the left sidebar
2. Click **"New query"** button

### Step 3: Run the Migration
1. Open this file in your editor:
   ```
   supabase/migrations/01_seed_example_reports.sql
   ```

2. Select ALL the content (Ctrl+A or Cmd+A)

3. Copy it (Ctrl+C or Cmd+C)

4. Paste into the Supabase SQL Editor

5. Click the **"Run"** button (or press Ctrl+Enter)

6. Wait ~5 seconds for it to complete

### Step 4: Verify
1. Go back to your website: **http://localhost:3000/examples**
2. Refresh the page (F5)
3. You should now see **7 example reports**!

## What You'll See

After running the migration, you'll have:
- ✅ 7 comprehensive example reports
- ✅ Total analyzed value: $962,877
- ✅ Identified gaps: $85K-$179K
- ✅ Reports covering water, fire, storm, hurricane, mold, hail, and flood damage

## Troubleshooting

### Error: "relation does not exist"
Run these migrations first (in order):
1. `00_create_users_table.sql`
2. `20260210_pricing_schema.sql`
3. `01_seed_example_reports.sql` (the one for examples)

### Error: "duplicate key value"
Good news! The reports are already loaded. Just refresh your `/examples` page.

### Still not showing?
1. Check browser console (F12) for errors
2. Make sure your dev server is running (`npm run dev`)
3. Try a hard refresh (Ctrl+Shift+R or Cmd+Shift+R)
