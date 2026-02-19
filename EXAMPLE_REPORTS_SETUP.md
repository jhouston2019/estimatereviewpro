# 🚀 EXAMPLE REPORTS - SETUP GUIDE

**Quick guide to loading and using the 7 enterprise-ready example reports**

---

## ⚡ QUICK START

### 1. Load Example Reports (Supabase)

```bash
# Option A: Using Supabase CLI
supabase db reset  # Resets and runs all migrations including seed data

# Option B: Run seed file directly
psql -h your-db-host -U postgres -d your-db-name -f supabase/migrations/01_seed_example_reports.sql

# Option C: Using Supabase Dashboard
# 1. Go to SQL Editor in Supabase Dashboard
# 2. Copy contents of supabase/migrations/01_seed_example_reports.sql
# 3. Paste and run
```

### 2. Verify Data Loaded

```sql
-- Check report count (should be 7)
SELECT COUNT(*) FROM reports;

-- View all reports
SELECT * FROM report_summary;

-- Check demo user exists
SELECT * FROM users WHERE email = 'demo@estimatereviewpro.com';
```

### 3. Access Reports in Your App

```typescript
import { supabase } from '@/lib/supabaseClient';
import { EXAMPLE_REPORT_IDS, getExampleReport } from '@/lib/report-utils';

// Get specific example report
const waterDamageReport = await getExampleReport(
  supabase, 
  EXAMPLE_REPORT_IDS.WATER_DAMAGE
);

// Get all example reports
const { data: allReports } = await supabase
  .from('reports')
  .select('*')
  .order('created_at', { ascending: false });
```

---

## 📋 WHAT YOU GET

### 7 Complete Reports

1. **Water Damage** - Residential ($28K, Medium Risk)
2. **Commercial Roof** - Office building ($188K, High Risk)  
3. **Fire Damage** - Kitchen fire ($94K, High Risk)
4. **Mold Remediation** - Hidden moisture ($13K, High Risk)
5. **Hurricane** - Coastal property ($249K, High Risk)
6. **Minimal Scope** - Small leak ($3K, Medium Risk)
7. **Complete Scope** - Gold standard ($388K, Low Risk)

### Demo User & Team
- **User:** demo@estimatereviewpro.com
- **Team:** Demo Construction & Restoration
- **Plan:** Professional (50 reviews/month)
- **Current Usage:** 5 reviews this month

---

## 🎯 USAGE EXAMPLES

### Display Report in Dashboard

```typescript
import { generateExecutiveSummary, getGapPercentage } from '@/lib/report-utils';

function ReportCard({ report }: { report: Report }) {
  const gap = getGapPercentage(report);
  const summary = generateExecutiveSummary(report);
  
  return (
    <div className="report-card">
      <h3>{report.estimate_name}</h3>
      <p>Risk: {report.result_json.risk_level}</p>
      <p>Gap: {gap.low}% - {gap.high}%</p>
      <p>Missing: {formatCurrencyRange(
        report.result_json.total_missing_value_estimate.low,
        report.result_json.total_missing_value_estimate.high
      )}</p>
    </div>
  );
}
```

### Generate Findings Report

```typescript
import { generateFindingsReport } from '@/lib/report-utils';

const report = await getExampleReport(supabase, EXAMPLE_REPORT_IDS.WATER_DAMAGE);
const findings = generateFindingsReport(report);

console.log(findings);
// Outputs formatted text report ready for display or export
```

### Get Critical Items Only

```typescript
import { getCriticalMissingItems } from '@/lib/report-utils';

const report = await getExampleReport(supabase, EXAMPLE_REPORT_IDS.FIRE_DAMAGE);
const criticalItems = getCriticalMissingItems(report);

criticalItems.forEach(item => {
  console.log(`🔴 ${item.category}: $${item.estimated_cost_impact}`);
});
```

### Calculate Health Score

```typescript
import { getReportHealthScore, getHealthScoreLabel } from '@/lib/report-utils';

const report = await getExampleReport(supabase, EXAMPLE_REPORT_IDS.COMPLETE_SCOPE);
const score = getReportHealthScore(report);
const label = getHealthScoreLabel(score);

console.log(`Health Score: ${score}/100 (${label})`);
// Output: Health Score: 100/100 (Excellent)
```

---

## 🎨 FRONTEND COMPONENTS

### Report List Component

