# 🚀 QUICK START - ERP REPORT SUITE

## For Users

### Generate a Report

1. Open any report detail page
2. Select format from dropdown:
   - **Negotiation Brief** - Quick 3-5 page leverage doc
   - **Pushback Response** - Detailed carrier rebuttal
   - **Appraisal Exhibit** - Litigation-ready exhibits
   - **Full Enforcement Report** - Complete documentation
3. Click **PDF**, **Excel**, or **CSV** button
4. Report opens in new tab

### Export Everything

Click **Export All (ZIP)** to get:
- All 4 report formats (text)
- Excel spreadsheet
- CSV file

One click = complete documentation bundle.

---

## For Developers

### Run Consistency Test

```bash
npx ts-node tests/report-suite-consistency.test.ts
```

**Expected output:**
```
✅ PASS: All reports are numerically consistent
✅ PASS: Deep validation successful
✅ ALL TESTS PASSED - DETERMINISTIC CONSISTENCY VERIFIED
```

### Add New Report Format

1. Create `lib/templates/your-template.ts`
2. Export `buildYourTemplate(input, metadata)` function
3. Add to `ReportType` in `lib/report-renderer.ts`
4. Add case to switch statement in `renderReport()`
5. Add option to dropdown in `ExportControls.tsx`

### API Usage

```typescript
// Generate specific format
GET /api/reports/{id}/export?format=pdf&type=NEGOTIATION

// Export all formats
GET /api/reports/{id}/export?format=pdf&type=ALL
```

**Parameters:**
- `format`: pdf | excel | csv
- `type`: NEGOTIATION | PUSHBACK | APPRAISAL | FULL | ALL

---

## Defensibility Scoring

### Use in Templates

```typescript
import { scoreDefensibility, formatDefensibilityScore } from '@/lib/defensibility-scorer';

const score = scoreDefensibility(
  deviation,
  expertDirective,
  hasDimensionVerification,
  hasPhotoEvidence
);

const scoreText = formatDefensibilityScore(score);
// Add to template output
```

### Scoring Breakdown

| Score | Level | Meaning |
|-------|-------|---------|
| 5 ★★★★★ | BULLETPROOF | Multiple authoritative sources |
| 4 ★★★★☆ | STRONG | Expert + compliance + verification |
| 3 ★★★☆☆ | MEDIUM | Some support, needs strengthening |
| 2 ★★☆☆☆ | FAIR | Weak documentation |
| 1 ★☆☆☆☆ | WEAK | Do not present without more support |

---

## File Structure

```
lib/
├── report-renderer.ts              # Core abstraction layer
├── defensibility-scorer.ts         # Strategic guidance
└── templates/
    ├── negotiation-template.ts     # 3-5 page brief
    ├── pushback-template.ts        # Carrier rebuttal
    ├── appraisal-template.ts       # Litigation exhibits
    └── full-template.ts            # Complete report

app/
├── api/reports/[id]/export/route.ts    # Export API
└── dashboard/reports/[id]/
    ├── page.tsx                        # Report detail page
    └── ExportControls.tsx              # Export UI component

tests/
└── report-suite-consistency.test.ts    # Automated validation
```

---

## Troubleshooting

### Numbers Don't Match
```bash
npx ts-node tests/report-suite-consistency.test.ts
```
Test will identify which format has discrepancy.

### ZIP Export Fails
```bash
npm install jszip
```

### Template Error
Check that `analysis` object has required fields:
- `property_details`
- `classification`
- `detected_trades`
- `missing_items`
- etc.

### UI Not Updating
Clear browser cache and hard refresh (Ctrl+Shift+R).

---

## Best Practices

### When to Use Each Format

**Negotiation Brief**
- Initial field adjuster meeting
- Quick leverage presentation
- Time-sensitive negotiations

**Pushback Response**
- Carrier denied initial claim
- Need structured rebuttal
- Desk review situation

**Appraisal Exhibit**
- Appraisal process initiated
- Litigation preparation
- Need formal exhibit formatting

**Full Enforcement Report**
- Complete documentation needed
- Legal proceedings
- Comprehensive record

### Export Strategy

1. **Start with Negotiation Brief** - Test the waters
2. **Escalate to Pushback** - If carrier disputes
3. **Use Appraisal Exhibits** - If entering appraisal
4. **Keep Full Report** - For your records

---

## Performance Tips

- Reports generate in <300ms per format
- ZIP bundling takes <1 second
- No recalculation = instant exports
- Safe to generate multiple times

---

## Security Notes

- All exports require authentication
- RLS enforced on report access
- Watermarks include claim info
- Audit trail in every export
- SHA-256 hash for verification

---

## Support

**Documentation:**
- `REPORT_SUITE_IMPLEMENTATION_COMPLETE.md` - Full technical details
- `QUICK_START_REPORT_SUITE.md` - This guide

**Testing:**
- `tests/report-suite-consistency.test.ts` - Automated validation

**Issues:**
Check linter: `npm run lint`
Check types: `npx tsc --noEmit`

---

**Version:** 1.0.0  
**Status:** Production Ready ✅  
**Last Updated:** February 26, 2026
