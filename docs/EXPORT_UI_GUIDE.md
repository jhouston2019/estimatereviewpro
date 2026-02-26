# 🎨 Export UI Guide

**Visual guide showing exactly where to find and use export features**

---

## 📍 Location 1: Report Detail Page

### Top-Right Export Controls

When viewing any report detail page, you'll see export buttons in the top-right corner:

```
┌────────────────────────────────────────────────────────────────┐
│  Johnson Residence - Water Damage Claim #WD-2024-8847          │
│  Claim #WD-2024-8847                                           │
│                                                                 │
│  [PDF] [Excel] [CSV] [Print]           [HIGH RISK]            │
└────────────────────────────────────────────────────────────────┘
```

**Button Details:**

| Button | Icon | Color | Action |
|--------|------|-------|--------|
| **PDF** | 📄 | Blue | Opens formatted HTML in new tab |
| **Excel** | 📊 | Green | Downloads .xls spreadsheet |
| **CSV** | 📋 | Yellow | Downloads .csv data file |
| **Print** | 🖨️ | Purple | Opens browser print dialog |

### Visual Hierarchy

```
┌─────────────────────────────────────────────────────────────────┐
│ Header with Logo and Navigation                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ← Back to Reports                                              │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                                                           │  │
│  │  Report Title                                             │  │
│  │  Claim Number                                             │  │
│  │                                                           │  │
│  │  [PDF] [Excel] [CSV] [Print]    [RISK BADGE]            │  │
│  │                                                           │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
│  [Report Content Sections Below]                                │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📍 Location 2: Reports List Page

### Report Card Export Buttons

Each report card in the list has export buttons at the bottom:

```
┌────────────────────────────────────────────────────────────┐
│  Johnson Residence - Water Damage        [HIGH]            │
│  Claim #WD-2024-8847                                       │
│                                                            │
│  Estimate Value:    $28,450                                │
│  Missing Scope:     $5,200 - $8,900                        │
│  Gap Percentage:    18% - 31%                              │
│                                                            │
│  🔴 3  🟡 5  🔵 2                95% confidence            │
│  ────────────────────────────────────────────────────────  │
│  Dec 15, 2024          [View] [PDF] [Excel]               │
└────────────────────────────────────────────────────────────┘
```

**Button Details:**

| Button | Action |
|--------|--------|
| **View** | Navigate to full report detail page |
| **PDF** | Download PDF without leaving list page |
| **Excel** | Download Excel without leaving list page |

### Grid Layout

```
┌─────────────────────────────────────────────────────────────────┐
│ Reports Dashboard                                                │
│                                                    [New Analysis] │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                      │
│  │ Report 1 │  │ Report 2 │  │ Report 3 │                      │
│  │          │  │          │  │          │                      │
│  │ [View]   │  │ [View]   │  │ [View]   │                      │
│  │ [PDF]    │  │ [PDF]    │  │ [PDF]    │                      │
│  │ [Excel]  │  │ [Excel]  │  │ [Excel]  │                      │
│  └──────────┘  └──────────┘  └──────────┘                      │
│                                                                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                      │
│  │ Report 4 │  │ Report 5 │  │ Report 6 │                      │
│  │          │  │          │  │          │                      │
│  │ [View]   │  │ [View]   │  │ [View]   │                      │
│  │ [PDF]    │  │ [PDF]    │  │ [PDF]    │                      │
│  │ [Excel]  │  │ [Excel]  │  │ [Excel]  │                      │
│  └──────────┘  └──────────┘  └──────────┘                      │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🎨 Button Styling

### Default State
```
┌─────────────────────────────────────────┐
│  [PDF]  [Excel]  [CSV]  [Print]         │
│   ↑       ↑       ↑       ↑             │
│  Blue   Green  Yellow  Purple           │
└─────────────────────────────────────────┘
```

### Hover State
```
┌─────────────────────────────────────────┐
│  [PDF]  [Excel]  [CSV]  [Print]         │
│   ↑                                      │
│  Brighter blue, glowing effect          │
└─────────────────────────────────────────┘
```

### Button Anatomy
```
┌──────────────────────┐
│  [Icon] Label        │
│   📄    PDF          │
└──────────────────────┘
    ↑      ↑
   SVG   Text
   Icon  Label
```

---

## 🖱️ User Interactions

### Clicking PDF Button

**What happens:**
1. User clicks "PDF" button
2. New browser tab opens
3. Formatted HTML report displays
4. User can:
   - View in browser
   - Use Ctrl+P / Cmd+P to print
   - Use browser "Save as PDF" function
   - Close tab when done

**Visual Flow:**
```
[Click PDF] → [New Tab Opens] → [Formatted Report] → [Print/Save]
```

### Clicking Excel Button

