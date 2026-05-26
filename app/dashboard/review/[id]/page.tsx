import { redirect } from "next/navigation";
import { requireUserAndPaywall } from "@/lib/auth/serverPageGuards";

/** Legacy route — deliverables is the canonical review detail view. */
export default async function ReviewDetailRedirectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireUserAndPaywall();
  const { id } = await params;
  redirect(`/deliverables?reviewId=${encodeURIComponent(id)}`);
}
