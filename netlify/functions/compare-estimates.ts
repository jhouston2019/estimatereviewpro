import { Handler } from "@netlify/functions";
import { createClient } from "@supabase/supabase-js";
import OpenAI from "openai";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

interface LineItem {
  trade: string;
  description: string;
  qty: number;
  unit: string;
  unit_price: number;
  total: number;
}

interface ComparisonResult {
  missingItems: Array<{
    item: LineItem;
    reason: string;
  }>;
  underpricedItems: Array<{
    contractorItem: LineItem;
    carrierItem: LineItem;
    priceDifference: number;
    percentDifference: number;
  }>;
  miscategorizedItems: Array<{
    item: LineItem;
    expectedTrade: string;
    actualTrade: string;
  }>;
  summary: {
    contractorTotal: number;
    carrierTotal: number;
    difference: number;
    percentDifference: number;
    keyFindings: string[];
  };
}

export const handler: Handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const { reviewId } = JSON.parse(event.body || "{}");

    if (!reviewId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Missing reviewId" }),
      };
    }

    // Fetch review data
    const { data: review, error: fetchError } = await supabase
      .from("reviews")
      .select("*")
      .eq("id", reviewId)
      .single();

    if (fetchError || !review) {
      throw new Error("Review not found");
    }

    const contractorAnalysis = review.ai_analysis_json as any;
    const carrierAnalysis = review.ai_comparison_json as any;

    if (!contractorAnalysis?.lineItems) {
      throw new Error("Contractor estimate not analyzed yet");
    }

    const contractorItems: LineItem[] = contractorAnalysis.lineItems;
    let carrierItems: LineItem[] = [];

    // If carrier estimate exists, it should be in a separate analysis
    // For now, we'll use AI to compare
    if (review.carrier_estimate_url) {
      // Import production prompts
      const { ESTIMATE_COMPARISON_SYSTEM, ESTIMATE_COMPARISON_USER } = await import(
        "../../lib/ai/prompts"
      );

      // Use production prompts for comparison
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: ESTIMATE_COMPARISON_SYSTEM,
          },
          {
            role: "user",
            content: ESTIMATE_COMPARISON_USER(contractorItems, carrierItems),
          },
        ],
        response_format: { type: "json_object" },
        max_tokens: 4096,
      });

      const comparisonResult: ComparisonResult = JSON.parse(
        response.choices[0].message.content || "{}"
      );

      // Save comparison result
      const { error: updateError } = await supabase
        .from("reviews")
        .update({
          ai_comparison_json: comparisonResult,
        })
        .eq("id", reviewId);

      if (updateError) {
        throw new Error(`Failed to save comparison: ${updateError.message}`);
      }

      return {
        statusCode: 200,
        body: JSON.stringify({
          success: true,
          comparison: comparisonResult,
        }),
      };
    } else {
      // No carrier estimate - just provide summary
      const contractorTotal = contractorItems.reduce(
        (sum, item) => sum + item.total,
        0
      );

      const summaryResult = {
        missingItems: [],
        underpricedItems: [],
        miscategorizedItems: [],
        summary: {
          contractorTotal,
          carrierTotal: 0,
          difference: contractorTotal,
          percentDifference: 100,
          keyFindings: [
            "No carrier estimate provided for comparison",
            `Contractor total: $${contractorTotal.toFixed(2)}`,
            `${contractorItems.length} line items in contractor estimate`,
          ],
        },
      };

      const { error: updateError } = await supabase
        .from("reviews")
        .update({
          ai_comparison_json: summaryResult,
        })
        .eq("id", reviewId);

      if (updateError) {
        throw new Error(`Failed to save comparison: ${updateError.message}`);
      }

      return {
        statusCode: 200,
        body: JSON.stringify({
          success: true,
          comparison: summaryResult,
        }),
      };
    }
  } catch (error: any) {
    console.error("Error in compare-estimates:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: error.message || "Failed to compare estimates",
      }),
    };
  }
};

