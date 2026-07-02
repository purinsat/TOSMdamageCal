"use client";

import { useState, useId } from "react";

type CollapsibleCardProps = {
  title: string;
  description?: string;
  badge?: React.ReactNode;
  defaultOpen?: boolean;
  headerRight?: React.ReactNode;
  children: React.ReactNode;
};

export const CollapsibleCard = ({
  title,
  description,
  badge,
  defaultOpen = true,
  headerRight,
  children,
}: CollapsibleCardProps) => {
  const [open, setOpen] = useState(defaultOpen);
  const id = useId();

  return (
    <section className="rounded-2xl border border-slate-700/70 bg-slate-900/70 shadow-sm transition-shadow hover:shadow-md">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen((prev) => !prev)}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
      >
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-base font-semibold leading-tight">{title}</h2>
            {badge}
          </div>
          {description && !open && (
            <p className="mt-0.5 truncate text-xs text-slate-400">{description}</p>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {headerRight}
          <ChevronIcon open={open} />
        </div>
      </button>

      <div
        id={id}
        className={`overflow-hidden transition-all duration-200 ${
          open ? "opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="px-4 pb-4">{children}</div>
      </div>
    </section>
  );
};

const ChevronIcon = ({ open }: { open: boolean }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={`shrink-0 text-slate-400 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
    aria-hidden="true"
  >
    <polyline points="6 9 12 15 18 9" />
  </svg>
);
