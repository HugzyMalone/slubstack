import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
  className?: string;
  narrow?: boolean;
};

export function PageContainer({ children, className, narrow = false }: Props) {
  const widthClass = narrow
    ? "mx-auto max-w-xl lg:max-w-3xl"
    : "w-full lg:max-w-[1200px] lg:mx-auto";
  return (
    <div
      className={`${widthClass} px-4 py-4 lg:px-8 lg:py-8 ${className ?? ""}`.trim()}
    >
      {children}
    </div>
  );
}
