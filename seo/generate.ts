#!/usr/bin/env node

/**
 * SEO Page Generator Script
 * 
 * This script generates individual SEO landing pages for each keyword.
 * Run with: npx tsx seo/generate.ts
 * 
 * Note: The dynamic route app/seo/[slug]/page.tsx handles all keywords automatically,
 * so this script is optional. It's provided for generating static pages if needed.
 */

import fs from "fs";
import path from "path";
import keywords from "./keywords.json";

const SEO_DIR = path.join(process.cwd(), "app", "seo-pages");

function generatePageFile(keyword: string): string {
  const slug = keyword.toLowerCase().replace(/\s+/g, "-");
  
  return `import { Metadata } from "next";
import { generateSeoContent } from "@/lib/seo/content";
import { generateAllSchemas } from "@/lib/seo/schema";
import { SeoLayout } from "@/components/SeoLayout";
import { SectionCard } from "@/components/SectionCard";

const keyword = "${keyword}";
const content = generateSeoContent(keyword);
const schemas = generateAllSchemas(content);

export const metadata: Metadata = {
  title: content.title,
  description: content.metaDescription,
};

export default function ${toPascalCase(slug)}Page() {
  return (
    <SeoLayout content={content} schemas={schemas}>
      <section className="text-center">
        <h1 className="text-4xl font-bold tracking-tight text-slate-50 md:text-5xl">
          {content.h1}
        </h1>
        <p className="mx-auto mt-4 max-w-3xl text-sm leading-relaxed text-slate-400">
          {content.intro}
        </p>
      </section>

      {content.sections.map((section, idx) => (
        <SectionCard key={idx} title={section.heading}>
          <div className="space-y-4 text-sm leading-relaxed text-slate-300">
            <p>{section.body}</p>
            {section.bullets && section.bullets.length > 0 && (
              <ul className="mt-4 space-y-2 pl-5">
                {section.bullets.map((bullet, bulletIdx) => (
                  <li key={bulletIdx} className="list-disc">
                    {bullet}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </SectionCard>
      ))}

      {content.faqs.length > 0 && (
        <section>
          <h2 className="mb-6 text-center text-2xl font-bold text-slate-50">
            Frequently Asked Questions
          </h2>
          <div className="space-y-4">
            {content.faqs.map((faq, idx) => (
              <SectionCard key={idx} title={faq.question}>
                <p className="text-sm leading-relaxed text-slate-300">
                  {faq.answer}
                </p>
              </SectionCard>
            ))}
          </div>
        </section>
      )}
    </SeoLayout>
  );
}
`;
}

function toPascalCase(str: string): string {
  return str
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join("");
}

function generatePages() {
  console.log("🚀 Starting SEO page generation...");
  console.log(`📄 Found ${keywords.length} keywords`);

  // Create SEO directory if it doesn't exist
  if (!fs.existsSync(SEO_DIR)) {
    fs.mkdirSync(SEO_DIR, { recursive: true });
  }

  let generated = 0;
  let skipped = 0;

  keywords.forEach((keyword) => {
    const slug = keyword.toLowerCase().replace(/\s+/g, "-");
    const pageDir = path.join(SEO_DIR, slug);
    const pageFile = path.join(pageDir, "page.tsx");

    // Create directory
    if (!fs.existsSync(pageDir)) {
      fs.mkdirSync(pageDir, { recursive: true });
    }

    // Generate page file
    if (!fs.existsSync(pageFile)) {
      const content = generatePageFile(keyword);
      fs.writeFileSync(pageFile, content, "utf-8");
      generated++;
      console.log(`✅ Generated: ${slug}`);
    } else {
      skipped++;
      console.log(`⏭️  Skipped (exists): ${slug}`);
    }
  });

  console.log("\n✨ Generation complete!");
  console.log(`📊 Generated: ${generated} pages`);
  console.log(`⏭️  Skipped: ${skipped} pages`);
  console.log(`📁 Location: ${SEO_DIR}`);
}

// Run generator
generatePages();

