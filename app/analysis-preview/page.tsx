import UploadWizardClient from "../upload/UploadWizardClient";

export const metadata = {
  title: "Free estimate preview | Estimate Review Pro",
  description:
    "Upload your carrier estimate for a free preview. Full analysis unlocks after payment.",
};

export default function AnalysisPreviewPage() {
  return <UploadWizardClient isPreviewMode />;
}
