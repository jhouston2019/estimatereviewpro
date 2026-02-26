# 🔒 Watermarking System Documentation

**Comprehensive watermarking of all exported reports with claim and project information**

---

## 🎯 Overview

Every exported report (PDF, Excel, CSV, and Print) is watermarked with claim and project information to ensure:
- **Confidentiality** - Clear marking of sensitive documents
- **Traceability** - Easy identification of which claim/property
- **Professionalism** - Branded, official-looking documents
- **Security** - Prevents unauthorized distribution

---

## 🔐 Watermark Types

### 1. Visual Watermarks (PDF & Print)

**Diagonal Center Watermark:**
- Large text across center of page
- Rotated 45 degrees
- Semi-transparent (8% opacity)
- Contains: Claim number or "CONFIDENTIAL"
- Example: `WD-2024-8847 - CONFIDENTIAL`

**Secondary Watermark:**
- Below main watermark
- Contains property address (first 50 chars)
- Smaller font (24px vs 72px)
- 6% opacity
- Example: `1234 Oak Street, Springfield, IL 62701`

**Header Corner Watermark:**
- Top-right corner of every page
- Small text (10px)
- Contains claim number and "CONFIDENTIAL"
- 30% opacity
- Fixed position (stays on every page)

**Footer Watermark:**
- Bottom center of every page
- Contains: Claim | Property | Company name
- 30% opacity
- Fixed position (stays on every page)

### 2. Header Watermarks (All Formats)

