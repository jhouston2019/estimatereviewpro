import { Handler } from "@netlify/functions";
import { createAdminClient } from "../../lib/supabase/admin";
import OpenAI from "openai";
import type { Database } from "../../lib/database.types";

const supabase = createAdminClient();

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

  let reviewId: string | null = null;

  try {
    const { reviewId: id, fileUrl, fileType } = JSON.parse(event.body || "{}");
    reviewId = id;

    if (!reviewId || !fileUrl) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Missing reviewId or fileUrl" }),
      };
    }

    // Update status to analyzing
    await (supabase as any)
      .from("reviews")
      .update({ status: "analyzing" })
      .eq("id", reviewId);

    // Download file from Supabase Storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from("uploads")
      .download(fileUrl.split("/uploads/")[1]);

    if (downloadError) {
      throw new Error(`Failed to download file: ${downloadError.message}`);
    }

    // Server-side file validation
    const ALLOWED_MIME_TYPES = [
      "application/pdf",
      "image/png",
      "image/jpeg",
      "image/jpg",
    ];
    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

    const fileMimeType = fileData.type;
    const fileSize = fileData.size;

    if (!ALLOWED_MIME_TYPES.includes(fileMimeType)) {
      throw new Error(
        `Invalid file type: ${fileMimeType}. Only PDF, PNG, and JPG files are supported.`
      );
    }

    if (fileSize > MAX_FILE_SIZE) {
      throw new Error(
        `File too large: ${(fileSize / 1024 / 1024).toFixed(2)}MB. Maximum size is 10MB.`
      );
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
    const lineItems: any[] = parsed.items || parsed.lineItems || [];

    // Validate and normalize line items
    const validatedItems: LineItem[] = lineItems.map((item: any) => ({
      trade: item.trade || "General",
      description: item.description || "Unknown item",
      qty: item.quantity || item.qty || 1,
      unit: item.unit || "EA",
      unit_price: item.unitPrice || item.unit_price || 0,
      total: item.total || 0,
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
    const { error: updateError } = await (supabase as any)
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
    
    // Update review status to error
    if (reviewId) {
      try {
        await (supabase as any)
          .from("reviews")
          .update({
            status: "error",
            error_message: error.message || "Failed to analyze estimate",
          })
          .eq("id", reviewId);
      } catch (updateError) {
        console.error("Failed to update error status:", updateError);
      }
    }

    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        error: error.message || "Failed to analyze estimate",
      }),
    };
  }
};

