"use client";

import { useController, useFieldArray, UseFormReturn, useWatch } from "react-hook-form";
import { DamageInputForm } from "@/lib/damage/schema";
import { DamageBreakdown } from "@/lib/damage/types";
import { MultiplierSection } from "@/components/calculator/MultiplierSection";
import { CollapsibleCard } from "@/components/calculator/CollapsibleCard";

const INPUT_CLASS =
  "w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm transition-colors focus:border-purple-400 focus:outline-none";

// ---------- helpers ----------

const formatWithCommas = (raw: string): string => {
  // Strip all commas, then format the integer part with grouping.
  // Preserves a leading minus, a trailing dot, and decimal digits.
  const stripped = raw.replace(/,/g, "");
  if (stripped === "" || stripped === "-") return stripped;

  const dotIndex = stripped.indexOf(".");
  const intPart = dotIndex >= 0 ? stripped.slice(0, dotIndex) : stripped;
  const decPart = dotIndex >= 0 ? stripped.slice(dotIndex) : "";

  // Insert commas every 3 digits from the right (skip a leading minus)
  const negative = intPart.startsWith("-");
  const digits = negative ? intPart.slice(1) : intPart;
  const grouped = digits.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return (negative ? "-" : "") + grouped + decPart;
};

const marginalColor = (pct: number) =>
  pct >= 8 ? "text-emerald-400" : pct >= 5 ? "text-yellow-400" : "text-red-400";

// ---------- components ----------

type HintProps = { children: React.ReactNode };
const HintLine = ({ children }: HintProps) => (
  <p className="mt-1 text-xs leading-snug text-slate-400">{children}</p>
);

export const NumberInput = ({
  label,
  registerProps,
  step = "any",
  hint,
}: {
  label: string;
  registerProps: ReturnType<UseFormReturn<DamageInputForm>["register"]>;
  step?: string;
  hint?: React.ReactNode;
}) => (
  <label className="space-y-1">
    <span className="text-xs font-medium uppercase tracking-wide text-slate-400">{label}</span>
    <input
      type="number"
      step={step}
      {...registerProps}
      onWheel={(event) => event.currentTarget.blur()}
      className={INPUT_CLASS}
    />
    {hint}
  </label>
);

export const NumericInput = ({
  label,
  name,
  control,
  hint,
}: {
  label: string;
  name: "attack" | "criticalDamage" | "defense";
  control: UseFormReturn<DamageInputForm>["control"];
  hint?: React.ReactNode;
}) => {
  const { field } = useController({ name, control });

  // Keep a display string separate from the numeric field value.
  // On focus we show the raw number; on blur we format with commas.
  const displayValue =
    field.value === 0 || field.value === undefined
      ? ""
      : formatWithCommas(String(field.value));

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/,/g, "");
    const num = raw === "" ? 0 : parseFloat(raw);
    field.onChange(Number.isFinite(num) ? num : 0);
  };

  return (
    <label className="space-y-1">
      <span className="text-xs font-medium uppercase tracking-wide text-slate-400">{label}</span>
      <input
        type="text"
        inputMode="decimal"
        name={field.name}
        ref={field.ref}
        value={displayValue}
        onChange={handleChange}
        onBlur={field.onBlur}
        onWheel={(e) => e.currentTarget.blur()}
        className={INPUT_CLASS}
        placeholder="0"
      />
      {hint}
    </label>
  );
};

