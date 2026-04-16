import { notFound } from "next/navigation";
import { LessonClient } from "./LessonClient";
import { getUnit, ALL_UNITS } from "@/lib/content";

export function generateStaticParams() {
  return ALL_UNITS.map((u) => ({ unitId: u.id }));
}

export default async function LessonPage(props: PageProps<"/learn/[unitId]">) {
  const { unitId } = await props.params;
  const unit = getUnit(unitId);
  if (!unit) notFound();

  return <LessonClient unitId={unit.id} />;
}
