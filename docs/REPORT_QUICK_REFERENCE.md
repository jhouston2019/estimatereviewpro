# 🚀 REPORT QUICK REFERENCE

**Fast access guide to example reports and their key data points**

---

## 📊 REPORT INDEX

| ID | Name | Type | Damage | Value | Gap | Risk |
|----|------|------|--------|-------|-----|------|
| **#1** | Johnson Residence | Residential | Water | $28K | $5-8K | 🟡 Medium |
| **#2** | Riverside Office | Commercial | Hail/Wind | $188K | $30-60K | 🔴 High |
| **#3** | Martinez Home | Residential | Fire | $94K | $20-40K | 🔴 High |
| **#4** | Thompson Property | Residential | Mold | $13K | $3-8K | 🔴 High |
| **#5** | Coastal Home | Residential | Hurricane | $249K | $25-50K | 🔴 High |
| **#6** | Anderson Condo | Residential | Plumbing | $3K | $2-4K | 🟡 Medium |
| **#7** | Williams Estate | Residential | Storm | $388K | $0 | 🟢 Low |

---

## 🎯 QUICK ACCESS BY USE CASE

### "Show me a complete, well-scoped estimate"
→ **Report #7** (Williams Estate) - Zero gaps, 287 line items, $388K

### "Show me a typical water damage claim"
→ **Report #1** (Johnson Residence) - Common gaps, $28K

### "Show me a commercial property example"
→ **Report #2** (Riverside Office) - Complex scope, $188K

### "Show me a fire damage example"
→ **Report #3** (Martinez Home) - Multi-trade, $94K

### "Show me a mold remediation example"
→ **Report #4** (Thompson Property) - Testing requirements, $13K

### "Show me a catastrophic claim"
→ **Report #5** (Coastal Home) - Hurricane, $249K

### "Show me an under-scoped small claim"
→ **Report #6** (Anderson Condo) - Minimal scope, 114% gap, $3K

---

## 🔍 QUICK QUERIES

### Get Report by ID
```sql
SELECT * FROM reports WHERE id = '10000000-0000-0000-0000-000000000001';
```

### Get All Reports Summary
```sql
SELECT * FROM report_summary ORDER BY created_at DESC;
```

### Get High-Risk Reports
```sql
SELECT estimate_name, risk_level, missing_value_high 
FROM report_summary 
WHERE risk_level = 'high'
ORDER BY missing_value_high DESC;
```

### Get Reports by Damage Type
```sql
SELECT estimate_name, estimate_value, missing_value_high
FROM report_summary
WHERE damage_type = 'water_damage';
```

### Get Top Missing Items Across All Reports
```sql
SELECT 
  jsonb_array_elements(result_json->'missing_items')->>'category' as category,
  COUNT(*) as frequency
FROM reports
GROUP BY category
ORDER BY frequency DESC
LIMIT 10;
```

---

## 📋 KEY METRICS BY REPORT

### Report #1 - Water Damage
- **Line Items:** 47
- **Trades:** 6 (DEM, DRY, INS, PLM, FLR, PNT)
- **Missing Items:** 5
- **Quantity Issues:** 2
- **Structural Gaps:** 2
- **Confidence:** 92%
- **Top Gap:** Antimicrobial treatment ($150-350)

### Report #2 - Commercial Roof
- **Line Items:** 89
- **Trades:** 3 (RFG, SHT, MSC)
- **Missing Items:** 7
- **Quantity Issues:** 2
- **Structural Gaps:** 2
- **Confidence:** 96%
- **Top Gap:** Roof deck repair ($8,500-15,000)

### Report #3 - Fire Damage
- **Line Items:** 134
- **Trades:** 12 (DEM, CLN, GYP, INS, PNT, CAB, CTR, PLM, ELC, FLR, TIL, MSC)
- **Missing Items:** 8
- **Quantity Issues:** 2
- **Structural Gaps:** 3
- **Confidence:** 94%
- **Top Gap:** Electrical inspection ($2,500-5,000)

