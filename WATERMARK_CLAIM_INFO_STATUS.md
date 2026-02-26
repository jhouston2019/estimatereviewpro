# 🔍 WATERMARK & CLAIM INFORMATION STATUS

**Date:** February 26, 2026  
**Issue:** Claim information not being saved and used in watermarks

---

## ❌ CURRENT PROBLEM

### What's Happening Now

1. **✅ UI Collects Claim Info** - Upload form has fields for:
   - Claim Number
   - Property Address
   - Date of Loss
   - Insurance Carrier
   - Adjuster

2. **❌ Data NOT Sent to API** - When form is submitted:
   - Only `estimateName`, `estimateType`, `damageType`, and `estimateText` are sent
   - Claim information (claim number, address, date of loss) is **NOT included** in API request
   - Data is lost after form submission

3. **❌ Data NOT Saved to Database** - The `create-review` API route:
   - Does NOT accept claim information parameters
   - Does NOT save claim info to `result_json.property_details`
   - Reports are created without claim metadata

4. **⚠️ Watermarks Use Fallback Text** - Export/print watermarks show:
   - "N/A" for claim number
   - "Property Address Not Specified" for address
   - Generic "ESTIMATE REVIEW PRO" instead of claim-specific info

---

## ✅ WHAT'S WORKING

### Watermark System is Ready

The watermark infrastructure is **fully implemented** and waiting for data:

**PDF Exports:**
```typescript
// lib/pdf-generator.ts (lines 126-131)
const watermarkText = headerData.claimNumber
  ? `${headerData.claimNumber} - CONFIDENTIAL`
  : 'ESTIMATE REVIEW PRO - CONFIDENTIAL';

const watermarkSubtext = headerData.propertyAddress
  ? headerData.propertyAddress.substring(0, 50)
  : '';
```

**Print View:**
```typescript
// app/dashboard/reports/[id]/page.tsx (lines 104, 119)
body::before {
  content: "${propertyDetails.claim_number || 'CONFIDENTIAL'} - ${propertyDetails.address?.substring(0, 30) || 'ESTIMATE REVIEW PRO'}";
}

body::after {
  content: "CONFIDENTIAL | Claim: ${propertyDetails.claim_number || 'N/A'} | ${propertyDetails.address?.substring(0, 40) || 'N/A'}";
}
```

**Footer Branding:**
```typescript
// lib/pdf-generator.ts (line 299)
${headerData.claimNumber || 'N/A'} | ${headerData.propertyAddress || 'Property Address Not Specified'} | Estimate Review Pro
```

**Excel/CSV Exports:**
```typescript
// app/api/reports/[id]/export/route.ts
CLAIM: ${propertyDetails.claim_number || 'N/A'} | PROPERTY: ${propertyDetails.address || 'N/A'}
```

### Brand Footer is Present

"Estimate Review Pro" appears at the bottom of every page:
- ✅ PDF exports (footer)
- ✅ Print view (footer)
- ✅ Excel exports (footer section)
- ✅ CSV exports (footer section)

---

## 🔧 WHAT NEEDS TO BE FIXED

### 1. Update Upload Form Submission

**File:** `app/upload/page.tsx`

**Current (lines 189-192):**
```typescript
const handleSubmit = (e: React.FormEvent) => {
  e.preventDefault();
  onSubmit();
};
```

**Needs to be:**
```typescript
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  
  // Call API with claim information
  const response = await fetch('/api/create-review', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId: user.id,
      estimateName: 'Estimate Review',
      estimateType,
      damageType,
      estimateText,
      // ADD THESE:
      claimNumber,
      propertyAddress,
      dateOfLoss,
      insuranceCarrier,
      platform
    })
  });
  
  // Then proceed to processing
  onSubmit();
};
```

### 2. Update API Route to Accept Claim Info

**File:** `app/api/create-review/route.ts`

**Current (line 16):**
```typescript
const { userId, estimateName, estimateType, damageType, estimateText } = await request.json();
```

**Needs to be:**
```typescript
const { 
  userId, 
  estimateName, 
  estimateType, 
  damageType, 
  estimateText,
  claimNumber,
  propertyAddress,
  dateOfLoss,
  insuranceCarrier,
  platform
} = await request.json();
```

### 3. Save Claim Info in result_json

**File:** `app/api/create-review/route.ts`

**Current (lines 102-106):**
```typescript
result_json: {
  status: 'complete',
  plan_type: 'single',
}
```

**Needs to be:**
```typescript
result_json: {
  status: 'complete',
  plan_type: 'single',
  property_details: {
    claim_number: claimNumber || '',
    address: propertyAddress || '',
    date_of_loss: dateOfLoss || '',
    adjuster: insuranceCarrier || '',
    total_estimate_value: 0, // Will be calculated by AI
    affected_areas: []
  },
  classification: {
    platform: platform || 'UNKNOWN',
    estimate_type: estimateType || 'insurance_claim',
    damage_category: damageType || 'water'
  }
}
```

