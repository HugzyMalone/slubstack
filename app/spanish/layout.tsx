import { GameStoreProvider, spanishStore } from "@/lib/store";
import { CloudSync } from "@/components/CloudSync";

export default function SpanishLayout({ children }: { children: React.ReactNode }) {
  return (
    <GameStoreProvider store={spanishStore}>
      <CloudSync lang="spanish" />
      {children}
    </GameStoreProvider>
  );
}
