import type { Metadata } from "next";
import { notFound } from "next/navigation";

interface TopicPageProps {
  params: Promise<{ slug: string }>;
}

// Generates static paths at build time.
// Replace with real slugs fetched from the API when content is ready.
export async function generateStaticParams() {
  return [];
}

export async function generateMetadata({
  params,
}: TopicPageProps): Promise<Metadata> {
  const { slug } = await params;

  // TODO: fetch topic metadata from API
  return {
    title: slug.replace(/-/g, " "),
  };
}

export default async function TopicPage({ params }: TopicPageProps) {
  const { slug } = await params;

  // TODO: fetch topic content from GET /public/topics/:slug
  if (!slug) notFound();

  return (
    <main>
      <h1>{slug}</h1>
      {/* Sections will be added in Etap 1:
          - Hero + Cheat Sheet
          - Wiedza w pigułce
          - Mini-Quiz interaktywny (z gatingiem)
          - Lead Magnet
          - SEO Silo
      */}
    </main>
  );
}
