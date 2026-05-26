"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { DELIVERABLES_REVIEW_ID_KEY } from "@/lib/wizard-snapshot";

type Props = {
  className?: string;
  children?: React.ReactNode;
};

/** Header nav: resume the paid review wizard, not a new free preview. */
export function DeliverablesResumeWizardLink({
  className,
  children = "Wizard",
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const onClick = () => {
    const fromUrl = searchParams?.get("reviewId")?.trim() ?? "";
    const fromStorage =
      typeof window !== "undefined"
        ? window.sessionStorage.getItem(DELIVERABLES_REVIEW_ID_KEY)?.trim() ??
          ""
        : "";
    const reviewId = fromUrl || fromStorage;
    if (reviewId) {
      router.push(
        `/upload?reviewId=${encodeURIComponent(reviewId)}&step=6`
      );
      return;
    }
    router.push("/upload?step=2");
  };

  return (
    <button type="button" onClick={onClick} className={className}>
      {children}
    </button>
  );
}