export const Toggle = ({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) => (
  <label className="flex cursor-pointer items-center justify-between rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 transition-colors hover:border-purple-500/50 hover:bg-slate-900">
    <span className="text-sm text-slate-200">{label}</span>
    <div
      className={`relative h-5 w-9 rounded-full transition-colors duration-200 ${checked ? "bg-purple-500" : "bg-slate-700"}`}
    >
      <div
        className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform duration-200 ${checked ? "translate-x-4" : "translate-x-0.5"}`}
      />
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="sr-only"
      />
    </div>
  </label>
);

// ---------- main form ----------

type DamageFormProps = {
  form: UseFormReturn<DamageInputForm>;
  breakdown: DamageBreakdown;
};

export const DamageForm = ({ form, breakdown }: DamageFormProps) => {
  const { register, control, setValue } = form;
  const formValues = useWatch({ control });

  const generalFieldArray = useFieldArray({ control, name: "generalMultiplier" });
  const skillFieldArray = useFieldArray({ control, name: "skillMultiplier" });
  const buffDebuffFieldArray = useFieldArray({ control, name: "buffDebuffMultiplier" });
  const conditionFieldArray = useFieldArray({ control, name: "conditionDamageMultiplier" });
  const ignoreDefenseFieldArray = useFieldArray({ control, name: "ignoreDefenseCustomizations" });

  // ---- Skill Damage Bonus hint ----
  const s = Number(formValues.skillDamagePercent) || 0;
  const skillFactor = 1 + s / 100;
  const skillMarginal = 10 / skillFactor;
  const skillHint = (
    <HintLine>
      Global ×{skillFactor.toFixed(2)} (attack + crit)
      {" · "}next +10%{" "}
      <span className={marginalColor(skillMarginal)}>
        ≈ +{skillMarginal.toFixed(1)}%
      </span>
    </HintLine>
  );

  // ---- Clean Hit / Pierce Bonus hint ----
  const pch = Number(formValues.bonusPchPercent) || 0;
  const pchFactor = 1.05 + pch / 100;
  const attackShare =
    breakdown.totalDamage > 0 ? breakdown.attackPart / breakdown.totalDamage : 1;
  const pchMarginal = attackShare * (10 / pchFactor);
  const pchHint = (
    <HintLine>
      Attack only ×{pchFactor.toFixed(2)} (not crit)
      {" · "}next +10%{" "}
      <span className={marginalColor(pchMarginal)}>
        ≈ +{pchMarginal.toFixed(1)}%
      </span>
    </HintLine>
  );

  return (
    <div className="space-y-3">
      {/* Core Stats */}
      <CollapsibleCard
        title="Core Stats"
        description="Base attack, critical damage, and bonus percentages"
        defaultOpen={true}
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <NumericInput label="Attack" name="attack" control={control} />
          <NumericInput label="Critical Damage" name="criticalDamage" control={control} />
          <NumberInput
            label="Skill Damage Bonus (%)"
            registerProps={register("skillDamagePercent", { valueAsNumber: true })}
            hint={skillHint}
          />
          <NumberInput
            label="Clean Hit / Pierce Bonus (%)"
            registerProps={register("bonusPchPercent", { valueAsNumber: true })}
            hint={pchHint}
          />
        </div>
      </CollapsibleCard>

      {/* Hit and Defense Conditions */}
      <CollapsibleCard
        title="Hit & Defense Conditions"
        description="Toggle hit types and enter defense values"
        defaultOpen={true}
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <Toggle
            label="Critical Hit"
            checked={Boolean(formValues.criticalHit)}
            onChange={(checked) => setValue("criticalHit", checked)}
          />
          <Toggle
            label="Pierce"
            checked={Boolean(formValues.pierce)}
            onChange={(checked) => setValue("pierce", checked)}
          />
          <Toggle
            label="Elemental Weakness"
            checked={Boolean(formValues.weakness)}
            onChange={(checked) => setValue("weakness", checked)}
          />
          <Toggle
            label="High DEF Monster"
            checked={Boolean(formValues.highDefMon)}
            onChange={(checked) => setValue("highDefMon", checked)}
          />
          <NumberInput
            label="Elemental Weakness Bonus (%)"
            registerProps={register("elementalWeaknessPercent", { valueAsNumber: true })}
          />
          <NumericInput label="Defense (ignored if High DEF enabled)" name="defense" control={control} />
          <NumberInput
            label="Final Damage Reduction (%)"
            registerProps={register("finalReductPercent", { valueAsNumber: true })}
          />
        </div>
      </CollapsibleCard>

      <MultiplierSection
        title="Ignore Defense"
        description="Add multiple ignore defense sources and percentages."
        register={register}
        fieldName="ignoreDefenseCustomizations"
        fieldArray={ignoreDefenseFieldArray}
        control={control}
        kind="ignoreDefense"
        defaultOpen={false}
      />
      <MultiplierSection
        title="General Multiplier"
        description="Boss / race / target element bonuses."
        register={register}
        fieldName="generalMultiplier"
        fieldArray={generalFieldArray}
        control={control}
        kind="additive"
        defaultOpen={false}
      />
      <MultiplierSection
        title="Skill Multiplier"
        description="Skill multiplier base ratio and skill-tree / buff rows."
        register={register}
        fieldName="skillMultiplier"
        fieldArray={skillFieldArray}
        control={control}
        kind="multiplicative"
        defaultOpen={false}
      />
      <MultiplierSection
        title="Buff & Debuff Multiplier"
        description="Damage increase buffs and target debuffs."
        register={register}
        fieldName="buffDebuffMultiplier"
        fieldArray={buffDebuffFieldArray}
        control={control}
        kind="additive"
        defaultOpen={false}
      />
      <MultiplierSection
        title="Conditional Damage Multiplier"
        description="Conditional and equipment-based bonuses."
        register={register}
        fieldName="conditionDamageMultiplier"
        fieldArray={conditionFieldArray}
        control={control}
        kind="additive"
        defaultOpen={false}
      />
    </div>
  );
};
