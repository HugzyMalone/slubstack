type Size = "sm" | "md" | "lg" | "xl";

const SIZES: Record<Size, { font: string; gap: string }> = {
  sm: { font: "text-[24px]", gap: "leading-[0.95]" },
  md: { font: "text-[30px]", gap: "leading-[0.95]" },
  lg: { font: "text-[36px]", gap: "leading-[0.95]" },
  xl: { font: "text-[44px]", gap: "leading-[0.95]" },
};

export function Wordmark({ size = "md", className = "" }: { size?: Size; className?: string }) {
  const { font, gap } = SIZES[size];
  return (
    <span
      className={`font-display flex flex-col items-center font-extrabold ${font} ${gap} ${className}`}
      style={{
        letterSpacing: "-0.04em",
        fontKerning: "none",
        fontFeatureSettings: '"kern" 0',
        background: "linear-gradient(120deg, var(--accent) 0%, var(--game) 100%)",
        WebkitBackgroundClip: "text",
        backgroundClip: "text",
        color: "transparent",
      }}
    >
      <span>slub</span>
      <span>stack</span>
    </span>
  );
}
