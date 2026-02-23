/**
 * PHOTO CLASSIFICATION ENGINE
 * Uses GPT-4 Vision for damage assessment
 * NO MEASUREMENT GUESSING - only classifies visible indicators
 */

export type MaterialCategory = 
  | 'DRYWALL'
  | 'INSULATION'
  | 'FLOORING'
  | 'ROOFING'
  | 'FRAMING'
  | 'ELECTRICAL'
  | 'PLUMBING'
  | 'HVAC'
  | 'EXTERIOR'
  | 'OTHER';

export type DamageType = 
  | 'WATER_SATURATION'
  | 'FIRE_DAMAGE'
  | 'SMOKE_DAMAGE'
  | 'MOLD_GROWTH'
  | 'STRUCTURAL_DAMAGE'
  | 'WIND_DAMAGE'
  | 'IMPACT_DAMAGE'
  | 'DETERIORATION'
  | 'NONE';

export type SeverityIndicator = 'SEVERE' | 'MODERATE' | 'MINOR' | 'MINIMAL';

export interface PhotoClassification {
  material: MaterialCategory;
  damageType: DamageType;
  severity: SeverityIndicator;
  visibleIndicators: string[];
  moldIndicators?: {
    present: boolean;
    extent: 'WIDESPREAD' | 'LOCALIZED' | 'MINIMAL' | 'NONE';
    color?: string;
  };
  structuralIndicators?: {
    present: boolean;
    concerns: string[];
  };
  missingComponents?: string[];
  confidence: number;
  aiReasoning: string;
}

export interface PhotoAnalysisResult {
  classifications: PhotoClassification[];
  overallSeverity: SeverityIndicator;
  criticalFlags: string[];
  summary: string;
  metadata: {
    photosAnalyzed: number;
    aiModel: string;
    processingTimeMs: number;
  };
}

/**
 * Analyze photo using GPT-4 Vision
 */
