"use server";

import { canSubmitReview, incrementUsage } from "@/lib/usage-tracking";

export async function checkUserUsage(organizationId: string) {
  return await canSubmitReview(organizationId);
}

export async function incrementUserUsage(organizationId: string) {
  return await incrementUsage(organizationId);
}

