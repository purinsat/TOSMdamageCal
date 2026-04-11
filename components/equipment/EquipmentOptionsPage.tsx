"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { EQUIPMENT_SLOTS, StatOption } from "@/lib/equipment/options";

type SelectedAffix = {
  optionId: string;
  value: number;
};

type SlotSelection = {
  mainOptionId: string;
  mainValue: number;
  extraOptionId: string;
  extraValue: number;
  subOptionCount: number;
  affixes: SelectedAffix[];
};

type AggregatedStat = {
  statKey: string;
  statLabel: string;
  unit: "flat" | "percent";
  isReduction: boolean;
  totalValue: number;
};

const clampValue = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const INPUT_CLASS =
  "w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm shadow-sm transition-colors focus:border-purple-400 focus:outline-none";
const ADJUST_BUTTON_CLASS =
  "rounded-lg border border-slate-600 bg-slate-900 px-2.5 py-2 text-sm font-semibold text-slate-200 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40";

const SLOT_BADGES: Record<string, { text: string; className: string }> = {
  main_weapon: { text: "MW", className: "border-rose-400/60 bg-rose-500/20 text-rose-200" },
  sub_weapon: { text: "SW", className: "border-orange-400/60 bg-orange-500/20 text-orange-200" },
  upper: { text: "UP", className: "border-emerald-400/60 bg-emerald-500/20 text-emerald-200" },
  lower: { text: "LW", className: "border-teal-400/60 bg-teal-500/20 text-teal-200" },
  gloves: { text: "GL", className: "border-sky-400/60 bg-sky-500/20 text-sky-200" },
  boots: { text: "BT", className: "border-indigo-400/60 bg-indigo-500/20 text-indigo-200" },
  ring: { text: "RG", className: "border-fuchsia-400/60 bg-fuchsia-500/20 text-fuchsia-200" },
  necklace: { text: "NC", className: "border-amber-400/60 bg-amber-500/20 text-amber-200" },
};

const formatValue = (stat: AggregatedStat) => {
  const prefix = stat.isReduction ? "-" : "+";
  const suffix = stat.unit === "percent" ? "%" : "";
  return `${prefix}${stat.totalValue.toLocaleString()}${suffix}`;
};

const adjustValue = (value: number, delta: number, min: number, max: number) =>
  clampValue(value + delta, min, max);

const createInitialSelection = (): Record<string, SlotSelection> => {
  return EQUIPMENT_SLOTS.reduce<Record<string, SlotSelection>>((acc, slot) => {
    const firstOption = slot.subOptions[0];
    const firstExtraOption = slot.extraStatOptions?.[0];
    acc[slot.id] = {
      mainOptionId: "",
      mainValue: 0,
      extraOptionId: firstExtraOption?.id ?? "",
      extraValue: 0,
      subOptionCount: 1,
      affixes: [{ optionId: firstOption.id, value: firstOption.min }],
    };
    return acc;
  }, {});
};