### 4. Pass Claim Info to AI Analysis

When the AI analyzes the estimate, it should **merge** user-provided claim info with AI-extracted data:

```typescript
// In AI analysis function
const aiAnalysis = await analyzeEstimate(estimateText);

// Merge with user-provided data
const finalAnalysis = {
  ...aiAnalysis,
  property_details: {
    ...aiAnalysis.property_details,
    // User-provided data takes precedence
    claim_number: claimNumber || aiAnalysis.property_details?.claim_number,
    address: propertyAddress || aiAnalysis.property_details?.address,
    date_of_loss: dateOfLoss || aiAnalysis.property_details?.date_of_loss,
    adjuster: insuranceCarrier || aiAnalysis.property_details?.adjuster
  }
};
```

---

## 📊 DATA FLOW (FIXED)

```
User Enters Claim Info on Upload Form
    ↓
Form Submit → API Call with Claim Data
    ↓
API Route Receives: claimNumber, propertyAddress, dateOfLoss, etc.
    ↓
Save to Database in result_json.property_details
    ↓
AI Analysis Merges with User-Provided Data
    ↓
Report Stored with Complete Claim Information
    ↓
Export/Print Pulls from property_details
    ↓
Watermarks Display Claim-Specific Information
```

---

## 🎯 EXPECTED BEHAVIOR (AFTER FIX)

### Watermarks Will Show

**PDF Header:**
```
CLAIM-2024-001 - CONFIDENTIAL
123 Main Street, City, ST 12345
```

**PDF Footer:**
```
CLAIM-2024-001 | 123 Main Street, City, ST 12345 | Estimate Review Pro
```

**Print Watermark (Diagonal):**
```
CLAIM-2024-001 - 123 Main Street, City, ST 12345
```

**Print Header (Top Right):**
```
CONFIDENTIAL | Claim: CLAIM-2024-001 | 123 Main Street, City, ST 12345
```

**Excel/CSV Footer:**
```
CLAIM: CLAIM-2024-001 | PROPERTY: 123 Main Street, City, ST 12345
```

### Brand Footer (Already Working)

Every page bottom shows:
```
Estimate Review Pro
Page X of Y
```

---

## 🚀 IMPLEMENTATION PRIORITY

### High Priority (Fix Now)
1. ✅ Update upload form to send claim info to API
2. ✅ Update API route to accept and save claim info
3. ✅ Ensure claim info is stored in `result_json.property_details`

### Medium Priority (Nice to Have)
4. ⚠️ Add validation for claim number format
5. ⚠️ Add auto-save for claim info (localStorage)
6. ⚠️ Allow editing claim info after report creation

### Low Priority (Future Enhancement)
7. 📋 Claim info templates (save frequently used info)
8. 📋 Bulk import claim info from CSV
9. 📋 Integration with claim management systems

---

## 📝 TESTING CHECKLIST (AFTER FIX)

- [ ] Enter claim info on upload form
- [ ] Submit form and create report
- [ ] Open report detail page
- [ ] Verify claim number appears in header
- [ ] Export PDF → Check watermarks show claim info
- [ ] Print report → Check watermarks show claim info
- [ ] Export Excel → Check footer shows claim info
- [ ] Export CSV → Check footer shows claim info
- [ ] Verify "Estimate Review Pro" appears on every page bottom
- [ ] Create report WITHOUT claim info → Verify fallback text works
- [ ] Create report WITH partial claim info → Verify mixed display

---

## 🔒 SECURITY NOTES

- Claim information is **sensitive data**
- Already protected by:
  - ✅ Supabase RLS (Row Level Security)
  - ✅ User authentication required
  - ✅ Report ownership validation
  - ✅ "CONFIDENTIAL" watermarks on all exports

---

## 📖 SUMMARY

**Current State:**
- ❌ Claim info collected but not saved
- ❌ Watermarks show fallback text ("N/A")
- ✅ Watermark infrastructure fully implemented
- ✅ Brand footer present on all pages

**After Fix:**
- ✅ Claim info saved to database
- ✅ Watermarks show claim-specific information
- ✅ Professional, branded output
- ✅ Audit trail with claim metadata

**Files to Modify:**
1. `app/upload/page.tsx` (form submission)
2. `app/api/create-review/route.ts` (API route)

**Estimated Time:** 30-45 minutes

**Risk:** Low (additive changes, no breaking modifications)

---

**Status:** Ready to implement  
**Priority:** High (user-facing feature)  
**Complexity:** Low (straightforward data flow)
