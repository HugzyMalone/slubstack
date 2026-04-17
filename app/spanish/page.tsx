import { SkillTree } from "@/components/SkillTree";
import { getLanguageContent } from "@/lib/content";

export default function SpanishPage() {
  const { units } = getLanguageContent("spanish");
  return (
    <SkillTree
      units={units}
      basePath="/spanish"
      greeting="¡Hola!"
      subGreeting="Learn Spanish one word at a time."
    />
  );
}
