"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { loadStoredDamageInput, hasStoredDamageInput } from "@/lib/damage/storage";
import { calculateDamage } from "@/lib/damage/calculate";
import { DamageInput } from "@/lib/damage/types";
import { DamageInputForm } from "@/lib/damage/schema";
import { formatCompact, formatFull } from "@/lib/damage/format";
import { ScenarioColumn, ScenarioResult } from "@/components/compare/ScenarioColumn";

const COMPARE_STORAGE_KEY = "tosm-compare-scenarios-v1";

type ScenarioMeta = {
  id: string;
  name: string;
  values: DamageInputForm;
};

const makeId = () => `s-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

const cloneWithNewIds = (values: DamageInputForm): DamageInputForm => ({
  ...values,
  generalMultiplier: values.generalMultiplier.map((e) => ({ ...e, id: `gen-${Date.now()}-${Math.random().toString(36).slice(2)}` })),
  skillMultiplier: values.skillMultiplier.map((e) => ({ ...e, id: `skill-${Date.now()}-${Math.random().toString(36).slice(2)}` })),
  buffDebuffMultiplier: values.buffDebuffMultiplier.map((e) => ({ ...e, id: `buff-${Date.now()}-${Math.random().toString(36).slice(2)}` })),
  conditionDamageMultiplier: values.conditionDamageMultiplier.map((e) => ({ ...e, id: `cond-${Date.now()}-${Math.random().toString(36).slice(2)}` })),
  ignoreDefenseCustomizations: values.ignoreDefenseCustomizations.map((e) => ({ ...e, id: `idef-${Date.now()}-${Math.random().toString(36).slice(2)}` })),
});

const loadScenarios = (base: DamageInputForm): ScenarioMeta[] => {
  try {
    const stored = localStorage.getItem(COMPARE_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as ScenarioMeta[];
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {
    // ignore
  }
  return [
    { id: makeId(), name: "Critical Build", values: cloneWithNewIds(base) },
    { id: makeId(), name: "Skill Damage Build", values: cloneWithNewIds(base) },
  ];
};

const saveScenarios = (scenarios: ScenarioMeta[]) => {
  try {
    localStorage.setItem(COMPARE_STORAGE_KEY, JSON.stringify(scenarios));
  } catch {
    // ignore
  }
};

export const ComparePage = () => {
  const [base, setBase] = useState<DamageInput | null>(null);
  const [hasBase, setHasBase] = useState(false);
  const [scenarios, setScenarios] = useState<ScenarioMeta[]>([]);
  const [results, setResults] = useState<Record<string, ScenarioResult>>({});
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const stored = hasStoredDamageInput();
    setHasBase(stored);
    const loadedBase = loadStoredDamageInput();
    setBase(loadedBase);
    setScenarios(loadScenarios(loadedBase));
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated && scenarios.length > 0) {
      saveScenarios(scenarios);
    }
  }, [scenarios, hydrated]);

  const handleResult = useCallback((result: ScenarioResult) => {
    setResults((prev) => ({ ...prev, [result.id]: result }));
  }, []);

  const handleValuesChange = useCallback((id: string, values: DamageInputForm) => {
    setScenarios((prev) =>
      prev.map((s) => (s.id === id ? { ...s, values } : s)),
    );
  }, []);

  const handleRename = useCallback((id: string, name: string) => {
    setScenarios((prev) => prev.map((s) => (s.id === id ? { ...s, name } : s)));
    setResults((prev) =>
      prev[id] ? { ...prev, [id]: { ...prev[id], name } } : prev,
    );
  }, []);

  const handleRemove = useCallback((id: string) => {
    setScenarios((prev) => prev.filter((s) => s.id !== id));
    setResults((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  }, []);

  const handleDuplicate = useCallback((id: string) => {
    setScenarios((prev) => {
      const src = prev.find((s) => s.id === id);
      if (!src) return prev;
      const idx = prev.indexOf(src);
      const copy: ScenarioMeta = {
        id: makeId(),
        name: `${src.name} (copy)`,
        values: cloneWithNewIds(src.values),
      };
      const next = [...prev];
      next.splice(idx + 1, 0, copy);
      return next;
    });
  }, []);

  const handleAddScenario = () => {
    if (!base) return;
    const newScenario: ScenarioMeta = {
      id: makeId(),
      name: `Option ${String.fromCharCode(65 + scenarios.length)}`,
      values: cloneWithNewIds(base as DamageInputForm),
    };
    setScenarios((prev) => [...prev, newScenario]);
  };

  const handleRefreshBase = () => {
    const refreshed = loadStoredDamageInput();
    setBase(refreshed);
    setHasBase(hasStoredDamageInput());
  };

  if (!hydrated) {
    return (
      <main className="mx-auto max-w-7xl p-4 md:p-8">
        <p className="text-slate-400">Loading...</p>
      </main>
    );
  }

  const baseBreakdown = base ? calculateDamage(base) : null;
  const allEntries: Array<{ id: string; name: string; total: number; isBase?: boolean }> = [
    ...(baseBreakdown ? [{ id: "base", name: "Base", total: baseBreakdown.totalDamage, isBase: true }] : []),
    ...scenarios.map((s) => ({ id: s.id, name: s.name, total: results[s.id]?.totalDamage ?? 0 })),
  ];
  const maxTotal = Math.max(...allEntries.map((e) => e.total));

  return (
    <main className="mx-auto min-h-screen max-w-7xl p-4 md:p-8">
      {/* Header */}
      <header className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-widest text-purple-400">
          Tree of Savior Mobile
        </p>
        <h1 className="bg-gradient-to-r from-white to-purple-200 bg-clip-text text-3xl font-bold text-transparent md:text-4xl">
          Stat Compare
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          Each scenario is a full clone of your base stats. Edit only the values you want to compare.
        </p>
      </header>

      {/* No-base warning */}
      {!hasBase && (
        <div className="mb-6 rounded-2xl border border-amber-500/40 bg-amber-900/20 p-4 text-sm text-amber-300">
          No saved stats found. Go to the{" "}
          <Link href="/" className="underline hover:text-amber-200">
            Calculator
          </Link>{" "}
          and enter your stats first — they save automatically.
        </div>
      )}

      {/* Comparison panel */}
      {baseBreakdown && (
        <section className="mb-6 overflow-hidden rounded-2xl border border-purple-500/30 bg-slate-900/80 shadow-lg shadow-purple-900/20">
          <div className="border-b border-purple-500/20 bg-gradient-to-br from-purple-900/40 to-slate-900/60 px-5 py-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-purple-400">
              Comparison Summary
            </p>
            <p className="mt-0.5 text-xs text-slate-400">
              All scenarios run against the exact same formula with your base stats.
              Changes in different stat brackets have different weight.
            </p>
          </div>

          <div className="divide-y divide-slate-700/40">
            {allEntries.map((entry) => {
              const delta = baseBreakdown
                ? entry.isBase
                  ? null
                  : entry.total - baseBreakdown.totalDamage
                : null;
              const pct =
                delta !== null && baseBreakdown.totalDamage !== 0
                  ? (delta / baseBreakdown.totalDamage) * 100
                  : null;
              const isWinner = entry.total === maxTotal && maxTotal > 0;
              const barWidth =
                maxTotal > 0 ? Math.round((entry.total / maxTotal) * 100) : 0;

              return (
                <div key={entry.id} className="flex items-center gap-4 px-5 py-3">
                  <div className="w-28 shrink-0">
                    <p className="truncate text-sm font-semibold text-slate-200">{entry.name}</p>
                    {isWinner && (
                      <span className="inline-block rounded-full bg-emerald-500/20 px-2 py-0.5 text-xs font-semibold text-emerald-400">
                        Best
                      </span>
                    )}
                  </div>

                  {/* Bar */}
                  <div className="flex-1 rounded-full bg-slate-800 h-2.5 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${entry.isBase ? "bg-slate-500" : isWinner ? "bg-emerald-500" : "bg-purple-500"}`}
                      style={{ width: `${barWidth}%` }}
                    />
                  </div>

                  <div className="shrink-0 text-right">
                    <p className="text-sm font-bold text-white tabular-nums">
                      {formatCompact(entry.total)}
                    </p>
                    <p className="text-xs text-slate-500 tabular-nums">{formatFull(entry.total)}</p>
                  </div>

                  {pct !== null && (
                    <div className="w-20 shrink-0 text-right">
                      <span
                        className={`text-sm font-bold tabular-nums ${pct > 0 ? "text-emerald-400" : pct < 0 ? "text-red-400" : "text-slate-400"}`}
                      >
                        {pct >= 0 ? "+" : ""}
                        {pct.toFixed(2)}%
                      </span>
                      <p className="text-xs text-slate-500 tabular-nums">
                        {delta !== null && delta >= 0 ? "+" : ""}
                        {delta !== null ? formatCompact(delta) : ""}
                      </p>
                    </div>
                  )}
                  {entry.isBase && <div className="w-20 shrink-0 text-right text-xs text-slate-500">base</div>}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Actions row */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={handleAddScenario}
          className="rounded-xl border border-purple-500/60 bg-purple-900/30 px-4 py-2 text-sm font-medium text-purple-200 transition-colors hover:bg-purple-800/40"
        >
          + Add Scenario
        </button>
        <button
          type="button"
          onClick={handleRefreshBase}
          className="rounded-xl border border-slate-600 bg-slate-900 px-4 py-2 text-sm font-medium text-slate-300 transition-colors hover:bg-slate-800"
        >
          Refresh Base from Calculator
        </button>
        <p className="text-xs text-slate-500">
          Scenarios auto-save in your browser.
        </p>
      </div>

      {/* Base stats info row */}
      {baseBreakdown && (
        <div className="mb-6 rounded-xl border border-slate-700/50 bg-slate-900/50 px-4 py-3 text-xs text-slate-400">
          <span className="font-semibold text-slate-300">Base (from Calculator):</span>{" "}
          Total {formatCompact(baseBreakdown.totalDamage)} · Attack {formatCompact(baseBreakdown.attackPart)} · Critical {formatCompact(baseBreakdown.criticalPart)}
          {" "}— <span className="italic">Edit stats on the Calculator page to change the base.</span>
        </div>
      )}

      {/* Scenario columns */}
      <div className="space-y-4">
        {scenarios.map((scenario) => (
          <ScenarioColumn
            key={scenario.id}
            id={scenario.id}
            name={scenario.name}
            base={base ?? loadStoredDamageInput()}
            initialValues={scenario.values}
            onResult={handleResult}
            onValuesChange={handleValuesChange}
            onRename={handleRename}
            onRemove={handleRemove}
            onDuplicate={handleDuplicate}
            canRemove={scenarios.length > 1}
          />
        ))}
      </div>
    </main>
  );
};
