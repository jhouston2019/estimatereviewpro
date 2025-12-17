/**
 * ESTIMATE OUTPUT FORMATTER
 * Formats analysis results into neutral findings report
 * NO recommendations, NO advocacy, NO pricing opinions
 * Output must be factual, neutral, and boring
 */

exports.handler = async (event, context) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { analysis, classification, metadata } = JSON.parse(event.body);

    if (!analysis) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: 'Missing analysis data'
        })
      };
    }

    // Build neutral findings report
    const report = {
      title: 'Estimate Review Findings',
      generated: new Date().toISOString(),
      classification: classification || 'UNKNOWN',
      
      summary: buildSummary(analysis),
      includedItems: buildIncludedItems(analysis),
      potentialOmissions: buildPotentialOmissions(analysis),
      potentialUnderScoping: buildPotentialUnderScoping(analysis),
      limitations: buildLimitations(),
      
      metadata: {
        totalLineItems: analysis.totalLineItems || 0,
        categoriesFound: analysis.includedCategories?.length || 0,
        categoriesMissing: analysis.missingCategories?.length || 0,
        issuesDetected: (analysis.zeroQuantityItems?.length || 0) + 
                       (analysis.potentialUnderScoping?.length || 0)
      }
    };

    return {
      statusCode: 200,
      body: JSON.stringify({
        status: 'SUCCESS',
        report
      })
    };

  } catch (error) {
    console.error('Formatting error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Formatting failed',
        message: error.message
      })
    };
  }
};

function buildSummary(analysis) {
  const lines = [];
  
  lines.push('ESTIMATE STRUCTURE REVIEW');
  lines.push('');
  lines.push('═'.repeat(80));
  lines.push('');
  lines.push('AUTOMATED OBSERVATIONAL ANALYSIS');
  lines.push('This is an automated, observational estimate analysis.');
  lines.push('No coverage, pricing, or entitlement determinations are made.');
  lines.push('');
  lines.push('═'.repeat(80));
  lines.push('');
  lines.push(`This report identifies ${analysis.totalLineItems || 0} line items in the submitted estimate.`);
  lines.push('');
  
  if (analysis.observations && analysis.observations.length > 0) {
    lines.push('Key Observations:');
    analysis.observations.forEach(obs => {
      lines.push(`• ${obs}`);
    });
  } else {
    lines.push('No significant observations noted.');
  }
  
  lines.push('');
  lines.push('This is a factual review only. It does not constitute advice, recommendations, or opinions on coverage, pricing, or claim strategy.');
  
  return lines.join('\n');
}

function buildIncludedItems(analysis) {
  const lines = [];
  
  lines.push('DETECTED TRADES');
  lines.push('');
  lines.push('The following categories were detected in the estimate:');
  lines.push('');
  
  if (analysis.includedCategories && analysis.includedCategories.length > 0) {
    analysis.includedCategories.forEach(cat => {
      lines.push(`• ${cat.category}`);
    });
  } else {
    lines.push('• No standard categories detected');
  }
  
  return lines.join('\n');
}

function buildPotentialOmissions(analysis) {
  const lines = [];
  
  lines.push('CATEGORIES NOT DETECTED');
  lines.push('');
  lines.push('The following categories were NOT detected in the estimate:');
  lines.push('');
  
  if (analysis.missingCategories && analysis.missingCategories.length > 0) {
    analysis.missingCategories.forEach(cat => {
      lines.push(`• ${cat.category}`);
      if (cat.note) {
        lines.push(`  Note: ${cat.note}`);
      }
    });
    lines.push('');
    lines.push('CRITICAL DISCLAIMER: Absence from this estimate does not indicate these items are required, covered, owed, or applicable to your specific claim. This is a factual observation only. Categories not detected may be intentionally excluded, not applicable, or not covered under the policy.');
  } else {
    lines.push('• All expected categories detected');
  }
  
  return lines.join('\n');
}

function buildPotentialUnderScoping(analysis) {
  const lines = [];
  
  lines.push('LINE ITEM OBSERVATIONS');
  lines.push('');
  
  const allIssues = [
    ...(analysis.zeroQuantityItems || []),
    ...(analysis.potentialUnderScoping || [])
  ];
  
  if (allIssues.length > 0) {
    lines.push('The following line items have structural observations:');
    lines.push('');
    
    allIssues.forEach(issue => {
      lines.push(`Line ${issue.lineNumber}:`);
      lines.push(`  Description: ${issue.description}`);
      lines.push(`  Observation: ${issue.issue}`);
      lines.push('');
    });
    
    lines.push('CRITICAL DISCLAIMER: These are factual observations based on the line item text. They do not constitute opinions on what should be included, paid, covered, or owed. These observations do not indicate carrier error, under-payment, or policy violations.');
  } else {
    lines.push('No structural observations noted.');
  }
  
  return lines.join('\n');
}

function buildLimitations() {
  const lines = [];
  
  lines.push('LIMITATIONS OF THIS REVIEW');
  lines.push('');
  lines.push('This review is subject to the following limitations:');
  lines.push('');
  lines.push('• This is a text-based analysis only. No physical inspection was performed.');
  lines.push('• This review does not interpret insurance policy coverage or exclusions.');
  lines.push('• This review does not provide opinions on pricing, rates, or cost reasonableness.');
  lines.push('• This review does not constitute advice on claim strategy or negotiations.');
  lines.push('• Missing items may not be applicable, required, or covered under your policy.');
  lines.push('• This review does not replace professional inspection or expert consultation.');
  lines.push('• Results depend on the quality and completeness of the submitted estimate.');
  lines.push('');
  lines.push('For coverage questions, consult your insurance policy or agent.');
  lines.push('For technical questions, consult a licensed contractor or engineer.');
  lines.push('For legal questions, consult an attorney.');
  
  return lines.join('\n');
}

