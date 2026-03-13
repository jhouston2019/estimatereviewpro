/**
 * REPORT TITLE GENERATOR
 * Generates vertical-specific report titles
 */

export function getVerticalReportTitle(vertical?: string): string {
  const titles: Record<string, string> = {
    roof: 'Roof Estimate Intelligence Report',
    water: 'Water Damage Estimate Intelligence Report',
    fire: 'Fire Damage Estimate Intelligence Report',
    interior: 'Interior Damage Estimate Intelligence Report',
    contractor: 'Contractor Estimate Comparison Report',
    xactimate: 'Xactimate Estimate Analysis Report'
  };

  return vertical && titles[vertical] 
    ? titles[vertical] 
    : 'Insurance Estimate Intelligence Report';
}

export function getVerticalReportSubtitle(vertical?: string): string {
  const subtitles: Record<string, string> = {
    roof: 'Structured analysis of roofing scope, quantities, and pricing',
    water: 'Structured analysis of water damage mitigation and restoration scope',
    fire: 'Structured analysis of fire restoration scope and requirements',
    interior: 'Structured analysis of interior repair scope and finishing',
    contractor: 'Comparative analysis of contractor vs. insurance estimates',
    xactimate: 'Line-by-line analysis of Xactimate estimate structure'
  };

  return vertical && subtitles[vertical]
    ? subtitles[vertical]
    : 'Structured analysis of estimate scope, quantities, and pricing';
}

export function getVerticalInsights(vertical?: string): string[] {
  const insights: Record<string, string[]> = {
    roof: [
      'Check for starter row omissions - required by all manufacturers',
      'Verify drip edge is included at all roof edges',
      'Confirm ridge cap quantities include all hips and valleys',
      'Ensure flashing is specified at all wall intersections',
      'Verify ice and water shield meets code requirements',
      'Check that waste factors reflect roofing industry standards (10-15%)'
    ],
    water: [
      'Verify all affected areas have proper demo and disposal scope',
      'Ensure drying equipment quantities match affected square footage',
      'Check for antimicrobial treatment in all water-affected areas',
      'Confirm insulation replacement is included behind all removed drywall',
      'Verify interior finishing includes proper texture and paint matching'
    ],
    fire: [
      'Check for smoke sealing on all surfaces exposed to smoke',
      'Verify thermal fogging is included for odor remediation',
      'Ensure HVAC cleaning is specified if system was exposed',
      'Confirm insulation replacement in all fire-affected areas',
      'Verify interior reconstruction includes all required finishes'
    ],
    interior: [
      'Verify drywall quantities account for proper panel breaks at studs',
      'Ensure insulation is included behind all new drywall',
      'Check that texture application covers full ceilings/walls as needed',
      'Confirm paint scope includes full rooms for proper color matching',
      'Verify baseboard and trim replacement where removed'
    ],
    contractor: [
      'Compare line-by-line scope between contractor and insurance estimates',
      'Identify items present in contractor bid but missing from insurance',
      'Verify pricing differences reflect current market rates vs. database pricing',
      'Check for waste factor and O&P differences',
      'Confirm code compliance items are included in both estimates'
    ],
    xactimate: [
      'Verify Xactimate pricing reflects current regional market rates',
      'Check for proper line code usage (repair vs. replacement codes)',
      'Ensure quantities match actual field measurements',
      'Verify waste factors are applied per Xactimate standards',
      'Check that O&P calculations follow Xactimate methodology'
    ]
  };

  return vertical && insights[vertical]
    ? insights[vertical]
    : [
        'Review all line items for completeness',
        'Verify quantities match scope of damage',
        'Check pricing against regional market rates',
        'Ensure all required trades are included',
        'Confirm waste factors and O&P are appropriate'
      ];
}
