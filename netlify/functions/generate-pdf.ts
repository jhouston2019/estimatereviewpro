import { Handler } from "@netlify/functions";
import { createAdminClient } from "../../lib/supabase/admin";
import { generatePDFReport } from "../../lib/pdf/generator";
import type { Database } from "../../lib/database.types";

const supabase = createAdminClient();

export const handler: Handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  let reviewId: string | null = null;

  try {
    const { reviewId: id } = JSON.parse(event.body || "{}");
    reviewId = id;

    if (!reviewId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Missing reviewId" }),
      };
    }

    // Update status to generating_pdf
    await (supabase as any)
      .from("reviews")
      .update({ status: "generating_pdf" })
      .eq("id", reviewId);

    // Fetch review data
    type Review = Database["public"]["Tables"]["reviews"]["Row"];
    const { data: review, error: fetchError } = await supabase
      .from("reviews")
      .select("*")
      .eq("id", reviewId)
      .single<Review>();

    if (fetchError || !review) {
      throw new Error("Review not found");
    }

    const analysis = review.ai_analysis_json as any;
    const comparison = review.ai_comparison_json as any;
    const summary = review.ai_summary_json as any;

    // Generate PDF using ClaimWorks-style generator
    const pdfBuffer = await generatePDFReport({
      comparison,
      reportSummary: summary,
      contractorItems: analysis?.lineItems || [],
      carrierItems: [],
      reviewId,
    });

    // Upload to Supabase Storage
    const fileName = `${reviewId}-report-${Date.now()}.pdf`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("reports")
      .upload(fileName, pdfBuffer, {
        contentType: "application/pdf",
        upsert: true,
      });

    if (uploadError) {
      throw new Error(`Failed to upload PDF: ${uploadError.message}`);
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from("reports").getPublicUrl(fileName);

    // Update review with PDF URL
    const { error: updateError } = await (supabase as any)
      .from("reviews")
      .update({
        pdf_report_url: publicUrl,
        status: "complete",
      })
      .eq("id", reviewId);

    if (updateError) {
      throw new Error(`Failed to update review: ${updateError.message}`);
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        pdfUrl: publicUrl,
      }),
    };
  } catch (error: any) {
    console.error("Error in generate-pdf:", error);
    
    // Update review status to error
    if (reviewId) {
      try {
        await (supabase as any)
          .from("reviews")
          .update({
            status: "error",
            error_message: error.message || "Failed to generate PDF",
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
        error: error.message || "Failed to generate PDF",
      }),
    };
  }
};