```typescript
'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Report } from '@/lib/report-types';
import { getGapPercentage, getRiskColor } from '@/lib/report-utils';

export default function ReportList() {
  const [reports, setReports] = useState<Report[]>([]);

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
    <div className="grid gap-4">
      {reports.map(report => {
        const gap = getGapPercentage(report);
        const riskColor = getRiskColor(report.result_json.risk_level);
        
        return (
          <div key={report.id} className="border rounded-lg p-4 shadow">
            <h3 className="font-bold text-lg">{report.estimate_name}</h3>
            <div className="flex gap-4 mt-2">
              <span style={{ color: riskColor }}>
                {report.result_json.risk_level.toUpperCase()}
              </span>
              <span>Gap: {gap.low}%-{gap.high}%</span>
              <span>Issues: {report.result_json.missing_items.length}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
```

### Report Detail Component

```typescript
'use client';

import { Report } from '@/lib/report-types';
import { 
  formatCurrency, 
  getSeverityColor,
  getIssuesBySeverity 
} from '@/lib/report-utils';

export default function ReportDetail({ report }: { report: Report }) {
  const analysis = report.result_json;
  const issues = getIssuesBySeverity(report);

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-4">{report.estimate_name}</h1>
      
      {/* Property Info */}
      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Property Information</h2>
        <div className="bg-gray-50 p-4 rounded">
          <p><strong>Address:</strong> {analysis.property_details.address}</p>
          <p><strong>Claim:</strong> {analysis.property_details.claim_number}</p>
          <p><strong>Value:</strong> {formatCurrency(analysis.property_details.total_estimate_value)}</p>
        </div>
      </section>

      {/* Issues Summary */}
      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Issues Summary</h2>
        <div className="flex gap-4">
          <div className="bg-red-50 p-4 rounded flex-1">
            <p className="text-2xl font-bold text-red-600">{issues.error}</p>
            <p className="text-sm">Critical</p>
          </div>
          <div className="bg-yellow-50 p-4 rounded flex-1">
            <p className="text-2xl font-bold text-yellow-600">{issues.warning}</p>
            <p className="text-sm">Warnings</p>
          </div>
          <div className="bg-blue-50 p-4 rounded flex-1">
            <p className="text-2xl font-bold text-blue-600">{issues.info}</p>
            <p className="text-sm">Info</p>
          </div>
        </div>
      </section>

      {/* Missing Items */}
      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Missing Items</h2>
        {analysis.missing_items.map((item, idx) => (
          <div 
            key={idx} 
            className="border-l-4 p-4 mb-3"
            style={{ borderColor: getSeverityColor(item.severity) }}
          >
            <h3 className="font-semibold">{item.category}</h3>
            <p className="text-sm text-gray-600">{item.description}</p>
            <p className="text-sm mt-2">
              <strong>Cost Impact:</strong> ${item.estimated_cost_impact}
            </p>
          </div>
        ))}
      </section>

      {/* Summary */}
      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Analysis Summary</h2>
        <p className="text-gray-700">{analysis.summary}</p>
      </section>
    </div>
  );
}
```

---

## 📊 DEMO SCENARIOS

### Scenario 1: Dashboard Overview
```typescript
// Show all reports with key metrics
const { data: reports } = await supabase
  .from('report_summary')
  .select('*')
  .order('created_at', { ascending: false });

// Display cards with:
// - Estimate name
// - Risk level (color coded)
// - Gap percentage
// - Missing value range
```

### Scenario 2: Risk Analysis
```typescript
// Filter high-risk reports
const { data: highRiskReports } = await supabase
  .from('reports')
  .select('*')
  .eq('result_json->>risk_level', 'high');

// Show prioritized list of high-risk claims
```

### Scenario 3: Missing Items Report
```typescript
// Aggregate missing items across all reports
const { data: reports } = await supabase
  .from('reports')
  .select('result_json');

const missingItemsFrequency = {};
reports.forEach(report => {
  report.result_json.missing_items.forEach(item => {
    missingItemsFrequency[item.category] = 
      (missingItemsFrequency[item.category] || 0) + 1;
  });
});

// Show most common missing items across all claims
```

### Scenario 4: Financial Impact Dashboard
```typescript
// Calculate total value of gaps identified
const { data: reports } = await supabase
  .from('report_summary')
  .select('missing_value_low, missing_value_high');

const totalMissingLow = reports.reduce((sum, r) => sum + parseFloat(r.missing_value_low), 0);
const totalMissingHigh = reports.reduce((sum, r) => sum + parseFloat(r.missing_value_high), 0);

// Display: "Total gaps identified: $XX,XXX - $XXX,XXX"
```

---

## 🔍 ADVANCED QUERIES

### Get Reports by Date Range
```sql
SELECT * FROM reports 
WHERE created_at BETWEEN '2024-01-01' AND '2024-12-31'
ORDER BY created_at DESC;
```

