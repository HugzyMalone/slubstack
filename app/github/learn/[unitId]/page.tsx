import { notFound } from "next/navigation";
import { LessonClient } from "@/app/learn/[unitId]/LessonClient";
import { getLanguageContent } from "@/lib/content";

export function generateStaticParams() {
  return getLanguageContent("github").units.map((u) => ({ unitId: u.id }));
}

export default async function GitHubLessonPage({
  params,
}: {
  params: Promise<{ unitId: string }>;
}) {
  const { unitId } = await params;
  const content = getLanguageContent("github");
  if (!content.getUnit(unitId)) notFound();

  return (
    <LessonClient
      unitId={unitId}
      lang="github"
      exitHref="/github"
      reviewHref="/github/review"
    />
  );
}
