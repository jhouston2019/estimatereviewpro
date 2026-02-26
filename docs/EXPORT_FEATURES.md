# 📄 Report Export Features

Complete guide to downloading and printing estimate review reports in multiple formats.

---

## 🎯 Overview

Estimate Review Pro provides **4 ways** to export and share your analysis reports:

1. **PDF/HTML Export** - Professional formatted report with watermark
2. **Excel Export** - Spreadsheet format for data analysis
3. **CSV Export** - Simple data format for import into other systems
4. **Print** - Browser-based printing for immediate hard copies

---

## 📥 Export Formats

### 1. PDF/HTML Export

**Best for:** Professional presentations, client delivery, documentation

**Features:**
- Professional header with claim information
- Watermarked pages ("ESTIMATE REVIEW PRO - CONFIDENTIAL")
- Color-coded risk levels and severity indicators
- Comprehensive tables for all findings
- Formatted for printing (Letter size)
- Confidentiality notice in footer

**How to use:**
```
1. Navigate to report detail page
2. Click "PDF" button in top-right corner
3. Browser opens formatted HTML in new tab
4. Use browser's "Print to PDF" or "Save as PDF" function
```

**Direct API access:**
```
GET /api/reports/{report-id}/export?format=pdf
```

---

### 2. Excel Export

**Best for:** Data analysis, financial calculations, custom reporting

**Features:**
- Multiple sections: Property Info, Missing Items, Quantity Issues, Structural Gaps, Detected Trades
- Formatted tables with borders
- Preserves all numeric values for calculations
- Opens directly in Microsoft Excel or Google Sheets
- Easy to filter, sort, and analyze

**How to use:**
```
1. Navigate to report detail page or reports list
2. Click "Excel" button
3. File downloads as .xls format
4. Open in Excel, Google Sheets, or LibreOffice Calc
```

**Direct API access:**
```
GET /api/reports/{report-id}/export?format=excel
```

---

### 3. CSV Export

**Best for:** Data import, system integration, simple data exchange

**Features:**
- Plain text format compatible with all systems
- Sections separated by blank lines
- Header row for each section
- Proper CSV escaping for special characters
- Lightweight file size

**How to use:**
```
1. Navigate to report detail page or reports list
2. Click "CSV" button
3. File downloads as .csv format
4. Open in Excel, import into database, or process with scripts
```

**Direct API access:**
```
GET /api/reports/{report-id}/export?format=csv
```

**CSV Structure:**
```csv
ESTIMATE REVIEW REPORT
Report ID,10000000-0000-0000-0000-000000000001
Estimate Name,Johnson Residence - Water Damage
...

MISSING ITEMS
Severity,Category,Description,Cost Impact,Justification
error,Drying & Dehumidification,No moisture mapping documented,$200-$400,...
...

QUANTITY ISSUES
Line Item,Issue Type,Description,Cost Impact
...
```

---

### 4. Print Function

**Best for:** Quick hard copies, immediate documentation

**Features:**
- Browser-native print dialog
- Optimized print styles (removes navigation, adjusts colors)
- Page break management to avoid splitting sections
- Print-friendly fonts and spacing
- Works with any printer or "Save as PDF"

**How to use:**
```
1. Navigate to report detail page
2. Click "Print" button (purple icon)
3. Browser print dialog opens
4. Select printer or "Save as PDF"
5. Adjust settings (margins, orientation, etc.)
6. Print or save
```

**Keyboard shortcut:**
```
Ctrl+P (Windows/Linux)
Cmd+P (Mac)
```

---

## 🎨 Export Button Locations

### Report Detail Page

Located in the top-right corner, next to the risk level badge:

```
┌─────────────────────────────────────────────────────┐
│ [PDF] [Excel] [CSV] [Print]  [HIGH RISK]           │
└─────────────────────────────────────────────────────┘
```

