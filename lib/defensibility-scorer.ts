/**
 * DEFENSIBILITY SCORER
 * Strategic guidance layer for settlement positioning
 * 
 * This module scores each deviation's defensibility to help users
 * understand which findings are bulletproof vs which need additional support.
 * 
 * CRITICAL: This is strategic guidance only. Does NOT affect calculations.
 */

import { Deviation } from './deviation-engine';
import { ExpertDirective } from './expert-intelligence-engine';
import { ExpectedQuantities } from './dimension-engine';

export interface DefensibilityScore {
  score: 1 | 2 | 3 | 4 | 5;
  level: 'WEAK' | 'FAIR' | 'MEDIUM' | 'STRONG' | 'BULLETPROOF';
  supportingFactors: string[];
  riskAssessment: {
    carrierDisputeRisk: 'LOW' | 'MODERATE' | 'HIGH';
    documentationStrength: 'WEAK' | 'FAIR' | 'STRONG';
    recommendation: string;
  };
  potentialCarrierArguments: string[];
  strengtheningStrategy?: string[];
}

/**
 * Score defensibility of a deviation
 * 
 * Scoring logic:
 * +2 points: Mandatory expert directive with license
 * +1 point: Recommended expert directive
 * +1 point: Compliance standard cited
 * +1 point: Dimension verification (source = BOTH)
 * +1 point: Photo evidence supports
 * +1 point: Industry-standard pricing
 * 
 * 5 points = BULLETPROOF
 * 4 points = STRONG
 * 3 points = MEDIUM
 * 2 points = FAIR
 * 1 point = WEAK
 */
export function scoreDefensibility(
  deviation: Deviation,
  expertDirective?: ExpertDirective,
  hasDimensionVerification?: boolean,
  hasPhotoEvidence?: boolean
): DefensibilityScore {
  
  let score = 0;
  const supportingFactors: string[] = [];
  const potentialArguments: string[] = [];
  const strengtheningStrategy: string[] = [];
  
  // Expert directive (strongest factor)
  if (expertDirective) {
    if (expertDirective.priority === 'MANDATORY') {
      score += 2;
      supportingFactors.push(`Mandatory expert directive`);
    } else if (expertDirective.priority === 'RECOMMENDED') {
      score += 1;
      supportingFactors.push(`Expert recommendation`);
      potentialArguments.push('"This is recommended, not mandated"');
      strengtheningStrategy.push('Obtain explicit mandate from expert or cite compliance standard requiring this scope');
    } else {
      score += 1;
      supportingFactors.push(`Expert directive present`);
    }
  } else if (deviation.source === 'REPORT') {
    // Has report source but no directive object
    score += 1;
    supportingFactors.push('Expert report-based finding');
    potentialArguments.push('"Expert directive not clearly documented"');
    strengtheningStrategy.push('Obtain detailed expert report with explicit directives');
  } else {
    // No expert backing
    potentialArguments.push('"No expert directive supports this finding"');
    strengtheningStrategy.push('Commission expert report to support this variance');
  }
  
  // Compliance standard
  if (expertDirective?.complianceBasis) {
    score += 1;
    supportingFactors.push(`Compliance standard cited (${expertDirective.complianceBasis.standard})`);
  } else {
    potentialArguments.push('"No compliance standard requires this"');
    strengtheningStrategy.push('Identify applicable compliance standard (IICRC, ANSI, IRC, etc.)');
  }
  
  // Dimension verification (high confidence)
  if (deviation.source === 'BOTH' || hasDimensionVerification) {
    score += 1;
    supportingFactors.push('Measured dimensions confirm requirement');
  } else if (deviation.source === 'DIMENSION') {
    score += 1;
    supportingFactors.push('Geometry-based calculation');
  } else {
    strengtheningStrategy.push('Obtain dimension measurements to verify quantity requirements');
  }
  
  // Photo evidence
  if (hasPhotoEvidence) {
    score += 1;
    supportingFactors.push('Photos show damage extent supports finding');
  } else {
    strengtheningStrategy.push('Document with photos showing visible damage or scope extent');
  }
  
  // Industry-standard pricing (always present)
  score += 1;
  supportingFactors.push('Industry-standard pricing (Cost Baseline v1.0.0)');
  
  // Cap at 5 and ensure minimum of 1
  const clampedScore = Math.max(1, Math.min(5, score));
  const finalScore = (clampedScore === 1 ? 1 : clampedScore === 2 ? 2 : clampedScore === 3 ? 3 : clampedScore === 4 ? 4 : 5) as 1 | 2 | 3 | 4 | 5;
  
  // Determine level
  const level = finalScore >= 5 ? 'BULLETPROOF'
    : finalScore >= 4 ? 'STRONG'
    : finalScore >= 3 ? 'MEDIUM'
    : finalScore >= 2 ? 'FAIR'
    : 'WEAK';
  
  // Determine risk
  const carrierDisputeRisk = finalScore >= 4 ? 'LOW'
    : finalScore >= 3 ? 'MODERATE'
    : 'HIGH';
  
  const documentationStrength = finalScore >= 4 ? 'STRONG'
    : finalScore >= 2 ? 'FAIR'
    : 'WEAK';
  
  // Generate recommendation
  let recommendation: string;
  if (finalScore >= 5) {
    recommendation = 'PUSH HARD – This is bulletproof. Multiple authoritative sources confirm this variance.';
  } else if (finalScore >= 4) {
    recommendation = 'STRONG POSITION – Well-documented finding with expert backing and verification.';
  } else if (finalScore >= 3) {
    recommendation = 'SUPPORT WITH ADDITIONAL DOCUMENTATION – Fair finding but needs strengthening.';
  } else if (finalScore >= 2) {
    recommendation = 'STRENGTHEN BEFORE PRESENTING – Weak documentation, high dispute risk.';
  } else {
    recommendation = 'DO NOT PRESENT – Insufficient support. Obtain additional documentation first.';
  }
  
  return {
    score: finalScore,
    level,
    supportingFactors,
    riskAssessment: {
      carrierDisputeRisk,
      documentationStrength,
      recommendation
    },
    potentialCarrierArguments: potentialArguments,
    strengtheningStrategy: strengtheningStrategy.length > 0 ? strengtheningStrategy : undefined
  };
}

