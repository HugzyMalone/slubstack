import { GameStoreProvider, germanStore } from "@/lib/store";

export default function GermanLayout({ children }: { children: React.ReactNode }) {
  return <GameStoreProvider store={germanStore}>{children}</GameStoreProvider>;
}
