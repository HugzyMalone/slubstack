"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { useEffect } from "react";
import { QuestCard } from "@/components/QuestCard";
import { spring } from "@/lib/motion";

type Props = {
  open: boolean;
  onClose: () => void;
};

export function QuestDrawer({ open, onClose }: Props) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[55] flex items-end justify-center sm:items-center"
          style={{
            background: "color-mix(in srgb, var(--fg) 36%, transparent)",
            backdropFilter: "blur(6px)",
          }}
          onClick={onClose}
        >
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={spring}
            className="w-full max-w-md rounded-t-[28px] sm:rounded-[28px] p-4"
            style={{
              background: "var(--bg)",
              border: "1px solid var(--border)",
              boxShadow: "var(--shadow-panel-hi)",
              paddingBottom: "max(calc(env(safe-area-inset-bottom, 0px) + 16px), 20px)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-2 flex items-center justify-between">
              <span className="text-[11px] font-semibold tracking-widest text-muted uppercase">Today</span>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="rounded-full p-1.5 text-muted hover:bg-border/50 hover:text-fg transition-colors"
              >
                <X size={18} strokeWidth={2.5} />
              </button>
            </div>
            <QuestCard />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
