import { notFound } from "next/navigation";
import { LessonClient } from "@/app/learn/[unitId]/LessonClient";
import { getLanguageContent } from "@/lib/content";

export function generateStaticParams() {
  return getLanguageContent("german").units.map((u) => ({ unitId: u.id }));
}

export default async function GermanLessonPage({
  params,
}: {
  params: Promise<{ unitId: string }>;
}) {
  const { unitId } = await params;
  const content = getLanguageContent("german");
  if (!content.getUnit(unitId)) notFound();

  return (
    <LessonClient
      unitId={unitId}
      lang="german"
      exitHref="/german"
      reviewHref="/german/review"
    />
  );
}
