"use client";

import { useState } from "react";
import { useClientValue } from "@/lib/hooks/use-client-value";
import { X } from "lucide-react";

const KEY = "md-demo-notice-v1";

export function DemoNotice({ text, dismiss }: { text: string; dismiss: string }) {
  const [dismissed, setDismissed] = useState(false);
  const stored = useClientValue(() => {
    try {
      return sessionStorage.getItem(KEY) !== "hidden";
    } catch {
      return true;
    }
  }, false);
  if (!stored || dismissed) return null;
  return (
    <aside
      aria-label="Notice"
      className="fixed bottom-4 left-4 right-4 z-40 sm:left-auto flex max-w-md items-start gap-3 rounded-2xl bg-mineral/88 py-3 pl-4 pr-2 text-[0.8125rem] leading-snug text-stone shadow-[0_12px_40px_-12px_rgb(0_0_0/0.5)] backdrop-blur-md transition-[opacity,transform] duration-500 ease-[var(--ease-out)] starting:translate-y-2 starting:opacity-0"
    >
      <span aria-hidden className="mt-1.5 size-1.5 shrink-0 rounded-full bg-bronze" />
      <p className="flex-1">{text}</p>
      <button
        type="button"
        onClick={() => {
          setDismissed(true);
          try {
            sessionStorage.setItem(KEY, "hidden");
          } catch {}
        }}
        className="grid size-9 shrink-0 place-items-center rounded-full text-warm-grey transition-colors hover:text-stone"
        aria-label={dismiss}
      >
        <X size={16} strokeWidth={1.5} />
      </button>
    </aside>
  );
}
