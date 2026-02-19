/**
 * Report Utility Functions
 * Helper functions for working with estimate analysis reports
 */

import {
  Report,
  ReportAnalysis,
  ReportSummary,
  MissingItem,
  TradeCategory,
  QuantityIssue,
  StructuralGap,
  RiskLevel,
  SeverityLevel,
  formatCurrency,
  formatCurrencyRange,
  calculateGapPercentage,
} from './report-types';

/**
 * Get total missing value for a report
 */
export function getTotalMissingValue(report: Report): { low: number; high: number } {
  return report.result_json.total_missing_value_estimate;
}

/**
 * Get gap percentage for a report
 */
export function getGapPercentage(report: Report): { low: number; high: number } {
  const estimateValue = report.result_json.property_details.total_estimate_value;
  const missingValue = report.result_json.total_missing_value_estimate;
  return calculateGapPercentage(estimateValue, missingValue.low, missingValue.high);
}

/**
 * Get critical missing items (severity: error)
 */
export function getCriticalMissingItems(report: Report): MissingItem[] {
  return report.result_json.missing_items.filter(item => item.severity === 'error');
}

/**
 * Get total number of issues
 */
export function getTotalIssueCount(report: Report): number {
  return (
    report.result_json.missing_items.length +
    report.result_json.quantity_issues.length +
    report.result_json.structural_gaps.length
  );
}

/**
 * Get issues by severity
 */
export function getIssuesBySeverity(report: Report): {
  error: number;
  warning: number;
  info: number;
} {
  const items = report.result_json.missing_items;
  return {
    error: items.filter(i => i.severity === 'error').length,
    warning: items.filter(i => i.severity === 'warning').length,
    info: items.filter(i => i.severity === 'info').length,
  };
}

/**
 * Get all trade codes present in estimate
 */
export function getAllTradeCodes(report: Report): string[] {
  return report.result_json.detected_trades.map(trade => trade.code);
}

/**
 * Get total value by trade
 */
export function getTotalValueByTrade(report: Report): Record<string, number> {
  const result: Record<string, number> = {};
  report.result_json.detected_trades.forEach(trade => {
    result[trade.code] = trade.subtotal;
  });
  return result;
}

/**
 * Get compliance status summary
 */
export function getComplianceStatus(report: Report): {
  total: number;
  compliant: number;
  nonCompliant: number;
  notDocumented: number;
} {
  const notes = report.result_json.compliance_notes;
  return {
    total: notes.length,
    compliant: notes.filter(n => n.status === 'included').length,
    nonCompliant: notes.filter(n => n.status === 'missing' || n.status === 'not_included').length,
    notDocumented: notes.filter(n => n.status === 'not_documented' || n.status === 'not_specified').length,
  };
}

/**
 * Generate executive summary
 */
export function generateExecutiveSummary(report: Report): string {
  const analysis = report.result_json;
  const gap = getGapPercentage(report);
  const issues = getIssuesBySeverity(report);
  
  return `
Estimate Analysis: ${report.estimate_name}
Property: ${analysis.property_details.address}
Claim: ${analysis.property_details.claim_number}

ESTIMATE VALUE: ${formatCurrency(analysis.property_details.total_estimate_value)}
MISSING SCOPE: ${formatCurrencyRange(analysis.total_missing_value_estimate.low, analysis.total_missing_value_estimate.high)}
GAP PERCENTAGE: ${gap.low}% - ${gap.high}%
RISK LEVEL: ${analysis.risk_level.toUpperCase()}

ISSUES IDENTIFIED:
- Critical (Error): ${issues.error}
- Warning: ${issues.warning}
- Informational: ${issues.info}

PLATFORM: ${analysis.classification.classification} (${analysis.classification.confidence}% confidence)
TRADES DETECTED: ${analysis.detected_trades.length}
LINE ITEMS: ${analysis.classification.metadata?.line_item_count || 'N/A'}

${analysis.summary}
  `.trim();
}

/**
 * Generate findings report (text format)
 */
