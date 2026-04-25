# 👀 HOW TO VIEW THE EXAMPLE REPORTS

**Complete guide to accessing and viewing your 7 enterprise-ready example reports**

---

## 🚀 QUICK ANSWER

The reports are viewable in **4 different ways**:

1. **🌐 Web Dashboard** - `http://localhost:3000/dashboard/reports` (after loading data)
2. **💾 Supabase Dashboard** - Direct database access via Supabase UI
3. **🔍 SQL Queries** - Command-line database queries
4. **📊 API Endpoints** - Programmatic access via REST API

---

## 1️⃣ WEB DASHBOARD (Recommended)

### Step 1: Load the Example Data

```bash
# Make sure you're in the project directory
cd "d:\Axis\Axis Projects - Projects\Projects - Stage 1\estimate review pro\estimatereviewpro"

# Option A: Using Supabase CLI (resets all migrations)
supabase db reset

# Option B: Run just the seed file
supabase db push --include-seed
```

### Step 2: Start Your Development Server

```bash
npm run dev
```

### Step 3: Navigate to Reports Page

Open your browser and go to:

**📍 http://localhost:3000/dashboard/reports**

You'll see:
- ✅ All 7 example reports in a grid layout
- ✅ Risk level indicators (color-coded)
- ✅ Gap percentages
- ✅ Missing value estimates
- ✅ Issue counts (critical/warning/info)
- ✅ Click any report to see full details

### Step 4: View Report Details

Click on any report card to see:
- 📋 Property information
- 💰 Financial summary
- 📊 Issues breakdown
- 🔧 Detected trades
- ❌ Missing items (with cost impacts)
- ⚠️ Quantity issues
- 🏗️ Structural gaps
- 💵 Pricing observations
- 📜 Compliance notes
- 🎯 Critical action items
- 📝 Executive summary

---

## 2️⃣ SUPABASE DASHBOARD

### Step 1: Open Supabase Dashboard

```bash
# Start Supabase (if not already running)
supabase start

# Open dashboard
supabase dashboard
```

Or go directly to: **https://app.supabase.com** (for cloud projects)

### Step 2: Navigate to Table Editor

1. Click **"Table Editor"** in left sidebar
2. Select **"reports"** table
3. You'll see all 7 reports listed

### Step 3: View Report Data

Click on any row to see:
- All columns (id, user_id, team_id, estimate_name, etc.)
- **result_json** column contains the full analysis
- Click the JSON icon to expand and view the complete structure

### Step 4: Use SQL Editor (Advanced)

1. Click **"SQL Editor"** in left sidebar
2. Try these queries:

**View all reports:**
```sql
SELECT * FROM report_summary;
```

**View specific report:**
```sql
SELECT * FROM reports WHERE estimate_name LIKE '%Johnson%';
```

**View report JSON:**
```sql
SELECT 
  estimate_name,
  result_json->'property_details'->>'address' as address,
  result_json->'total_missing_value_estimate' as missing_value,
  result_json->>'risk_level' as risk
FROM reports;
```

---

## 3️⃣ COMMAND LINE (SQL Queries)

### Using psql

```bash
# Connect to your local Supabase database
psql postgresql://postgres:postgres@localhost:54322/postgres

# Or for cloud database
psql "your-connection-string"
```

### Quick Queries

**List all reports:**
```sql
SELECT 
  estimate_name,
  estimate_type,
  damage_type,
  created_at
FROM reports
ORDER BY created_at DESC;
```

**View report summary:**
```sql
SELECT * FROM report_summary;
```

**Get specific report:**
```sql
SELECT 
  estimate_name,
  result_json->'property_details'->>'total_estimate_value' as estimate_value,
  result_json->'total_missing_value_estimate'->>'low' as missing_low,
  result_json->'total_missing_value_estimate'->>'high' as missing_high,
  result_json->>'risk_level' as risk
FROM reports
WHERE id = '10000000-0000-0000-0000-000000000001';
```

**Get high-risk reports:**
```sql
SELECT 
  estimate_name,
  result_json->>'risk_level' as risk,
  result_json->'total_missing_value_estimate'->>'high' as missing_value
FROM reports
WHERE result_json->>'risk_level' = 'high'
ORDER BY (result_json->'total_missing_value_estimate'->>'high')::numeric DESC;
```

---

## 4️⃣ Programmatic access (Supabase)

### Using Supabase Client

```typescript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Get all reports
const { data: reports, error } = await supabase
  .from('reports')
  .select('*')
  .order('created_at', { ascending: false });

console.log('Reports:', reports);

// Get specific report
const { data: report } = await supabase
  .from('reports')
  .select('*')
  .eq('id', '10000000-0000-0000-0000-000000000001')
  .single();

console.log('Report:', report);

// Get report summary view
const { data: summaries } = await supabase
  .from('report_summary')
  .select('*');

console.log('Summaries:', summaries);
```

