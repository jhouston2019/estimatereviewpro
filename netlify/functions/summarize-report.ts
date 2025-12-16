import { Handler } from "@netlify/functions";
import { createAdminClient } from "../../lib/supabase/admin";
import OpenAI from "openai";
import type { Database } from "../../lib/database.types";

const supabase = createAdminClient();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

interface ReportSummary {
  plainEnglishSummary: string;
  keyFindings: string[];
  approvalStatus: "approved" | "denied" | "partial" | "unclear";
  technicalPoints: string[];
  recommendedNextSteps: string[];
  extractedAt: string;
}

export const handler: Handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const { reviewId, reportUrl, fileType } = JSON.parse(event.body || "{}");

    if (!reviewId || !reportUrl) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Missing reviewId or reportUrl" }),
      };
    }

    // Download file from Supabase Storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from("uploads")
      .download(reportUrl.split("/uploads/")[1]);

    if (downloadError) {
      throw new Error(`Failed to download file: ${downloadError.message}`);
    }

    // Convert to base64 for OpenAI Vision
    const buffer = await fileData.arrayBuffer();
    const base64 = Buffer.from(buffer).toString("base64");
    const mimeType = fileType === "pdf" ? "application/pdf" : "image/jpeg";

    // Import production prompts
    const { REPORT_SUMMARY_SYSTEM, REPORT_SUMMARY_USER } = await import(
      "../../lib/ai/prompts"
    );

    // Use OpenAI with production prompts to summarize the report
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: REPORT_SUMMARY_SYSTEM,
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: REPORT_SUMMARY_USER,
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
    
    // Normalize field names (handle both camelCase and snake_case)
    const summary: ReportSummary = {
      plainEnglishSummary: parsed.plainEnglishSummary || parsed.summary || "",
      keyFindings: parsed.keyFindings || parsed.key_findings || [],
      approvalStatus: parsed.approvalStatus || parsed.approval_status || "unclear",
      technicalPoints: parsed.technicalPoints || parsed.technical_points || [],
      recommendedNextSteps: parsed.recommendedActions || parsed.recommendedNextSteps || parsed.recommended_actions || [],
      extractedAt: new Date().toISOString(),
    };

    // Save to database
    const { error: updateError } = await (supabase as any)
      .from("reviews")
      .update({
        ai_summary_json: summary,
      })
      .eq("id", reviewId);

    if (updateError) {
      throw new Error(`Failed to save summary: ${updateError.message}`);
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        summary,
      }),
    };
  } catch (error: any) {
    console.error("Error in summarize-report:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: error.message || "Failed to summarize report",
      }),
    };
  }
};

