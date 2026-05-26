import { redirect } from "next/navigation";
import { isPaymentBypassActive } from "@/lib/billing/devBypass";
import { createSupabaseServerComponentClient } from "@/lib/supabaseServer";
import UploadWizardClient from "../upload/UploadWizardClient";

export const metadata = {
  title: "Free estimate preview | Estimate Review Pro",
  description:
    "Upload your carrier estimate for a free preview. Full analysis unlocks after payment.",
};

export default async function AnalysisPreviewPage() {
  const supabase = await createSupabaseServerComponentClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user && !isPaymentBypassActive()) {
    const { data: userRow } = await supabase
      .from("users")
      .select("is_admin")
      .eq("id", user.id)
      .maybeSingle();
    const isAdmin = (userRow as { is_admin?: boolean } | null)?.is_admin === true;

    if (!isAdmin) {
      const { data: paid } = await supabase.rpc("user_has_paid_access");
      if (paid === true) {
        redirect("/upload");
      }
    }
  }

  return <UploadWizardClient isPreviewMode />;
}