### Using Fetch API

```typescript
// Create API route first: app/api/reports/route.ts
const response = await fetch('/api/reports');
const reports = await response.json();

// Get specific report
const response = await fetch(`/api/reports/${reportId}`);
const report = await response.json();
```

---

## 📍 FILE LOCATIONS

### Frontend Pages (Created)
```
app/
├── dashboard/
│   ├── reports/
│   │   ├── page.tsx              ← Reports list page
│   │   └── [id]/
│   │       └── page.tsx          ← Report detail page
│   └── page.tsx                  ← Main dashboard
```

### Database Files
```
supabase/
└── migrations/
    ├── 00_create_users_table.sql
    ├── 20260210_pricing_schema.sql
    └── 01_seed_example_reports.sql  ← Example reports data
```

### Utility Files
```
lib/
├── report-types.ts               ← TypeScript types
└── report-utils.ts               ← Helper functions
```

---

## 🎯 STEP-BY-STEP VIEWING GUIDE

### Complete Walkthrough

**1. Load the data** (one-time setup)
```bash
cd "d:\Axis\Axis Projects - Projects\Projects - Stage 1\estimate review pro\estimatereviewpro"
supabase db reset
```

**2. Start the app**
```bash
npm run dev
```

**3. Open browser**
```
http://localhost:3000/dashboard/reports
```

**4. You should see:**
- 7 report cards in a grid
- Each showing estimate name, value, gap, risk level
- Color-coded risk indicators
- Issue counts (🔴🟡🔵)

**5. Click any report to see:**
- Full property details
- Complete analysis
- All missing items
- Quantity issues
- Structural gaps
- Pricing observations
- Compliance notes
- Action items
- Executive summary

---

## 🔧 TROUBLESHOOTING

### "No reports showing"

**Check 1: Data loaded?**
```sql
SELECT COUNT(*) FROM reports;
-- Should return 7
```

**Check 2: RLS policies?**
```sql
-- Temporarily disable RLS for testing
ALTER TABLE reports DISABLE ROW LEVEL SECURITY;

-- Re-enable after testing
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
```

**Check 3: User authenticated?**
```typescript
// Check if user is logged in
const { data: { user } } = await supabase.auth.getUser();
console.log('User:', user);
```

### "Page not found"

**Check 1: File exists?**
```bash
ls "app/dashboard/reports/page.tsx"
ls "app/dashboard/reports/[id]/page.tsx"
```

**Check 2: Server running?**
```bash
# Make sure dev server is running
npm run dev
```

### "Type errors"

**Fix:** Make sure TypeScript files are in place
```bash
ls "lib/report-types.ts"
ls "lib/report-utils.ts"
```

---

## 🎨 CUSTOMIZATION

### Change the URL

Edit `app/dashboard/reports/page.tsx` to change the route:

Current: `/dashboard/reports`  
Custom: `/dashboard/analysis` or `/reports` or whatever you prefer

### Add to Navigation

Update your main navigation to include reports link:

```tsx
<Link href="/dashboard/reports">
  Reports
</Link>
```

### Add Filtering

Add filter controls to `app/dashboard/reports/page.tsx`:

```typescript
// Filter by risk level
const highRiskReports = reports?.filter(r => r.result_json.risk_level === 'high');

// Filter by damage type
const waterDamageReports = reports?.filter(r => r.damage_type === 'water_damage');

// Filter by date range
const recentReports = reports?.filter(r => 
  new Date(r.created_at) > new Date('2024-01-01')
);
```

---

## 📱 MOBILE ACCESS

The reports pages are responsive and work on:
- ✅ Desktop (1200px+)
- ✅ Tablet (768px - 1199px)
- ✅ Mobile (< 768px)

Access from any device:
```
http://localhost:3000/dashboard/reports
```

---

## 🔗 DIRECT LINKS TO EXAMPLE REPORTS

Once loaded, you can access each report directly:

1. **Water Damage:**  
   `http://localhost:3000/dashboard/reports/10000000-0000-0000-0000-000000000001`

2. **Commercial Roof:**  
   `http://localhost:3000/dashboard/reports/10000000-0000-0000-0000-000000000002`

3. **Fire Damage:**  
   `http://localhost:3000/dashboard/reports/10000000-0000-0000-0000-000000000003`

4. **Mold Remediation:**  
   `http://localhost:3000/dashboard/reports/10000000-0000-0000-0000-000000000004`

5. **Hurricane:**  
   `http://localhost:3000/dashboard/reports/10000000-0000-0000-0000-000000000005`

6. **Minimal Scope:**  
   `http://localhost:3000/dashboard/reports/10000000-0000-0000-0000-000000000006`

7. **Complete Scope:**  
   `http://localhost:3000/dashboard/reports/10000000-0000-0000-0000-000000000007`

