/**
 * Alias for Stripe webhook forwarding. Same handler as /api/webhook.
 * Use with: stripe listen --forward-to localhost:3000/api/webhooks/stripe
 */
export { POST } from "../../webhook/route";
