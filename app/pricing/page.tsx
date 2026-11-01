import type { Metadata } from "next";
import { createSupabaseServerComponentClient } from "@/lib/supabaseServer";
import { withPublicCanonical } from "@/lib/seo/site";
import PricingPageClient from "./PricingPageClient";

export const metadata: Metadata = withPublicCanonical("/pricing", {
  title: "Pricing | Estimate Review Pro",
  description:
    "Choose a plan for full AI-powered insurance estimate review, comparison, and deliverables.",
});

export default async function PricingPage() {
  const supabase = await createSupabaseServerComponentClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return <PricingPageClient userEmail={user?.email ?? null} />;
}
