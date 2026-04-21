import Stripe from "stripe";

const STRIPE_API_VERSION: Stripe.LatestApiVersion = "2025-11-17.clover";

let stripeSingleton: Stripe | null = null;

function getStripe(): Stripe {
  if (!stripeSingleton) {
    const key = process.env.STRIPE_SECRET_KEY?.trim();
    if (!key) throw new Error("STRIPE_SECRET_KEY is not configured");
    stripeSingleton = new Stripe(key, { apiVersion: STRIPE_API_VERSION });
  }
  return stripeSingleton;
}

function emailFromSession(session: Stripe.Checkout.Session): string | null {
  const direct = session.customer_email?.trim() ?? "";
  if (direct) return direct;
  const details = session.customer_details?.email?.trim() ?? "";
  if (details) return details;
  const c = session.customer;
  if (c && typeof c === "object" && "email" in c && !("deleted" in c && c.deleted)) {
    const em = (c as Stripe.Customer).email?.trim() ?? "";
    if (em) return em;
  }
  return null;
}

/**
 * Returns checkout email only for a completed, paid Stripe Checkout session.
 */
export async function resolveCheckoutEmailForCreateAccount(
  sessionId: string
): Promise<string | null> {
  if (!sessionId.trim()) return null;
  try {
    const stripe = getStripe();
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["customer"],
    });
    const paid =
      session.payment_status === "paid" ||
      session.payment_status === "no_payment_required";
    if (!paid) return null;
    return emailFromSession(session);
  } catch {
    return null;
  }
}
