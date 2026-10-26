"use client";

import { useEffect, useSyncExternalStore } from "react";
import { InlineScript } from "../inline-script";

// Both home layouts are server-rendered; CSS in globals.css shows one based on <html data-home>.
// Choose with the switcher or ?home=a|b. The choice is remembered in this browser.
const KEY = "scholarpath-home";
type Variant = "a" | "b";

const applyScript = `try{var p=new URLSearchParams(location.search).get("home");if(p==="a"||p==="b")localStorage.setItem("${KEY}",p);if(localStorage.getItem("${KEY}")==="b")document.documentElement.dataset.home="b"}catch(e){}`;

function current(): Variant {
  return document.documentElement.dataset.home === "b" ? "b" : "a";
}

function apply(v: Variant) {
  document.documentElement.dataset.home = v;
  try {
    localStorage.setItem(KEY, v);
  } catch {}
}

export function HomeVariantScript() {
  return <InlineScript html={applyScript} />;
}

function subscribe(onChange: () => void) {
  const mo = new MutationObserver(onChange);
  mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-home"] });
  return () => mo.disconnect();
}

/** Floating A/B switch, as in the prototype. Remove before launch once a layout is chosen. */
export function HomeVariantSwitcher() {
  const v = useSyncExternalStore(subscribe, current, () => "a" as Variant);
  useEffect(() => {
    // Client navigations don't re-run the inline script, so apply the stored choice here too.
    try {
      if (localStorage.getItem(KEY) === "b") document.documentElement.dataset.home = "b";
    } catch {}
  }, []);

  return (
    <div
      data-noprint
      role="group"
      aria-label="Home page layout"
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