**What happens:**
1. User clicks "Excel" button
2. Browser shows download prompt
3. File downloads as `estimate-review-XXXXXXXX.xls`
4. User opens file in Excel or Google Sheets

**Visual Flow:**
```
[Click Excel] → [Download Starts] → [File Saved] → [Open in Excel]
```

### Clicking CSV Button

**What happens:**
1. User clicks "CSV" button
2. Browser shows download prompt
3. File downloads as `estimate-review-XXXXXXXX.csv`
4. User opens file in Excel, text editor, or imports to system

**Visual Flow:**
```
[Click CSV] → [Download Starts] → [File Saved] → [Open/Import]
```

### Clicking Print Button

**What happens:**
1. User clicks "Print" button
2. Browser print dialog opens immediately
3. User sees print preview
4. User can:
   - Select printer
   - Choose "Save as PDF"
   - Adjust settings (margins, orientation, etc.)
   - Print or cancel

**Visual Flow:**
```
[Click Print] → [Print Dialog] → [Preview] → [Print/Save/Cancel]
```

---

## 📱 Responsive Design

### Desktop (1920px)
```
┌────────────────────────────────────────────────────────────┐
│  Report Title                                               │
│  [PDF] [Excel] [CSV] [Print]              [RISK BADGE]     │
└────────────────────────────────────────────────────────────┘
```

### Laptop (1366px)
```
┌────────────────────────────────────────────────────────────┐
│  Report Title                                               │
│  [PDF] [Excel] [CSV] [Print]        [RISK BADGE]           │
└────────────────────────────────────────────────────────────┘
```

### Tablet (768px)
```
┌────────────────────────────────────────┐
│  Report Title                           │
│  [PDF] [Excel] [CSV] [Print]           │
│  [RISK BADGE]                           │
└────────────────────────────────────────┘
```

### Mobile (375px)
```
┌──────────────────────────┐
│  Report Title             │
│  [PDF] [Excel]            │
│  [CSV] [Print]            │
│  [RISK BADGE]             │
└──────────────────────────┘
```

---

## 🎯 Visual Feedback

### Loading States

**During Export:**
```
[PDF] → [PDF ⏳] → [PDF ✓]
```

**Download Progress:**
```
Browser shows download bar at bottom:
┌────────────────────────────────────────┐
│ ⬇️ estimate-review-10000000.xls        │
│ [▓▓▓▓▓▓▓▓▓▓░░░░░░] 65%                │
└────────────────────────────────────────┘
```

### Success Indicators

**PDF Opened:**
```
New tab with formatted report
Header shows: "Estimate Review Report - WD-2024-8847"
```

**Excel Downloaded:**
```
Browser notification:
"estimate-review-10000000.xls downloaded"
```

**CSV Downloaded:**
```
Browser notification:
"estimate-review-10000000.csv downloaded"
```

**Print Dialog Opened:**
```
Native OS print dialog appears
Shows print preview on right side
```

---

## 🎨 Color Scheme

### Button Colors

**PDF (Blue):**
- Default: `border-slate-700 text-slate-200`
- Hover: `border-blue-500 text-blue-300 bg-blue-500/10`

**Excel (Green):**
- Default: `border-slate-700 text-slate-200`
- Hover: `border-green-500 text-green-300 bg-green-500/10`

**CSV (Yellow):**
- Default: `border-slate-700 text-slate-200`
- Hover: `border-yellow-500 text-yellow-300 bg-yellow-500/10`

**Print (Purple):**
- Default: `border-slate-700 text-slate-200`
- Hover: `border-purple-500 text-purple-300 bg-purple-500/10`

### Dark Theme (Current)
```
Background: slate-950 (very dark blue-gray)
Text: slate-50 to slate-400 (light gray shades)
Borders: slate-700 to slate-800 (medium gray)
Accents: Blue, green, yellow, purple
```

---

## 🖼️ Example Screenshots

### Report Detail Page - Export Section
```
┌─────────────────────────────────────────────────────────────────┐
│                                                                  │
│  Johnson Residence - Water Damage Claim #WD-2024-8847           │
│  Claim #WD-2024-8847                                            │
│                                                                  │
│  ┌────┐ ┌────┐ ┌────┐ ┌────┐                ┌──────────┐       │
│  │ 📄 │ │ 📊 │ │ 📋 │ │ 🖨️ │                │   HIGH   │       │
│  │PDF │ │XLS │ │CSV │ │PRT │                │   RISK   │       │
│  └────┘ └────┘ └────┘ └────┘                └──────────┘       │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Reports List - Card with Export Buttons
```
┌─────────────────────────────────────────────────────────────────┐
│  Johnson Residence - Water Damage                    [HIGH]     │
│  Claim #WD-2024-8847                                            │
│                                                                  │
│  Estimate Value:    $28,450                                     │
│  Missing Scope:     $5,200 - $8,900                             │
│  Gap Percentage:    18% - 31%                                   │
│                                                                  │
│  🔴 3  🟡 5  🔵 2                        95% confidence         │
│  ─────────────────────────────────────────────────────────────  │
│  Dec 15, 2024                                                   │
│                                                                  │
│  ┌──────┐ ┌────┐ ┌────┐                                        │
│  │ View │ │PDF │ │XLS │                                        │
│  └──────┘ └────┘ └────┘                                        │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔍 Accessibility

