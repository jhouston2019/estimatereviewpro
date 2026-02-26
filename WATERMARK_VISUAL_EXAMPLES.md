# 🎨 Watermark Visual Examples

**See exactly what watermarks look like in each export format**

---

## 📄 PDF/HTML Export

### Full Page View

```
┌─────────────────────────────────────────────────────────────────┐
│ CONFIDENTIAL | CLAIM: WD-2024-8847                [Top-right]  │
│                                                                  │
│ ╔═══════════════════════════════════════════════════════════╗   │
│ ║  ESTIMATE REVIEW PRO                                      ║   │
│ ║  Professional Estimate Analysis Report                    ║   │
│ ║                                                           ║   │
│ ║  Report ID: 10000000    Date: December 15, 2024          ║   │
│ ║                                                           ║   │
│ ║  Claim Information                                        ║   │
│ ║  Claim Number: WD-2024-8847                               ║   │
│ ║  Property: 1234 Oak Street, Springfield, IL 62701        ║   │
│ ║  Date of Loss: 01/15/2024                                 ║   │
│ ╚═══════════════════════════════════════════════════════════╝   │
│                                                                  │
│                  WD-2024-8847 - CONFIDENTIAL                    │
│                     (Diagonal, 72px)                             │
│                                                                  │
│            1234 Oak Street, Springfield, IL                      │
│                  (Diagonal, 24px)                                │
│                                                                  │
│  Executive Summary                                               │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Risk Level: HIGH                                         │   │
│  │ Estimate Value: $28,450                                  │   │
│  │ Estimated Missing Value: $5,200 - $8,900                 │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
│  [More content sections...]                                      │
│                                                                  │
│  ──────────────────────────────────────────────────────────     │
│  CONFIDENTIAL - For Client Use Only                             │
│  CLAIM: WD-2024-8847 | PROPERTY: 1234 Oak Street                │
│  Estimate Review Pro                              Page 1 of 3   │
│                                                                  │
│ WD-2024-8847 | 1234 Oak St | Estimate Review Pro [Bottom]       │
└─────────────────────────────────────────────────────────────────┘
```

### Watermark Detail View

**Diagonal Watermark (Center):**
```
        WD-2024-8847 - CONFIDENTIAL
       /
      /
     /
    /  (Rotated -45 degrees, semi-transparent)
   /
```

**Secondary Watermark (Below center):**
```
           1234 Oak Street, Springfield, IL
          /
         /  (Rotated -45 degrees, lighter)
        /
```

---

## 📊 Excel Export

### Full Spreadsheet View

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
│ Property Information                                             │
│ ┌────────────────────┬──────────────────────────────────┐       │
│ │ Estimate Name      │ Johnson Residence - Water Damage │       │
│ │ Address            │ 1234 Oak Street, Springfield     │       │
│ │ Claim Number       │ WD-2024-8847                     │       │
│ │ Risk Level         │ HIGH                             │       │
│ └────────────────────┴──────────────────────────────────┘       │
│                                                                  │
│ Missing Items                                                    │
│ ┌──────────┬──────────┬──────────────────┬─────────────┐       │
│ │ Severity │ Category │ Description      │ Cost Impact │       │
│ ├──────────┼──────────┼──────────────────┼─────────────┤       │
│ │ error    │ Drying   │ No moisture...   │ $200-$400   │       │
│ └──────────┴──────────┴──────────────────┴─────────────┘       │
│                                                                  │
│ [More data tables...]                                            │
│                                                                  │
│ ╔═══════════════════════════════════════════════════════════╗   │
│ ║ ⚠️ CONFIDENTIAL - FOR CLIENT USE ONLY ⚠️                  ║   │
│ ║ CLAIM: WD-2024-8847 | PROPERTY: 1234 Oak St | ID: 10000000║   │
│ ║ This report is provided for informational purposes only.  ║   │
│ ╚═══════════════════════════════════════════════════════════╝   │
└─────────────────────────────────────────────────────────────────┘
```

### Color Scheme

**Header (Blue):**
```
╔═══════════════════════════════════════╗
║ Background: #1e3a8a (Dark blue)      ║
║ Text: #ffffff (White)                ║
║ Font: Bold, centered                 ║
╚═══════════════════════════════════════╝
```

**Claim Info Box (Light Blue):**
```
┌─────────────────────────────────────┐
│ Background: #eff6ff (Light blue)    │
│ Border: #2563eb (Blue, 2px)         │
│ Text: #000000 (Black)               │
│ Font: Normal, table layout          │
└─────────────────────────────────────┘
```

**Footer (Red):**
```
╔═══════════════════════════════════════╗
║ Background: #fee2e2 (Light red)      ║
║ Border: #dc2626 (Red, 2px)           ║
║ Text: #dc2626 (Red)                  ║
║ Font: Bold, centered                 ║
╚═══════════════════════════════════════╝
```

---

## 📋 CSV Export

### Full File View

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

ESTIMATE REVIEW REPORT
Report ID,10000000-0000-0000-0000-000000000001
Estimate Name,Johnson Residence - Water Damage Claim #WD-2024-8847
Created,2024-12-15T10:30:00Z
Address,1234 Oak Street, Springfield, IL 62701
Claim Number,WD-2024-8847
Risk Level,HIGH
Estimate Value,28450.75
Missing Value Low,5200
Missing Value High,8900

MISSING ITEMS
Severity,Category,Description,Cost Impact,Justification
error,Drying & Dehumidification,No moisture mapping documented,$200-$400,...
warning,Demolition,Limited demolition scope,$300-$600,...

[More data sections...]

=================================================================
CONFIDENTIAL REPORT - END OF DOCUMENT
=================================================================
CLAIM: WD-2024-8847 | PROPERTY: 1234 Oak Street, Springfield
REPORT ID: 10000000 | DATE: 12/15/2024
=================================================================
This report is provided for informational purposes only.
Does not constitute legal, financial, or professional advice.
Estimate Review Pro - Professional Estimate Analysis
=================================================================
```

