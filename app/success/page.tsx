import { SuccessRedirect } from "./SuccessRedirect";

function sessionIdFromSearchParams(sp: {
  session_id?: string | string[];
}): string | null {
  const raw = sp.session_id;
  if (Array.isArray(raw)) {
    const first = raw[0]?.trim();
    return first && first.length > 0 ? first : null;
  }
  const s = raw?.trim();
  return s && s.length > 0 ? s : null;
}

export default async function SuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string | string[] }>;
}) {
  const sp = await searchParams;
  const sessionId = sessionIdFromSearchParams(sp);
  return <SuccessRedirect sessionId={sessionId} />;
}
