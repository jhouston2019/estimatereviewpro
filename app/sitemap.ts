import { MetadataRoute } from "next";
import keywords from "@/seo/keywords.json";
import seoKeywords from "@/seo/seo-keywords";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://estimatereviewpro.com";

  // Static pages
  const staticPages = [
    "",
    "/pricing",
    "/how-it-works",
    "/examples",
    "/faq",
    "/contact",
    "/contractor-estimate-review",
    "/insurance-estimate-review",
    "/xactimate-review",
    "/roof-estimate-review",
    "/water-estimate-review",
    "/fire-estimate-review",
    "/wind-hail-estimate-review",
    "/mold-estimate-review",
    "/tree-damage-estimate-review",
    "/property-damage-estimate-review",
    "/supplement-estimate-review",
    "/contractor-vs-insurance-estimate",
    "/public-adjuster-estimate-review",
    "/estimate-discrepancy-analysis",
    "/insurance-underpayment-review",
    "/policyholder-estimate-help",
    "/how-to-read-an-estimate",
    "/insurance-estimate-missing-items",
    "/estimate-comparison-tool",
  ].map((path) => ({
    url: `${baseUrl}${path}`,
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: path === "" ? 1.0 : 0.8,
  }));

  // SEO pages from dynamic route keywords
  const dynamicSeoPages = keywords.map((keyword) => {
    const slug = keyword.toLowerCase().replace(/\s+/g, "-");
    return {
      url: `${baseUrl}/seo/${slug}`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.7,
    };
  });

  // SEO pages from generated static pages
  const staticSeoPages = seoKeywords.map((keyword) => {
    const slug = keyword
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim();
    return {
      url: `${baseUrl}/${slug}`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.7,
    };
  });

  return [...staticPages, ...dynamicSeoPages, ...staticSeoPages];
}

