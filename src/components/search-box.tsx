"use client";

import { useRouter } from "next/navigation";
import { useId, useRef, useState } from "react";
import { searchMatches, type SearchEntry } from "@/lib/search-index";

/**
 * Search with suggestions (ARIA combobox). Arrow keys move through suggestions, Enter opens one,
 * Escape closes the list.
 */
export function SearchBox({ index }: { index: SearchEntry[] }) {
  const router = useRouter();
  const id = useId();
  const listId = `${id}-list`;
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const matches = searchMatches(index, q);
  const showList = open && q.trim().length > 0;

  const go = (entry: SearchEntry) => {
    setQ("");
    setOpen(false);
    router.push(entry.href);
  };
  const submit = () => {
    const pick = matches[active] ?? matches[0];
    if (pick) go(pick);
    else setOpen(true);
  };

  return (
    <div
      className="relative max-w-[520px] flex-[1_1_300px]"
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) setOpen(false);
      }}
    >
      <form
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        <span
          aria-hidden="true"
          className="pointer-events-none absolute top-4 left-[18px] block size-[13px] rounded-full border-2 border-muted"
        />
        <input
          ref={inputRef}
          type="text"
          role="combobox"
          aria-label="Search scholarships"
          aria-expanded={showList}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={showList && active >= 0 ? `${id}-opt-${active}` : undefined}
          autoComplete="off"
          value={q}
          placeholder="Search by subject, country, university or scholarship"
          onChange={(e) => {
            setQ(e.target.value);
            setActive(-1);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown" && matches.length) {
              e.preventDefault();
              setOpen(true);
              setActive((a) => (a + 1) % matches.length);
            } else if (e.key === "ArrowUp" && matches.length) {
              e.preventDefault();
              setActive((a) => (a <= 0 ? matches.length - 1 : a - 1));
            } else if (e.key === "Escape") {
              setOpen(false);
              setActive(-1);
            }
          }}
          className="h-12 w-full rounded-pill border-0 bg-surface-4 pr-[18px] pl-11 text-sm font-medium text-ink placeholder:text-muted"
        />
      </form>
      <div
        id={listId}
        role="listbox"
        aria-label="Suggestions"
        hidden={!showList}
        className="absolute top-[54px] right-0 left-0 z-20 max-h-[360px] overflow-auto rounded-card-sm bg-surface p-1.5 shadow-dropdown"
      >
        {matches.map((m, i) => (
          <div
            key={m.href}
            id={`${id}-opt-${i}`}
            role="option"
            aria-selected={i === active}
            tabIndex={-1}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => go(m)}
            onMouseEnter={() => setActive(i)}
            className={`flex min-h-[46px] cursor-pointer items-center justify-between gap-3 rounded-input px-3 text-sm font-medium ${
              i === active ? "bg-surface-4" : ""
            }`}
          >
            <span>{m.label}</span>
            <span className="font-mono text-[11px] font-medium text-muted uppercase">{m.type}</span>
          </div>
        ))}
        {matches.length === 0 && (
          <p className="m-0 px-3 py-3.5 text-sm text-muted">No matches. Try a subject, country or scholarship name.</p>
        )}
      </div>
    </div>
  );
}
