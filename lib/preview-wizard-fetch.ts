import { createSupabaseBrowserClient, wizardFetch } from "@/lib/supabaseClient";

let anonInFlight: Promise<void> | null = null;

/**
 * Ensures a browser session exists for unauthenticated /analysis-preview
 * (anonymous sign-in) so Netlify `verifyWizardAuth` receives a valid JWT.
 * Falls through if sign-in is unavailable — caller may get 401 from functions.
 */
export async function ensurePreviewAnonSession(): Promise<void> {
  const supabase = createSupabaseBrowserClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (session?.access_token) return;
  if (!anonInFlight) {
    anonInFlight = (async () => {
      try {
        const auth = supabase.auth as {
          signInAnonymously?: () => Promise<{ error: { message: string } | null }>;
        };
        if (typeof auth.signInAnonymously === "function") {
          const { error } = await auth.signInAnonymously();
          if (error) {
            console.warn("[preview] signInAnonymously:", error.message);
          }
        }
      } finally {
        anonInFlight = null;
      }
    })();
  }
  await anonInFlight;
}

/**
 * For preview mode only: after anonymous session, use the same headers as
 * the authenticated `wizardFetch` (Bearer JWT).
 */
export async function previewWizardFetch(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<Response> {
  await ensurePreviewAnonSession();
  return wizardFetch(input, init);
}
