import { Panda } from "@/components/Panda";
import Link from "next/link";

export default function TriviaPage() {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-6 pb-24 pt-16 text-center">
      <Panda mood="happy" size={160} />
      <h1 className="mt-6 text-2xl font-bold tracking-tight">Trivia — Coming Soon</h1>
      <p className="mt-2 text-muted">
        Challenge a friend to a 10-question head-to-head quiz. We&apos;re building it now.
      </p>
      <Link
        href="/"
        className="mt-8 inline-block rounded-xl border border-border px-6 py-3 text-sm font-medium hover:bg-border/40"
      >
        Back to home
      </Link>
    </div>
  );
}