export function generateFindingsReport(report: Report): string {
  const analysis = report.result_json;
  let output = '';

  output += `═══════════════════════════════════════════════════════════════\n`;
  output += `ESTIMATE ANALYSIS REPORT\n`;
  output += `═══════════════════════════════════════════════════════════════\n\n`;

  output += `PROPERTY INFORMATION\n`;
  output += `────────────────────────────────────────────────────────────\n`;
  output += `Address: ${analysis.property_details.address}\n`;
  output += `Claim Number: ${analysis.property_details.claim_number}\n`;
  output += `Date of Loss: ${analysis.property_details.date_of_loss}\n`;
  output += `Adjuster: ${analysis.property_details.adjuster}\n`;
  output += `Estimate Value: ${formatCurrency(analysis.property_details.total_estimate_value)}\n\n`;

  output += `CLASSIFICATION\n`;
  output += `────────────────────────────────────────────────────────────\n`;
  output += `Type: ${analysis.classification.classification}\n`;
  output += `Confidence: ${analysis.classification.confidence}%\n`;
  if (analysis.classification.platform) {
    output += `Platform: ${analysis.classification.platform}\n`;
  }
  output += `Line Items: ${analysis.classification.metadata?.line_item_count || 'N/A'}\n\n`;

  output += `DETECTED TRADES (${analysis.detected_trades.length})\n`;
  output += `────────────────────────────────────────────────────────────\n`;
  analysis.detected_trades.forEach(trade => {
    output += `${trade.code} - ${trade.name}: ${formatCurrency(trade.subtotal)}\n`;
  });
  output += `\n`;

  if (analysis.missing_items.length > 0) {
    output += `MISSING ITEMS (${analysis.missing_items.length})\n`;
    output += `────────────────────────────────────────────────────────────\n`;
    
    const errors = analysis.missing_items.filter(i => i.severity === 'error');
    const warnings = analysis.missing_items.filter(i => i.severity === 'warning');
    const info = analysis.missing_items.filter(i => i.severity === 'info');

    if (errors.length > 0) {
      output += `\n🔴 CRITICAL ITEMS (${errors.length}):\n\n`;
      errors.forEach((item, idx) => {
        output += `${idx + 1}. ${item.category}\n`;
        output += `   ${item.description}\n`;
        output += `   Estimated Cost: $${item.estimated_cost_impact}\n`;
        if (item.xactimate_codes) {
          output += `   Xactimate Codes: ${item.xactimate_codes.join(', ')}\n`;
        }
        output += `\n`;
      });
    }

    if (warnings.length > 0) {
      output += `🟡 WARNINGS (${warnings.length}):\n\n`;
      warnings.forEach((item, idx) => {
        output += `${idx + 1}. ${item.category}\n`;
        output += `   ${item.description}\n`;
        output += `   Estimated Cost: $${item.estimated_cost_impact}\n`;
        output += `\n`;
      });
    }

    if (info.length > 0) {
      output += `🔵 INFORMATIONAL (${info.length}):\n\n`;
      info.forEach((item, idx) => {
        output += `${idx + 1}. ${item.category}\n`;
        output += `   ${item.description}\n`;
        output += `\n`;
      });
    }
  }

  if (analysis.quantity_issues.length > 0) {
    output += `QUANTITY ISSUES (${analysis.quantity_issues.length})\n`;
    output += `────────────────────────────────────────────────────────────\n`;
    analysis.quantity_issues.forEach((issue, idx) => {
      output += `${idx + 1}. ${issue.line_item}\n`;
      output += `   Issue: ${issue.description}\n`;
      if (issue.recommended_quantity) {
        output += `   Recommended: ${issue.recommended_quantity}\n`;
      }
      output += `   Cost Impact: $${issue.cost_impact}\n\n`;
    });
  }

  if (analysis.structural_gaps.length > 0) {
    output += `STRUCTURAL GAPS (${analysis.structural_gaps.length})\n`;
    output += `────────────────────────────────────────────────────────────\n`;
    analysis.structural_gaps.forEach((gap, idx) => {
      output += `${idx + 1}. ${gap.category}\n`;
      output += `   Type: ${gap.gap_type}\n`;
      output += `   ${gap.description}\n`;
      output += `   Estimated Cost: $${gap.estimated_cost}\n\n`;
    });
  }

  output += `FINANCIAL SUMMARY\n`;
  output += `────────────────────────────────────────────────────────────\n`;
  output += `Original Estimate: ${formatCurrency(analysis.property_details.total_estimate_value)}\n`;
  output += `Missing Value (Low): ${formatCurrency(analysis.total_missing_value_estimate.low)}\n`;
  output += `Missing Value (High): ${formatCurrency(analysis.total_missing_value_estimate.high)}\n`;
  const gap = getGapPercentage(report);
  output += `Gap Percentage: ${gap.low}% - ${gap.high}%\n`;
  output += `Risk Level: ${analysis.risk_level.toUpperCase()}\n\n`;

  if (analysis.critical_action_items.length > 0) {
    output += `CRITICAL ACTION ITEMS\n`;
    output += `────────────────────────────────────────────────────────────\n`;
    analysis.critical_action_items.forEach((item, idx) => {
      output += `${idx + 1}. ${item}\n`;
    });
    output += `\n`;
  }

  output += `SUMMARY\n`;
  output += `────────────────────────────────────────────────────────────\n`;
  output += `${analysis.summary}\n\n`;

  output += `═══════════════════════════════════════════════════════════════\n`;
  output += `Report generated: ${analysis.metadata.timestamp}\n`;
  output += `Analysis confidence: ${analysis.metadata.confidence_score}%\n`;
  output += `Processing time: ${analysis.metadata.processing_time_ms}ms\n`;
  output += `═══════════════════════════════════════════════════════════════\n`;

  return output;
}

