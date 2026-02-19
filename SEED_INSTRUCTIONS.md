# How to Seed Example Reports

The example reports page is empty because the sample data hasn't been loaded into your Supabase database yet.

## Quick Fix (2 minutes)

### Option 1: Using Supabase Dashboard (Recommended)

1. **Open Supabase Dashboard**
   - Go to: https://supabase.com/dashboard
   - Select your project

2. **Open SQL Editor**
   - Click "SQL Editor" in the left sidebar
   - Click "New query"

3. **Run the Migration**
   - Open the file: `supabase/migrations/01_seed_example_reports.sql`
   - Copy ALL the contents (Ctrl+A, Ctrl+C)
   - Paste into the SQL Editor
   - Click "Run" button

4. **Verify**
   - Refresh your `/examples` page
   - You should see 7 example reports

### Option 2: Using Node Script

```bash
# Install dependencies if needed
npm install

# Run the seed script
node scripts/seed-examples.js
```

## What Gets Created

The migration creates:
- ✅ 1 demo user (`demo@estimatereviewpro.com`)
- ✅ 1 demo team ("Demo Construction & Restoration")
- ✅ 7 comprehensive example reports covering:
  - Water damage (residential)
  - Fire damage (commercial)
  - Storm damage (residential)
  - Hurricane damage (residential)
  - Mold remediation (commercial)
  - Hail & wind damage (residential)
  - Flood damage (commercial)

## Troubleshooting

### "relation does not exist" error
- Make sure you've run the other migrations first:
  - `00_create_users_table.sql`
  - `20260210_pricing_schema.sql`

### "duplicate key value" error
- The reports are already seeded! Just refresh the page.

### Still not showing?
- Check browser console for errors (F12)
- Verify environment variables are set in `.env.local`:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `SUPABASE_SERVICE_ROLE_KEY`
