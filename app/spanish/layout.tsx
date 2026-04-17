import { GameStoreProvider, spanishStore } from "@/lib/store";

export default function SpanishLayout({ children }: { children: React.ReactNode }) {
  return <GameStoreProvider store={spanishStore}>{children}</GameStoreProvider>;
}
