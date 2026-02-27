/**
 * MULTI-PHASE MATCHING ENGINE
 * 4-phase matching algorithm: Exact → Fuzzy → Category → AI
 * Used for comparing two estimates (contractor vs carrier)
 */

import { normalizeQuantity, compareQuantities, areUnitsCompatible } from './unit-normalizer';

export interface LineItem {
  lineNumber: number;
  tradeCode: string;
  tradeName: string;
  description: string;
  quantity: number;
  unit: string;
  rcv: number;
  acv: number;
  actionType?: string;
}

export interface Match {
  phase: 'EXACT' | 'FUZZY' | 'CATEGORY' | 'AI' | 'UNMATCHED';
  confidence: number; // 0-100
  sourceItem: LineItem;
  targetItem: LineItem | null;
  similarityScore: number;
  quantityMatch: boolean;
  priceVariance: number;
  priceVariancePercentage: number;
  explanation: string;
}

export interface MatchingResult {
  matches: Match[];
  unmatchedSource: LineItem[];
  unmatchedTarget: LineItem[];
  statistics: {
    totalSourceItems: number;
    totalTargetItems: number;
    exactMatches: number;
    fuzzyMatches: number;
    categoryMatches: number;
    aiMatches: number;
    unmatched: number;
    averageConfidence: number;
  };
  metadata: {
    processingTime: number;
    phasesUsed: string[];
  };
}

/**
 * Main matching function - orchestrates 4-phase matching
 */