**Buttons:**
- **PDF** (Blue) - Opens formatted HTML in new tab
- **Excel** (Green) - Downloads .xls file
- **CSV** (Yellow) - Downloads .csv file
- **Print** (Purple) - Opens browser print dialog

### Reports List Page

Located at the bottom of each report card:

```
┌─────────────────────────────────────────────────────┐
│ Johnson Residence - Water Damage     [HIGH]         │
│ ...                                                  │
│ Dec 15, 2024    [View] [PDF] [Excel]               │
└─────────────────────────────────────────────────────┘
```

---

## 💼 Use Cases

### For Homeowners

**Scenario:** Disputing insurance lowball offer

1. Export report as **PDF**
2. Review missing items and cost impacts
3. Print or email PDF to insurance adjuster
4. Use as supporting documentation for supplement claim

### For Public Adjusters

**Scenario:** Building client case file

1. Export report as **PDF** for client presentation
2. Export as **Excel** for detailed cost analysis
3. Print hard copy for physical file
4. Share PDF via secure client portal

### For Contractors

**Scenario:** Preparing supplement estimate

1. Export report as **Excel**
2. Import missing items into estimating software
3. Use cost impacts as baseline for supplement
4. Export final supplement and attach original PDF

### For Insurance Companies

**Scenario:** Quality control and audit

1. Export multiple reports as **CSV**
2. Import into analysis database
3. Run aggregate statistics on common gaps
4. Generate training materials from findings

---

## 🔧 Technical Details

### API Endpoint

**Base URL:**
```
/api/reports/{report-id}/export
```

**Query Parameters:**
- `format` (required): `pdf`, `excel`, `xlsx`, or `csv`

**Response:**
- **PDF:** `text/html` with print-optimized styling
- **Excel:** `application/vnd.ms-excel` (.xls file)
- **CSV:** `text/csv` (.csv file)

**Example:**
```bash
# Download PDF
curl https://your-domain.com/api/reports/10000000-0000-0000-0000-000000000001/export?format=pdf

# Download Excel
curl https://your-domain.com/api/reports/10000000-0000-0000-0000-000000000001/export?format=excel

# Download CSV
curl https://your-domain.com/api/reports/10000000-0000-0000-0000-000000000001/export?format=csv
```

### Authentication

Exports respect the same authentication and authorization as the web interface:
- User must be logged in
- User must have access to the report (owner or team member)
- Row Level Security (RLS) policies apply

### File Naming

Downloaded files use this naming convention:
```
estimate-review-{short-id}.{extension}

Examples:
- estimate-review-10000000.html
- estimate-review-10000000.xls
- estimate-review-10000000.csv
```

---

## 📊 Data Included in Exports

### All Formats Include:

✅ **Property Information**
- Address, claim number, date of loss
- Adjuster name, estimate type
- Risk level, estimate value

✅ **Financial Summary**
- Total estimate value (RCV)
- Missing value range (low/high)
- Gap percentage

✅ **Missing Items**
- Severity, category, description
- Cost impact, justification
- Xactimate codes (if applicable)

✅ **Quantity Issues**
- Line item, issue type
- Description, cost impact
- Recommended corrections

✅ **Structural Gaps**
- Category, gap type
- Description, estimated cost
- Xactimate codes (if applicable)

✅ **Detected Trades**
- Trade code and name
- Line items with quantities, units, prices
- Subtotals per trade

✅ **Pricing Observations**
- Item, observed price
- Typical range, notes

✅ **Compliance Notes**
- Standard, requirement
- Status, description

✅ **Critical Action Items**
- Prioritized list of required actions

### Format-Specific Features:

**PDF/HTML:**
- Color-coded severity levels
- Formatted tables with styling
- Page headers and footers
- Watermarks

**Excel:**
- Multiple worksheets (future enhancement)
- Formulas for calculations (future enhancement)
- Conditional formatting (future enhancement)

**CSV:**
- Section headers for easy parsing
- Proper escaping for special characters
- Lightweight for bulk processing

