import { GameStoreProvider, germanStore } from "@/lib/store";
import { CloudSync } from "@/components/CloudSync";

export default function GermanLayout({ children }: { children: React.ReactNode }) {
  return (
    <GameStoreProvider store={germanStore}>
      <CloudSync lang="german" />
      {children}
    </GameStoreProvider>
  );
}
