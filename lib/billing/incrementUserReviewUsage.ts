import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Bump per-user review counter (service-role client; complements team usage).
 */
export async function incrementUserReviewUsage(
  supabase: SupabaseClient,
  userId: string,
  reviewsLimit: number
): Promise<void> {
  const { data: row } = await supabase
    .from("user_review_usage")
    .select("reviews_used")
    .eq("user_id", userId)
    .maybeSingle();

  const prev = (row as { reviews_used?: number } | null)?.reviews_used ?? 0;
  const { error } = await supabase.from("user_review_usage").upsert(
    {
      user_id: userId,
      reviews_used: prev + 1,
      reviews_limit: Math.max(reviewsLimit, 0),
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" }
  );
  if (error) {
    console.error("[incrementUserReviewUsage]", error);
  }
}
