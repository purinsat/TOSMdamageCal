"use client";

import { useEffect, useRef } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { damageInputSchema, DamageInputForm } from "@/lib/damage/schema";
import { DamageInput } from "@/lib/damage/types";
import { calculateDamage } from "@/lib/damage/calculate";
import { diffDamageInput } from "@/lib/damage/diff";
import { sanitizeDamageInput } from "@/lib/damage/sanitize";
import { formatCompact, formatFull } from "@/lib/damage/format";
import { DamageForm } from "@/components/calculator/DamageForm";
import { CollapsibleCard } from "@/components/calculator/CollapsibleCard";

export type ScenarioResult = {
  id: string;
  name: string;
  totalDamage: number;
  attackPart: number;
  criticalPart: number;
};

type ScenarioColumnProps = {
  id: string;
  name: string;
  base: DamageInput;
  initialValues: DamageInputForm;
  onResult: (result: ScenarioResult) => void;
  onValuesChange: (id: string, values: DamageInputForm) => void;
  onRename: (id: string, name: string) => void;
  onRemove: (id: string) => void;
  onDuplicate: (id: string) => void;
  canRemove: boolean;
};

export const ScenarioColumn = ({
  id,
  name,
  base,
  initialValues,
  onResult,
  onValuesChange,
  onRename,
  onRemove,
  onDuplicate,
  canRemove,
}: ScenarioColumnProps) => {
  const form = useForm<DamageInputForm>({
    resolver: zodResolver(damageInputSchema),
    defaultValues: initialValues,
    mode: "onChange",
  });

  const formValues = useWatch({ control: form.control });
  const input = sanitizeDamageInput(formValues);
  const breakdown = calculateDamage(input);
  const diffs = diffDamageInput(base, input);

  // Report result up to parent
  const onResultRef = useRef(onResult);
  onResultRef.current = onResult;
  const onValuesChangeRef = useRef(onValuesChange);
  onValuesChangeRef.current = onValuesChange;

  useEffect(() => {
    onResultRef.current({ id, name, totalDamage: breakdown.totalDamage, attackPart: breakdown.attackPart, criticalPart: breakdown.criticalPart });
  }, [id, name, breakdown.totalDamage, breakdown.attackPart, breakdown.criticalPart]);

  const parsed = damageInputSchema.safeParse(formValues);
  useEffect(() => {
    if (parsed.success) {
      onValuesChangeRef.current(id, parsed.data);
    }
  }, [id, parsed.success, formValues]);

  const diffSummary =
    diffs.length === 0 ? (
      <p className="text-xs text-slate-500 italic">No changes from base</p>
    ) : (
      <ul className="space-y-1">
        {diffs.map((d, i) => (
          <li key={i} className="text-xs text-slate-400">
            <span className="font-medium text-slate-300">{d.label}:</span>{" "}
            <span className="line-through text-slate-500">{d.from}</span>{" "}
            <span className="text-emerald-400">{d.to}</span>
          </li>
        ))}
      </ul>
    );

  const header = (
    <div className="flex items-center gap-2 w-full min-w-0">
      <input
        type="text"
        value={name}
        onChange={(e) => onRename(id, e.target.value)}
        onClick={(e) => e.stopPropagation()}
        className="min-w-0 flex-1 rounded-md border border-slate-700 bg-slate-900 px-2 py-1 text-sm font-semibold text-slate-100 focus:border-purple-400 focus:outline-none"
        placeholder="Scenario name"
      />
      <span className="shrink-0 text-base font-bold text-white tabular-nums">
        {formatCompact(breakdown.totalDamage)}
      </span>
    </div>
  );

  return (
    <section className="rounded-2xl border border-slate-700/70 bg-slate-900/70 shadow-sm">
      {/* Collapsed summary header */}
      <CollapsibleCard
        title=""
        headerRight={header}
        defaultOpen={false}
      >
        {/* Diff summary */}
        <div className="mb-4 rounded-xl border border-slate-700/60 bg-slate-950/60 p-3">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
            Changes vs Base
          </p>
          {diffSummary}
        </div>

        {/* Full numbers */}
        <div className="mb-4 grid grid-cols-3 gap-2 text-center">
          <div className="rounded-xl border border-slate-700/60 bg-slate-950/60 p-3">
            <p className="text-xs uppercase tracking-wide text-slate-400">Total</p>
            <p className="mt-1 text-sm font-bold text-white">{formatCompact(breakdown.totalDamage)}</p>
            <p className="text-xs text-slate-500">{formatFull(breakdown.totalDamage)}</p>
          </div>
          <div className="rounded-xl border border-slate-700/60 bg-slate-950/60 p-3">
            <p className="text-xs uppercase tracking-wide text-slate-400">Attack</p>
            <p className="mt-1 text-sm font-bold text-slate-200">{formatCompact(breakdown.attackPart)}</p>
          </div>
          <div className="rounded-xl border border-slate-700/60 bg-slate-950/60 p-3">
            <p className="text-xs uppercase tracking-wide text-slate-400">Critical</p>
            <p className="mt-1 text-sm font-bold text-slate-200">{formatCompact(breakdown.criticalPart)}</p>
          </div>
        </div>

        {/* Form editor */}
        <form>
          <DamageForm form={form} breakdown={breakdown} />
        </form>

        {/* Actions */}
        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={() => onDuplicate(id)}
            className="flex-1 rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-xs font-medium text-slate-200 transition-colors hover:bg-slate-700"
          >
            Duplicate
          </button>
          {canRemove && (
            <button
              type="button"
              onClick={() => onRemove(id)}
              className="rounded-lg border border-red-500/50 px-3 py-2 text-xs font-medium text-red-300 transition-colors hover:bg-red-900/30"
            >
              Remove
            </button>
          )}
        </div>
      </CollapsibleCard>
    </section>
  );
};
