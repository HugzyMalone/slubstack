import { SkillTree } from "@/components/SkillTree";
import { getLanguageContent } from "@/lib/content";

export default function GitHubPage() {
  const { units } = getLanguageContent("github");
  return (
    <SkillTree
      units={units}
      basePath="/github"
      greeting="Master GitHub."
      subGreeting="Git · Branches · PRs · Actions"
      character="bear"
      linear={false}
    />
  );
}