export async function performMultiPhaseMatching(
  sourceEstimate: LineItem[],
  targetEstimate: LineItem[],
  options: {
    includeAI?: boolean;
    minFuzzyScore?: number;
    openaiApiKey?: string;
  } = {}
): Promise<MatchingResult> {
  const startTime = Date.now();
  const matches: Match[] = [];
  const unmatchedSource: LineItem[] = [];
  let unmatchedTarget = [...targetEstimate];
  const phasesUsed: string[] = [];
  
  const minFuzzyScore = options.minFuzzyScore || 0.85;
  
  console.log(`[MATCHING] Starting multi-phase matching...`);
  console.log(`[MATCHING] Source: ${sourceEstimate.length} items, Target: ${targetEstimate.length} items`);
  
  // PHASE 1: Exact Matching (100% confidence)
  console.log(`[MATCHING] Phase 1: Exact matching...`);
  phasesUsed.push('exact');
  
  for (const sourceItem of sourceEstimate) {
    const exactMatch = findExactMatch(sourceItem, unmatchedTarget);
    
    if (exactMatch) {
      matches.push({
        phase: 'EXACT',
        confidence: 100,
        sourceItem,
        targetItem: exactMatch,
        similarityScore: 1.0,
        quantityMatch: true,
        priceVariance: sourceItem.rcv - exactMatch.rcv,
        priceVariancePercentage: ((sourceItem.rcv - exactMatch.rcv) / exactMatch.rcv) * 100,
        explanation: 'Exact match: identical description and quantity',
      });
      
      // Remove from unmatched
      unmatchedTarget = unmatchedTarget.filter(item => item.lineNumber !== exactMatch.lineNumber);
    } else {
      unmatchedSource.push(sourceItem);
    }
  }
  
  console.log(`[MATCHING] Phase 1 complete: ${matches.length} exact matches`);
  
  // PHASE 2: Fuzzy Matching (85%+ similarity)
  console.log(`[MATCHING] Phase 2: Fuzzy matching (threshold: ${minFuzzyScore})...`);
  phasesUsed.push('fuzzy');
  
  const stillUnmatchedSource: LineItem[] = [];
  
  for (const sourceItem of unmatchedSource) {
    const fuzzyMatch = findFuzzyMatch(sourceItem, unmatchedTarget, minFuzzyScore);
    
    if (fuzzyMatch) {
      const confidence = Math.round(fuzzyMatch.similarity * 100);
      
      matches.push({
        phase: 'FUZZY',
        confidence,
        sourceItem,
        targetItem: fuzzyMatch.item,
        similarityScore: fuzzyMatch.similarity,
        quantityMatch: fuzzyMatch.quantityMatch,
        priceVariance: sourceItem.rcv - fuzzyMatch.item.rcv,
        priceVariancePercentage: ((sourceItem.rcv - fuzzyMatch.item.rcv) / fuzzyMatch.item.rcv) * 100,
        explanation: `Fuzzy match: ${(fuzzyMatch.similarity * 100).toFixed(1)}% similarity`,
      });
      
      // Remove from unmatched
      unmatchedTarget = unmatchedTarget.filter(item => item.lineNumber !== fuzzyMatch.item.lineNumber);
    } else {
      stillUnmatchedSource.push(sourceItem);
    }
  }
  
  console.log(`[MATCHING] Phase 2 complete: ${matches.filter(m => m.phase === 'FUZZY').length} fuzzy matches`);
  
  // PHASE 3: Category Matching (same trade code)
  console.log(`[MATCHING] Phase 3: Category matching...`);
  phasesUsed.push('category');
  
  const stillUnmatchedSource2: LineItem[] = [];
  
  for (const sourceItem of stillUnmatchedSource) {
    const categoryMatch = findCategoryMatch(sourceItem, unmatchedTarget);
    
    if (categoryMatch) {
      matches.push({
        phase: 'CATEGORY',
        confidence: categoryMatch.confidence,
        sourceItem,
        targetItem: categoryMatch.item,
        similarityScore: categoryMatch.similarity,
        quantityMatch: categoryMatch.quantityMatch,
        priceVariance: sourceItem.rcv - categoryMatch.item.rcv,
        priceVariancePercentage: ((sourceItem.rcv - categoryMatch.item.rcv) / categoryMatch.item.rcv) * 100,
        explanation: `Category match: same trade (${sourceItem.tradeCode})`,
      });
      
      // Remove from unmatched
      unmatchedTarget = unmatchedTarget.filter(item => item.lineNumber !== categoryMatch.item.lineNumber);
    } else {
      stillUnmatchedSource2.push(sourceItem);
    }
  }
  
  console.log(`[MATCHING] Phase 3 complete: ${matches.filter(m => m.phase === 'CATEGORY').length} category matches`);
  
  // PHASE 4: AI Semantic Matching (fallback, optional)
  if (options.includeAI && options.openaiApiKey && stillUnmatchedSource2.length > 0 && unmatchedTarget.length > 0) {
    console.log(`[MATCHING] Phase 4: AI semantic matching...`);
    phasesUsed.push('ai');
    
    try {
      const aiMatches = await performAIMatching(
        stillUnmatchedSource2,
        unmatchedTarget,
        options.openaiApiKey
      );
      
      for (const aiMatch of aiMatches) {
        matches.push(aiMatch);
        
        // Remove from unmatched
        if (aiMatch.targetItem) {
          unmatchedTarget = unmatchedTarget.filter(item => item.lineNumber !== aiMatch.targetItem!.lineNumber);
        }
      }
      
      console.log(`[MATCHING] Phase 4 complete: ${aiMatches.length} AI matches`);
    } catch (error) {
      console.error(`[MATCHING] Phase 4 failed (non-blocking):`, error);
    }
  }
  
  // Calculate statistics
  const statistics = {
    totalSourceItems: sourceEstimate.length,
    totalTargetItems: targetEstimate.length,
    exactMatches: matches.filter(m => m.phase === 'EXACT').length,
    fuzzyMatches: matches.filter(m => m.phase === 'FUZZY').length,
    categoryMatches: matches.filter(m => m.phase === 'CATEGORY').length,
    aiMatches: matches.filter(m => m.phase === 'AI').length,
    unmatched: sourceEstimate.length - matches.length,
    averageConfidence: matches.length > 0 
      ? matches.reduce((sum, m) => sum + m.confidence, 0) / matches.length 
      : 0,
  };
  
  const processingTime = Date.now() - startTime;
  
  console.log(`[MATCHING] Complete in ${processingTime}ms`);
  console.log(`[MATCHING] Statistics:`, statistics);
  
  return {
    matches,
    unmatchedSource: stillUnmatchedSource2,
    unmatchedTarget,
    statistics,
    metadata: {
      processingTime,
      phasesUsed,
    },
  };
}

/**
 * PHASE 1: Find exact match
 */
