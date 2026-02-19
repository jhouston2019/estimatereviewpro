# Database Setup Guide

## Problem
Your `/examples` page shows "Example reports are being loaded" because the database tables and example data haven't been created yet.

## Solution: Run Migrations in Supabase

You need to run 3 SQL migration files in order to set up your database.

### Step-by-Step Instructions

#### 1. Open Supabase Dashboard
- Go to: **https://supabase.com/dashboard**
- Select your project: **kptombohsrxxmaalnwmv**

#### 2. Open SQL Editor
- Click **"SQL Editor"** in the left sidebar
- Click **"New query"**

#### 3. Run Migration #1: Create Users Table
1. Open file: `supabase/migrations/00_create_users_table.sql`
2. Copy ALL content (Ctrl+A, then Ctrl+C)
3. Paste into SQL Editor
4. Click **"Run"** (or Ctrl+Enter)
5. Wait for "Success" message

#### 4. Run Migration #2: Create Reports & Teams Tables
1. Click **"New query"** again
2. Open file: `supabase/migrations/20260210_pricing_schema.sql`
3. Copy ALL content
4. Paste into SQL Editor
5. Click **"Run"**
6. Wait for "Success" message

#### 5. Run Migration #3: Seed Example Reports
1. Click **"New query"** again
2. Open file: `supabase/migrations/01_seed_example_reports.sql`
3. Copy ALL content
4. Paste into SQL Editor
5. Click **"Run"**
6. Wait for "Success" message (~5-10 seconds)

#### 6. Verify It Worked
1. In Supabase Dashboard, click **"Table Editor"**
2. Select **"reports"** table
3. You should see **7 rows** (the example reports)

#### 7. Test Your Website
1. Go to: **http://localhost:3000/examples**
2. Refresh the page (F5)
3. You should now see **7 example reports**! 🎉

## What Gets Created

### Tables
- `users` - User accounts
- `teams` - Team/organization accounts
- `reports` - Analysis reports
- `usage_tracking` - Monthly usage tracking

### Example Data
- 1 demo user (demo@estimatereviewpro.com)
- 1 demo team (Demo Construction & Restoration)
- 7 comprehensive example reports:
  1. Water Damage - Residential ($142K, $18K-$32K gaps)
  2. Fire Damage - Commercial ($187K, $22K-$38K gaps)
  3. Storm Damage - Residential ($98K, $8K-$15K gaps)
  4. Hurricane Damage - Residential ($215K, $15K-$28K gaps)
  5. Mold Remediation - Commercial ($125K, $12K-$24K gaps)
  6. Hail & Wind - Residential ($87K, $5K-$12K gaps)
  7. Flood Damage - Commercial ($108K, $6K-$11K gaps)

**Total:** $962,877 analyzed, $85K-$179K in gaps identified

## Troubleshooting

### "relation already exists"
✅ Good! The table is already created. Skip to the next migration.

### "duplicate key value"
✅ Good! The data is already loaded. Skip to the next migration.

### "permission denied"
❌ Make sure you're using your Supabase project (not a different one)

### Still not showing on /examples page?
1. Check browser console (F12) for errors
2. Make sure dev server is running: `npm run dev`
3. Hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
4. Run check script: `node scripts/check-reports.mjs`

## Quick Verification Script

After running migrations, verify everything worked:

```bash
node scripts/check-reports.mjs
```

This will show you if all 7 example reports are in the database.
