"use client";

type Props = { size?: number; className?: string };

export function BullMascot({ size = 96, className }: Props) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 96 96"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <radialGradient id="bull-body" cx="50%" cy="40%" r="60%">
          <stop offset="0%" stopColor="#fff1e0" />
          <stop offset="100%" stopColor="#f4d4b3" />
        </radialGradient>
        <linearGradient id="bull-horn" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffb37a" />
          <stop offset="100%" stopColor="#ff8a4c" />
        </linearGradient>
      </defs>

      {/* Horns */}
      <path d="M22 36 C 14 28, 12 18, 22 14 C 24 22, 28 28, 32 32 Z" fill="url(#bull-horn)" />
      <path d="M74 36 C 82 28, 84 18, 74 14 C 72 22, 68 28, 64 32 Z" fill="url(#bull-horn)" />

      {/* Head */}
      <ellipse cx="48" cy="54" rx="30" ry="28" fill="url(#bull-body)" stroke="#2a1738" strokeWidth="2" />

      {/* Forehead tuft */}
      <path d="M40 30 Q 48 24 56 30 Q 52 34 48 33 Q 44 34 40 30 Z" fill="#2a1738" opacity="0.85" />

      {/* Snout */}
      <ellipse cx="48" cy="68" rx="14" ry="10" fill="#ffd9b8" stroke="#2a1738" strokeWidth="1.6" />
      <ellipse cx="42" cy="67" rx="1.6" ry="2.2" fill="#2a1738" />
      <ellipse cx="54" cy="67" rx="1.6" ry="2.2" fill="#2a1738" />

      {/* Eyes */}
      <ellipse cx="38" cy="50" rx="4" ry="5" fill="#fff" />
      <ellipse cx="58" cy="50" rx="4" ry="5" fill="#fff" />
      <circle cx="39" cy="51" r="2.4" fill="#2a1738" />
      <circle cx="59" cy="51" r="2.4" fill="#2a1738" />
      <circle cx="40" cy="50" r="0.9" fill="#fff" />
      <circle cx="60" cy="50" r="0.9" fill="#fff" />

      {/* Cheeks */}
      <circle cx="28" cy="62" r="3.5" fill="#ff8a4c" opacity="0.4" />
      <circle cx="68" cy="62" r="3.5" fill="#ff8a4c" opacity="0.4" />

      {/* Mouth */}
      <path d="M44 73 Q 48 76 52 73" stroke="#2a1738" strokeWidth="1.6" strokeLinecap="round" fill="none" />

      {/* Ears */}
      <ellipse cx="20" cy="46" rx="6" ry="4" fill="url(#bull-body)" stroke="#2a1738" strokeWidth="1.6" transform="rotate(-30 20 46)" />
      <ellipse cx="76" cy="46" rx="6" ry="4" fill="url(#bull-body)" stroke="#2a1738" strokeWidth="1.6" transform="rotate(30 76 46)" />
    </svg>
  );
}
