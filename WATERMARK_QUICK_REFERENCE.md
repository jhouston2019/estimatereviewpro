# 🔒 Watermark Quick Reference Card

**One-page reference for watermark implementation**

---

## 📊 Watermark Locations

### PDF Export
| Location | Content | Visibility |
|----------|---------|------------|
| **Center Diagonal** | `{CLAIM} - CONFIDENTIAL` | 8% opacity, 72px |
| **Secondary Diagonal** | `{PROPERTY_ADDRESS}` | 6% opacity, 24px |
| **Top-Right Corner** | `CLAIM: {CLAIM}\nCONFIDENTIAL` | 30% opacity, 10px |
| **Bottom Center** | `{CLAIM} \| {PROPERTY} \| ERP` | 30% opacity, 9px |
| **Footer Content** | `CLAIM: {CLAIM} \| PROPERTY: {PROPERTY}` | 100% opacity, 10px |

### Excel Export
| Location | Content | Style |
|----------|---------|-------|
| **Header Section** | `ESTIMATE REVIEW PRO - CONFIDENTIAL` | Blue background, white text |
| **Claim Info Box** | Claim #, Property, Dates | Light blue box, before data |
| **Footer Section** | Confidential notice + Claim info | Red box, after data |

### CSV Export
| Location | Content | Format |
|----------|---------|--------|
| **Header (Lines 1-10)** | Claim #, Property, Dates, Confidential | Separator lines + text |
| **Footer (Last 8 lines)** | Claim #, Property, Legal disclaimer | Separator lines + text |

### Print View
| Location | Content | Method |
|----------|---------|--------|
| **Diagonal** | `{CLAIM} - {ADDRESS}` | CSS ::before pseudo-element |
| **Top-Right** | `CONFIDENTIAL \| Claim: {CLAIM}` | CSS ::after pseudo-element |
| **Info Bar** | Claim, Property, Date, Confidential | Visible div element |
| **Footer** | Claim + Property | Standard footer |

---

## 🎯 Information Included

### Primary Data
- ✅ **Claim Number** - Example: `WD-2024-8847`
- ✅ **Property Address** - Example: `1234 Oak Street, Springfield, IL 62701`
- ✅ **Date of Loss** - Example: `01/15/2024`

### Secondary Data
- ✅ **Report ID** - Example: `10000000` (short) or full UUID
- ✅ **Report Date** - Example: `12/15/2024`
- ✅ **Confidentiality Notice** - "CONFIDENTIAL - FOR CLIENT USE ONLY"

---

## 🎨 Styling Reference

### Colors
- **Blue (Primary):** `#2563eb` - Watermarks, headers
- **Red (Confidential):** `#dc2626` - Notices, warnings
- **Gray (Text):** `#1f2937` - Main content

### Opacity
- **Background watermarks:** 6-8% (subtle)
- **Corner watermarks:** 30% (readable)
- **Content watermarks:** 100% (fully visible)

### Typography
- **Large watermarks:** 72px, Bold
- **Small watermarks:** 9-10px, Semi-bold
- **Headers:** 16-28px, Bold

---

## 🔧 Implementation Files

### Modified Files
1. `lib/pdf-generator.ts` - Enhanced watermarking
2. `app/api/reports/[id]/export/route.ts` - All format watermarks
3. `app/dashboard/reports/[id]/page.tsx` - Print watermarks + info bar

### Key Functions
- `generatePDFHTML()` - Creates PDF with watermarks
- `generatePDFFooter()` - Footer with claim info
- `generatePDFExport()` - PDF generation
- `generateExcelExport()` - Excel with watermarks
- `generateCSVExport()` - CSV with watermarks

---

## ✅ Quick Testing

### Test PDF
```
1. Click [PDF] button
2. Look for: Diagonal "WD-2024-8847 - CONFIDENTIAL"
3. Look for: Address below diagonal
4. Look for: Top-right corner claim
5. Look for: Bottom center claim
6. Print to PDF and verify watermarks persist
```

### Test Excel
```
1. Click [Excel] button
2. Look for: Blue header "CONFIDENTIAL"
3. Look for: Claim info box (blue) before data
4. Look for: Red footer with claim info
5. Print and verify watermarks appear
```

### Test CSV
```
1. Click [CSV] button
2. Open in text editor
3. Look for: Header (lines 1-10) with claim
4. Look for: Footer (last 8 lines) with claim
5. Verify separator lines (=====)
```

### Test Print
```
1. Click [Print] button
2. Check print preview
3. Look for: Diagonal watermark with claim
4. Look for: Top-right corner text
5. Look for: Info bar at top
6. Verify navigation hidden
```

---

## 🎯 Use Cases

| User Type | Best Format | Why |
|-----------|-------------|-----|
| **Homeowner** | PDF | Professional, easy to email |
| **Public Adjuster** | Excel | Data analysis, calculations |
| **Contractor** | CSV | Import to estimating software |
| **Insurance Co** | All formats | Different use cases |

---

## 🔒 Security Features

✅ **Authentication** - Login required for all exports
✅ **Authorization** - RLS policies enforced
✅ **Confidentiality** - Marked on all documents
✅ **Traceability** - Claim number on every page
✅ **Legal Protection** - Disclaimers included

---

## 📚 Documentation

- **Quick Start:** `EXPORT_QUICK_START.md`
- **Complete Guide:** `docs/EXPORT_FEATURES.md`
- **Watermark Details:** `docs/WATERMARKING_SYSTEM.md`
- **Visual Examples:** `WATERMARK_VISUAL_EXAMPLES.md`

---

## ✅ Status

**Implementation:** ✅ COMPLETE
**Testing:** ⏳ RECOMMENDED
**Deployment:** ⏳ READY
**Documentation:** ✅ COMPLETE

---

**All outputs are watermarked with claim and project information!** 🎉

---

**Version:** 1.0.0 | **Date:** February 26, 2026
