import type { MetadataRoute } from "next";
import { PUBLIC_SITEMAP_URLS } from "@/lib/seo/sitemapUrls";

const LAST_MOD = new Date("2025-12-17");

export default function sitemap(): MetadataRoute.Sitemap {
  return PUBLIC_SITEMAP_URLS.map((url) => ({
    url,
    lastModified: LAST_MOD,
    changeFrequency: "monthly" as const,
    priority: url === "https://estimatereviewpro.com/" ? 1 : 0.8,
  }));
}
