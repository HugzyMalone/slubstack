import { GameStoreProvider, mandarinStore } from "@/lib/store";
import { CloudSync } from "@/components/CloudSync";

export default function MandarinLayout({ children }: { children: React.ReactNode }) {
  return (
    <GameStoreProvider store={mandarinStore}>
      <CloudSync lang="mandarin" />
      {children}
    </GameStoreProvider>
  );
}
