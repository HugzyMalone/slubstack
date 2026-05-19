import { notFound } from "next/navigation";
import { LessonClient } from "@/app/learn/[unitId]/LessonClient";
import { getLanguageContent } from "@/lib/content";

export function generateStaticParams() {
  return getLanguageContent("italian").units.map((u) => ({ unitId: u.id }));
}

export default async function ItalianLessonPage({
  params,
}: {
  params: Promise<{ unitId: string }>;
}) {
  const { unitId } = await params;
  const content = getLanguageContent("italian");
  if (!content.getUnit(unitId)) notFound();

  return (
    <LessonClient
      unitId={unitId}
      lang="italian"
      exitHref="/italian"
      reviewHref="/italian/review"
    />
  );
}
