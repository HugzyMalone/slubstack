import { notFound } from "next/navigation";
import { LessonClient } from "@/app/learn/[unitId]/LessonClient";
import { getLanguageContent } from "@/lib/content";

export function generateStaticParams() {
  return getLanguageContent("mandarin").units.map((u) => ({ unitId: u.id }));
}

export default async function MandarinLessonPage({
  params,
}: {
  params: Promise<{ unitId: string }>;
}) {
  const { unitId } = await params;
  const content = getLanguageContent("mandarin");
  if (!content.getUnit(unitId)) notFound();

  return (
    <LessonClient
      unitId={unitId}
      lang="mandarin"
      exitHref="/mandarin"
      reviewHref="/mandarin/review"
    />
  );
}
