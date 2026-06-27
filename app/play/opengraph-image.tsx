import { renderOgCard } from "@/lib/og/card";

export const runtime = "nodejs";

export { alt, size, contentType } from "@/lib/og/card";

export default function Image() {
  return renderOgCard();
}
