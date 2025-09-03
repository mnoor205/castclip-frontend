import RenderBlocks from "@/components/notion/render-block";
import { notion, databaseId } from "@/lib/notion";
import Link from "next/link";

async function getGuideBySlug(slug: string) {
  const response = await notion.databases.query({
    database_id: databaseId,
    filter: { property: "Slug", rich_text: { equals: slug } },
    page_size: 1,
  });
  return response.results[0];
}

async function getGuideForRoot() {
  // Show the Notion page whose Slug is exactly 'intro' on /guide
  return await getGuideBySlug("intro");
}

async function getGuideBlocks(pageId: string) {
  const blocks = await notion.blocks.children.list({ block_id: pageId });
  return blocks.results;
}

async function getAllGuides() {
  const response = await notion.databases.query({
    database_id: databaseId,
    sorts: [{ timestamp: "created_time", direction: "ascending" }],
  });

  return response.results.map((page: any) => ({
    id: page.id,
    slug: page.properties.Slug.rich_text[0]?.plain_text || "",
    title: page.properties.Title.title[0]?.plain_text || "Untitled",
  }));
}

export default async function GuideCatchAllPage({ params }: { params: Promise<{ slug?: string[] }> }) {
  const { slug } = await params;
  const slugParam = slug?.[0];
  const guide = slugParam ? await getGuideBySlug(slugParam) : await getGuideForRoot();

  if (!guide) {
    return (
      <div className="max-w-3xl mx-auto p-6">
        <h1 className="text-2xl font-bold">Guide not found</h1>
      </div>
    );
  }

  const pageId = (guide as any).id as string;
  const properties = (guide as any).properties ?? {};
  const statusProp = (properties as any).Status ?? (properties as any).status;
  const status = statusProp?.status?.name as string | undefined;
  const isInProgress = status?.toLowerCase() === "in progress";
  const blocks = isInProgress ? [] : await getGuideBlocks(pageId);
  const allGuides = await getAllGuides();

  const currentSlug = (guide as any).properties?.Slug?.rich_text?.[0]?.plain_text ?? "";
  const currentIndex = allGuides.findIndex((g) => g.slug === currentSlug);
  const prevGuide = allGuides[currentIndex - 1];
  const nextGuide = allGuides[currentIndex + 1];

  const title = (guide as any).properties?.Title?.title?.[0]?.plain_text ?? "Introduction";

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-8">
      <h1 className="text-3xl font-bold">{title}</h1>
      {isInProgress ? (
        <div className="p-4 rounded-md bg-primary/30 border border-primary text-pink-800">
          Coming soon. This part is still in progress.
        </div>
      ) : (
        <RenderBlocks blocks={blocks} />
      )}

      <div className="flex justify-between border-t pt-6 mt-6">
        {prevGuide ? (
          <Link href={prevGuide.slug ? `/guide/${prevGuide.slug}` : `/guide`} className="text-blue-500 hover:underline">
            ← {prevGuide.title}
          </Link>
        ) : (
          <span />
        )}

        {nextGuide ? (
          <Link href={nextGuide.slug ? `/guide/${nextGuide.slug}` : `/guide`} className="text-blue-500 hover:underline">
            {nextGuide.title} →
          </Link>
        ) : (
          <span />
        )}
      </div>
    </div>
  );
}