### Separator Lines

**Header separator:**
```
=================================================================
```
- 65 equal signs
- Creates clear visual boundary
- Easy to identify sections

**Footer separator:**
```
=================================================================
```
- Same style as header
- Bookends the document
- Professional appearance

---

## 🖨️ Print View

### Screen View (Before Print)

```
┌─────────────────────────────────────────────────────────────────┐
│ [Header Navigation]                                              │
│                                                                  │
│ ← Back to Reports                                                │
│                                                                  │
│ ┌─────────────────────────────────────────────────────────┐     │
│ │ Claim: WD-2024-8847  |  Property: 1234 Oak Street       │     │
│ │ Date of Loss: 01/15/2024  |  CONFIDENTIAL               │     │
│ └─────────────────────────────────────────────────────────┘     │
│                                                                  │
│ ╔═══════════════════════════════════════════════════════════╗   │
│ ║ Johnson Residence - Water Damage                          ║   │
│ ║ [PDF] [Excel] [CSV] [Print]              [HIGH RISK]     ║   │
│ ╚═══════════════════════════════════════════════════════════╝   │
│                                                                  │
│ [Report Content]                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Print Preview (After Clicking Print)

```
┌─────────────────────────────────────────────────────────────────┐
│ CONFIDENTIAL | Claim: WD-2024-8847 | 1234 Oak St [Top-right]   │
│                                                                  │
│ ┌─────────────────────────────────────────────────────────┐     │
│ │ Claim: WD-2024-8847  |  Property: 1234 Oak Street       │     │
│ │ Date of Loss: 01/15/2024  |  CONFIDENTIAL               │     │
│ └─────────────────────────────────────────────────────────┘     │
│                                                                  │
│              WD-2024-8847 - 1234 Oak Street                     │
│                   (Diagonal watermark)                           │
│                                                                  │
│ Johnson Residence - Water Damage                                 │
│                                                                  │
│ [Report Content - Navigation Hidden]                             │
│                                                                  │
│ ──────────────────────────────────────────────────────────      │
│ Page 1                                                           │
└─────────────────────────────────────────────────────────────────┘
```

**Note:** Navigation, buttons, and dark theme removed for printing

---

## 🎯 Watermark Placement Strategy

### PDF/HTML - Multi-Layer Approach

**Layer 1 (Background):** Diagonal watermarks
- Purpose: Prevent unauthorized copying
- Visibility: Subtle but present
- Coverage: Entire page

**Layer 2 (Corners):** Fixed position watermarks
- Purpose: Page identification
- Visibility: Small but readable
- Coverage: Every page

**Layer 3 (Content):** Header and footer
- Purpose: Official claim information
- Visibility: Fully visible
- Coverage: Top and bottom of document

### Excel - Section-Based Approach

**Section 1 (Top):** Header banner
- Purpose: Brand and confidentiality
- Visibility: Very prominent
- Placement: First thing user sees

**Section 2 (Before Data):** Claim info box
- Purpose: Claim identification
- Visibility: Prominent, color-coded
- Placement: Before any data tables

**Section 3 (Bottom):** Confidential footer
- Purpose: Legal protection
- Visibility: Very prominent (red)
- Placement: Last thing user sees

### CSV - Text-Based Approach

**Section 1 (Header):** Multi-line header
- Purpose: Claim identification and confidentiality
- Visibility: First 10 lines of file
- Format: Separator lines + data

**Section 2 (Footer):** Multi-line footer
- Purpose: End-of-document marker and legal
- Visibility: Last 8 lines of file
- Format: Separator lines + data

### Print - Hybrid Approach

**CSS Watermarks:** Background elements
- Purpose: Prevent unauthorized copying
- Visibility: Subtle on screen, visible when printed
- Coverage: Every page

**Visible Elements:** Info bar
- Purpose: Claim identification
- Visibility: Prominent on screen and print
- Coverage: First page

---

## 📐 Watermark Dimensions

### PDF Watermarks

**Diagonal Main:**
- Width: ~800px (depends on text length)
- Height: 72px
- Rotation: -45 degrees
- Position: Absolute center

**Diagonal Secondary:**
- Width: ~600px (depends on text length)
- Height: 24px
- Rotation: -45 degrees
- Position: Below center (60% from top)

**Corner (Top-Right):**
- Width: Auto (based on text)
- Height: ~30px (2 lines)
- Position: 10px from top, 10px from right

**Footer (Bottom-Center):**
- Width: Auto (based on text)
- Height: ~15px (1 line)
- Position: 10px from bottom, centered

### Excel Watermarks

**Header Section:**
- Width: 100% of page
- Height: ~80px
- Background: Full width blue bar

**Claim Info Box:**
- Width: 100% of page
- Height: ~60px
- Background: Light blue with border

**Footer Section:**
- Width: 100% of page
- Height: ~80px
- Background: Light red with border

### Print Watermarks

**Diagonal (CSS):**
- Font size: 48px (smaller than PDF for better readability)
- Opacity: 8%
- Coverage: Entire page

**Corner (CSS):**
- Font size: 9px
- Opacity: 40%
- Position: Top-right, fixed

**Info Bar:**
- Width: 100% of content area
- Height: ~50px
- Border: 2px blue

---

## 🎨 Color Palette

### Watermark Colors

**Blue (Primary):**
- Main: `#2563eb` (rgb(37, 99, 235))
- Light: `#eff6ff` (backgrounds)
- Dark: `#1e3a8a` (headers)
- Transparent: `rgba(37, 99, 235, 0.08)` (watermarks)