### Keyboard Navigation
- **Tab** - Navigate between buttons
- **Enter/Space** - Activate button
- **Ctrl+P / Cmd+P** - Quick print (anywhere on page)

### Screen Reader Support
- All buttons have descriptive labels
- Icons are decorative (aria-hidden)
- Tooltips provide additional context
- Download links announce file type

### Tooltips
```
Hover over button → Tooltip appears:
┌────────────────────────┐
│  Download as PDF/HTML  │
└────────────────────────┘
```

---

## 💡 Pro Tips

### Quick Actions
- **Right-click PDF button** → "Open in new tab" or "Save link as"
- **Ctrl+Click (Cmd+Click)** → Open in background tab
- **Shift+Click** → Download directly without opening

### Keyboard Shortcuts
- **Ctrl+P / Cmd+P** → Print current page
- **Ctrl+S / Cmd+S** → Save page (when PDF is open)

### Browser Features
- **Print Preview** → See before printing
- **Save as PDF** → Available in all modern browsers
- **Download Manager** → View all downloaded exports

---

## 📊 What Users See

### PDF Export Result
```
┌─────────────────────────────────────────────────────────────────┐
│ ╔═══════════════════════════════════════════════════════════╗   │
│ ║  ESTIMATE REVIEW PRO                                      ║   │
│ ║  Professional Estimate Analysis Report                    ║   │
│ ║                                                           ║   │
│ ║  Report ID: 10000000    Date: December 15, 2024          ║   │
│ ║                                                           ║   │
│ ║  Claim Information                                        ║   │
│ ║  Claim Number: WD-2024-8847                               ║   │
│ ║  Property: 1234 Oak Street, Springfield, IL 62701        ║   │
│ ╚═══════════════════════════════════════════════════════════╝   │
│                                                                  │
│  Executive Summary                                               │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Risk Level: HIGH                                         │   │
│  │ Estimate Value: $28,450                                  │   │
│  │ Estimated Missing Value: $5,200 - $8,900                 │   │
│  │                                                          │   │
│  │ This water damage estimate shows significant gaps...     │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
│  [More sections below...]                                        │
│                                                                  │
│  CONFIDENTIAL - For Client Use Only                             │
│  Page 1 of 3                                                    │
└─────────────────────────────────────────────────────────────────┘
```

### Excel Export Result
```
┌─────────────────────────────────────────────────────────────────┐
│ File Edit View Insert Format Data Tools                         │
├─────────────────────────────────────────────────────────────────┤
│  A              B                C              D                │
├─────────────────────────────────────────────────────────────────┤
│1 ESTIMATE REVIEW REPORT                                          │
│2 Report ID     10000000                                          │
│3 Estimate Name Johnson Residence - Water Damage                 │
│4                                                                 │
│5 MISSING ITEMS                                                   │
│6 Severity      Category         Description    Cost Impact      │
│7 error         Drying           No moisture... $200-$400         │
│8 warning       Demolition       Limited demo... $300-$600        │
│9                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### CSV Export Result (in text editor)
```
ESTIMATE REVIEW REPORT
Report ID,10000000-0000-0000-0000-000000000001
Estimate Name,Johnson Residence - Water Damage Claim #WD-2024-8847
Created,2024-12-15T10:30:00Z

MISSING ITEMS
Severity,Category,Description,Cost Impact,Justification
error,Drying & Dehumidification,No moisture mapping documented,$200-$400,...
warning,Demolition,Limited demolition scope,$300-$600,...
```

---

## 🎓 Training Guide

### For New Users

**Step 1:** Find the export buttons
- Detail page: Top-right corner
- List page: Bottom of each card

**Step 2:** Choose your format
- PDF for presentations
- Excel for analysis
- CSV for imports
- Print for hard copies

**Step 3:** Download or print
- Click button
- Wait for download/dialog
- Open file or print

### For Power Users

**Batch Exports:**
- Open multiple reports in tabs
- Click export on each
- All downloads queue in browser

**Custom Workflows:**
- Export CSV → Import to database
- Export Excel → Add to analysis workbook
- Export PDF → Email to client

---

**Last Updated:** February 2026
**Version:** 1.0.0
