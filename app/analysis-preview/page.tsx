import type { Metadata } from "next";
import UploadWizardClient from "../upload/UploadWizardClient";
import { withPublicCanonical } from "@/lib/seo/site";

export const metadata: Metadata = withPublicCanonical("/analysis-preview", {
  title: "Free estimate preview | Estimate Review Pro",
  description:
    "Upload your carrier estimate for a free preview. Full analysis unlocks after payment.",
});

/** Public funnel — always preview mode, even for logged-in users with prior purchases. */
export default function AnalysisPreviewPage() {
  return <UploadWizardClient isPreviewMode />;
}