/**
 * Generate supplement list (for contractors)
 */
export function generateSupplementList(report: Report): string {
  const analysis = report.result_json;
  let output = '';

  output += `SUPPLEMENT REQUEST\n`;
  output += `Claim: ${analysis.property_details.claim_number}\n`;
  output += `Property: ${analysis.property_details.address}\n\n`;

  output += `ADDITIONAL SCOPE REQUIRED:\n\n`;

  let itemNumber = 1;

  analysis.missing_items.forEach(item => {
    if (item.severity === 'error' || item.severity === 'warning') {
      output += `${itemNumber}. ${item.category}\n`;
      output += `   Description: ${item.description}\n`;
      output += `   Estimated Cost: $${item.estimated_cost_impact}\n`;
      if (item.xactimate_codes) {
        output += `   Xactimate Codes: ${item.xactimate_codes.join(', ')}\n`;
      }
      if (item.justification) {
        output += `   Justification: ${item.justification}\n`;
      }
      output += `\n`;
      itemNumber++;
    }
  });

  analysis.structural_gaps.forEach(gap => {
    output += `${itemNumber}. ${gap.category}\n`;
    output += `   Description: ${gap.description}\n`;
    output += `   Estimated Cost: $${gap.estimated_cost}\n`;
    if (gap.xactimate_codes) {
      output += `   Xactimate Codes: ${gap.xactimate_codes.join(', ')}\n`;
    }
    output += `\n`;
    itemNumber++;
  });

  output += `TOTAL ADDITIONAL SCOPE: ${formatCurrencyRange(
    analysis.total_missing_value_estimate.low,
    analysis.total_missing_value_estimate.high
  )}\n`;

  return output;
}

/**
 * Get report health score (0-100)
 */
export function getReportHealthScore(report: Report): number {
  const analysis = report.result_json;
  
  let score = 100;
  
  const issues = getIssuesBySeverity(report);
  score -= issues.error * 15;
  score -= issues.warning * 5;
  score -= issues.info * 2;
  
  score -= analysis.quantity_issues.length * 3;
  score -= analysis.structural_gaps.length * 10;
  
  const complianceIssues = analysis.compliance_notes.filter(
    n => n.status === 'missing' || n.status === 'not_included'
  ).length;
  score -= complianceIssues * 8;
  
  return Math.max(0, Math.min(100, score));
}

/**
 * Get health score label
 */
export function getHealthScoreLabel(score: number): string {
  if (score >= 90) return 'Excellent';
  if (score >= 75) return 'Good';
  if (score >= 60) return 'Fair';
  if (score >= 40) return 'Poor';
  return 'Critical';
}

/**
 * Get health score color
 */
export function getHealthScoreColor(score: number): string {
  if (score >= 90) return '#10b981'; // Green
  if (score >= 75) return '#84cc16'; // Light green
  if (score >= 60) return '#f59e0b'; // Yellow
  if (score >= 40) return '#f97316'; // Orange
  return '#ef4444'; // Red
}

