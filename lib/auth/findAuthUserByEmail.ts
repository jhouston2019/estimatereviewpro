import { createClient } from "@supabase/supabase-js";

function serviceSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !key) return null;
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

/**
 * Resolve a Supabase Auth user id by email via GoTrue admin listUsers filter.
 */
export async function findAuthUserIdByEmail(
  email: string
): Promise<string | null> {
  const trimmed = email.trim();
  if (trimmed.length < 3) return null;

  const supabase = serviceSupabase();
  const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!supabase || !baseUrl || !serviceKey) {
    console.error(
      "[findAuthUserIdByEmail] missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY"
    );
    return null;
  }

  const target = trimmed.toLowerCase();

  try {
    const url = `${baseUrl}/auth/v1/admin/users?filter=${encodeURIComponent(trimmed)}&per_page=50&page=1`;
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${serviceKey}`,
        apikey: serviceKey,
      },
      cache: "no-store",
    });

    if (res.ok) {
      const json = (await res.json()) as {
        users?: { id: string; email?: string }[];
      };
      const exact = json.users?.find(
        (u) => u.email?.trim().toLowerCase() === target
      );
      if (exact?.id) return exact.id;
    } else {
      console.warn(
        "[findAuthUserIdByEmail] admin users filter failed:",
        res.status
      );
    }
  } catch (err) {
    console.warn("[findAuthUserIdByEmail] filter request failed:", err);
  }

  for (let page = 1; page <= 20; page++) {
    const { data, error } = await supabase.auth.admin.listUsers({
      page,
      perPage: 200,
    });
    if (error) {
      console.error("[findAuthUserIdByEmail] listUsers page failed:", error);
      break;
    }
    const found = data.users.find(
      (u) => u.email?.trim().toLowerCase() === target
    );
    if (found?.id) return found.id;
    if (data.users.length < 200) break;
  }

  return null;
}
