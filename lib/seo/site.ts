import type { Metadata } from "next";

export const SITE_ORIGIN = "https://estimatereviewpro.com";

export const metadataBase = new URL(SITE_ORIGIN);

/** Canonical URL: homepage uses trailing slash; all other paths have none. */
export function publicCanonicalUrl(pathname: string): string {
  if (pathname === "/") {
    return `${SITE_ORIGIN}/`;
  }
  const path = pathname.startsWith("/") ? pathname : `/${pathname}`;
  return `${SITE_ORIGIN}${path}`;
}

export function withPublicCanonical(pathname: string, metadata: Metadata): Metadata {
  return {
    ...metadata,
    alternates: {
      ...metadata.alternates,
      canonical: publicCanonicalUrl(pathname),
    },
  };
}
