import { SeoContent } from "./content";

export function generateServiceSchema(content: SeoContent) {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    "serviceType": content.keyword,
    "provider": {
      "@type": "Organization",
      "name": "Estimate Review Pro",
      "url": "https://estimatereviewpro.com",
    },
    "areaServed": "United States",
    "description": content.metaDescription,
  };
}

export function generateFAQSchema(content: SeoContent) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": content.faqs.map((faq) => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer,
      },
    })),
  };
}

export function generateBreadcrumbSchema(content: SeoContent) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": "https://estimatereviewpro.com",
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": "SEO",
        "item": "https://estimatereviewpro.com/seo",
      },
      {
        "@type": "ListItem",
        "position": 3,
        "name": content.h1,
        "item": `https://estimatereviewpro.com/seo/${content.slug}`,
      },
    ],
  };
}

export function generateAllSchemas(content: SeoContent) {
  return {
    service: generateServiceSchema(content),
    faq: generateFAQSchema(content),
    breadcrumb: generateBreadcrumbSchema(content),
  };
}

