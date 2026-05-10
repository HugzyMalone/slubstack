/* eslint-disable @next/next/no-img-element */
const CONCEPTS = [
  { id: "1-tight-stack", name: "Tight stack" },
  { id: "2-staggered", name: "Staggered" },
  { id: "3-floating-accent", name: "Floating accent" },
];

const SIZES = [
  { px: 24, label: "24px (sidebar)" },
  { px: 40, label: "40px (topbar)" },
  { px: 80, label: "80px (auth)" },
  { px: 160, label: "160px (hero)" },
];

export default function LogoPreviewPage() {
  return (
    <div className="px-6 py-10 lg:max-w-[1100px] lg:mx-auto">
      <h1 className="text-3xl font-bold tracking-tight">Logo concepts</h1>
      <p className="mt-2 text-sm text-muted">
        Three cube-stack variants, rendered at the four real-world sizes the logo lives at, on light and dark.
      </p>

      <div className="mt-10 space-y-12">
        {CONCEPTS.map(({ id, name }) => (
          <section key={id}>
            <h2 className="mb-4 text-lg font-semibold">{name}</h2>
            <div className="grid gap-4 lg:grid-cols-2">
              <Tile id={id} mode="light" sizes={SIZES} />
              <Tile id={id} mode="dark" sizes={SIZES} />
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

function Tile({ id, mode, sizes }: { id: string; mode: "light" | "dark"; sizes: typeof SIZES }) {
  const bg = mode === "light" ? "#fafaf9" : "#0f0f17";
  const fg = mode === "light" ? "#0f0f17" : "#fafaf9";
  return (
    <div className="overflow-hidden rounded-2xl border border-border">
      <div className="flex flex-wrap items-end justify-around gap-6 px-6 py-8" style={{ background: bg }}>
        {sizes.map(({ px, label }) => (
          <div key={px} className="flex flex-col items-center gap-3">
            <img
              src={`/logo-concepts/${id}.svg`}
              alt=""
              style={{ width: px, height: "auto" }}
            />
            <span className="text-[11px] tracking-wide" style={{ color: fg, opacity: 0.6 }}>{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