/**
 * Score all deviations
 */
export function scoreAllDeviations(
  deviations: Deviation[],
  expertDirectives?: ExpertDirective[],
  dimensions?: ExpectedQuantities,
  photoAnalysis?: any
): Map<string, DefensibilityScore> {
  
  const scores = new Map<string, DefensibilityScore>();
  
  deviations.forEach((deviation, idx) => {
    // Find matching expert directive
    const expertDirective = expertDirectives?.find(dir => 
      dir.sourceParagraph && deviation.reportDirective && 
      dir.sourceParagraph.includes(deviation.reportDirective)
    );
    
    // Check if dimension verification
    const hasDimensionVerification = deviation.source === 'BOTH' || 
      (dimensions && (deviation.source === 'DIMENSION'));
    
    // Check if photo evidence
    const hasPhotoEvidence = photoAnalysis && 
      photoAnalysis.criticalFlags && 
      photoAnalysis.criticalFlags.length > 0;
    
    const score = scoreDefensibility(
      deviation,
      expertDirective,
      hasDimensionVerification,
      hasPhotoEvidence
    );
    
    scores.set(`deviation-${idx}`, score);
  });
  
  return scores;
}

/**
 * Format defensibility score as text
 */
export function formatDefensibilityScore(score: DefensibilityScore): string {
  
  const stars = '★'.repeat(score.score) + '☆'.repeat(5 - score.score);
  
  let output = '';
  output += `DEFENSIBILITY: ${stars} (${score.level})\n\n`;
  
  if (score.supportingFactors.length > 0) {
    output += 'Supporting Factors:\n';
    score.supportingFactors.forEach(factor => {
      output += `✓ ${factor}\n`;
    });
    output += '\n';
  }
  
  output += 'Risk Assessment:\n';
  output += `• Carrier dispute risk: ${score.riskAssessment.carrierDisputeRisk}\n`;
  output += `• Documentation strength: ${score.riskAssessment.documentationStrength}\n`;
  output += `• Recommendation: ${score.riskAssessment.recommendation}\n\n`;
  
  if (score.potentialCarrierArguments.length > 0) {
    output += 'Potential Carrier Arguments:\n';
    score.potentialCarrierArguments.forEach(arg => {
      output += `• ${arg}\n`;
    });
    output += '\n';
  }
  
  if (score.strengtheningStrategy && score.strengtheningStrategy.length > 0) {
    output += 'Strengthening Strategy:\n';
    score.strengtheningStrategy.forEach(strategy => {
      output += `• ${strategy}\n`;
    });
    output += '\n';
  }
  
  return output;
}