### Get Reports Above Threshold
```sql
SELECT 
  estimate_name,
  (result_json->'property_details'->>'total_estimate_value')::numeric as value,
  (result_json->'total_missing_value_estimate'->>'high')::numeric as missing
FROM reports
WHERE (result_json->'total_missing_value_estimate'->>'high')::numeric > 10000
ORDER BY missing DESC;
```

### Get Reports by Trade Code
```sql
SELECT 
  estimate_name,
  result_json->'classification'->'metadata'->>'trade_codes_found' as trades
FROM reports
WHERE result_json->'classification'->'metadata'->>'trade_codes_found' LIKE '%RFG%';
```

### Get Compliance Issues
```sql
SELECT 
  estimate_name,
  jsonb_array_length(result_json->'compliance_notes') as compliance_items,
  result_json->'compliance_notes'
FROM reports
WHERE jsonb_array_length(result_json->'compliance_notes') > 0;
```

---

## 🎓 TRAINING EXERCISES

### Exercise 1: Identify the Gap
**Task:** Compare Report #6 (Minimal) with what it should include  
**Learning:** Importance of thorough assessment  
**Answer:** Missing $1,600-$3,700 (49-114% gap)

### Exercise 2: Find the Pattern
**Task:** What items are missing in 3+ reports?  
**Learning:** Common adjuster oversights  
**Answer:** Moisture testing, antimicrobial treatment, electrical inspection

### Exercise 3: Calculate ROI
**Task:** For Report #2, calculate ROI of the analysis  
**Learning:** Value proposition of the service  
**Answer:** $30K-60K identified for $149 fee = 200-400x ROI

### Exercise 4: Risk Assessment
**Task:** Why is Report #4 (Mold) high risk despite low value?  
**Learning:** Risk isn't just about money  
**Answer:** Missing testing = no verification of safe re-occupancy

### Exercise 5: Best Practices
**Task:** What makes Report #7 score 100%?  
**Learning:** Gold standard for estimates  
**Answer:** All trades, inspections, permits, testing included

---

## 💡 TIPS & TRICKS

### For Developers

1. **Type Safety:** Import types from `lib/report-types.ts`
2. **Utilities:** Use helper functions from `lib/report-utils.ts`
3. **Validation:** Reports match AI validation schema in `lib/ai-validation.ts`
4. **Testing:** Use example reports for unit and integration tests

### For Demos

1. **Start with #7** - Show what "perfect" looks like
2. **Then show #6** - Dramatic gap (114%) demonstrates value
3. **Show #2 or #5** - Large dollar amounts impress enterprise clients
4. **End with variety** - Show range of damage types and scenarios

### For Training

1. **New users:** Start with Report #1 (straightforward water damage)
2. **Advanced users:** Use Report #2 or #5 (complex multi-system)
3. **Specialists:** Use Report #4 (mold - specialized requirements)
4. **Quality control:** Use Report #7 as benchmark

---

## 🔧 CUSTOMIZATION

### Modify Example Data

Edit `supabase/migrations/01_seed_example_reports.sql`:

```sql
-- Change property address
'address': 'YOUR ADDRESS HERE',

-- Change estimate value
'total_estimate_value': 50000.00,

-- Add/remove missing items
'missing_items': [
  {
    'category': 'Your Category',
    'description': 'Your description',
    ...
  }
]
```

### Add Your Own Examples

```sql
INSERT INTO reports (
  id,
  user_id,
  team_id,
  estimate_name,
  estimate_type,
  damage_type,
  result_json,
  paid_single_use,
  created_at
) VALUES (
  gen_random_uuid(),
  'your-user-id',
  'your-team-id',
  'Your Estimate Name',
  'residential',
  'water_damage',
  '{...your analysis JSON...}'::jsonb,
  false,
  NOW()
);
```

---

## 📱 API ENDPOINTS

### Get All Reports
```typescript
// GET /api/reports
const response = await fetch('/api/reports');
const reports = await response.json();
```

### Get Single Report
```typescript
// GET /api/reports/:id
const response = await fetch(`/api/reports/${reportId}`);
const report = await response.json();
```

### Create New Report
```typescript
// POST /api/create-review
const response = await fetch('/api/create-review', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    userId: 'user-id',
    estimateName: 'My Estimate',
    estimateType: 'residential',
    damageType: 'water_damage',
    estimateText: 'Your estimate text here...'
  })
});
```

---

## 🎯 TESTING

### Unit Tests

```typescript
import { describe, it, expect } from 'vitest';
import { getReportHealthScore, getGapPercentage } from '@/lib/report-utils';

describe('Report Utils', () => {
  it('should calculate health score correctly', () => {
    const report = mockReport; // Use example report
    const score = getReportHealthScore(report);
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);
  });

  it('should calculate gap percentage', () => {
    const report = mockReport;
    const gap = getGapPercentage(report);
    expect(gap.low).toBeGreaterThanOrEqual(0);
    expect(gap.high).toBeGreaterThanOrEqual(gap.low);
  });
});
```