---

## 📊 ALTERNATIVE VIEWING OPTIONS

### Option 1: Supabase Studio (Local)

```bash
# Start Supabase
supabase start

# Open Studio
supabase dashboard

# Navigate to: Table Editor > reports
```

### Option 2: Database Client (DBeaver, pgAdmin, etc.)

**Connection details:**
```
Host: localhost
Port: 54322
Database: postgres
User: postgres
Password: postgres
```

Then query the `reports` table.

### Option 3: VS Code Extension

Install **PostgreSQL** extension for VS Code:
1. Install extension
2. Connect to local database
3. Browse `reports` table
4. View JSON data

### Option 4: JSON Viewer

Export report JSON and view in online JSON viewer:

```sql
-- Copy this output
SELECT result_json FROM reports WHERE id = '10000000-0000-0000-0000-000000000001';
```

Paste into: https://jsonviewer.stack.hu/

---

## 🎯 WHAT YOU'LL SEE

### Reports List Page

```
┌─────────────────────────────────────────────────────────┐
│  ESTIMATE ANALYSIS REPORTS                    [New]    │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │ Johnson Res  │  │ Riverside    │  │ Martinez     │ │
│  │ Water Damage │  │ Commercial   │  │ Fire Damage  │ │
│  │              │  │              │  │              │ │
│  │ $28K         │  │ $188K        │  │ $94K         │ │
│  │ Gap: 17-28%  │  │ Gap: 16-32%  │  │ Gap: 22-43%  │ │
│  │ 🟡 MEDIUM    │  │ 🔴 HIGH      │  │ 🔴 HIGH      │ │
│  └──────────────┘  └──────────────┘  └──────────────┘ │
│                                                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │ Thompson     │  │ Coastal Home │  │ Anderson     │ │
│  │ Mold         │  │ Hurricane    │  │ Plumbing     │ │
│  │              │  │              │  │              │ │
│  │ $13K         │  │ $249K        │  │ $3K          │ │
│  │ Gap: 27-66%  │  │ Gap: 10-20%  │  │ Gap: 49-114% │ │
│  │ 🔴 HIGH      │  │ 🔴 HIGH      │  │ 🟡 MEDIUM    │ │
│  └──────────────┘  └──────────────┘  └──────────────┘ │
│                                                         │
│  ┌──────────────┐                                      │
│  │ Williams     │                                      │
│  │ Storm        │                                      │
│  │              │                                      │
│  │ $388K        │                                      │
│  │ Gap: 0%      │                                      │
│  │ 🟢 LOW       │                                      │
│  └──────────────┘                                      │
└─────────────────────────────────────────────────────────┘
```

### Report Detail Page

```
┌─────────────────────────────────────────────────────────┐
│  ← Back to Reports                                      │
├─────────────────────────────────────────────────────────┤
│  Johnson Residence - Water Damage Claim #WD-2024-8847  │
│  WD-2024-8847                            🟡 MEDIUM RISK │
│                                                         │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐   │
│  │ Estimate     │ │ Missing      │ │ Gap          │   │
│  │ $28,451      │ │ $4,800-$7,900│ │ 17% - 28%    │   │
│  └──────────────┘ └──────────────┘ └──────────────┘   │
│                                                         │
│  PROPERTY INFORMATION                                   │
│  ├─ Address: 1234 Oak Street, Springfield, IL          │
│  ├─ Claim: WD-2024-8847                                │
│  ├─ Date of Loss: 2024-01-15                           │
│  └─ Adjuster: Sarah Mitchell                           │
│                                                         │
│  ISSUES SUMMARY                                         │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐               │
│  │ 🔴 2     │ │ 🟡 2     │ │ 🔵 1     │               │
│  │ Critical │ │ Warnings │ │ Info     │               │
│  └──────────┘ └──────────┘ └──────────┘               │
│                                                         │
│  DETECTED TRADES (6)                                    │
│  ├─ DEM - Demolition: $1,107.75                        │
│  ├─ DRY - Drying: $1,248.00                            │
│  ├─ INS - Insulation: $322.00                          │
│  └─ ... (3 more)                                       │
│                                                         │
│  MISSING ITEMS (5)                                      │
│  🔴 Antimicrobial Treatment                            │
│     Cost: $150-$350 | Codes: CLN ANTI, CLN DSNF       │
│                                                         │
│  🔴 Moisture Testing                                   │
│     Cost: $200-$400 | Codes: DRY MSTR                 │
│                                                         │
│  ... (3 more)                                          │
│                                                         │
│  EXECUTIVE SUMMARY                                      │
│  This Xactimate estimate covers basic water damage...  │
│                                                         │
│  [← Back to Reports]              [🖨️ Print Report]   │
└─────────────────────────────────────────────────────────┘
```

---

## 🎬 DEMO WORKFLOW