/**
 * Sort missing items by cost impact
 */
export function sortMissingItemsByCost(items: MissingItem[]): MissingItem[] {
  return [...items].sort((a, b) => {
    const aMax = parseFloat(a.estimated_cost_impact.split('-')[1] || a.estimated_cost_impact);
    const bMax = parseFloat(b.estimated_cost_impact.split('-')[1] || b.estimated_cost_impact);
    return bMax - aMax;
  });
}

/**
 * Group missing items by severity
 */
export function groupMissingItemsBySeverity(items: MissingItem[]): {
  error: MissingItem[];
  warning: MissingItem[];
  info: MissingItem[];
} {
  return {
    error: items.filter(i => i.severity === 'error'),
    warning: items.filter(i => i.severity === 'warning'),
    info: items.filter(i => i.severity === 'info'),
  };
}

/**
 * Get top N missing items by cost
 */
export function getTopMissingItems(report: Report, n: number = 5): MissingItem[] {
  const sorted = sortMissingItemsByCost(report.result_json.missing_items);
  return sorted.slice(0, n);
}

/**
 * Calculate total line item count
 */
export function getTotalLineItemCount(report: Report): number {
  return report.result_json.detected_trades.reduce(
    (sum, trade) => sum + trade.line_items.length,
    0
  );
}

/**
 * Get largest trade by value
 */
export function getLargestTrade(report: Report): TradeCategory | null {
  if (report.result_json.detected_trades.length === 0) return null;
  
  return report.result_json.detected_trades.reduce((largest, current) =>
    current.subtotal > largest.subtotal ? current : largest
  );
}

/**
 * Format report for email
 */