### Integration Tests

```typescript
import { supabase } from '@/lib/supabaseClient';
import { EXAMPLE_REPORT_IDS, getExampleReport } from '@/lib/report-utils';

describe('Example Reports', () => {
  it('should load water damage report', async () => {
    const report = await getExampleReport(supabase, EXAMPLE_REPORT_IDS.WATER_DAMAGE);
    expect(report).toBeTruthy();
    expect(report?.estimate_type).toBe('residential');
    expect(report?.damage_type).toBe('water_damage');
  });

  it('should have complete data structure', async () => {
    const report = await getExampleReport(supabase, EXAMPLE_REPORT_IDS.COMPLETE_SCOPE);
    expect(report?.result_json.classification).toBeTruthy();
    expect(report?.result_json.detected_trades.length).toBeGreaterThan(0);
    expect(report?.result_json.missing_items.length).toBe(0); // Complete scope
  });
});
```

---

## 📊 ANALYTICS QUERIES

### Monthly Report Statistics
```sql
SELECT 
  TO_CHAR(created_at, 'YYYY-MM') as month,
  COUNT(*) as report_count,
  AVG((result_json->'property_details'->>'total_estimate_value')::numeric) as avg_value,
  AVG((result_json->'total_missing_value_estimate'->>'high')::numeric) as avg_missing
FROM reports
GROUP BY month
ORDER BY month DESC;
```

### Damage Type Distribution
```sql
SELECT 
  damage_type,
  COUNT(*) as count,
  AVG((result_json->'total_missing_value_estimate'->>'high')::numeric) as avg_gap
FROM reports
GROUP BY damage_type
ORDER BY count DESC;
```

### Top Missing Items
```sql
SELECT 
  jsonb_array_elements(result_json->'missing_items')->>'category' as category,
  COUNT(*) as frequency,
  AVG((jsonb_array_elements(result_json->'missing_items')->>'estimated_cost_impact')::text) as avg_cost
FROM reports
GROUP BY category
ORDER BY frequency DESC
LIMIT 10;
```

---

## 🚀 DEPLOYMENT CHECKLIST

- [ ] Run migration: `01_seed_example_reports.sql`
- [ ] Verify 7 reports loaded
- [ ] Verify demo user and team created
- [ ] Test report queries in Supabase dashboard
- [ ] Import types in your TypeScript files
- [ ] Test report display in frontend
- [ ] Test report export functionality
- [ ] Verify RLS policies allow access
- [ ] Test report filtering and sorting
- [ ] Test report detail view

---

## 📞 TROUBLESHOOTING

### Reports Not Loading?

```sql
-- Check if reports table exists
SELECT * FROM information_schema.tables WHERE table_name = 'reports';

-- Check if seed data loaded
SELECT COUNT(*) FROM reports WHERE user_id = '00000000-0000-0000-0000-000000000001';

-- Check RLS policies
SELECT * FROM pg_policies WHERE tablename = 'reports';
```

### Type Errors?

```typescript
// Make sure you've imported types
import { Report, ReportAnalysis } from '@/lib/report-types';

// Type the response
const { data } = await supabase
  .from('reports')
  .select('*')
  .single();

const report = data as Report;
```

### Can't Access Reports?

```sql
-- Check RLS policies allow your user
SELECT * FROM reports WHERE user_id = auth.uid();

-- Or use service role key for admin access
const supabase = createClient(url, serviceRoleKey);
```

---

## 🎉 NEXT STEPS

1. ✅ Load example reports (see Quick Start above)
2. ✅ Verify data in Supabase dashboard
3. ✅ Import types and utilities in your app
4. ✅ Build report list and detail pages
5. ✅ Add filtering and search
6. ✅ Implement PDF export
7. ✅ Add analytics dashboard
8. ✅ Use for demos and training

---

## 📚 RELATED DOCUMENTATION

- **[EXAMPLE_REPORTS.md](./docs/EXAMPLE_REPORTS.md)** - Comprehensive report documentation
- **[REPORT_QUICK_REFERENCE.md](./docs/REPORT_QUICK_REFERENCE.md)** - Quick reference guide
- **[lib/report-types.ts](./lib/report-types.ts)** - TypeScript type definitions
- **[lib/report-utils.ts](./lib/report-utils.ts)** - Utility functions
- **[lib/ai-validation.ts](./lib/ai-validation.ts)** - AI response validation

---

**Questions? Check the full documentation in [EXAMPLE_REPORTS.md](./docs/EXAMPLE_REPORTS.md)**

**Ready to use! Load the data and start building.** 🚀