### For Presentations

**1. Start with overview** (Reports list page)
```
"Here are 7 comprehensive example reports we've analyzed..."
```

**2. Show the extremes**
- Click Report #7 (Complete) - "This is what perfect looks like"
- Click Report #6 (Minimal) - "This is what happens when scope is missed"

**3. Show the gap**
```
"Notice the 114% gap in the small claim - 
 $3,250 estimate missing $3,705 in scope"
```

**4. Show detail**
- Scroll through missing items
- Point out cost impacts
- Highlight critical action items

**5. Show variety**
- Navigate between different damage types
- Show commercial vs residential
- Show different risk levels

---

## 📸 SCREENSHOTS

### Taking Screenshots for Documentation

**Reports List:**
```bash
# Navigate to reports page
http://localhost:3000/dashboard/reports

# Take screenshot (browser dev tools or snipping tool)
# Save as: screenshots/reports-list.png
```

**Report Detail:**
```bash
# Navigate to specific report
http://localhost:3000/dashboard/reports/10000000-0000-0000-0000-000000000001

# Take screenshot
# Save as: screenshots/report-detail-water-damage.png
```

---

## 🔐 ACCESS CONTROL

### Public Access (for demos)

If you want to make reports publicly viewable without login:

**Option 1: Disable RLS temporarily**
```sql
ALTER TABLE reports DISABLE ROW LEVEL SECURITY;
```

**Option 2: Add public read policy**
```sql
CREATE POLICY "Public can view example reports"
  ON reports FOR SELECT
  USING (user_id = '00000000-0000-0000-0000-000000000001');
```

**Option 3: Create demo route**
```typescript
// app/demo/reports/page.tsx
// Use service role key to bypass RLS
```

---

## 📊 VIEWING IN PRODUCTION

### Cloud Deployment

Once deployed to production (Vercel, Netlify, etc.):

**Reports URL:**
```
https://your-domain.com/dashboard/reports
```

**Direct report links:**
```
https://your-domain.com/dashboard/reports/[report-id]
```

### Sharing with Stakeholders

**Option 1: Share direct links** (if public)
```
https://your-domain.com/dashboard/reports/10000000-0000-0000-0000-000000000001
```

**Option 2: Export to PDF**
```typescript
// Add PDF export button
<button onClick={() => window.print()}>
  Print/Save as PDF
</button>
```

**Option 3: Screenshot and share**
- Take screenshots of report pages
- Share via email or presentation

---

## 🎓 TRAINING SESSIONS

### Session 1: Overview (15 minutes)
1. Navigate to `/dashboard/reports`
2. Review all 7 reports
3. Discuss risk levels and gaps
4. Compare estimate values

### Session 2: Deep Dive (30 minutes)
1. Open Report #1 (Water Damage)
2. Review each section
3. Discuss missing items
4. Explain cost impacts
5. Review action items

### Session 3: Comparison (20 minutes)
1. Open Report #6 (Minimal)
2. Open Report #7 (Complete)
3. Compare side-by-side
4. Discuss differences
5. Highlight best practices

---

## 💻 DEVELOPER ACCESS

### In Your Code

```typescript
// pages/my-component.tsx
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function MyComponent() {
  const [reports, setReports] = useState([]);

  useEffect(() => {
    async function loadReports() {
      const { data } = await supabase
        .from('reports')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (data) setReports(data);
    }
    loadReports();
  }, []);

  return (
    <div>
      {reports.map(report => (
        <div key={report.id}>
          <h3>{report.estimate_name}</h3>
          <p>Risk: {report.result_json.risk_level}</p>
        </div>
      ))}
    </div>
  );
}
```

### In API Routes

```typescript
// app/api/reports/route.ts
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function GET() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: reports } = await supabase
    .from('reports')
    .select('*')
    .order('created_at', { ascending: false });

  return NextResponse.json(reports);
}
```

---

## 🎉 SUMMARY

### Where to View Reports:

1. **🌐 Web UI (Best for users)**
   - URL: `http://localhost:3000/dashboard/reports`
   - Features: Interactive, visual, user-friendly

2. **💾 Supabase Dashboard (Best for admins)**
   - URL: `http://localhost:54323` or cloud dashboard
   - Features: Direct database access, SQL queries

3. **🔍 Command Line (Best for developers)**
   - Tool: `psql` or Supabase CLI
   - Features: Fast queries, scripting

4. **📊 API (Best for integration)**
   - Endpoint: `/api/reports`
   - Features: Programmatic access, automation

### Quick Start:
```bash
# 1. Load data
supabase db reset

# 2. Start app
npm run dev

# 3. Open browser
http://localhost:3000/dashboard/reports

# Done! 🎉
```

---

**Need help? See [EXAMPLE_REPORTS.md](./docs/EXAMPLE_REPORTS.md) for full documentation.**
