import { GameStoreProvider, vibeCodingStore } from "@/lib/store";
import { CloudSync } from "@/components/CloudSync";

export default function VibeCodingLayout({ children }: { children: React.ReactNode }) {
  return (
    <GameStoreProvider store={vibeCodingStore}>
      <CloudSync lang="vibe-coding" />
      {children}
    </GameStoreProvider>
  );
}
