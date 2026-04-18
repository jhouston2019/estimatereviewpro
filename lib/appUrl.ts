/**
 * Join NEXT_PUBLIC_APP_URL with a path/query string without a double slash
 * (e.g. when the env value ends with `/` and the path starts with `/`).
 */
export function appAbsoluteUrl(pathAndQuery: string): string {
  const base = (process.env.NEXT_PUBLIC_APP_URL ?? '').trim();
  if (!base) {
    const p = pathAndQuery.replace(/^\/+/, '');
    return `/${p}`;
  }
  const root = base.endsWith('/') ? base : `${base}/`;
  const relative = pathAndQuery.replace(/^\/+/, '');
  return new URL(relative, root).href;
}