**PDF/HTML:**
- Blue gradient header box
- Contains:
  - Company name and logo
  - Report ID and date
  - Claim information section (claim #, property, date of loss, carrier)
- Visible and prominent

**Excel:**
- Blue header section at top
- Contains:
  - "ESTIMATE REVIEW PRO - CONFIDENTIAL"
  - Professional subtitle
- Claim information box:
  - Claim number, Report ID
  - Property address
  - Date of loss, Report date
- Color-coded (blue background)

**CSV:**
- Text-based header with separator lines
- Contains:
  - "ESTIMATE REVIEW PRO - CONFIDENTIAL REPORT"
  - Claim number, Property address
  - Date of loss, Report ID, Report date
  - "FOR CLIENT USE ONLY - DO NOT DISTRIBUTE"

### 3. Footer Watermarks (All Formats)

**PDF/HTML:**
- Standard footer with confidentiality notice
- Additional claim information line:
  - Claim number | Property address
- Page numbers

**Excel:**
- Red confidential notice box
- Contains:
  - "CONFIDENTIAL - FOR CLIENT USE ONLY"
  - Claim number | Property address | Report ID
  - Legal disclaimer

**CSV:**
- Text-based footer with separator lines
- Contains:
  - "CONFIDENTIAL REPORT - END OF DOCUMENT"
  - Claim | Property | Report ID | Date
  - Legal disclaimer
  - Company name

---

## 📄 Format-Specific Implementation

### PDF/HTML Export

**Watermark Layers (5 layers):**

1. **Diagonal Background Watermark**
```css
position: fixed;
top: 50%;
left: 50%;
transform: translate(-50%, -50%) rotate(-45deg);
font-size: 72px;
opacity: 0.08;
z-index: 0;
```
Text: `{claim_number} - CONFIDENTIAL`

2. **Secondary Address Watermark**
```css
position: fixed;
top: 60%;
left: 50%;
transform: translate(-50%, -50%) rotate(-45deg);
font-size: 24px;
opacity: 0.06;
z-index: 0;
```
Text: `{property_address}`

3. **Top-Right Corner**
```css
position: fixed;
top: 10px;
right: 10px;
font-size: 10px;
opacity: 0.3;
z-index: 1000;
```
Text: `CLAIM: {claim_number}\nCONFIDENTIAL`

4. **Bottom Center**
```css
position: fixed;
bottom: 10px;
left: 50%;
transform: translateX(-50%);
font-size: 9px;
opacity: 0.3;
z-index: 1000;
```
Text: `{claim_number} | {property_address} | Estimate Review Pro`

5. **Header Section**
- Blue gradient box at top
- Contains full claim information table
- Fully opaque and prominent

**Print Behavior:**
- All watermarks use `print-color-adjust: exact` to ensure they print
- Fixed position watermarks appear on every printed page
- Content has higher z-index to appear above watermarks

### Excel Export

**Watermark Sections (3 sections):**

1. **Header Section**
```html
<div class="watermark-header">
  <h1>ESTIMATE REVIEW PRO - CONFIDENTIAL</h1>
  <p>Professional Estimate Analysis Report</p>
</div>
```
- Blue background (#1e3a8a)
- White text
- Centered

2. **Claim Information Box**
```html
<div class="watermark-info">
  <table>
    CLAIM NUMBER: {claim_number} | REPORT ID: {report_id}
    PROPERTY: {address}
    DATE OF LOSS: {date} | REPORT DATE: {date}
  </table>
</div>
```
- Light blue background (#eff6ff)
- Blue border (#2563eb)
- Prominent placement before data

3. **Footer Section**
```html
<div class="confidential-notice">
  ⚠️ CONFIDENTIAL - FOR CLIENT USE ONLY ⚠️
  CLAIM: {claim} | PROPERTY: {address} | REPORT ID: {id}
  [Legal disclaimer]
</div>
```
- Red background (#fee2e2)
- Red border (#dc2626)
- Bold text
- At end of document

### CSV Export

**Watermark Sections (2 sections):**

1. **Header Watermark**
```csv
=================================================================
ESTIMATE REVIEW PRO - CONFIDENTIAL REPORT
=================================================================
CLAIM NUMBER: {claim_number}
PROPERTY ADDRESS: {address}
DATE OF LOSS: {date}
REPORT ID: {report_id}
REPORT DATE: {date}
=================================================================
FOR CLIENT USE ONLY - DO NOT DISTRIBUTE
=================================================================
```

2. **Footer Watermark**
```csv
=================================================================
CONFIDENTIAL REPORT - END OF DOCUMENT
=================================================================
CLAIM: {claim} | PROPERTY: {address}
REPORT ID: {id} | DATE: {date}
=================================================================
This report is provided for informational purposes only.
Does not constitute legal, financial, or professional advice.
Estimate Review Pro - Professional Estimate Analysis
=================================================================
```

### Print View

**Watermark Elements (4 elements):**

1. **CSS Pseudo-element (::before)**
```css
body::before {
  content: "{claim_number} - {property_address}";
  /* Diagonal watermark styling */
}
```

2. **CSS Pseudo-element (::after)**
```css
body::after {
  content: "CONFIDENTIAL | Claim: {claim} | {address}";
  /* Top-right corner */
}
```

3. **Visible Info Bar**
- Blue bordered box at top of page
- Contains claim #, property, date of loss
- Prints on first page

4. **Footer on Every Page**
- Uses `@page` CSS rule
- Contains claim and property info
- Appears at bottom of every printed page

---

## 🎨 Visual Examples

### PDF Watermark Layout

```
┌─────────────────────────────────────────────────────────────────┐
│ CONFIDENTIAL | CLAIM: WD-2024-8847          [Top-right corner] │
│                                                                  │
│                                                                  │
│                    WD-2024-8847                                 │
│                   CONFIDENTIAL                                   │
│                  (Diagonal, large)                               │
│                                                                  │
│              1234 Oak Street, Springfield                        │
│                (Diagonal, smaller)                               │
│                                                                  │
│                                                                  │
│ [Report Content Here]                                            │
│                                                                  │
│                                                                  │
│ WD-2024-8847 | 1234 Oak St | Estimate Review Pro [Bottom center]│
└─────────────────────────────────────────────────────────────────┘
```

### Excel Watermark Layout

```
┌─────────────────────────────────────────────────────────────────┐
│ ╔═══════════════════════════════════════════════════════════╗   │
│ ║ ESTIMATE REVIEW PRO - CONFIDENTIAL                        ║   │
│ ║ Professional Estimate Analysis Report                     ║   │
│ ╚═══════════════════════════════════════════════════════════╝   │
│                                                                  │
│ ┌─────────────────────────────────────────────────────────┐     │
│ │ CLAIM NUMBER: WD-2024-8847    REPORT ID: 10000000       │     │
│ │ PROPERTY: 1234 Oak Street, Springfield, IL 62701        │     │
│ │ DATE OF LOSS: 01/15/2024      REPORT DATE: 12/15/2024   │     │
│ └─────────────────────────────────────────────────────────┘     │
│                                                                  │
│ [Report Data Tables]                                             │
│                                                                  │
│ ╔═══════════════════════════════════════════════════════════╗   │
│ ║ ⚠️ CONFIDENTIAL - FOR CLIENT USE ONLY ⚠️                  ║   │
│ ║ CLAIM: WD-2024-8847 | PROPERTY: 1234 Oak St | ID: 10000000║   │
│ ╚═══════════════════════════════════════════════════════════╝   │
└─────────────────────────────────────────────────────────────────┘
```

### CSV Watermark Layout

```
=================================================================
ESTIMATE REVIEW PRO - CONFIDENTIAL REPORT
=================================================================
CLAIM NUMBER: WD-2024-8847
PROPERTY ADDRESS: 1234 Oak Street, Springfield, IL 62701
DATE OF LOSS: 01/15/2024
REPORT ID: 10000000-0000-0000-0000-000000000001
REPORT DATE: 12/15/2024
=================================================================
FOR CLIENT USE ONLY - DO NOT DISTRIBUTE
=================================================================

[Report Data]

=================================================================
CONFIDENTIAL REPORT - END OF DOCUMENT
=================================================================
CLAIM: WD-2024-8847 | PROPERTY: 1234 Oak Street, Springfield
REPORT ID: 10000000 | DATE: 12/15/2024
=================================================================
```

---

## 🔧 Technical Implementation

### PDF Generator (lib/pdf-generator.ts)

**Enhanced `generatePDFHTML()` function:**
```typescript
export function generatePDFHTML(
  headerData: PDFHeaderData,
  contentHTML: string,
  totalPages: number = 1
): string {
  // Create watermark text with claim information
  const watermarkText = headerData.claimNumber 
    ? `${headerData.claimNumber} - CONFIDENTIAL`
    : 'ESTIMATE REVIEW PRO - CONFIDENTIAL';
  
  const watermarkSubtext = headerData.propertyAddress 
    ? headerData.propertyAddress.substring(0, 50)
    : '';
  
  // Returns HTML with multiple watermark layers
}
```

**Enhanced `generatePDFFooter()` function:**
```typescript
export function generatePDFFooter(
  pageNumber: number, 
  totalPages: number,
  claimNumber?: string,
  propertyAddress?: string
): string {
  // Returns footer with claim information
}
```

### Export API (app/api/reports/[id]/export/route.ts)

**PDF Export:**
```typescript
const headerData = {
  reportId: report.id.substring(0, 8),
  dateReviewed: report.created_at,
  estimateName: report.estimate_name,
  claimNumber: propertyDetails.claim_number,
  propertyAddress: propertyDetails.address,
  dateOfLoss: propertyDetails.date_of_loss,
};

const html = generatePDFHTML(headerData, contentHTML, 1);
```

**Excel Export:**
```typescript
// Watermark header section
<div class="watermark-header">...</div>

// Claim information box
<div class="watermark-info">
  <table>
    CLAIM NUMBER | REPORT ID
    PROPERTY ADDRESS
    DATE OF LOSS | REPORT DATE
  </table>
</div>

// Content...

// Confidential footer
<div class="confidential-notice">...</div>
```

**CSV Export:**
```typescript
// Header watermark
csv += '=================================================================\n';
csv += 'ESTIMATE REVIEW PRO - CONFIDENTIAL REPORT\n';
csv += `CLAIM NUMBER: ${claim}\n`;
csv += `PROPERTY ADDRESS: ${address}\n`;
// ...

// Footer watermark
csv += '=================================================================\n';
csv += 'CONFIDENTIAL REPORT - END OF DOCUMENT\n';
csv += `CLAIM: ${claim} | PROPERTY: ${address}\n`;
// ...
```

### Report Detail Page (app/dashboard/reports/[id]/page.tsx)

**Visible Info Bar:**
```tsx
<div className="rounded-lg border-2 border-blue-500/40 bg-blue-500/5">
  <div className="flex items-center justify-between">
    <div>Claim: {claim_number}</div>
    <div>Property: {address}</div>
    <div>Date of Loss: {date}</div>
    <div>CONFIDENTIAL</div>
  </div>
</div>
```

**Print CSS Watermarks:**
```css
@media print {
  body::before {
    content: "{claim} - {address}";
    /* Diagonal watermark */
  }
  
  body::after {
    content: "CONFIDENTIAL | Claim: {claim} | {address}";
    /* Top-right corner */
  }
}
```

---

## 📊 Watermark Information Included

### Primary Information

✅ **Claim Number**
- Appears in all watermarks
- Most prominent identifier
- Example: `WD-2024-8847`

✅ **Property Address**
- Appears in most watermarks
- Identifies specific property
- Truncated if too long (50 chars max for diagonal)
- Example: `1234 Oak Street, Springfield, IL 62701`

✅ **Date of Loss**
- Appears in headers and info bars
- Critical for claim identification
- Example: `01/15/2024`

### Secondary Information

✅ **Report ID**
- Short version (8 chars) in most places
- Full UUID in CSV header
- Example: `10000000`

✅ **Report Date**
- When analysis was performed
- Example: `12/15/2024`

✅ **Adjuster Name** (in main content)
- Appears in property information section
- Example: `Sarah Mitchell`

✅ **Estimate Name**
- Full estimate title
- Example: `Johnson Residence - Water Damage Claim #WD-2024-8847`

---

## 🎨 Styling & Appearance

### Color Coding

**Confidential Notices:**
- Red text: `#dc2626`
- Red background: `#fee2e2`
- Red border: `#dc2626`

**Claim Information:**
- Blue text: `#2563eb`
- Blue background: `#eff6ff`
- Blue border: `#2563eb`

**Watermarks:**
- Blue semi-transparent: `rgba(37, 99, 235, 0.08)`
- Ensures readability while maintaining presence

### Typography

**Large Watermarks:**
- Font size: 72px
- Font weight: Bold
- Transform: Rotate -45deg

**Small Watermarks:**
- Font size: 9-10px
- Font weight: 600 (semi-bold)
- No transform

**Headers:**
- Font size: 16-28px
- Font weight: Bold
- Color: White on blue background

---

## 🖨️ Print Behavior

### What Prints

✅ **All watermarks print** - Using `print-color-adjust: exact`
✅ **Claim info bar prints** - Visible at top of first page
✅ **Diagonal watermarks print** - On every page
✅ **Corner watermarks print** - On every page
✅ **Footer with claim info prints** - On every page

### What Doesn't Print

❌ **Navigation menus** - Hidden with `display: none`
❌ **Export buttons** - Hidden with `display: none`
❌ **Dashboard elements** - Hidden with `display: none`

### Print Optimization

**Colors adjusted:**
- Dark backgrounds → White
- Light text → Black
- Borders → Light gray
- Watermarks → Maintain color (exact print)

**Layout adjusted:**
- Sections avoid page breaks
- Tables stay together
- Proper margins for printing

---

## 🔒 Security Features

### Confidentiality Marking

**Every export includes:**
- ✅ "CONFIDENTIAL" text prominently displayed
- ✅ "For Client Use Only" designation
- ✅ Legal disclaimer about advice
- ✅ Company branding

### Traceability

**Every export includes:**
- ✅ Unique Report ID
- ✅ Claim number
- ✅ Property address
- ✅ Date of loss
- ✅ Report generation date

**Benefits:**
- Easy to identify which claim
- Prevents document mix-ups
- Enables audit trail
- Facilitates proper filing

### Distribution Control

**Watermarks indicate:**
- Document is confidential
- Intended for specific client only
- Should not be redistributed
- Company ownership/branding

---

## 📋 Watermark Content Rules

### Claim Number

**Format:** Free text as provided in estimate
**Examples:**
- `WD-2024-8847` (Water Damage)
- `FD-2024-1234` (Fire Damage)
- `HD-2024-5678` (Hail Damage)

**Fallback:** If no claim number, uses "N/A" or "CONFIDENTIAL"

### Property Address

**Format:** Full address as provided
**Max length:** 50 characters for diagonal watermark
**Examples:**
- `1234 Oak Street, Springfield, IL 62701`
- `567 Main Ave, Unit 3B, Chicago, IL 60601`

**Truncation:** Long addresses truncated with `...` if needed

### Date of Loss

**Format:** MM/DD/YYYY or as provided
**Examples:**
- `01/15/2024`
- `2024-01-15` (ISO format)

**Fallback:** "N/A" if not provided

### Report ID

**Format:** 
- Short: First 8 characters of UUID (`10000000`)
- Full: Complete UUID for CSV header

**Usage:**
- Short version in visible watermarks
- Full version in CSV header for traceability

---

## 🎯 Use Cases

### For Homeowners

**Scenario:** Sending report to insurance adjuster

**Watermark benefits:**
- ✅ Clearly identifies which claim
- ✅ Shows professionalism
- ✅ Prevents confusion with other claims
- ✅ Marks as confidential

### For Public Adjusters

**Scenario:** Managing multiple client claims

**Watermark benefits:**
- ✅ Easy to identify which client/claim
- ✅ Prevents document mix-ups
- ✅ Professional branding
- ✅ Audit trail for compliance

### For Contractors

**Scenario:** Creating supplement estimates

**Watermark benefits:**
- ✅ Links analysis to specific project
- ✅ Maintains document integrity
- ✅ Professional appearance
- ✅ Clear ownership

### For Insurance Companies

**Scenario:** Quality control and auditing

**Watermark benefits:**
- ✅ Traceability to original claim
- ✅ Prevents unauthorized distribution
- ✅ Audit trail
- ✅ Compliance documentation

---

## 🧪 Testing Watermarks

### Visual Testing

**PDF Export:**
1. Export report as PDF
2. Check for diagonal watermark (visible but not intrusive)
3. Check top-right corner watermark
4. Check bottom center watermark
5. Verify claim info in header
6. Verify claim info in footer
7. Print to PDF and verify watermarks persist

**Excel Export:**
1. Export report as Excel
2. Open in Excel or Google Sheets
3. Check blue header section
4. Check claim information box
5. Scroll to bottom and check red confidential notice
6. Verify claim number and address visible
7. Print and verify watermarks appear

**CSV Export:**
1. Export report as CSV
2. Open in text editor
3. Check header section (first 10 lines)
4. Scroll to bottom and check footer section
5. Verify claim number and address in both places
6. Open in Excel and verify formatting preserved

**Print Function:**
1. Click Print button
2. Check print preview
3. Verify diagonal watermark visible
4. Verify top-right corner text
5. Verify info bar at top
6. Verify footer on each page
7. Print test page and verify all watermarks appear

### Content Testing

**Verify all fields populated:**
- [ ] Claim number appears correctly
- [ ] Property address appears correctly
- [ ] Date of loss appears correctly
- [ ] Report ID appears correctly
- [ ] Report date appears correctly
- [ ] All watermarks use correct data

**Test edge cases:**
- [ ] Missing claim number (uses "N/A")
- [ ] Missing property address (uses "N/A")
- [ ] Very long property address (truncates properly)
- [ ] Special characters in address (escapes properly)
- [ ] International addresses (displays correctly)

---

## 🛡️ Security Best Practices

### Document Handling

**When exporting:**
1. ✅ Verify claim information is correct
2. ✅ Check recipient has authorization
3. ✅ Use secure transmission (encrypted email, secure portal)
4. ✅ Track who received exports

**When printing:**
1. ✅ Use secure printer
2. ✅ Collect prints immediately
3. ✅ Store in secure location
4. ✅ Shred when no longer needed

**When sharing:**
1. ✅ Verify recipient identity
2. ✅ Use password-protected files if possible
3. ✅ Include transmission notice
4. ✅ Log distribution

### Compliance

**Watermarks help with:**
- ✅ HIPAA compliance (if medical info present)
- ✅ Privacy regulations
- ✅ Professional liability protection
- ✅ Audit requirements
- ✅ Chain of custody

---

## 📈 Benefits

### For Business

**Professionalism:**
- Branded documents
- Consistent appearance
- Quality presentation

**Security:**
- Clear confidentiality marking
- Traceability
- Distribution control

**Compliance:**
- Meets industry standards
- Audit trail
- Legal protection

### For Users

**Clarity:**
- Easy to identify which claim
- No confusion with other documents
- Clear ownership

**Confidence:**
- Professional appearance
- Legitimate documentation
- Trustworthy source

**Convenience:**
- All info on document
- No need to reference separately
- Easy filing and organization

---

## 🚀 Future Enhancements

### Planned Features

- [ ] **Custom watermarks** - User-defined text
- [ ] **Company logos** - Upload and include in watermarks
- [ ] **QR codes** - Link to online report
- [ ] **Barcodes** - For automated filing systems
- [ ] **Digital signatures** - Cryptographic verification
- [ ] **Watermark templates** - Multiple style options
- [ ] **Dynamic opacity** - User-adjustable transparency
- [ ] **Multi-language** - Watermarks in different languages

### Technical Improvements

- [ ] **Server-side rendering** - Better watermark quality
- [ ] **Image watermarks** - Logo overlays
- [ ] **PDF metadata** - Embed claim info in PDF properties
- [ ] **Encryption** - Password-protected exports
- [ ] **Access tracking** - Log who opened exports
- [ ] **Expiration dates** - Time-limited access

---

## 📚 Related Documentation

- [Export Features Guide](EXPORT_FEATURES.md) - Complete export documentation
- [Export Quick Start](../EXPORT_QUICK_START.md) - User quick reference
- [PDF Generator](../lib/pdf-generator.ts) - Source code
- [Export API](../app/api/reports/[id]/export/route.ts) - API implementation

---

## ✅ Watermarking Checklist

### Implementation
- [x] PDF diagonal watermark with claim info
- [x] PDF secondary watermark with address
- [x] PDF corner watermarks (top-right, bottom-center)
- [x] PDF header with claim information
- [x] PDF footer with claim information
- [x] Excel header section with claim info
- [x] Excel claim information box
- [x] Excel confidential footer
- [x] CSV header watermark
- [x] CSV footer watermark
- [x] Print CSS watermarks
- [x] Print visible info bar
- [x] All watermarks use actual claim data

### Testing
- [ ] Visual verification of all formats
- [ ] Print testing (watermarks appear)
- [ ] Edge cases (missing data)
- [ ] Special characters handling
- [ ] Multiple browsers
- [ ] Mobile devices

---

## 🎉 Summary

**Watermarking Coverage:**
- ✅ **PDF:** 5 watermark layers with claim info
- ✅ **Excel:** 3 watermark sections with claim info
- ✅ **CSV:** Header and footer with claim info
- ✅ **Print:** 4 watermark elements with claim info

**Information Included:**
- ✅ Claim number (all formats)
- ✅ Property address (all formats)
- ✅ Date of loss (all formats)
- ✅ Report ID (all formats)
- ✅ Report date (all formats)
- ✅ Confidentiality notices (all formats)

**Status:** ✅ **FULLY IMPLEMENTED**

All exported reports are now comprehensively watermarked with claim and project information, ensuring security, traceability, and professionalism.

---

**Last Updated:** February 26, 2026
**Version:** 1.0.0