export const EquipmentOptionsPage = () => {
  const [selections, setSelections] = useState<Record<string, SlotSelection>>(
    createInitialSelection,
  );

  const optionsById = useMemo(() => {
    const map = new Map<string, StatOption>();
    for (const slot of EQUIPMENT_SLOTS) {
      for (const option of slot.subOptions) {
        map.set(option.id, option);
      }
      for (const option of slot.mainOptions) {
        map.set(option.id, option);
      }
      for (const option of slot.extraStatOptions ?? []) {
        map.set(option.id, option);
      }
    }
    return map;
  }, []);

  const updateSlotSelection = (slotId: string, updater: (prev: SlotSelection) => SlotSelection) =>
    setSelections((prev) => ({ ...prev, [slotId]: updater(prev[slotId]) }));

  const aggregatedStats = useMemo(() => {
    const aggregateMap = new Map<string, AggregatedStat>();

    const addStat = (option: StatOption, value: number) => {
      const existing = aggregateMap.get(option.statKey);
      if (existing) {
        existing.totalValue += value;
      } else {
        aggregateMap.set(option.statKey, {
          statKey: option.statKey,
          statLabel: option.statLabel,
          unit: option.unit,
          isReduction: Boolean(option.isReduction),
          totalValue: value,
        });
      }
    };

    for (const slot of EQUIPMENT_SLOTS) {
      const slotSelection = selections[slot.id];
      if (!slotSelection) {
        continue;
      }

      if (slotSelection.mainOptionId) {
        const selectedMain = optionsById.get(slotSelection.mainOptionId);
        if (selectedMain) {
          addStat(selectedMain, slotSelection.mainValue);
        }
      }

      if (slotSelection.extraOptionId && slotSelection.extraValue !== 0) {
        const selectedExtra = optionsById.get(slotSelection.extraOptionId);
        if (selectedExtra) {
          addStat(selectedExtra, slotSelection.extraValue);
        }
      }

      for (const affix of slotSelection.affixes) {
        const selectedAffix = optionsById.get(affix.optionId);
        if (selectedAffix) {
          addStat(selectedAffix, affix.value);
        }
      }
    }

    return Array.from(aggregateMap.values()).sort((a, b) =>
      a.statLabel.localeCompare(b.statLabel),
    );
  }, [optionsById, selections]);

  return (
    <main className="mx-auto min-h-screen max-w-[90rem] p-4 md:p-8">
      <header className="mb-6 rounded-2xl border border-slate-700/70 bg-slate-900/70 p-5 shadow-lg">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold">TOSM Equipment Option Planner</h1>
            <p className="text-sm text-slate-300 md:text-base">
              Build each equipment piece with main option, passive stat, and 1-4 stars to preview
              total added stats.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setSelections(createInitialSelection())}
              className="rounded-lg border border-slate-600 bg-slate-950 px-3 py-2 text-sm hover:bg-slate-800"
            >
              Reset Planner
            </button>
            <Link
              href="/"
              className="rounded-lg border border-slate-600 bg-slate-950 px-3 py-2 text-sm hover:bg-slate-800"
            >
              Back to Damage Calculator
            </Link>
          </div>
        </div>
      </header>
 
      <div className="grid gap-6 lg:grid-cols-3">
        <section className="space-y-4 lg:col-span-2">
          {EQUIPMENT_SLOTS.map((slot) => {
            const slotSelection = selections[slot.id];
            const selectedMain = slot.mainOptions.find(
              (option) => option.id === slotSelection.mainOptionId,
            );
            const selectedExtra = slot.extraStatOptions?.find(
              (option) => option.id === slotSelection.extraOptionId,
            );

            return (
              <article
                key={slot.id}
                className="rounded-2xl border border-slate-700/70 bg-slate-900/70 p-4 shadow-md"
              >
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <h2 className="flex items-center gap-2 text-lg font-semibold">
                    <span
                      className={`inline-flex h-7 min-w-7 items-center justify-center rounded-md border px-1.5 text-[10px] font-bold tracking-wide ${
                        SLOT_BADGES[slot.id]?.className ?? "border-slate-500/60 bg-slate-500/20 text-slate-200"
                      }`}
                    >
                      {SLOT_BADGES[slot.id]?.text ?? "EQ"}
                    </span>
                    <span>{slot.label}</span>
                  </h2>
                  <div className="flex flex-wrap gap-2 text-xs">
                    <span className="rounded-full border border-slate-600 bg-slate-950 px-2 py-1 text-slate-300">
                      Main: {slotSelection.mainOptionId ? "Selected" : "None"}
                    </span>
                    <span className="rounded-full border border-slate-600 bg-slate-950 px-2 py-1 text-slate-300">
                      Passive: {slotSelection.extraOptionId ? "Enabled" : "None"}
                    </span>
                    <span className="rounded-full border border-purple-500/60 bg-purple-900/20 px-2 py-1 text-purple-200">
                      Stars: {slotSelection.subOptionCount}
                    </span>
                  </div>
                </div>
 
                {slot.mainOptions.length > 0 ? (
                  <div className="mt-3 rounded-xl border border-slate-700/70 bg-slate-950/50 p-3">
                    <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                      Main Option
                    </h3>
                    <div className="grid gap-3 sm:grid-cols-2">
                    <label className="space-y-1">
                      <span className="text-xs text-slate-300">Type</span>
                      <select
                        value={slotSelection.mainOptionId}
                        onChange={(event) => {
                          const nextId = event.target.value;
                          const mainOption = slot.mainOptions.find((option) => option.id === nextId);
                          updateSlotSelection(slot.id, (prev) => ({
                            ...prev,
                            mainOptionId: nextId,
                            mainValue: mainOption ? mainOption.min : 0,
                          }));
                        }}
                        className={INPUT_CLASS}
                      >
                        <option value="">No main option</option>
                        {slot.mainOptions.map((option) => (
                          <option key={option.id} value={option.id}>
                            {option.label} ({option.min}-{option.max}
                            {option.unit === "percent" ? "%" : ""})
                          </option>
                        ))}
                      </select>
                    </label>
 
                    <label className="space-y-1">
                      <span className="text-xs text-slate-300">Value</span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          disabled={!selectedMain}
                          onClick={() => {
                            if (!selectedMain) {
                              return;
                            }
                            updateSlotSelection(slot.id, (prev) => ({
                              ...prev,
                              mainValue: adjustValue(
                                prev.mainValue,
                                -1,
                                selectedMain.min,
                                selectedMain.max,
                              ),
                            }));
                          }}
                          className={ADJUST_BUTTON_CLASS}
                          aria-label={`Decrease ${slot.label} main option value`}
                        >
                          -
                        </button>
                        <input
                          type="number"
                          step="1"
                          min={selectedMain?.min ?? 0}
                          max={selectedMain?.max ?? 0}
                          value={selectedMain ? slotSelection.mainValue : 0}
                          disabled={!selectedMain}
                          onChange={(event) => {
                            if (!selectedMain) {
                              return;
                            }
                            const nextValue = Number(event.target.value);
                            updateSlotSelection(slot.id, (prev) => ({
                              ...prev,
                              mainValue: nextValue,
                            }));
                          }}
                          onBlur={() => {
                            if (!selectedMain) {
                              return;
                            }
                            updateSlotSelection(slot.id, (prev) => ({
                              ...prev,
                              mainValue: clampValue(prev.mainValue, selectedMain.min, selectedMain.max),
                            }));
                          }}
                          onWheel={(event) => event.currentTarget.blur()}
                          className={`${INPUT_CLASS} disabled:opacity-40`}
                        />
                        <button
                          type="button"
                          disabled={!selectedMain}
                          onClick={() => {
                            if (!selectedMain) {
                              return;
                            }
                            updateSlotSelection(slot.id, (prev) => ({
                              ...prev,
                              mainValue: adjustValue(
                                prev.mainValue,
                                1,
                                selectedMain.min,
                                selectedMain.max,
                              ),
                            }));
                          }}
                          className={ADJUST_BUTTON_CLASS}
                          aria-label={`Increase ${slot.label} main option value`}
                        >
                          +
                        </button>
                      </div>
                    </label>
                    </div>
                  </div>
                ) : (
                  <p className="mt-3 text-sm text-slate-400">
                    This slot has no separate main option.
                  </p>
                )}
 
                {slot.extraStatOptions && slot.extraStatOptions.length > 0 ? (
                  <div className="mt-3 rounded-xl border border-slate-700/70 bg-slate-950/50 p-3">
                    <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                      Passive Stat
                    </h3>
                    <div className="grid gap-3 sm:grid-cols-2">
                    {slot.extraStatOptions.length > 1 ? (
                      <label className="space-y-1">
                        <span className="text-xs text-slate-300">Type</span>
                        <select
                          value={slotSelection.extraOptionId}
                          onChange={(event) => {
                            const nextId = event.target.value;
                            updateSlotSelection(slot.id, (prev) => ({
                              ...prev,
                              extraOptionId: nextId,
                            }));
                          }}
                          className={INPUT_CLASS}
                        >
                          {slot.extraStatOptions.map((option) => (
                            <option key={option.id} value={option.id}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </label>
                    ) : (
                      <label className="space-y-1">
                        <span className="text-xs text-slate-300">Type</span>
                        <input
                          type="text"
                          value={selectedExtra?.label ?? "-"}
                          disabled
                          className={`${INPUT_CLASS} disabled:opacity-60`}
                        />
                      </label>
                    )}
 
                    <label className="space-y-1">
                      <span className="text-xs text-slate-300">
                        {selectedExtra?.label ?? "Passive Stat"} Value
                        {selectedExtra?.unit === "percent" ? " (%)" : ""}
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            const min = selectedExtra?.min ?? 0;
                            const max = selectedExtra?.max ?? 999999;
                            updateSlotSelection(slot.id, (prev) => ({
                              ...prev,
                              extraValue: adjustValue(prev.extraValue, -1, min, max),
                            }));
                          }}
                          className={ADJUST_BUTTON_CLASS}
                          aria-label={`Decrease ${slot.label} passive stat value`}
                        >
                          -
                        </button>
                        <input
                          type="number"
                          step="1"
                          min={selectedExtra?.min ?? 0}
                          max={selectedExtra?.max ?? 999999}
                          value={slotSelection.extraValue}
                          onChange={(event) => {
                            const nextValue = Number(event.target.value);
                            updateSlotSelection(slot.id, (prev) => ({
                              ...prev,
                              extraValue: nextValue,
                            }));
                          }}
                          onBlur={() => {
                            const min = selectedExtra?.min ?? 0;
                            const max = selectedExtra?.max ?? 999999;
                            updateSlotSelection(slot.id, (prev) => ({
                              ...prev,
                              extraValue: clampValue(prev.extraValue, min, max),
                            }));
                          }}
                          onWheel={(event) => event.currentTarget.blur()}
                          className={INPUT_CLASS}
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const min = selectedExtra?.min ?? 0;
                            const max = selectedExtra?.max ?? 999999;
                            updateSlotSelection(slot.id, (prev) => ({
                              ...prev,
                              extraValue: adjustValue(prev.extraValue, 1, min, max),
                            }));
                          }}
                          className={ADJUST_BUTTON_CLASS}
                          aria-label={`Increase ${slot.label} passive stat value`}
                        >
                          +
                        </button>
                      </div>
                    </label>
                    </div>
                  </div>
                ) : null}
 
                <div className="mt-3 rounded-xl border border-slate-700/70 bg-slate-950/50 p-3">
                  <label className="space-y-1">
                    <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                      Number of Stars
                    </span>
                    <select
                      value={slotSelection.subOptionCount}
                      onChange={(event) => {
                        const nextCount = Number(event.target.value);
                        updateSlotSelection(slot.id, (prev) => {
                          const trimmed = prev.affixes.slice(0, nextCount);
                          const nextAffixes = [...trimmed];
                          while (nextAffixes.length < nextCount) {
                            const fallbackId = slot.subOptions[0]?.id ?? "";
                            const fallbackOption = optionsById.get(fallbackId);
                            if (!fallbackOption) {
                              break;
                            }
                            nextAffixes.push({
                              optionId: fallbackOption.id,
                              value: fallbackOption.min,
                            });
                          }
                          return { ...prev, subOptionCount: nextCount, affixes: nextAffixes };
                        });
                      }}
                      className={INPUT_CLASS}
                    >
                      <option value={1}>1 Star</option>
                      <option value={2}>2 Stars</option>
                      <option value={3}>3 Stars</option>
                      <option value={4}>4 Stars</option>
                    </select>
                  </label>
                </div>
 
                <div className="mt-3 space-y-3">
                  {slotSelection.affixes.map((affix, index) => {
                    const selectedOption = optionsById.get(affix.optionId);
                    const optionChoices = slot.subOptions;
 
                    return (
                      <div
                        key={`${slot.id}-affix-${index}`}
                        className="grid gap-3 rounded-xl border border-slate-700 bg-slate-950/60 p-3 sm:grid-cols-2"
                      >
                        <label className="space-y-1">
                          <span className="text-xs text-slate-300">Star #{index + 1} Type</span>
                          <select
                            value={affix.optionId}
                            onChange={(event) => {
                              const nextId = event.target.value;
                              const nextOption = optionsById.get(nextId);
                              if (!nextOption) {
                                return;
                              }
                              updateSlotSelection(slot.id, (prev) => ({
                                ...prev,
                                affixes: prev.affixes.map((item, affixIndex) =>
                                  affixIndex === index
                                    ? {
                                        optionId: nextId,
                                        value: clampValue(item.value, nextOption.min, nextOption.max),
                                      }
                                    : item,
                                ),
                              }));
                            }}
                            className={INPUT_CLASS}
                          >
                            {optionChoices.map((option) => (
                              <option key={option.id} value={option.id}>
                                {option.label} ({option.min}-{option.max}
                                {option.unit === "percent" ? "%" : ""})
                              </option>
                            ))}
                          </select>
                        </label>
 
                        <label className="space-y-1">
                          <span className="text-xs text-slate-300">
                            Star #{index + 1} Value {selectedOption?.unit === "percent" ? "(%)" : ""}
                          </span>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              disabled={!selectedOption}
                              onClick={() => {
                                if (!selectedOption) {
                                  return;
                                }
                                updateSlotSelection(slot.id, (prev) => ({
                                  ...prev,
                                  affixes: prev.affixes.map((item, affixIndex) =>
                                    affixIndex === index
                                      ? {
                                          ...item,
                                          value: adjustValue(
                                            item.value,
                                            -1,
                                            selectedOption.min,
                                            selectedOption.max,
                                          ),
                                        }
                                      : item,
                                  ),
                                }));
                              }}
                              className={ADJUST_BUTTON_CLASS}
                              aria-label={`Decrease ${slot.label} star ${index + 1} value`}
                            >
                              -
                            </button>
                            <input
                              type="number"
                              step="1"
                              min={selectedOption?.min ?? 0}
                              max={selectedOption?.max ?? 0}
                              value={affix.value}
                              onChange={(event) => {
                                if (!selectedOption) {
                                  return;
                                }
                                const nextValue = Number(event.target.value);
                                updateSlotSelection(slot.id, (prev) => ({
                                  ...prev,
                                  affixes: prev.affixes.map((item, affixIndex) =>
                                    affixIndex === index
                                      ? {
                                          ...item,
                                          value: nextValue,
                                        }
                                      : item,
                                  ),
                                }));
                              }}
                              onBlur={() => {
                                if (!selectedOption) {
                                  return;
                                }
                                updateSlotSelection(slot.id, (prev) => ({
                                  ...prev,
                                  affixes: prev.affixes.map((item, affixIndex) =>
                                    affixIndex === index
                                      ? {
                                          ...item,
                                          value: clampValue(
                                            item.value,
                                            selectedOption.min,
                                            selectedOption.max,
                                          ),
                                        }
                                      : item,
                                  ),
                                }));
                              }}
                              onWheel={(event) => event.currentTarget.blur()}
                              className={INPUT_CLASS}
                            />
                            <button
                              type="button"
                              disabled={!selectedOption}
                              onClick={() => {
                                if (!selectedOption) {
                                  return;
                                }
                                updateSlotSelection(slot.id, (prev) => ({
                                  ...prev,
                                  affixes: prev.affixes.map((item, affixIndex) =>
                                    affixIndex === index
                                      ? {
                                          ...item,
                                          value: adjustValue(
                                            item.value,
                                            1,
                                            selectedOption.min,
                                            selectedOption.max,
                                          ),
                                        }
                                      : item,
                                  ),
                                }));
                              }}
                              className={ADJUST_BUTTON_CLASS}
                              aria-label={`Increase ${slot.label} star ${index + 1} value`}
                            >
                              +
                            </button>
                          </div>
                        </label>
                      </div>
                    );
                  })}
                </div>
              </article>
            );
          })}
        </section>
 
        <aside className="h-fit rounded-2xl border border-slate-700/70 bg-slate-900/80 p-4 shadow-lg lg:sticky lg:top-4">
          <h2 className="text-xl font-semibold">Total Added Stats</h2>
          <p className="mt-1 text-xs text-slate-400">
            Combined result from all selected main options, passive stats, and stars.
          </p>
          {aggregatedStats.length === 0 ? (
            <p className="mt-3 text-sm text-slate-300">No selected options yet.</p>
          ) : (
            <ul className="mt-4 max-h-[70vh] space-y-2 overflow-auto pr-1">
              {aggregatedStats.map((stat) => (
                <li
                  key={stat.statKey}
                  className="flex items-center justify-between rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm"
                >
                  <span className="text-slate-200">{stat.statLabel}</span>
                  <span className="font-semibold text-purple-300">{formatValue(stat)}</span>
                </li>
              ))}
            </ul>
          )}
        </aside>
      </div>
    </main>
  );
};
