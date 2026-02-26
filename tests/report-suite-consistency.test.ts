/**
 * REPORT SUITE CONSISTENCY TEST
 * 
 * Ensures all report formats use identical numerical data, baseline version,
 * report ID, and hash. This is CRITICAL for deterministic integrity.
 * 
 * Run with: npx ts-node tests/report-suite-consistency.test.ts
 */

import { renderAllReports, validateReportConsistency, FormattedReport } from '../lib/report-renderer';
import type { Report, ReportAnalysis } from '../lib/report-types';

// Mock report data for testing
const mockReport: Report = {
  id: '10000000-0000-0000-0000-000000000001',
  user_id: 'test-user',
  estimate_name: 'Test Estimate',
  file_path: '/test/estimate.pdf',
  status: 'completed',
  result_json: {} as any, // Will be populated below
  created_at: '2026-02-25T00:00:00Z',
  updated_at: '2026-02-25T00:00:00Z'
};

const mockAnalysis: ReportAnalysis = {
  classification: {
    estimate_type: 'insurance_claim',
    property_type: 'residential',
    damage_category: 'water',
    confidence_score: 95
  },
  property_details: {
    address: '123 Test St',
    claim_number: 'TEST-2024-001',
    date_of_loss: '2024-01-15',
    total_estimate_value: 50000
  },
  detected_trades: [],
  missing_items: [],
  quantity_issues: [],
  structural_gaps: [],
  pricing_observations: [],
  compliance_notes: [],
  summary: 'Test analysis summary',
  risk_level: 'medium',
  total_missing_value_estimate: {
    low: 5000,
    high: 8000,
    confidence: 'medium'
  },
  critical_action_items: ['Test action 1', 'Test action 2'],
  metadata: {
    model_version: 'gpt-4-turbo-2024-04-09',
    processing_time_ms: 1000,
    timestamp: '2026-02-25T00:00:00Z'
  }
};

// Mock deviations
const mockDeviations = [
  {
    trade: 'DRY',
    tradeName: 'Drywall',
    issue: 'Insufficient cut height',
    source: 'BOTH' as const,
    severity: 'CRITICAL' as const,
    estimateValue: 360,
    expectedValue: 1440,
    unit: 'SF',
    calculation: 'Perimeter 180 LF × (8 ft - 2 ft) = 1080 SF shortfall',
    impactMin: 15660,
    impactMax: 23220,
    complianceReference: 'IICRC S500',
    reportDirective: 'Remove drywall full height in affected rooms'
  },
  {
    trade: 'INS',
    tradeName: 'Insulation',
    issue: 'Missing insulation replacement',
    source: 'REPORT' as const,
    severity: 'HIGH' as const,
    estimateValue: 0,
    expectedValue: 850,
    unit: 'SF',
    calculation: '850 SF × $4.00-$6.00/SF',
    impactMin: 3400,
    impactMax: 5100,
    complianceReference: undefined,
    reportDirective: 'Replace all insulation'
  }
];

async function runConsistencyTest() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('REPORT SUITE CONSISTENCY TEST');
  console.log('═══════════════════════════════════════════════════════════════\n');
  
  try {
    // Prepare structured input
    const structuredInput = {
      report: mockReport,
      analysis: mockAnalysis,
      deviations: mockDeviations,
      expertDirectives: undefined,
      dimensions: undefined,
      photoAnalysis: undefined
    };
    
    console.log('Generating all report formats...\n');
    
    // Generate all reports
    const reports = await renderAllReports(structuredInput);
    
    console.log(`✓ Generated ${reports.length} report formats\n`);
    
    // Extract key metrics from each report
    console.log('Extracting metrics from each format:\n');
    
    reports.forEach(report => {
      const totalMin = report.rawData.deviations.reduce((sum, d) => sum + d.impactMin, 0);
      const totalMax = report.rawData.deviations.reduce((sum, d) => sum + d.impactMax, 0);
      
      console.log(`${report.type}:`);
      console.log(`  Report ID: ${report.metadata.reportId}`);
      console.log(`  Cost Baseline: v${report.metadata.costBaselineVersion}`);
      console.log(`  Hash: ${report.metadata.sha256Hash}`);
      console.log(`  Total Exposure: $${totalMin.toLocaleString()} - $${totalMax.toLocaleString()}`);
      console.log(`  Deviations: ${report.rawData.deviations.length}`);
      console.log(`  Sections: ${report.sections.length}\n`);
    });
    
    // Validate consistency
    console.log('Validating consistency across all formats...\n');
    
    const validation = validateReportConsistency(reports);
    
    if (validation.consistent) {
      console.log('✅ PASS: All reports are numerically consistent\n');
      console.log('Verified:');
      console.log('  ✓ Report IDs match');
      console.log('  ✓ Cost baseline versions match');
      console.log('  ✓ Hashes match');
      console.log('  ✓ Deviation counts match');
      console.log('  ✓ Total exposures match\n');
    } else {
      console.log('❌ FAIL: Consistency errors detected\n');
      validation.errors.forEach(error => {
        console.log(`  ✗ ${error}`);
      });
      console.log('');
      process.exit(1);
    }
    
    // Additional validation: Check that no calculations differ
    console.log('Performing deep validation...\n');
    
    const baseline = reports[0];
    let deepErrors = 0;
    
    for (let i = 1; i < reports.length; i++) {
      const current = reports[i];
      
      // Check each deviation
      for (let j = 0; j < baseline.rawData.deviations.length; j++) {
        const baselineDev = baseline.rawData.deviations[j];
        const currentDev = current.rawData.deviations[j];
        
        if (baselineDev.impactMin !== currentDev.impactMin) {
          console.log(`  ✗ Deviation ${j} impactMin mismatch: ${baseline.type} vs ${current.type}`);
          deepErrors++;
        }
        
        if (baselineDev.impactMax !== currentDev.impactMax) {
          console.log(`  ✗ Deviation ${j} impactMax mismatch: ${baseline.type} vs ${current.type}`);
          deepErrors++;
        }
        
        if (baselineDev.calculation !== currentDev.calculation) {
          console.log(`  ✗ Deviation ${j} calculation mismatch: ${baseline.type} vs ${current.type}`);
          deepErrors++;
        }
      }
    }
    
    if (deepErrors === 0) {
      console.log('✅ PASS: Deep validation successful - all calculations identical\n');
    } else {
      console.log(`\n❌ FAIL: ${deepErrors} deep validation errors detected\n`);
      process.exit(1);
    }
    
    // Performance check
    console.log('Performance metrics:\n');
    console.log(`  Total reports generated: ${reports.length}`);
    console.log(`  Average sections per report: ${Math.round(reports.reduce((sum, r) => sum + r.sections.length, 0) / reports.length)}`);
    console.log(`  Total deviations processed: ${reports.length * mockDeviations.length}\n`);
    
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('✅ ALL TESTS PASSED - DETERMINISTIC CONSISTENCY VERIFIED');
    console.log('═══════════════════════════════════════════════════════════════\n');
    
  } catch (error: any) {
    console.error('❌ TEST FAILED WITH ERROR:\n');
    console.error(error.message);
    console.error('\nStack trace:');
    console.error(error.stack);
    process.exit(1);
  }
}

// Run the test
if (require.main === module) {
  runConsistencyTest();
}

export { runConsistencyTest };
