import type { SupabaseClient } from "@supabase/supabase-js";
import { userHasPaidAccessForUserId } from "./paidAccess";

async function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

/**
 * Confirms paid access via service-role mirror + JWT RPC (when session client provided).
 */
export async function confirmPaidAccessReady(args: {
  userId: string;
  authClient?: SupabaseClient;
}): Promise<boolean> {
  const { userId, authClient } = args;

  for (let attempt = 0; attempt < 3; attempt++) {
    const svc = await userHasPaidAccessForUserId(userId);
    let rpcOk = true;
    if (authClient) {
      const { data, error } = await authClient.rpc("user_has_paid_access");
      rpcOk = !error && data === true;
    }

    if (svc && rpcOk) {
      return true;
    }

    if (attempt < 2) await sleep(200);
  }

  return false;
}