function findExactMatch(sourceItem: LineItem, targetItems: LineItem[]): LineItem | null {
  for (const targetItem of targetItems) {
    // Exact match criteria:
    // 1. Identical description (case-insensitive)
    // 2. Same quantity (within 1% tolerance)
    // 3. Same or compatible unit
    
    const descriptionMatch = sourceItem.description.toLowerCase().trim() === 
                            targetItem.description.toLowerCase().trim();
    
    const quantityMatch = Math.abs(sourceItem.quantity - targetItem.quantity) < sourceItem.quantity * 0.01;
    
    const unitMatch = sourceItem.unit.toUpperCase() === targetItem.unit.toUpperCase() ||
                     areUnitsCompatible(sourceItem.unit, targetItem.unit);
    
    if (descriptionMatch && quantityMatch && unitMatch) {
      return targetItem;
    }
  }
  
  return null;
}

/**
 * PHASE 2: Find fuzzy match using string similarity
 */
function findFuzzyMatch(
  sourceItem: LineItem,
  targetItems: LineItem[],
  minScore: number
): { item: LineItem; similarity: number; quantityMatch: boolean } | null {
  
  let bestMatch: { item: LineItem; similarity: number; quantityMatch: boolean } | null = null;
  let bestScore = 0;
  
  for (const targetItem of targetItems) {
    // Calculate string similarity
    const similarity = calculateStringSimilarity(
      sourceItem.description.toLowerCase(),
      targetItem.description.toLowerCase()
    );
    
    if (similarity >= minScore && similarity > bestScore) {
      // Check quantity match (within 10% tolerance for fuzzy)
      const quantityMatch = Math.abs(sourceItem.quantity - targetItem.quantity) < sourceItem.quantity * 0.1;
      
      bestMatch = {
        item: targetItem,
        similarity,
        quantityMatch,
      };
      bestScore = similarity;
    }
  }
  
  return bestMatch;
}

/**
 * PHASE 3: Find category match (same trade code)
 */
function findCategoryMatch(
  sourceItem: LineItem,
  targetItems: LineItem[]
): { item: LineItem; similarity: number; quantityMatch: boolean; confidence: number } | null {
  
  // Filter by same trade code
  const sameTradeItems = targetItems.filter(item => 
    item.tradeCode === sourceItem.tradeCode
  );
  
  if (sameTradeItems.length === 0) {
    return null;
  }
  
  // Find best match within same trade
  let bestMatch: { item: LineItem; similarity: number; quantityMatch: boolean; confidence: number } | null = null;
  let bestScore = 0;
  
  for (const targetItem of sameTradeItems) {
    const similarity = calculateStringSimilarity(
      sourceItem.description.toLowerCase(),
      targetItem.description.toLowerCase()
    );
    
    // Check action type match (remove vs install)
    const actionMatch = sourceItem.actionType === targetItem.actionType;
    
    // Check quantity similarity (within 20% for category matching)
    const quantityMatch = Math.abs(sourceItem.quantity - targetItem.quantity) < sourceItem.quantity * 0.2;
    
    // Calculate confidence based on multiple factors
    let confidence = 60; // Base confidence for category match
    confidence += similarity * 20; // Up to +20 for description similarity
    if (actionMatch) confidence += 10;
    if (quantityMatch) confidence += 10;
    
    if (similarity > bestScore) {
      bestMatch = {
        item: targetItem,
        similarity,
        quantityMatch,
        confidence: Math.min(85, confidence), // Cap at 85% for category matches
      };
      bestScore = similarity;
    }
  }
  
  return bestMatch;
}

/**
 * PHASE 4: AI Semantic Matching (fallback)
 */
