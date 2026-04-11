"use client";

import { UseFieldArrayReturn, UseFormRegister } from "react-hook-form";
import { DamageInputForm } from "@/lib/damage/schema";

type MultiplierFieldName =
  | "generalMultiplier"
  | "skillMultiplier"
  | "buffDebuffMultiplier"
  | "conditionDamageMultiplier"
  | "ignoreDefenseCustomizations";

type MultiplierSectionProps = {
  title: string;
  description: string;
  fieldName: MultiplierFieldName;
  register: UseFormRegister<DamageInputForm>;
  fieldArray: UseFieldArrayReturn<DamageInputForm, MultiplierFieldName, "id">;
};

export const MultiplierSection = ({
  title,
  description,
  fieldName,
  register,
  fieldArray,
}: MultiplierSectionProps) => {
  return (
    <section className="rounded-2xl border border-slate-700/70 bg-slate-900/70 p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div>
          <h3 className="text-lg font-semibold">{title}</h3>
          <p className="text-sm text-slate-300">{description}</p>
        </div>
        <button
          type="button"
          onClick={() =>
            fieldArray.append({
              id: `${fieldName}-${Date.now()}`,
              name: "Custom",
              value: 0,
            })
          }
          className="rounded-lg border border-slate-500 px-3 py-2 text-sm font-medium text-slate-100 hover:bg-slate-800"
        >
          Add Row
        </button>
      </div>

      <div className="space-y-2">
        {fieldArray.fields.map((field, index) => (
          <div key={field.id} className="grid grid-cols-12 gap-2">
            <input
              {...register(`${fieldName}.${index}.name`)}
              className="col-span-7 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
              placeholder="Multiplier name"
            />
            <input
              type="number"
              step="any"
              {...register(`${fieldName}.${index}.value`, { valueAsNumber: true })}
              onWheel={(event) => event.currentTarget.blur()}
              className="col-span-4 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
              placeholder="Value"
            />
            <button
              type="button"
              onClick={() => fieldArray.remove(index)}
              className="col-span-1 rounded-lg border border-red-500/60 px-2 py-2 text-sm text-red-200 hover:bg-red-900/30"
              aria-label={`Remove ${field.name}`}
            >
              x
            </button>
          </div>
        ))}
      </div>
    </section>
  );
};
