"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { href: "/", label: "Calculator" },
  { href: "/compare", label: "Compare" },
  { href: "/buffs", label: "Buffs" },
];

export const AppNav = () => {
  const pathname = usePathname();

  return (
    <nav className="sticky top-0 z-50 border-b border-slate-700/60 bg-slate-950/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-7xl items-center gap-1 px-4 md:px-8">
        {tabs.map((tab) => {
          const isActive = tab.href === "/" ? pathname === "/" : pathname.startsWith(tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`relative px-4 py-3 text-sm font-medium transition-colors ${
                isActive
                  ? "text-purple-300"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              {tab.label}
              {isActive && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full bg-purple-400" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
};
