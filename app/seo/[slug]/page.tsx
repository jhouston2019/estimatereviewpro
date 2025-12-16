import { Metadata } from "next";
import { notFound } from "next/navigation";
import { generateSeoContent } from "@/lib/seo/content";
import { generateAllSchemas } from "@/lib/seo/schema";
import { SeoLayout } from "@/components/SeoLayout";
import { SectionCard } from "@/components/SectionCard";
import keywords from "@/seo/keywords.json";

export async function generateStaticParams() {
  return keywords.map((keyword) => ({
    slug: keyword.toLowerCase().replace(/\s+/g, "-"),
  }));
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const keyword = keywords.find(
    (k) => k.toLowerCase().replace(/\s+/g, "-") === params.slug
  );

  if (!keyword) {
    return {
      title: "Page Not Found",
    };
  }

  const content = generateSeoContent(keyword);

  return {
    title: content.title,
    description: content.metaDescription,
  };
}

export default function SeoPage({ params }: { params: { slug: string } }) {
  const keyword = keywords.find(
    (k) => k.toLowerCase().replace(/\s+/g, "-") === params.slug
  );

  if (!keyword) {
    notFound();
  }

  const content = generateSeoContent(keyword);
  const schemas = generateAllSchemas(content);

  return (
    <SeoLayout content={content} schemas={schemas}>
      {/* Hero Section */}
      <section className="text-center">
        <h1 className="text-4xl font-bold tracking-tight text-slate-50 md:text-5xl">
          {content.h1}
        </h1>
        <p className="mx-auto mt-4 max-w-3xl text-sm leading-relaxed text-slate-400">
          {content.intro}
        </p>
      </section>

      {/* Content Sections */}
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

      {/* FAQ Section */}
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