async function performAIMatching(
  sourceItems: LineItem[],
  targetItems: LineItem[],
  apiKey: string
): Promise<Match[]> {
  
  // Limit to prevent excessive API costs
  const maxItems = 10;
  const limitedSource = sourceItems.slice(0, maxItems);
  const limitedTarget = targetItems.slice(0, maxItems);
  
  const matches: Match[] = [];
  
  // Create prompt for AI matching
  const prompt = `You are an expert at matching construction estimate line items. Given a source line item, find the best matching target line item.

Source items:
${limitedSource.map((item, i) => `${i + 1}. ${item.description} (${item.quantity} ${item.unit})`).join('\n')}

Target items:
${limitedTarget.map((item, i) => `${i + 1}. ${item.description} (${item.quantity} ${item.unit})`).join('\n')}

For each source item, identify the best matching target item (if any). Return JSON array:
[
  {
    "sourceIndex": 1,
    "targetIndex": 2,
    "confidence": 75,
    "explanation": "Both items describe drywall installation"
  }
]

Return empty array [] if no matches found. Only return matches with confidence >= 60.`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          { role: 'system', content: 'You are a construction estimate matching expert. Return only valid JSON.' },
          { role: 'user', content: prompt },
        ],
        temperature: 0.0,
        response_format: { type: 'json_object' },
      }),
    });
    
    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }
    
    const data = await response.json();
    const content = data.choices[0].message.content;
    const aiMatches = JSON.parse(content);
    
    // Convert AI matches to Match objects
    for (const aiMatch of aiMatches) {
      const sourceItem = limitedSource[aiMatch.sourceIndex - 1];
      const targetItem = limitedTarget[aiMatch.targetIndex - 1];
      
      if (sourceItem && targetItem) {
        const quantityMatch = Math.abs(sourceItem.quantity - targetItem.quantity) < sourceItem.quantity * 0.2;
        
        matches.push({
          phase: 'AI',
          confidence: aiMatch.confidence,
          sourceItem,
          targetItem,
          similarityScore: aiMatch.confidence / 100,
          quantityMatch,
          priceVariance: sourceItem.rcv - targetItem.rcv,
          priceVariancePercentage: ((sourceItem.rcv - targetItem.rcv) / targetItem.rcv) * 100,
          explanation: `AI semantic match: ${aiMatch.explanation}`,
        });
      }
    }
    
  } catch (error) {
    console.error('[MATCHING] AI matching failed:', error);
  }
  
  return matches;
}

/**
 * Calculate string similarity using Levenshtein distance
 */
function calculateStringSimilarity(str1: string, str2: string): number {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;
  
  if (longer.length === 0) {
    return 1.0;
  }
  
  const distance = levenshteinDistance(longer, shorter);
  return (longer.length - distance) / longer.length;
}

/**
 * Calculate Levenshtein distance between two strings
 */
function levenshteinDistance(str1: string, str2: string): number {
  const matrix: number[][] = [];
  
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }
  
  return matrix[str2.length][str1.length];
}

/**
 * Generate matching summary report
 */
export function generateMatchingSummary(result: MatchingResult): string {
  const { matches, unmatchedSource, unmatchedTarget, statistics } = result;
  
  let summary = `MATCHING ANALYSIS SUMMARY\n`;
  summary += `${'='.repeat(60)}\n\n`;
  
  summary += `STATISTICS:\n`;
  summary += `- Total source items: ${statistics.totalSourceItems}\n`;
  summary += `- Total target items: ${statistics.totalTargetItems}\n`;
  summary += `- Exact matches: ${statistics.exactMatches} (${(statistics.exactMatches / statistics.totalSourceItems * 100).toFixed(1)}%)\n`;
  summary += `- Fuzzy matches: ${statistics.fuzzyMatches} (${(statistics.fuzzyMatches / statistics.totalSourceItems * 100).toFixed(1)}%)\n`;
  summary += `- Category matches: ${statistics.categoryMatches} (${(statistics.categoryMatches / statistics.totalSourceItems * 100).toFixed(1)}%)\n`;
  summary += `- AI matches: ${statistics.aiMatches} (${(statistics.aiMatches / statistics.totalSourceItems * 100).toFixed(1)}%)\n`;
  summary += `- Unmatched: ${statistics.unmatched} (${(statistics.unmatched / statistics.totalSourceItems * 100).toFixed(1)}%)\n`;
  summary += `- Average confidence: ${statistics.averageConfidence.toFixed(1)}%\n\n`;
  
  if (unmatchedSource.length > 0) {
    summary += `UNMATCHED SOURCE ITEMS (${unmatchedSource.length}):\n`;
    for (const item of unmatchedSource.slice(0, 10)) {
      summary += `- Line ${item.lineNumber}: ${item.description} (${item.quantity} ${item.unit})\n`;
    }
    if (unmatchedSource.length > 10) {
      summary += `... and ${unmatchedSource.length - 10} more\n`;
    }
    summary += `\n`;
  }
  
  if (unmatchedTarget.length > 0) {
    summary += `UNMATCHED TARGET ITEMS (${unmatchedTarget.length}):\n`;
    for (const item of unmatchedTarget.slice(0, 10)) {
      summary += `- Line ${item.lineNumber}: ${item.description} (${item.quantity} ${item.unit})\n`;
    }
    if (unmatchedTarget.length > 10) {
      summary += `... and ${unmatchedTarget.length - 10} more\n`;
    }
  }
  
  return summary;
}