**Red (Confidential):**
- Main: `#dc2626` (rgb(220, 38, 38))
- Light: `#fee2e2` (backgrounds)
- Text: `#dc2626` (notices)

**Gray (Text):**
- Dark: `#1f2937` (main text)
- Medium: `#6b7280` (secondary text)
- Light: `#9ca3af` (tertiary text)

### Opacity Levels

**Watermarks:**
- Background diagonal: 8% (very subtle)
- Secondary diagonal: 6% (even more subtle)
- Corner fixed: 30% (readable but not intrusive)
- Footer fixed: 30% (readable but not intrusive)

**Content:**
- Headers: 100% (fully opaque)
- Info boxes: 100% (fully opaque)
- Footers: 100% (fully opaque)

---

## 📱 Responsive Watermarks

### Desktop (1920px)

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                  │
│              WD-2024-8847 - CONFIDENTIAL                        │
│                  (Full text visible)                             │
│                                                                  │
│        1234 Oak Street, Springfield, IL 62701                    │
│              (Full address visible)                              │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Tablet (768px)

```
┌──────────────────────────────────────────┐
│                                           │
│      WD-2024-8847 - CONFIDENTIAL         │
│         (Slightly smaller)                │
│                                           │
│   1234 Oak Street, Springfield, IL       │
│         (Address may wrap)                │
│                                           │
└──────────────────────────────────────────┘
```

### Mobile (375px)

```
┌────────────────────────┐
│                         │
│  WD-2024-8847          │
│  CONFIDENTIAL          │
│  (Stacked, smaller)    │
│                         │
│  1234 Oak Street       │
│  Springfield, IL       │
│  (Wrapped address)     │
│                         │
└────────────────────────┘
```

---

## 🔍 Watermark Readability

### Optimal Opacity Levels

**Background Watermarks:**
- Too light (< 5%): Not visible enough
- ✅ **Optimal (6-8%)**: Visible but not intrusive
- Too dark (> 10%): Interferes with content

**Corner Watermarks:**
- Too light (< 20%): Hard to read
- ✅ **Optimal (30-40%)**: Readable but subtle
- Too dark (> 50%): Too prominent

**Content Watermarks:**
- Always 100% opacity
- Fully readable
- Clearly visible

### Font Size Guidelines

**Diagonal Watermarks:**
- Too small (< 48px): Not visible enough
- ✅ **Optimal (72px)**: Visible across page
- Too large (> 100px): Overwhelming

**Corner Watermarks:**
- Too small (< 8px): Hard to read
- ✅ **Optimal (9-10px)**: Readable
- Too large (> 12px): Too prominent

