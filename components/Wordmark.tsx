type Size = "sm" | "md" | "lg" | "xl";

const HEIGHTS: Record<Size, number> = {
  sm: 46,
  md: 56,
  lg: 68,
  xl: 84,
};

export function Wordmark({ size = "md", className = "" }: { size?: Size; className?: string }) {
  const h = HEIGHTS[size];
  return (
    /* eslint-disable-next-line @next/next/no-img-element */
    <img
      src="/email-wordmark.png"
      alt="Slubstack"
      style={{ height: h, width: "auto" }}
      className={`inline-block select-none ${className}`}
    />
  );
}
