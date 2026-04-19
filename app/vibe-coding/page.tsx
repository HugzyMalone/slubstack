import { SkillTree } from "@/components/SkillTree";
import { getLanguageContent } from "@/lib/content";

export default function VibeCodingPage() {
  const { units } = getLanguageContent("vibe-coding");
  return (
    <SkillTree
      units={units}
      basePath="/vibe-coding"
      greeting="Build smarter with Claude."
      subGreeting="Prompting · Debugging · Web Patterns"
      character="bear"
    />
  );
}