### Report #4 - Mold Remediation
- **Line Items:** 23
- **Trades:** 5 (DEM, REM, INS, GYP, PNT)
- **Missing Items:** 7
- **Quantity Issues:** 2
- **Structural Gaps:** 2
- **Confidence:** 89%
- **Top Gap:** Testing (pre & post) ($800-1,450)

### Report #5 - Hurricane
- **Line Items:** 156
- **Trades:** 13 (RFG, SID, WDW, DOR, GUT, ELC, DRY, CLN, GYP, INS, PNT, FLR, MSC)
- **Missing Items:** 9
- **Quantity Issues:** 2
- **Structural Gaps:** 3
- **Confidence:** 95%
- **Top Gap:** Roof deck + Engineering ($10,000-18,500)

### Report #6 - Plumbing Leak
- **Line Items:** 8
- **Trades:** 2 (PLM, DRY)
- **Missing Items:** 5
- **Quantity Issues:** 1
- **Structural Gaps:** 2
- **Confidence:** 88%
- **Top Gap:** Cabinet replacement ($450-850)

### Report #7 - Complete (Gold Standard)
- **Line Items:** 287
- **Trades:** 21 (All major trades)
- **Missing Items:** 0
- **Quantity Issues:** 0
- **Structural Gaps:** 0
- **Confidence:** 98%
- **Positive Findings:** 10 best practices identified

---

## 🎓 TRAINING SCENARIOS

### Scenario 1: New Adjuster Training
**Use Reports:** #1, #6, #7
**Focus:** Compare minimal (#6) vs moderate (#1) vs complete (#7) scoping
**Lesson:** Importance of thorough assessment

### Scenario 2: Commercial Claims Training
**Use Report:** #2
**Focus:** Commercial-specific requirements
**Lesson:** Code compliance, engineering, permits

### Scenario 3: Fire Damage Training
**Use Report:** #3
**Focus:** Multi-trade coordination
**Lesson:** Safety-critical items (electrical, HVAC)

### Scenario 4: Mold Remediation Training
**Use Report:** #4
**Focus:** IICRC S520 compliance
**Lesson:** Testing requirements, source repair

### Scenario 5: Catastrophic Loss Training
**Use Report:** #5
**Focus:** Large-scale multi-system damage
**Lesson:** Building code upgrades, structural requirements

---

## 💼 SALES & MARKETING USE

### Demonstrate Value Proposition
- **Average gap identified:** 20-43%
- **Total value analyzed:** $962,875
- **Standards referenced:** 7 major codes/standards
- **Time saved:** Automated analysis vs manual review

### Case Studies
Each report can be used as a case study:
- Before: Original estimate
- Analysis: What was found
- After: Complete scope with gaps filled
- Impact: Financial and quality improvements

### ROI Calculation
```
Example: Report #2 (Commercial Roof)
- Original estimate: $187,650
- Missing scope identified: $30,000-60,000
- Analysis cost: $149 (one-time) or included in subscription
- ROI: 200-400x return on analysis investment
```

---

## 🔗 RELATED RESOURCES

- **Full Documentation:** [EXAMPLE_REPORTS.md](./EXAMPLE_REPORTS.md)
- **Database Schema:** [../supabase/migrations/20260210_pricing_schema.sql](../supabase/migrations/20260210_pricing_schema.sql)
- **AI Validation:** [../lib/ai-validation.ts](../lib/ai-validation.ts)
- **Seed File:** [../supabase/migrations/01_seed_example_reports.sql](../supabase/migrations/01_seed_example_reports.sql)

---

## 🎯 QUICK TIPS

1. **Start with Report #7** - Shows what "complete" looks like
2. **Use Report #6** - Shows dramatic impact of thorough analysis (114% gap)
3. **Use Report #2** - Shows commercial complexity and large gaps
4. **Use Report #4** - Shows specialized requirements (mold testing)
5. **Compare Reports #1 & #7** - Shows difference between adequate and excellent

---

**Need help? See [EXAMPLE_REPORTS.md](./EXAMPLE_REPORTS.md) for detailed documentation.**
