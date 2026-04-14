/**
 * Builds absolute URLs for Netlify functions in local dev (Next on :3000, functions on :8888).
 * In production, returns a same-origin path so `fetch` uses the deployed host.
 */
export function netlifyFunctionUrl(functionName: string): string {
  const path = `/.netlify/functions/${functionName}`;
  if (process.env.NODE_ENV === "production") {
    return path;
  }
  const base = (
    process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:8888"
  ).replace(/\/$/, "");
  const origin = base.includes("localhost:3000")
    ? "http://localhost:8888"
    : base;
  return `${origin}${path}`;
}
