import { SkillTree } from "@/components/SkillTree";
import { getLanguageContent } from "@/lib/content";

export default function GermanPage() {
  const { units } = getLanguageContent("german");
  return (
    <SkillTree
      units={units}
      basePath="/german"
      greeting="Guten Tag!"
      subGreeting="Learn German one word at a time."
      character="bear"
    />
  );
}
