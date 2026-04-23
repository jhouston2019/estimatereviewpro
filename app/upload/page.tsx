import { requireUserAndPaywall } from "@/lib/auth/serverPageGuards";
import UploadWizardClient from "./UploadWizardClient";

export default async function UploadRoutePage() {
  await requireUserAndPaywall();
  return <UploadWizardClient />;
}
