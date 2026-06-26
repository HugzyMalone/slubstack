"use client";

import { useEffect, useState } from "react";
import { Download, Share, X } from "lucide-react";
import Image from "next/image";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const DISMISS_KEY = "slubstack_install_dismissed";

function isStandalone() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as { standalone?: boolean }).standalone === true
  );
}

function isIos() {
  return /iphone|ipad|ipod/i.test(window.navigator.userAgent);
}

export function InstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [iosHint, setIosHint] = useState(false);

  useEffect(() => {
    if (isStandalone() || localStorage.getItem(DISMISS_KEY)) return;

    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);

    // One-time read of a browser-only capability (userAgent) after hydration;
    // it cannot be derived on the server.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (isIos()) setIosHint(true);

    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  function dismiss() {
    localStorage.setItem(DISMISS_KEY, "1");
    setDeferred(null);
    setIosHint(false);
  }

  async function install() {
    if (!deferred) return;
    await deferred.prompt();
    await deferred.userChoice;
    dismiss();
  }

  if (!deferred && !iosHint) return null;

  return (
    <div
      className="fixed inset-x-0 z-40 flex justify-center px-4 lg:hidden"
      style={{ bottom: "calc(env(safe-area-inset-bottom) + 76px)" }}
    >
      <div
        className="flex w-full max-w-md items-center gap-3 rounded-2xl px-3.5 py-3"
        style={{
          background: "color-mix(in srgb, var(--surface) 92%, transparent)",
          backdropFilter: "blur(24px) saturate(180%)",
          WebkitBackdropFilter: "blur(24px) saturate(180%)",
          border: "1.5px solid color-mix(in srgb, var(--accent) 30%, transparent)",
          boxShadow: "0 12px 32px -10px color-mix(in srgb, var(--accent) 35%, transparent)",
        }}
      >
        <Image src="/slubstack-logo.png" alt="" width={36} height={36} className="h-9 w-9 shrink-0 rounded-lg object-contain" />
        <div className="min-w-0 flex-1">
          <div className="text-[13px] font-extrabold leading-tight">Install Slubstack</div>
          {deferred ? (
            <div className="text-[11px] leading-snug text-muted">Add it to your home screen for full-screen play.</div>
          ) : (
            <div className="flex items-center gap-1 text-[11px] leading-snug text-muted">
              Tap <Share size={12} strokeWidth={2.5} className="inline" /> then &ldquo;Add to Home Screen&rdquo;.
            </div>
          )}
        </div>
        {deferred && (
          <button
            type="button"
            onClick={install}
            className="flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2 text-[12px] font-bold text-[var(--accent-fg)] transition-transform duration-100 active:scale-95"
            style={{ background: "var(--accent)" }}
          >
            <Download size={14} strokeWidth={2.5} />
            Install
          </button>
        )}
        <button
          type="button"
          onClick={dismiss}
          aria-label="Dismiss"
          className="shrink-0 rounded-full p-1.5 text-muted transition-colors hover:text-fg"
        >
          <X size={16} strokeWidth={2.5} />
        </button>
      </div>
    </div>
  );
}