**Header/Footer:**
- Standard document sizes (10-16px)
- Fully readable
- Professional appearance

---

## 🎯 Watermark Effectiveness

### What Makes a Good Watermark

✅ **Visible but not intrusive**
- Present on every page
- Doesn't interfere with content
- Easy to read when needed

✅ **Contains key information**
- Claim number (most important)
- Property address (for context)
- Confidentiality notice (for security)

✅ **Difficult to remove**
- Multiple layers
- Fixed positions
- CSS-based (not just text)

✅ **Professional appearance**
- Consistent styling
- Color-coded
- Proper typography

### What Our Watermarks Achieve

✅ **Security:** Multiple layers prevent unauthorized use
✅ **Traceability:** Claim number on every page
✅ **Professionalism:** Branded, consistent appearance
✅ **Compliance:** Legal notices and disclaimers
✅ **Usability:** Key info always visible

---

## 📊 Comparison: Before vs After

### Before Implementation

**PDF:**
```
┌─────────────────────────────────────────┐
│                                          │
│    ESTIMATE REVIEW PRO - CONFIDENTIAL   │
│         (Generic watermark)              │
│                                          │
│  [Report Content]                        │
│  (No claim identification)               │
│                                          │
└─────────────────────────────────────────┘
```

**Excel:**
```
┌─────────────────────────────────────────┐
│ Estimate Review Report                   │
│                                          │
│ [Data Tables]                            │
│ (No watermark, no claim info)            │
│                                          │
└─────────────────────────────────────────┘
```

**CSV:**
```
ESTIMATE REVIEW REPORT
Report ID,10000000
[Data]
(No watermark, minimal info)
```

### After Implementation

**PDF:**
```
┌─────────────────────────────────────────┐
│ CONFIDENTIAL | CLAIM: WD-2024-8847      │
│                                          │
│    WD-2024-8847 - CONFIDENTIAL          │
│    1234 Oak Street, Springfield         │
│         (Claim-specific)                 │
│                                          │
│  ╔════════════════════════════════════╗ │
│  ║ CLAIM: WD-2024-8847                ║ │
│  ║ PROPERTY: 1234 Oak Street          ║ │
│  ╚════════════════════════════════════╝ │
│                                          │
│  [Report Content]                        │
│                                          │
│ WD-2024-8847 | 1234 Oak St | ERP        │
└─────────────────────────────────────────┘
```

**Excel:**
```
┌─────────────────────────────────────────┐
│ ╔════════════════════════════════════╗  │
│ ║ ESTIMATE REVIEW PRO - CONFIDENTIAL ║  │
│ ╚════════════════════════════════════╝  │
│                                          │
│ ┌──────────────────────────────────┐    │
│ │ CLAIM: WD-2024-8847              │    │
│ │ PROPERTY: 1234 Oak Street        │    │
│ └──────────────────────────────────┘    │
│                                          │
│ [Data Tables]                            │
│                                          │
│ ╔════════════════════════════════════╗  │
│ ║ CONFIDENTIAL - CLAIM: WD-2024-8847║  │
│ ╚════════════════════════════════════╝  │
└─────────────────────────────────────────┘
```

**CSV:**
```
=================================================================
ESTIMATE REVIEW PRO - CONFIDENTIAL REPORT
=================================================================
CLAIM NUMBER: WD-2024-8847
PROPERTY ADDRESS: 1234 Oak Street, Springfield, IL 62701
=================================================================
FOR CLIENT USE ONLY - DO NOT DISTRIBUTE
=================================================================

[Data]

=================================================================
CONFIDENTIAL REPORT - END OF DOCUMENT
=================================================================
CLAIM: WD-2024-8847 | PROPERTY: 1234 Oak Street
=================================================================
```

---

## ✅ Summary

**Watermark Coverage:**
- ✅ **PDF:** 5 layers with claim info
- ✅ **Excel:** 3 sections with claim info
- ✅ **CSV:** Header and footer with claim info
- ✅ **Print:** 4 elements with claim info

**Information Displayed:**
- ✅ Claim number (all formats, multiple locations)
- ✅ Property address (all formats, multiple locations)
- ✅ Date of loss (headers and info bars)
- ✅ Report ID (all formats)
- ✅ Report date (all formats)
- ✅ Confidentiality notices (all formats)

**Visual Quality:**
- ✅ Professional appearance
- ✅ Subtle but effective
- ✅ Doesn't interfere with content
- ✅ Easy to identify claim

**Status:** ✅ **FULLY IMPLEMENTED**

---

**All exports are now comprehensively watermarked with claim and project information!** 🎉

---

**Last Updated:** February 26, 2026
**Version:** 1.0.0
