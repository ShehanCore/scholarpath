import Link from "next/link";
import { Fragment } from "react";

export function Breadcrumb({ items }: { items: { label: string; href?: string }[] }) {
  return (
    <nav aria-label="Breadcrumb" className="px-1 pt-5">
      <ol className="m-0 flex list-none flex-wrap items-center gap-2 p-0 text-[13px] text-muted">
        {items.map((item, i) => (
          <Fragment key={item.label}>
            {i > 0 && (
              <li aria-hidden="true" className="flex items-center">
                ›
              </li>
            )}
            <li className="flex items-center">
              {item.href ? (
                <Link href={item.href} className="flex min-h-11 items-center font-medium no-underline">
                  {item.label}
                </Link>
              ) : (
                <span aria-current="page" className="text-ink">
                  {item.label}
                </span>
              )}
            </li>
          </Fragment>
        ))}
      </ol>
    </nav>
  );
}