async function analyzePhotoWithVision(
  imageBase64: string,
  openaiApiKey: string
): Promise<PhotoClassification> {
  
  try {
    // Dynamic import of OpenAI
    const { default: OpenAI } = await import('openai');
    const openai = new OpenAI({ apiKey: openaiApiKey });
    
    const systemPrompt = `You are a damage assessment specialist analyzing property damage photos.

CRITICAL RULES:
- DO NOT attempt to measure or estimate square footage
- DO NOT guess quantities
- ONLY identify visible materials, damage types, and severity indicators
- Be specific about what you observe
- State confidence level

Analyze the image and return ONLY valid JSON with this structure:
{
  "material": "DRYWALL|INSULATION|FLOORING|ROOFING|FRAMING|ELECTRICAL|PLUMBING|HVAC|EXTERIOR|OTHER",
  "damageType": "WATER_SATURATION|FIRE_DAMAGE|SMOKE_DAMAGE|MOLD_GROWTH|STRUCTURAL_DAMAGE|WIND_DAMAGE|IMPACT_DAMAGE|DETERIORATION|NONE",
  "severity": "SEVERE|MODERATE|MINOR|MINIMAL",
  "visibleIndicators": ["indicator 1", "indicator 2"],
  "moldIndicators": {
    "present": true|false,
    "extent": "WIDESPREAD|LOCALIZED|MINIMAL|NONE",
    "color": "description if present"
  },
  "structuralIndicators": {
    "present": true|false,
    "concerns": ["concern 1", "concern 2"]
  },
  "missingComponents": ["component 1", "component 2"],
  "confidence": 0.0-1.0,
  "aiReasoning": "Brief explanation of classification"
}`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4-vision-preview',
      max_tokens: 1000,
      temperature: 0.0,
      messages: [
        {
          role: 'system',
          content: systemPrompt
        },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Analyze this damage photo. DO NOT estimate measurements or quantities. Only classify visible damage.'
            },
            {
              type: 'image_url',
              image_url: {
                url: `data:image/jpeg;base64,${imageBase64}`
              }
            }
          ]
        }
      ]
    });
    
    const responseText = completion.choices[0]?.message?.content;
    
    if (!responseText) {
      throw new Error('Empty response from GPT-4 Vision');
    }
    
    // Remove markdown if present
    let cleaned = responseText.trim();
    cleaned = cleaned.replace(/^```json\s*/i, '');
    cleaned = cleaned.replace(/^```\s*/i, '');
    cleaned = cleaned.replace(/\s*```$/i, '');
    
    const parsed = JSON.parse(cleaned);
    
    // Validate structure
    if (!parsed.material || !parsed.damageType || !parsed.severity) {
      throw new Error('Invalid classification structure');
    }
    
    return parsed as PhotoClassification;
    
  } catch (error: any) {
    console.error('[PHOTO] Vision analysis failed:', error.message);
    
    // Return fallback classification
    return {
      material: 'OTHER',
      damageType: 'NONE',
      severity: 'MINIMAL',
      visibleIndicators: ['Analysis failed'],
      confidence: 0,
      aiReasoning: `Vision analysis failed: ${error.message}`
    };
  }
}

/**
 * Analyze multiple photos
 */
export async function analyzePhotos(
  images: Array<{ base64: string; filename?: string }>,
  openaiApiKey: string
): Promise<PhotoAnalysisResult> {
  
  const startTime = Date.now();
  const classifications: PhotoClassification[] = [];
  
  for (const image of images) {
    const classification = await analyzePhotoWithVision(image.base64, openaiApiKey);
    classifications.push(classification);
  }
  
  // Determine overall severity
  const severities = classifications.map(c => c.severity);
  const overallSeverity = severities.includes('SEVERE') ? 'SEVERE'
    : severities.includes('MODERATE') ? 'MODERATE'
    : severities.includes('MINOR') ? 'MINOR'
    : 'MINIMAL';
  
  // Collect critical flags
  const criticalFlags: string[] = [];
  
  for (const c of classifications) {
    if (c.severity === 'SEVERE') {
      criticalFlags.push(`Severe ${c.damageType.toLowerCase().replace('_', ' ')} observed in ${c.material.toLowerCase()}`);
    }
    
    if (c.moldIndicators?.present && c.moldIndicators.extent !== 'MINIMAL') {
      criticalFlags.push(`Mold growth detected: ${c.moldIndicators.extent.toLowerCase()}`);
    }
    
    if (c.structuralIndicators?.present) {
      criticalFlags.push(`Structural concerns: ${c.structuralIndicators.concerns.join(', ')}`);
    }
  }
  
  // Generate summary
  const summary = classifications.length > 0
    ? `Analyzed ${classifications.length} photo(s). Overall severity: ${overallSeverity}. ${criticalFlags.length > 0 ? `${criticalFlags.length} critical flag(s) identified.` : 'No critical issues flagged.'}`
    : 'No photos analyzed.';
  
  const processingTimeMs = Date.now() - startTime;
  
  return {
    classifications,
    overallSeverity,
    criticalFlags,
    summary,
    metadata: {
      photosAnalyzed: classifications.length,
      aiModel: 'gpt-4-vision-preview',
      processingTimeMs
    }
  };
}

/**
 * Cross-check photo severity against estimate scope
 */
export function crossCheckPhotoVsEstimate(
  photoAnalysis: PhotoAnalysisResult,
  estimateTotalRCV: number
): {
  consistent: boolean;
  flags: string[];
} {
  
  const flags: string[] = [];
  
  // Check if severe damage but low estimate
  if (photoAnalysis.overallSeverity === 'SEVERE' && estimateTotalRCV < 10000) {
    flags.push('Photos show severe damage but estimate total is < $10,000');
  }
  
  // Check for mold but no mitigation
  const hasMold = photoAnalysis.classifications.some(c => 
    c.moldIndicators?.present && c.moldIndicators.extent !== 'MINIMAL'
  );
  
  if (hasMold) {
    flags.push('Photos show mold growth - verify mitigation and antimicrobial treatment in estimate');
  }
  
  // Check for structural damage
  const hasStructuralConcerns = photoAnalysis.classifications.some(c => 
    c.structuralIndicators?.present
  );
  
  if (hasStructuralConcerns) {
    flags.push('Photos show structural concerns - verify framing/structural work in estimate');
  }
  
  // Check for fire/smoke damage
  const hasFireSmoke = photoAnalysis.classifications.some(c => 
    c.damageType === 'FIRE_DAMAGE' || c.damageType === 'SMOKE_DAMAGE'
  );
  
  if (hasFireSmoke) {
    flags.push('Photos show fire/smoke damage - verify cleaning and sealing in estimate');
  }
  
  return {
    consistent: flags.length === 0,
    flags
  };
}