---

## 🎯 Best Practices

### For Professional Delivery

1. **Always use PDF** for client-facing documents
2. **Include cover letter** explaining key findings
3. **Highlight critical items** in accompanying email
4. **Set expectations** about cost ranges being estimates

### For Data Analysis

1. **Use Excel** for single-report deep dives
2. **Use CSV** for bulk analysis of multiple reports
3. **Preserve original data** - don't modify exports
4. **Document assumptions** when performing calculations

### For Printing

1. **Review print preview** before printing
2. **Use landscape orientation** for wide tables
3. **Adjust margins** if content is cut off
4. **Print to PDF first** to verify formatting

### For Sharing

1. **Use secure methods** - reports contain sensitive data
2. **Redact if necessary** - remove sensitive property details
3. **Add disclaimers** - reports are for informational purposes
4. **Track distribution** - know who has access

---

## 🔒 Security & Privacy

### Confidentiality

All exports include confidentiality notices:
```
CONFIDENTIAL - For Client Use Only

This report is provided for informational purposes only and does not
constitute legal, financial, or professional advice.
```

### Data Protection

- Exports are generated on-demand (not stored)
- No export history is maintained
- Downloads occur over HTTPS
- Authentication required for all exports

### Compliance

Reports comply with:
- Industry standard confidentiality practices
- Professional services disclaimers
- Data privacy requirements

---

## 🐛 Troubleshooting

### PDF not displaying correctly

**Issue:** Formatting looks broken or incomplete

**Solutions:**
1. Try a different browser (Chrome, Firefox, Edge)
2. Clear browser cache and reload
3. Use "Print to PDF" from browser instead
4. Check for browser extensions blocking content

### Excel file won't open

**Issue:** Excel shows error when opening file

**Solutions:**
1. File is actually HTML format - Excel should handle this
2. Try opening in Google Sheets instead
3. Right-click file, choose "Open with" > Excel
4. If all else fails, use CSV format

### CSV encoding issues

**Issue:** Special characters display incorrectly

**Solutions:**
1. Open CSV in Excel using "Data" > "From Text/CSV"
2. Select UTF-8 encoding
3. Or use Google Sheets which auto-detects encoding

### Print cuts off content

**Issue:** Tables or sections are cut off when printing

**Solutions:**
1. Adjust print margins to "Narrow" or "None"
2. Use landscape orientation for wide tables
3. Reduce print scale to 90% or 80%
4. Use "Print to PDF" and review before printing

### Download blocked by browser

**Issue:** Browser blocks download or shows warning

**Solutions:**
1. Click "Keep" or "Download anyway" in browser warning
2. Add site to browser's allowed list
3. Check antivirus/firewall settings
4. Try different browser

---

## 📞 Support

For export-related issues:

1. **Check browser console** for error messages
2. **Verify report access** - ensure you have permission
3. **Try different format** - if PDF fails, try Excel or CSV
4. **Contact support** with report ID and error details

---

## 🚀 Future Enhancements

Planned export features:

- [ ] **Batch export** - Download multiple reports at once
- [ ] **Custom templates** - Choose different PDF layouts
- [ ] **Email delivery** - Send exports directly to email
- [ ] **Scheduled exports** - Automatic weekly/monthly exports
- [ ] **Export history** - Track what was exported when
- [ ] **Comparison exports** - Side-by-side report comparisons
- [ ] **API integration** - Webhook-based export delivery
- [ ] **Custom branding** - Add your logo to exports

---

## 📚 Related Documentation

- [Report Types](./REPORT_TYPES.md) - Understanding report structure
- [API Documentation](./API_DOCUMENTATION.md) - Programmatic access
- [User Guide](./USER_GUIDE.md) - Complete platform guide
- [Example Reports](./EXAMPLE_REPORTS.md) - Sample exports

---

**Last Updated:** February 2026
**Version:** 1.0.0
