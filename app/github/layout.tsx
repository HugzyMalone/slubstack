import { GameStoreProvider, githubStore } from "@/lib/store";
import { CloudSync } from "@/components/CloudSync";

export default function GitHubLayout({ children }: { children: React.ReactNode }) {
  return (
    <GameStoreProvider store={githubStore}>
      <CloudSync lang="github" />
      {children}
    </GameStoreProvider>
  );
}
