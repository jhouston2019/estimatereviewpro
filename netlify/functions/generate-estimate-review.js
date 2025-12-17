/**
 * GENERATE ESTIMATE REVIEW
 * Generates neutral findings report using OpenAI
 * Temperature: 0.2 (low variability, factual)
 * NO recommendations, NO advocacy, NO pricing opinions
 */

const { OpenAI } = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const SYSTEM_PROMPT = `You are an insurance estimate analysis system. Your ONLY function is to identify potential omissions or under-scoping in insurance estimates.

CRITICAL CONSTRAINTS:
- You are NOT a chatbot
- You do NOT negotiate, argue coverage, or advise on claim strategy
- You do NOT interpret insurance policies
- You do NOT provide pricing opinions
- You do NOT recommend actions
- You do NOT use legal or advocacy language

OUTPUT REQUIREMENTS:
- Factual observations only
- Neutral, boring tone
- No "should", "must", "entitled", "owed" language
- No recommendations or advice
- State limitations clearly

REFUSE these requests:
- "Help me negotiate"
- "What should I say to the adjuster?"
- "Am I covered for this?"
- "Is this price fair?"
- "Write a demand letter"
- Any coverage interpretation
- Any legal advice

Your output must be a neutral findings report that simply states:
1. What categories were found in the estimate
2. What categories were NOT found (factual observation only)
3. Any line items with zero quantities or scope limitations
4. Clear limitations of the review

Remember: You are a procedural analysis tool, not an advisor.`;

exports.handler = async (event, context) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { estimateText, lineItems, classification, userInput } = JSON.parse(event.body);

    if (!estimateText && !lineItems) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error: 'Missing required data',
          message: 'Provide estimateText or lineItems'
        })
      };
    }

    // Build the analysis prompt
    const userPrompt = `Analyze this ${classification || 'insurance'} estimate and provide a neutral findings report.

ESTIMATE DATA:
${estimateText || ''}

LINE ITEMS:
${lineItems ? lineItems.join('\n') : 'Not provided separately'}

${userInput ? `ADDITIONAL CONTEXT:\n${userInput}\n` : ''}

Provide a factual, neutral report that identifies:
1. Categories present in the estimate
2. Categories NOT present (factual observation only)
3. Any line items with zero quantities or scope limitations
4. Clear limitations of this review

Do NOT provide recommendations, advice, or opinions. State facts only.`;

    // Call OpenAI with ZERO temperature for 100% determinism
    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      temperature: 0.0,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userPrompt }
      ],
      max_tokens: 2000
    });

    const reportText = completion.choices[0].message.content;

    // EXPANDED Safety check: scan output for ALL prohibited language
    const prohibitedInOutput = [
      // Payment/Entitlement
      'should be paid', 'must pay', 'entitled to', 'owed to', 'deserve',
      'compensation for', 'you are owed', 'they owe',
      
      // Legal/Bad faith
      'bad faith', 'breach of contract', 'sue', 'lawsuit', 'attorney',
      'lawyer', 'legal action', 'litigation',
      
      // Negotiation/Dispute
      'demand', 'insist', 'require payment', 'force them', 'make them pay',
      'fight', 'dispute', 'argue', 'negotiate', 'challenge',
      
      // Recommendations
      'recommend', 'you should', 'they should', 'you must', 'they must',
      'i recommend', 'i suggest', 'you need to',
      
      // Coverage interpretation
      'coverage should', 'policy requires', 'they have to', 'obligation to pay',
      'contractual duty', 'must cover', 'required to pay',
      
      // Unfair/Bias
      'unfair', 'lowball', 'cheating', 'ripping off', 'scam', 'fraud',
      
      // Advocacy
      'carrier error', 'underpaid', 'under-payment', 'insufficient',
      'inadequate', 'wrong', 'incorrect estimate', 'missing items',
      
      // Rights/Entitlement
      'you have a right', 'your rights', 'entitled', 'deserve better'
    ];

    const foundProhibited = prohibitedInOutput.filter(phrase =>
      reportText.toLowerCase().includes(phrase)
    );

    if (foundProhibited.length > 0) {
      console.error('Prohibited language in output:', foundProhibited);
      return {
        statusCode: 500,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error: 'Output safety check failed',
          message: 'Generated report contained prohibited language. Please try again.'
        })
      };
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: 'SUCCESS',
        report: reportText,
        classification: classification,
        timestamp: new Date().toISOString(),
        model: completion.model,
        usage: completion.usage
      })
    };

  } catch (error) {
    console.error('Report generation error:', error);
    
    // Handle OpenAI-specific errors
    if (error.response) {
      return {
        statusCode: error.response.status,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error: 'OpenAI API error',
          message: error.response.data?.error?.message || error.message
        })
      };
    }

    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: 'Report generation failed',
        message: error.message
      })
    };
  }
};