export function formatReportForEmail(report: Report): string {
  const analysis = report.result_json;
  const gap = getGapPercentage(report);
  
  return `
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .header { background: #1e40af; color: white; padding: 20px; }
    .section { margin: 20px 0; padding: 15px; border-left: 4px solid #1e40af; }
    .critical { background: #fee; border-left-color: #ef4444; }
    .warning { background: #fef3c7; border-left-color: #f59e0b; }
    .info { background: #dbeafe; border-left-color: #3b82f6; }
    .success { background: #d1fae5; border-left-color: #10b981; }
    table { width: 100%; border-collapse: collapse; margin: 10px 0; }
    th, td { padding: 8px; text-align: left; border-bottom: 1px solid #ddd; }
    th { background: #f3f4f6; font-weight: bold; }
    .footer { margin-top: 30px; padding: 20px; background: #f9fafb; font-size: 12px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>Estimate Analysis Report</h1>
    <p>${report.estimate_name}</p>
  </div>

  <div class="section">
    <h2>Property Information</h2>
    <table>
      <tr><th>Address</th><td>${analysis.property_details.address}</td></tr>
      <tr><th>Claim Number</th><td>${analysis.property_details.claim_number}</td></tr>
      <tr><th>Date of Loss</th><td>${analysis.property_details.date_of_loss}</td></tr>
      <tr><th>Adjuster</th><td>${analysis.property_details.adjuster}</td></tr>
      <tr><th>Estimate Value</th><td>${formatCurrency(analysis.property_details.total_estimate_value)}</td></tr>
    </table>
  </div>

  <div class="section ${analysis.risk_level === 'high' ? 'critical' : analysis.risk_level === 'medium' ? 'warning' : 'success'}">
    <h2>Risk Assessment</h2>
    <p><strong>Risk Level:</strong> ${analysis.risk_level.toUpperCase()}</p>
    <p><strong>Missing Scope:</strong> ${formatCurrencyRange(analysis.total_missing_value_estimate.low, analysis.total_missing_value_estimate.high)}</p>
    <p><strong>Gap Percentage:</strong> ${gap.low}% - ${gap.high}%</p>
  </div>

  ${analysis.missing_items.length > 0 ? `
  <div class="section">
    <h2>Missing Items (${analysis.missing_items.length})</h2>
    ${analysis.missing_items.map(item => `
      <div class="${item.severity === 'error' ? 'critical' : item.severity === 'warning' ? 'warning' : 'info'}" style="margin: 10px 0; padding: 10px;">
        <h3>${item.category}</h3>
        <p>${item.description}</p>
        <p><strong>Estimated Cost:</strong> $${item.estimated_cost_impact}</p>
        ${item.xactimate_codes ? `<p><strong>Xactimate Codes:</strong> ${item.xactimate_codes.join(', ')}</p>` : ''}
      </div>
    `).join('')}
  </div>
  ` : ''}

  ${analysis.critical_action_items.length > 0 ? `
  <div class="section critical">
    <h2>Critical Action Items</h2>
    <ol>
      ${analysis.critical_action_items.map(item => `<li>${item}</li>`).join('')}
    </ol>
  </div>
  ` : ''}

  <div class="section">
    <h2>Summary</h2>
    <p>${analysis.summary}</p>
  </div>

  <div class="footer">
    <p>Report generated: ${analysis.metadata.timestamp}</p>
    <p>Analysis confidence: ${analysis.metadata.confidence_score}%</p>
    <p>Platform: ${analysis.classification.classification} (${analysis.classification.confidence}% confidence)</p>
    <p><em>This analysis is for informational purposes only and does not constitute professional advice.</em></p>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Compare two reports
 */
export function compareReports(report1: Report, report2: Report): {
  estimateValueDiff: number;
  missingValueDiff: { low: number; high: number };
  riskComparison: string;
  commonMissingItems: string[];
} {
  const diff = {
    estimateValueDiff: 
      report1.result_json.property_details.total_estimate_value -
      report2.result_json.property_details.total_estimate_value,
    missingValueDiff: {
      low: 
        report1.result_json.total_missing_value_estimate.low -
        report2.result_json.total_missing_value_estimate.low,
      high:
        report1.result_json.total_missing_value_estimate.high -
        report2.result_json.total_missing_value_estimate.high,
    },
    riskComparison: `${report1.result_json.risk_level} vs ${report2.result_json.risk_level}`,
    commonMissingItems: [] as string[],
  };

  const items1 = new Set(report1.result_json.missing_items.map(i => i.category));
  const items2 = new Set(report2.result_json.missing_items.map(i => i.category));
  
  items1.forEach(item => {
    if (items2.has(item)) {
      diff.commonMissingItems.push(item);
    }
  });

  return diff;
}

/**
 * Export report to CSV format
 */
export function exportReportToCSV(report: Report): string {
  const analysis = report.result_json;
  let csv = '';

  csv += 'Category,Item,Description,Severity,Cost Impact\n';
  
  analysis.missing_items.forEach(item => {
    csv += `"Missing Item","${item.category}","${item.description}","${item.severity}","${item.estimated_cost_impact}"\n`;
  });

  analysis.quantity_issues.forEach(issue => {
    csv += `"Quantity Issue","${issue.line_item}","${issue.description}","warning","${issue.cost_impact}"\n`;
  });

  analysis.structural_gaps.forEach(gap => {
    csv += `"Structural Gap","${gap.category}","${gap.description}","error","${gap.estimated_cost}"\n`;
  });

  return csv;
}

/**
 * Get example reports (for demos)
 */
export const EXAMPLE_REPORT_IDS = {
  WATER_DAMAGE: '10000000-0000-0000-0000-000000000001',
  COMMERCIAL_ROOF: '10000000-0000-0000-0000-000000000002',
  FIRE_DAMAGE: '10000000-0000-0000-0000-000000000003',
  MOLD_REMEDIATION: '10000000-0000-0000-0000-000000000004',
  HURRICANE: '10000000-0000-0000-0000-000000000005',
  MINIMAL_SCOPE: '10000000-0000-0000-0000-000000000006',
  COMPLETE_SCOPE: '10000000-0000-0000-0000-000000000007',
} as const;

/**
 * Get example report by type
 */
export async function getExampleReport(
  supabase: any,
  reportId: string
): Promise<Report | null> {
  const { data, error } = await supabase
    .from('reports')
    .select('*')
    .eq('id', reportId)
    .single();

  if (error || !data) return null;
  return data as Report;
}

/**
 * Get all example reports
 */
export async function getAllExampleReports(supabase: any): Promise<Report[]> {
  const { data, error } = await supabase
    .from('reports')
    .select('*')
    .in('id', Object.values(EXAMPLE_REPORT_IDS))
    .order('created_at', { ascending: false });

  if (error || !data) return [];
  return data as Report[];
}
