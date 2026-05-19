import { GameStoreProvider, italianStore } from "@/lib/store";
import { CloudSync } from "@/components/CloudSync";

export default function ItalianLayout({ children }: { children: React.ReactNode }) {
  return (
    <GameStoreProvider store={italianStore}>
      <CloudSync lang="italian" />
      {children}
    </GameStoreProvider>
  );
}
