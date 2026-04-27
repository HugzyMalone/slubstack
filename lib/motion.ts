import type { Transition, Variants } from "framer-motion";

export const spring: Transition = { type: "spring", stiffness: 220, damping: 22, mass: 0.9 };
export const bouncy: Transition = { type: "spring", stiffness: 360, damping: 14 };
export const springy: Transition = { type: "spring", stiffness: 280, damping: 20 };
export const snappy: Transition = { duration: 0.18, ease: [0.2, 0.8, 0.2, 1] };

export const pressVariants: Variants = {
  idle: { scale: 1 },
  press: { scale: 0.96, transition: snappy },
};

export const correctVariants: Variants = {
  idle: { scale: 1 },
  hit: { scale: [1, 1.08, 1], transition: bouncy },
};

export const wrongVariants: Variants = {
  idle: { x: 0 },
  shake: { x: [0, -8, 8, -6, 6, 0], transition: { duration: 0.32 } },
};

export const screenEnterVariants: Variants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: spring },
  exit: { opacity: 0, y: -8, transition: snappy },
};
