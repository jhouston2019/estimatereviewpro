import type { NextConfig } from "next";

const legacyHtmlRedirects = [
  ["/estimate-review.html", "/estimate-review"],
  ["/xactimate-estimate-review.html", "/xactimate-estimate-review"],
  ["/contractor-estimate-review.html", "/contractor-estimate-review"],
  ["/water-damage-estimate-review.html", "/water-damage-estimate-review"],
  ["/fire-damage-estimate-review.html", "/fire-damage-estimate-review"],
  ["/wind-hail-estimate-review.html", "/wind-and-hail-estimate-review"],
] as const;

const nextConfig: NextConfig = {
  async redirects() {
    return legacyHtmlRedirects.map(([source, destination]) => ({
      source,
      destination,
      statusCode: 301,
    }));
  },
};

export default nextConfig;
