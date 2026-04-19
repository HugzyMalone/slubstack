import { notFound } from "next/navigation";
import { LessonClient } from "@/app/learn/[unitId]/LessonClient";
import { getLanguageContent } from "@/lib/content";

export function generateStaticParams() {
  return getLanguageContent("vibe-coding").units.map((u) => ({ unitId: u.id }));
}

export default async function VibeCodingLessonPage({
  params,
}: {
  params: Promise<{ unitId: string }>;
}) {
  const { unitId } = await params;
  const content = getLanguageContent("vibe-coding");
  if (!content.getUnit(unitId)) notFound();

  return (
    <LessonClient
      unitId={unitId}
      lang="vibe-coding"
      exitHref="/vibe-coding"
      reviewHref="/vibe-coding/review"
    />
  );
}
