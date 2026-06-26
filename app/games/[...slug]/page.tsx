import { notFound } from "next/navigation";

// Any /games/<slug> that doesn't match a real game route lands here and renders
// the branded games not-found boundary instead of the bare framework 404.
export default function UnknownGamePage() {
  notFound();
}
