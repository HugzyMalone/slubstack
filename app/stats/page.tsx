import { AuthPanel } from "@/components/AuthPanel";
import { StatsClient } from "./StatsClient";

export default function StatsPage() {
  return (
    <div className="mx-auto max-w-xl px-4 pb-28 pt-4">
      <StatsClient />
      <AuthPanel />
    </div>
  );
}
