"use client";

import { useEffect, useSyncExternalStore } from "react";
import { InlineScript } from "./inline-script";

// The prototype's two design directions (A · Library, B · Hero) for Home and the checklist, chosen with
// one switch as in the prototype. Home renders both and CSS in globals.css shows one based on
// <html data-layout>; the checklist reads it with useLayoutVariant(). Choose with the switcher or
// ?layout=a|b (?home= also works). Remembered in this browser. Remove once a direction is chosen.
const KEY = "scholarpath-layout";
type Variant = "a" | "b";

const applyScript = `try{var q=new URLSearchParams(location.search),p=q.get("layout")||q.get("home");if(p==="a"||p==="b")localStorage.setItem("${KEY}",p);if(localStorage.getItem("${KEY}")==="b")document.documentElement.dataset.layout="b"}catch(e){}`;

function current(): Variant {
  return document.documentElement.dataset.layout === "b" ? "b" : "a";
}

function apply(v: Variant) {
  document.documentElement.dataset.layout = v;
  try {
    localStorage.setItem(KEY, v);
  } catch {}
}

export function LayoutVariantScript() {
  return <InlineScript html={applyScript} />;
}

function subscribe(onChange: () => void) {
  const mo = new MutationObserver(onChange);
  mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-layout"] });
  return () => mo.disconnect();
}

/** Current direction, for client components that render only one (the checklist). */
export function useLayoutVariant(): Variant {
  return useSyncExternalStore(subscribe, current, () => "a" as Variant);
}

/** Floating A/B switch, as in the prototype. Remove before launch once a layout is chosen. */
export function LayoutVariantSwitcher() {
  const v = useSyncExternalStore(subscribe, current, () => "a" as Variant);
  useEffect(() => {
    // Client navigations don't re-run the inline script, so apply the stored choice here too.
    try {
      if (localStorage.getItem(KEY) === "b") document.documentElement.dataset.layout = "b";
    } catch {}
  }, []);

  return (
    <div
      data-noprint
      role="group"
      aria-label="Design direction"
      className="fixed bottom-4 left-4 z-50 flex gap-0.5 rounded-pill bg-ink p-1 shadow-[0_8px_24px_rgb(0_0_0/.2)]"
    >
      {(
        [
          ["a", "A · Library"],
          ["b", "B · Hero"],
        ] as const
      ).map(([key, label]) => (
        <button
          key={key}
          type="button"
          aria-pressed={v === key}
          onClick={() => apply(key)}
          className={`min-h-11 rounded-pill border-0 px-3.5 text-xs font-semibold whitespace-nowrap ${
            v === key ? "bg-gold text-on-gold" : "bg-transparent text-white"
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
