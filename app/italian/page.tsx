import { SkillTree } from "@/components/SkillTree";
import { getLanguageContent } from "@/lib/content";

export default function ItalianPage() {
  const { units } = getLanguageContent("italian");
  return (
    <SkillTree
      units={units}
      basePath="/italian"
      greeting="Ciao!"
      subGreeting="Learn Italian one word at a time."
      linear={false}
    />
  );
}
