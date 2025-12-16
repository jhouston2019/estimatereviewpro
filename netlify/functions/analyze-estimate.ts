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

export const handler: Handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const { reviewId, fileUrl, fileType } = JSON.parse(event.body || "{}");

    if (!reviewId || !fileUrl) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Missing reviewId or fileUrl" }),
      };
    }

    // Download file from Supabase Storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from("uploads")
      .download(fileUrl.split("/uploads/")[1]);

    if (downloadError) {
      throw new Error(`Failed to download file: ${downloadError.message}`);
    }

    // Convert to base64 for OpenAI Vision
    const buffer = await fileData.arrayBuffer();
    const base64 = Buffer.from(buffer).toString("base64");
    const mimeType = fileType === "pdf" ? "application/pdf" : "image/jpeg";

    // Import production prompts
    const { ESTIMATE_EXTRACTION_SYSTEM, ESTIMATE_EXTRACTION_USER } = await import(
      "../../lib/ai/prompts"
    );

    // Determine document type
    const documentType = fileUrl.includes("contractor") ? "contractor" : "carrier";

    // Use OpenAI Vision to extract line items with production prompts
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: ESTIMATE_EXTRACTION_SYSTEM,
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: ESTIMATE_EXTRACTION_USER(documentType as "contractor" | "carrier"),
            },
            {
              type: "image_url",
              image_url: {
                url: `data:${mimeType};base64,${base64}`,
              },
            },
          ],
        },
      ],
      response_format: { type: "json_object" },
      max_tokens: 4096,
    });

    const content = response.choices[0].message.content || "{}";
    const parsed = JSON.parse(content);
    
    // Support both new format (items) and legacy format (lineItems)
    const lineItems: LineItem[] = parsed.items || parsed.lineItems || [];

    // Validate and normalize line items
    const validatedItems = lineItems.map((item) => ({
      trade: item.trade || "General",
      description: item.description || "Unknown item",
      qty: item.quantity || item.qty || 1,
      unit: item.unit || "EA",
      unit_price: item.unitPrice || item.unit_price || 0,
      total: item.total || 0,
      notes: item.notes,
    }));

    // Calculate totals
    const totalAmount = validatedItems.reduce((sum, item) => sum + item.total, 0);
    const itemCount = validatedItems.length;

    const analysisResult = {
      lineItems: validatedItems,
      summary: {
        totalAmount,
        itemCount,
        trades: [...new Set(validatedItems.map((item) => item.trade))],
      },
      extractedAt: new Date().toISOString(),
      documentType: parsed.metadata?.documentType || "unknown",
    };

    // Save to database
    const { error: updateError } = await supabase
      .from("reviews")
      .update({
        ai_analysis_json: analysisResult,
      })
      .eq("id", reviewId);

    if (updateError) {
      throw new Error(`Failed to save analysis: ${updateError.message}`);
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        analysis: analysisResult,
      }),
    };
  } catch (error: any) {
    console.error("Error in analyze-estimate:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: error.message || "Failed to analyze estimate",
      }),
    };
  }
};

