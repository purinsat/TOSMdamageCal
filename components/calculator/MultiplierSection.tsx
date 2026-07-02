"use client";

import { Control, UseFieldArrayReturn, UseFormRegister, useWatch } from "react-hook-form";
import { DamageInputForm } from "@/lib/damage/schema";
import { CollapsibleCard } from "@/components/calculator/CollapsibleCard";

type MultiplierFieldName =
  | "generalMultiplier"
  | "skillMultiplier"
  | "buffDebuffMultiplier"
  | "conditionDamageMultiplier"
  | "ignoreDefenseCustomizations";

type MultiplierKind = "additive" | "multiplicative" | "ignoreDefense";

type MultiplierSectionProps = {
  title: string;
  description: string;
  fieldName: MultiplierFieldName;
  register: UseFormRegister<DamageInputForm>;
  fieldArray: UseFieldArrayReturn<DamageInputForm, MultiplierFieldName, "id">;
  control: Control<DamageInputForm>;
  kind: MultiplierKind;
  defaultOpen?: boolean;
};

const safeNum = (v: unknown): number => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

const computeSummary = (
  kind: MultiplierKind,
  entries: Array<{ name?: string; value?: unknown }>,
) => {
  const values = entries.map((e) => safeNum(e.value));

  if (kind === "additive") {
    const sum = values.reduce((acc, v) => acc + v, 0);
    const factor = 1 + sum / 100;
    const marginal = 10 / factor;
    return { kind, sum, factor, marginal } as const;
  }

  if (kind === "multiplicative") {
    let factor = 1;
    for (const entry of entries) {
      const v = safeNum(entry.value);
      const name = (entry.name ?? "").trim().toLowerCase();
      if (name === "skill multiplier") {
        factor *= v / 100;
      } else if (v !== 0) {
        factor *= 1 + v / 100;
      }
    }
    return { kind, factor } as const;
  }

  // ignoreDefense
  const product = values.reduce((acc, v) => acc * (1 - v / 100), 1);
  const totalIgnore = (1 - product) * 100;
  return { kind, totalIgnore } as const;
};

export const MultiplierSection = ({
  title,
  description,
  fieldName,
  register,
  fieldArray,
  control,
  kind,
  defaultOpen = false,
}: MultiplierSectionProps) => {
  const rawEntries = useWatch({ control, name: fieldName }) ?? [];
  const entries = rawEntries as Array<{ name?: string; value?: unknown }>;
  const summary = computeSummary(kind, entries);
  const rowCount = fieldArray.fields.length;

  // Badge: key metric visible even when collapsed
  const badge = (
    <span className="rounded-full border border-purple-500/50 bg-purple-900/30 px-2 py-0.5 text-xs font-medium text-purple-300">
      {summary.kind === "ignoreDefense"
        ? `${summary.totalIgnore.toFixed(0)}% ignored`
        : `×${summary.factor.toFixed(2)}`}
    </span>
  );

  // Summary strip content
  const summaryStrip =
    summary.kind === "additive" ? (
      <div className="mb-3 rounded-lg border border-slate-700/60 bg-slate-950/60 px-3 py-2 text-xs text-slate-300">
        <span className="text-slate-400">Sum </span>
        <span className="font-medium text-white">
          {summary.sum >= 0 ? "+" : ""}
          {summary.sum.toFixed(1)}%
        </span>
        <span className="mx-2 text-slate-600">→</span>
        <span className="font-medium text-purple-300">×{summary.factor.toFixed(2)}</span>
        <span className="mx-2 text-slate-600">·</span>
        <span className="text-slate-400">next +10% </span>
        <span
          className={`font-medium ${
            summary.marginal >= 8
              ? "text-emerald-400"
              : summary.marginal >= 5
                ? "text-yellow-400"
                : "text-red-400"
          }`}
        >
          ≈ +{summary.marginal.toFixed(1)}%
        </span>
      </div>
    ) : summary.kind === "multiplicative" ? (
      <div className="mb-3 rounded-lg border border-slate-700/60 bg-slate-950/60 px-3 py-2 text-xs text-slate-300">
        <span className="text-slate-400">Multiplier </span>
        <span className="font-medium text-purple-300">×{summary.factor.toFixed(2)}</span>
        <span className="mx-2 text-slate-600">·</span>
        <span className="text-emerald-400">multiplicative — each row is full value</span>
      </div>
    ) : (
      <div className="mb-3 rounded-lg border border-slate-700/60 bg-slate-950/60 px-3 py-2 text-xs text-slate-300">
        <span className="text-slate-400">Total ignore </span>
        <span className="font-medium text-purple-300">≈ {summary.totalIgnore.toFixed(1)}%</span>
        <span className="mx-2 text-slate-600">·</span>
        <span className="text-slate-400">only effective vs defended targets</span>
      </div>
    );

  return (
    <CollapsibleCard
      title={title}
      description={description}
      badge={badge}
      defaultOpen={defaultOpen}
    >
      {summaryStrip}

      <div className="mb-3 flex items-center justify-between gap-2">
        <span className="text-xs text-slate-500">
          {rowCount} {rowCount === 1 ? "row" : "rows"}
        </span>
        <button
          type="button"
          onClick={() =>
            fieldArray.append({
              id: `${fieldName}-${Date.now()}`,
              name: "Custom",
              value: 0,
            })
          }
          className="shrink-0 rounded-lg border border-slate-500 px-3 py-1.5 text-sm font-medium text-slate-100 transition-colors hover:bg-slate-800"
        >
          + Add Row
        </button>
      </div>

      <div className="space-y-2">
        {fieldArray.fields.map((field, index) => (
          <div key={field.id} className="grid grid-cols-12 gap-2">
            <input
              {...register(`${fieldName}.${index}.name`)}
              className="col-span-7 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm transition-colors focus:border-purple-400 focus:outline-none"
              placeholder="Multiplier name"
            />
            <input
              type="number"
              step="any"
              {...register(`${fieldName}.${index}.value`, { valueAsNumber: true })}
              onWheel={(event) => event.currentTarget.blur()}
              className="col-span-4 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm transition-colors focus:border-purple-400 focus:outline-none"
              placeholder="Value"
            />
            <button
              type="button"
              onClick={() => fieldArray.remove(index)}
              className="col-span-1 rounded-lg border border-red-500/60 px-2 py-2 text-sm text-red-300 transition-colors hover:bg-red-900/30"
              aria-label={`Remove ${field.name}`}
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </CollapsibleCard>
  );
};
