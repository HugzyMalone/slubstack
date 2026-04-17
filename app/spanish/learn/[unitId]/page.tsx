import { notFound } from "next/navigation";
import { LessonClient } from "@/app/learn/[unitId]/LessonClient";
import { getLanguageContent } from "@/lib/content";

export function generateStaticParams() {
  return getLanguageContent("spanish").units.map((u) => ({ unitId: u.id }));
}

export default async function SpanishLessonPage({
  params,
}: {
  params: Promise<{ unitId: string }>;
}) {
  const { unitId } = await params;
  const content = getLanguageContent("spanish");
  if (!content.getUnit(unitId)) notFound();

  return (
    <LessonClient
      unitId={unitId}
      lang="spanish"
      exitHref="/spanish"
      reviewHref="/spanish/review"
    />
  );
}
