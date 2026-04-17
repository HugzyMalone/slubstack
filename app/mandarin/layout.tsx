import { GameStoreProvider, mandarinStore } from "@/lib/store";

export default function MandarinLayout({ children }: { children: React.ReactNode }) {
  return <GameStoreProvider store={mandarinStore}>{children}</GameStoreProvider>;
}
