/**
 * ESTIMATE RISK GUARDRAILS
 * Blocks prohibited language and requests
 * Prevents negotiation, coverage disputes, and legal advice
 * Temperature: N/A (rule-based)
 */

// Prohibited phrases that trigger immediate rejection
const PROHIBITED_PHRASES = [
  // Payment/Entitlement language
  'should be paid',
  'must pay',
  'owed to',
  'entitled to',
  'deserve',
  'compensation for',
  
  // Legal/Bad faith language
  'bad faith',
  'breach of contract',
  'sue',
  'lawsuit',
  'attorney',
  'lawyer',
  'legal action',
  'litigation',
  
  // Negotiation/Dispute language
  'demand',
  'insist',
  'require payment',
  'force them',
  'make them pay',
  'fight',
  'dispute',
  'argue',
  'negotiate',
  
  // Coverage interpretation
  'coverage should',
  'policy requires',
  'they have to',
  'obligation to pay',
  'contractual duty',
  
  // Unfair/Bias language
  'unfair',
  'cheating',
  'lowball',
  'ripping off',
  'scam',
  'fraud'
];

// Prohibited request types
const PROHIBITED_REQUESTS = [
  'write a demand letter',
  'draft a complaint',
  'help me negotiate',
  'what should i say',
  'how do i argue',
  'prove they\'re wrong',
  'fight this estimate',
  'dispute this',
  'challenge the adjuster',
  'interpret my policy',
  'what does my policy say',
  'am i covered',
  'should this be covered',
  'coverage question',
  'legal advice',
  'what are my rights'
];

exports.handler = async (event, context) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { text, userInput, lineItems } = JSON.parse(event.body);

    if (!text && !userInput && !lineItems) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: 'Missing required field: text, userInput, or lineItems'
        })
      };
    }

    // CRITICAL FIX: Include lineItems in guardrail check
    const lineItemsText = (lineItems || []).join(' ');
    const content = (text || '') + ' ' + (userInput || '') + ' ' + lineItemsText;
    const contentLower = content.toLowerCase();

    // Check for prohibited phrases
    const foundProhibitedPhrases = PROHIBITED_PHRASES.filter(phrase =>
      contentLower.includes(phrase)
    );

    if (foundProhibitedPhrases.length > 0) {
      return {
        statusCode: 403,
        body: JSON.stringify({
          error: 'Prohibited content detected',
          reason: 'This system provides neutral estimate analysis only',
          violations: foundProhibitedPhrases,
          message: 'This tool does not provide negotiation assistance, coverage interpretation, or legal advice. It only identifies potential omissions or under-scoping in estimates.'
        })
      };
    }

    // Check for prohibited request types
    const foundProhibitedRequests = PROHIBITED_REQUESTS.filter(request =>
      contentLower.includes(request)
    );

    if (foundProhibitedRequests.length > 0) {
      return {
        statusCode: 403,
        body: JSON.stringify({
          error: 'Prohibited request detected',
          reason: 'This system does not handle this type of request',
          violations: foundProhibitedRequests,
          message: 'This tool provides factual estimate review only. For coverage questions, consult your policy. For legal matters, consult an attorney. For negotiations, work directly with your carrier or hire a public adjuster.'
        })
      };
    }

    // Additional pattern detection for sneaky attempts
    const suspiciousPatterns = [
      /how (do|can) i (get|make|force)/i,
      /they (should|must|need to|have to) pay/i,
      /what (should|can) i (say|tell|write)/i,
      /help me (fight|argue|dispute|negotiate)/i,
      /am i (entitled|owed|covered)/i
    ];

    const foundSuspiciousPatterns = suspiciousPatterns.filter(pattern =>
      pattern.test(content)
    );

    if (foundSuspiciousPatterns.length > 0) {
      return {
        statusCode: 403,
        body: JSON.stringify({
          error: 'Request outside system scope',
          reason: 'This system provides neutral estimate analysis only',
          message: 'This tool identifies potential omissions in estimates. It does not provide advice on negotiations, coverage, or claim strategy.'
        })
      };
    }

    // Content passes all guardrails
    return {
      statusCode: 200,
      body: JSON.stringify({
        status: 'APPROVED',
        message: 'Content passes safety guardrails'
      })
    };

  } catch (error) {
    console.error('Guardrail check error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Guardrail check failed',
        message: error.message
      })
    };
  }
};

