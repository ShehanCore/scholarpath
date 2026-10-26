"use client";

import { useActionState, useId, useState } from "react";
import { saveRank, type RankFormState } from "./actions";

export type EditorRow = { id: string; name: string; countryCode: string; countryName: string; rank: string };

export function RankingsEditor({ rows, editable }: { rows: EditorRow[]; editable: boolean }) {
  const countries = [...new Map(rows.map((r) => [r.countryCode, r.countryName])).entries()];
  const [country, setCountry] = useState(countries[0]?.[0] ?? "");
  const shown = rows.filter((r) => r.countryCode === country);
  return (
    <>
      <label className="mb-4 flex max-w-xs flex-col gap-1.5 text-xs font-semibold uppercase tracking-[.06em]">
        Country
        <select
          value={country}
          onChange={(e) => setCountry(e.target.value)}
          className="min-h-12 rounded-segment border-[1.5px] border-border-input bg-surface px-3 text-sm font-medium tracking-normal normal-case"
        >
          {countries.map(([code, name]) => (
            <option key={code} value={code}>
              {name} ({rows.filter((r) => r.countryCode === code && r.rank).length} ranked)
            </option>
          ))}
        </select>
      </label>
      <ul className="m-0 flex list-none flex-col p-0">
        {shown.map((r) => (
          <RankRow key={r.id} row={r} editable={editable} />
        ))}
      </ul>
    </>
  );
}

function RankRow({ row, editable }: { row: EditorRow; editable: boolean }) {
  const [state, action, pending] = useActionState<RankFormState, FormData>(saveRank, null);
  const id = useId();
  return (
    <li className="border-t border-border py-3">
      <form action={action} className="flex flex-wrap items-end gap-3">
        <input type="hidden" name="universityId" value={row.id} />
        <label htmlFor={`${id}-rank`} className="min-w-[220px] flex-1 text-[15px] font-semibold">
          {row.name}
        </label>
        <input
          id={`${id}-rank`}
          name="rank"
          defaultValue={row.rank}
          placeholder="To confirm"
          disabled={!editable}
          aria-describedby={`${id}-msg`}
          inputMode="text"
          className="min-h-11 w-36 rounded-input border-[1.5px] border-border-input bg-surface px-3 font-mono text-sm tabular-nums disabled:bg-surface-4"
        />
        <button
          type="submit"
          disabled={!editable || pending}
          className="min-h-11 rounded-pill border-0 bg-navy px-5 text-xs font-bold uppercase tracking-[.05em] text-white disabled:bg-disabled disabled:text-muted"
        >
          {pending ? "Saving…" : "Save"}
        </button>
        <p id={`${id}-msg`} role="status" className={`m-0 basis-full text-[13px] ${state?.ok === false ? "text-error" : "text-muted"}`}>
          {state?.message}
        </p>
      </form>
    </li>
  );
}
