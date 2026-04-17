import { SkillTree } from "@/components/SkillTree";
import { getLanguageContent } from "@/lib/content";

export default function MandarinPage() {
  const { units } = getLanguageContent("mandarin");
  return (
    <SkillTree
      units={units}
      basePath="/mandarin"
      greeting="你好!"
    />
  );
}
