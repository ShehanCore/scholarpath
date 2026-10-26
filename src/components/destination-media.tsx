"use client";

import { useEffect, useRef, useState } from "react";

type NetworkInformation = { saveData?: boolean; effectiveType?: string };

/** Plays a muted looping clip over the poster image, only when it's on screen and the visitor can afford it. */
export function DestinationVideo({ src }: { src: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  // Becomes true the first time the card is on screen (and the visitor can afford video); sets the src.
  const [loaded, setLoaded] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const connection = (navigator as Navigator & { connection?: NetworkInformation }).connection;
    const slow = connection?.saveData || /(^|-)2g|3g/.test(connection?.effectiveType ?? "");
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const el = ref.current;
    if (slow || reduced || !el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        setVisible(entry.isIntersecting);
        if (entry.isIntersecting) setLoaded(true);
      },
      { threshold: 0.25 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el || !loaded) return;
    if (visible) el.play().catch(() => {});
    else el.pause();
  }, [loaded, visible]);

  return (
    <video
      ref={ref}
      src={loaded ? src : undefined}
      muted
      loop
      playsInline
      preload="none"
      aria-hidden="true"
      tabIndex={-1}
      className={`pointer-events-none absolute inset-0 size-full object-cover transition-opacity duration-500 ${loaded ? "opacity-100" : "opacity-0"}`}
    />
  );
}
