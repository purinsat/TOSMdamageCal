"use client";

import { useState } from "react";
import { useFieldArray, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { defaultDamageInput } from "@/lib/damage/defaults";
import { calculateDamage } from "@/lib/damage/calculate";
import { damageInputSchema, DamageInputForm } from "@/lib/damage/schema";
import { MultiplierSection } from "@/components/calculator/MultiplierSection";
import { CalculationBreakdown } from "@/components/calculator/CalculationBreakdown";

const NumberInput = ({
  label,
  registerProps,
  step = "any",
}: {
  label: string;
  registerProps: ReturnType<
    ReturnType<typeof useForm<DamageInputForm>>["register"]
  >;
  step?: string;
}) => (
  <label className="space-y-1">
    <span className="text-sm text-slate-200">{label}</span>
    <input
      type="number"
      step={step}
      {...registerProps}
      className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2"
    />
  </label>
);

export const CalculatorPage = () => {
  const [showDetails, setShowDetails] = useState(false);
  const [savedDamages, setSavedDamages] = useState<
    Array<{ id: number; label: string; totalDamage: number }>
  >([]);
  const form = useForm<DamageInputForm>({
    resolver: zodResolver(damageInputSchema),
    defaultValues: defaultDamageInput,
    mode: "onChange",
  });

  const generalFieldArray = useFieldArray({
    control: form.control,
    name: "generalMultiplier",
  });
  const skillFieldArray = useFieldArray({
    control: form.control,
    name: "skillMultiplier",
  });
  const buffDebuffFieldArray = useFieldArray({
    control: form.control,
    name: "buffDebuffMultiplier",
  });
  const conditionFieldArray = useFieldArray({
    control: form.control,
    name: "conditionDamageMultiplier",
  });
  const ignoreDefenseFieldArray = useFieldArray({
    control: form.control,
    name: "ignoreDefenseCustomizations",
  });

  const formValues = useWatch({ control: form.control });
  const parsed = damageInputSchema.safeParse(formValues);
  const breakdown = calculateDamage(parsed.success ? parsed.data : defaultDamageInput);

  const handleResetToZero = () => {
    const current = form.getValues();
    form.reset({
      ...current,
      attack: 0,
      criticalDamage: 0,
      skillDamagePercent: 0,
      bonusPchPercent: 0,
      criticalHit: false,
      pierce: false,
      weakness: false,
      elementalWeaknessPercent: 0,
      highDefMon: false,
      defense: 0,
      finalReductPercent: 0,
      generalMultiplier: current.generalMultiplier.map((entry) => ({
        ...entry,
        value: 0,
      })),
      skillMultiplier: current.skillMultiplier.map((entry) => ({
        ...entry,
        value: 0,
      })),
      buffDebuffMultiplier: current.buffDebuffMultiplier.map((entry) => ({
        ...entry,
        value: 0,
      })),
      conditionDamageMultiplier: current.conditionDamageMultiplier.map((entry) => ({
        ...entry,
        value: 0,
      })),
      ignoreDefenseCustomizations: current.ignoreDefenseCustomizations.map((entry) => ({
        ...entry,
        value: 0,
      })),
    });
    setShowDetails(false);
    setSavedDamages([]);
  };

  const handleSaveDamage = () => {
    setSavedDamages((previous) => {
      const nextVersion = previous.length + 1;
      const next = [
        ...previous,
        { id: Date.now(), label: `V${nextVersion}`, totalDamage: breakdown.totalDamage },
      ];
      return next.slice(-6);
    });
  };

  return (
    <main className="mx-auto min-h-screen max-w-7xl p-4 md:p-8">
      <header className="mb-6">
        <h1 className="text-3xl font-bold">
          TOSM Extreme Damage Calculator created by PonderingTH
        </h1>
        <p className="mt-2 text-slate-300">
          Public calculator with full formula transparency and custom multipliers.
        </p>
        <div className="mt-4 rounded-xl border border-slate-700 bg-slate-900/70 p-4 text-sm text-slate-200">
          <p>Please subscribe us at</p>
          <a
            href="https://www.youtube.com/@PonderingTH"
            target="_blank"
            rel="noreferrer"
            className="text-purple-300 underline underline-offset-4"
          >
            https://www.youtube.com/@PonderingTH
          </a>
          <p className="mt-3">And support us at</p>
          <a
            href="https://tipme.in.th/ponderingth"
            target="_blank"
            rel="noreferrer"
            className="text-purple-300 underline underline-offset-4"
          >
            https://tipme.in.th/ponderingth
          </a>
          <p className="mt-3">Thanks and enjoy!</p>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-5">
        <form className="space-y-4 lg:col-span-3">
          <section className="rounded-2xl border border-slate-700/70 bg-slate-900/70 p-4">
            <h2 className="text-lg font-semibold">Core Stats</h2>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <NumberInput
                label="Attack"
                registerProps={form.register("attack", { valueAsNumber: true })}
              />
              <NumberInput
                label="Critical Damage"
                registerProps={form.register("criticalDamage", { valueAsNumber: true })}
              />
              <NumberInput
                label="Skill Damage Bonus (%)"
                registerProps={form.register("skillDamagePercent", {
                  valueAsNumber: true,
                })}
              />
              <NumberInput
                label="Clean Hit / Pierce Bonus (%)"
                registerProps={form.register("bonusPchPercent", {
                  valueAsNumber: true,
                })}
              />
            </div>
          </section>

          <section className="rounded-2xl border border-slate-700/70 bg-slate-900/70 p-4">
            <h2 className="text-lg font-semibold">Hit and Defense Conditions</h2>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <Toggle
                label="Critical Hit"
                checked={Boolean(formValues.criticalHit)}
                onChange={(checked) => form.setValue("criticalHit", checked)}
              />
              <Toggle
                label="Pierce"
                checked={Boolean(formValues.pierce)}
                onChange={(checked) => form.setValue("pierce", checked)}
              />
              <Toggle
                label="Elemental Weakness"
                checked={Boolean(formValues.weakness)}
                onChange={(checked) => form.setValue("weakness", checked)}
              />
              <Toggle
                label="High DEF Monster"
                checked={Boolean(formValues.highDefMon)}
                onChange={(checked) => form.setValue("highDefMon", checked)}
              />
              <NumberInput
                label="Elemental Weakness Bonus (%)"
                registerProps={form.register("elementalWeaknessPercent", {
                  valueAsNumber: true,
                })}
              />
              <NumberInput
                label="Defense (ignored if High DEF enabled)"
                registerProps={form.register("defense", { valueAsNumber: true })}
              />
              <NumberInput
                label="Final Damage Reduction (%)"
                registerProps={form.register("finalReductPercent", {
                  valueAsNumber: true,
                })}
              />
            </div>
          </section>

          <MultiplierSection
            title="Ignore Defense Customization"
            description="Add multiple ignore defense sources and percentages."
            register={form.register}
            fieldName="ignoreDefenseCustomizations"
            fieldArray={ignoreDefenseFieldArray}
          />

          <MultiplierSection
            title="General Multiplier"
            description="Boss/race/target element bonuses."
            register={form.register}
            fieldName="generalMultiplier"
            fieldArray={generalFieldArray}
          />
          <MultiplierSection
            title="Skill Multiplier"
            description='Includes "Skill multiplier" base ratio and skill-tree/buff rows.'
            register={form.register}
            fieldName="skillMultiplier"
            fieldArray={skillFieldArray}
          />
          <MultiplierSection
            title="Buff and Debuff Multiplier"
            description="Damage increase buffs and target debuffs."
            register={form.register}
            fieldName="buffDebuffMultiplier"
            fieldArray={buffDebuffFieldArray}
          />
          <MultiplierSection
            title="Conditional Damage Multiplier"
            description="Conditional and equipment-based bonuses."
            register={form.register}
            fieldName="conditionDamageMultiplier"
            fieldArray={conditionFieldArray}
          />
        </form>

        <div className="space-y-4 lg:sticky lg:top-4 lg:col-span-2 lg:h-fit">
          <CalculationBreakdown
            breakdown={breakdown}
            showDetails={showDetails}
            savedDamages={savedDamages}
          />
          <button
            type="button"
            onClick={() => setShowDetails((value) => !value)}
            className="w-full rounded-xl border border-slate-500 bg-slate-900 px-4 py-2 font-medium hover:bg-slate-800"
          >
            {showDetails ? "Hide Calculation Details" : "Show Calculation Details"}
          </button>
          <button
            type="button"
            onClick={handleSaveDamage}
            className="w-full rounded-xl border border-purple-500/70 bg-purple-900/30 px-4 py-2 font-medium hover:bg-purple-800/40"
          >
            Save Damage
          </button>
          <button
            type="button"
            onClick={handleResetToZero}
            className="w-full rounded-xl border border-slate-500 bg-slate-900 px-4 py-2 font-medium hover:bg-slate-800"
          >
            Reset All To Zero
          </button>
        </div>
      </div>
    </main>
  );
};

const Toggle = ({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) => (
  <label className="flex items-center justify-between rounded-lg border border-slate-700 bg-slate-950 px-3 py-2">
    <span className="text-sm">{label}</span>
    <input
      type="checkbox"
      checked={checked}
      onChange={(event) => onChange(event.target.checked)}
      className="h-4 w-4 accent-purple-400"
    />
  </label>
);
