"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { loadStoredDamageInput, hasStoredDamageInput } from "@/lib/damage/storage";
import { sanitizeDamageInput } from "@/lib/damage/sanitize";
import { formatCompact, formatFull } from "@/lib/damage/format";
import { calculateDamage } from "@/lib/damage/calculate";
import {
  BRACKET_META,
  BuffBracket,
  BuffConfig,
  BuffEffect,
  BuffTiming,
  evaluateBuff,
} from "@/lib/buff/model";

// ─── Storage ──────────────────────────────────────────────────────────────────
const STORAGE_KEY = "tosm-buff-compare-v1";

const makeId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

const makeTiming = (): BuffTiming => ({ mode: "always" });
const makeTimedTiming = (): Extract<BuffTiming, { mode: "timed" }> => ({
  mode: "timed",
  durationSec: 30,
  cooldownSec: 80,
  initialDelaySec: 0,
});

const makeEffect = (): BuffEffect => ({
  id: makeId(),
  value: 0,
  bracket: "buffDebuff",
  timing: makeTiming(),
});

// Default buffs matching the plan example
const makeDefaultBuffs = (): BuffConfig[] => [
  {
    id: makeId(),
    name: "Mechanic Buff (example)",
    effects: [
      { id: makeId(), value: 5000, bracket: "attackFlat",  timing: { mode: "always" } },
      { id: makeId(), value: 15,   bracket: "buffDebuff",  timing: { mode: "timed", durationSec: 30, cooldownSec: 80, initialDelaySec: 0 } },
      { id: makeId(), value: 15,   bracket: "ignoreDefense", timing: { mode: "timed", durationSec: 30, cooldownSec: 80, initialDelaySec: 0 } },
    ],
  },
  {
    id: makeId(),
    name: "Always-on Skill Dmg",
    effects: [
      { id: makeId(), value: 30, bracket: "skillDamage", timing: { mode: "always" } },
    ],
  },
];

// ─── Migration: old single-effect shape → new effects[] shape ─────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const normalizeBuff = (raw: any): BuffConfig => {
  if (Array.isArray(raw.effects)) {
    // Already new shape
    return raw as BuffConfig;
  }
  // Old shape: { id, name, value, bracket, timing }
  return {
    id: raw.id ?? makeId(),
    name: raw.name ?? "Buff",
    effects: [
      {
        id: makeId(),
        value: raw.value ?? 0,
        bracket: (raw.bracket ?? "buffDebuff") as BuffBracket,
        timing: (raw.timing ?? { mode: "always" }) as BuffTiming,
      },
    ],
  };
};

const loadState = (): { buffs: BuffConfig[]; fightSec: number } => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.buffs) && typeof parsed.fightSec === "number") {
        return {
          buffs: parsed.buffs.map(normalizeBuff),
          fightSec: parsed.fightSec,
        };
      }
    }
  } catch {
    // ignore
  }
  return { buffs: makeDefaultBuffs(), fightSec: 210 };
};

const saveState = (buffs: BuffConfig[], fightSec: number) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ buffs, fightSec }));
  } catch {
    // ignore
  }
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const BRACKETS = (Object.entries(BRACKET_META) as [BuffBracket, { label: string; unit: string }][]).map(
  ([value, meta]) => ({ value, label: meta.label, unit: meta.unit }),
);

const toMmSs = (totalSec: number): string => {
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
};

const fromMmSs = (str: string): number => {
  const parts = str.split(":");
  if (parts.length === 2) {
    const m = parseInt(parts[0], 10);
    const s = parseInt(parts[1], 10);
    if (!isNaN(m) && !isNaN(s)) return Math.max(1, m * 60 + s);
  }
  const plain = parseInt(str, 10);
  return isNaN(plain) ? 210 : Math.max(1, plain);
};

const PRESETS = [
  { label: "1:30", sec: 90 },
  { label: "2:00", sec: 120 },
  { label: "3:30", sec: 210 },
  { label: "5:00", sec: 300 },
  { label: "10:00", sec: 600 },
];

// ─── Effect row sub-component ─────────────────────────────────────────────────
const INPUT_CLS =
  "rounded-lg border border-slate-700 bg-slate-950 px-2 py-1.5 text-sm transition-colors focus:border-purple-400 focus:outline-none";

type EffectRowProps = {
  effect: BuffEffect;
  onChange: (updated: BuffEffect) => void;
  onRemove: () => void;
  canRemove: boolean;
};

const EffectRow = ({ effect, onChange, onRemove, canRemove }: EffectRowProps) => {
  const isTimed = effect.timing.mode === "timed";
  const timed = effect.timing.mode === "timed" ? effect.timing : null;
  const meta = BRACKET_META[effect.bracket];

  const set = (partial: Partial<BuffEffect>) => onChange({ ...effect, ...partial });
  const setTiming = (partial: Partial<Extract<BuffTiming, { mode: "timed" }>>) => {
    if (!timed) return;
    onChange({ ...effect, timing: { ...timed, ...partial } });
  };

  return (
    <div className="rounded-lg border border-slate-700/40 bg-slate-950/40 p-2.5 space-y-2">
      {/* Value + bracket + remove */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1">
          <input
            type="number"
            value={effect.value}
            min={0}
            step="any"
            onChange={(e) => set({ value: parseFloat(e.target.value) || 0 })}
            onWheel={(e) => e.currentTarget.blur()}
            className={`${INPUT_CLS} w-24 text-right`}
          />
          <span className="text-xs text-slate-400 w-8">{meta.unit === "percent" ? "%" : "flat"}</span>
        </div>
        <select
          value={effect.bracket}
          onChange={(e) => set({ bracket: e.target.value as BuffBracket })}
          className={`${INPUT_CLS} flex-1 min-w-0`}
        >
          {BRACKETS.map((b) => (
            <option key={b.value} value={b.value}>
              {b.label}
            </option>
          ))}
        </select>
        {canRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="rounded border border-red-500/40 px-2 py-1 text-xs text-red-400 hover:bg-red-900/20 transition-colors"
            title="Remove effect"
          >
            ×
          </button>
        )}
      </div>

      {/* Timing */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex overflow-hidden rounded-md border border-slate-700 text-xs font-medium">
          <button
            type="button"
            onClick={() => set({ timing: { mode: "always" } })}
            className={`px-2.5 py-1 transition-colors ${!isTimed ? "bg-purple-600 text-white" : "bg-slate-900 text-slate-400 hover:bg-slate-800"}`}
          >
            Always
          </button>
          <button
            type="button"
            onClick={() =>
              set({
                timing: {
                  mode: "timed",
                  durationSec: timed?.durationSec ?? 30,
                  cooldownSec: timed?.cooldownSec ?? 80,
                  initialDelaySec: timed?.initialDelaySec ?? 0,
                },
              })
            }
            className={`px-2.5 py-1 transition-colors ${isTimed ? "bg-purple-600 text-white" : "bg-slate-900 text-slate-400 hover:bg-slate-800"}`}
          >
            Timed
          </button>
        </div>

        {isTimed && timed && (
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400">
            <label className="flex items-center gap-1">
              Duration
              <input
                type="number" min={1} step={1} value={timed.durationSec}
                onChange={(e) => setTiming({ durationSec: Math.max(1, parseInt(e.target.value) || 1) })}
                onWheel={(e) => e.currentTarget.blur()}
                className={`${INPUT_CLS} w-14 text-right`}
              />
              s
            </label>
            <label className="flex items-center gap-1">
              CD
              <input
                type="number" min={1} step={1} value={timed.cooldownSec}
                onChange={(e) => setTiming({ cooldownSec: Math.max(1, parseInt(e.target.value) || 1) })}
                onWheel={(e) => e.currentTarget.blur()}
                className={`${INPUT_CLS} w-14 text-right`}
              />
              s
            </label>
            <label className="flex items-center gap-1">
              Delay
              <input
                type="number" min={0} step={1} value={timed.initialDelaySec}
                onChange={(e) => setTiming({ initialDelaySec: Math.max(0, parseInt(e.target.value) || 0) })}
                onWheel={(e) => e.currentTarget.blur()}
                className={`${INPUT_CLS} w-14 text-right`}
              />
              s
            </label>
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Buff card sub-component ──────────────────────────────────────────────────
type BuffCardProps = {
  buff: BuffConfig;
  onChange: (updated: BuffConfig) => void;
  onRemove: () => void;
  canRemove: boolean;
};

const BuffCard = ({ buff, onChange, onRemove, canRemove }: BuffCardProps) => {
  const updateEffect = (id: string, updated: BuffEffect) =>
    onChange({ ...buff, effects: buff.effects.map((e) => (e.id === id ? updated : e)) });

  const removeEffect = (id: string) =>
    onChange({ ...buff, effects: buff.effects.filter((e) => e.id !== id) });

  const addEffect = () =>
    onChange({ ...buff, effects: [...buff.effects, makeEffect()] });

  return (
    <div className="rounded-2xl border border-slate-700/60 bg-slate-900/70 p-4 space-y-3">
      {/* Header: name + remove buff */}
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={buff.name}
          onChange={(e) => onChange({ ...buff, name: e.target.value })}
          placeholder="Buff name"
          className={`${INPUT_CLS} flex-1 font-semibold`}
        />
        {canRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="rounded-lg border border-red-500/50 px-3 py-1.5 text-xs font-medium text-red-300 transition-colors hover:bg-red-900/30"
          >
            Remove buff
          </button>
        )}
      </div>

      {/* Effect rows */}
      <div className="space-y-2">
        {buff.effects.map((eff) => (
          <EffectRow
            key={eff.id}
            effect={eff}
            onChange={(updated) => updateEffect(eff.id, updated)}
            onRemove={() => removeEffect(eff.id)}
            canRemove={buff.effects.length > 1}
          />
        ))}
      </div>

      <button
        type="button"
        onClick={addEffect}
        className="w-full rounded-lg border border-dashed border-slate-600 py-1.5 text-xs font-medium text-slate-400 transition-colors hover:border-purple-500/60 hover:text-purple-300"
      >
        + Add effect
      </button>
    </div>
  );
};

// ─── Main page ────────────────────────────────────────────────────────────────
export const BuffComparePage = () => {
  const [buffs, setBuffs] = useState<BuffConfig[]>(() => makeDefaultBuffs());
  const [fightSec, setFightSec] = useState(210);
  const [fightInput, setFightInput] = useState("3:30");
  const [hasBase, setHasBase] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [baseVersion, setBaseVersion] = useState(0);

  useEffect(() => {
    const { buffs: saved, fightSec: savedFight } = loadState();
    setBuffs(saved);
    setFightSec(savedFight);
    setFightInput(toMmSs(savedFight));
    setHasBase(hasStoredDamageInput());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) saveState(buffs, fightSec);
  }, [buffs, fightSec, hydrated]);

  const base = useMemo(
    () => sanitizeDamageInput(loadStoredDamageInput()),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [baseVersion],
  );

  const results = useMemo(
    () => buffs.map((buff) => ({ buff, eval: evaluateBuff(base, buff, fightSec) })),
    [buffs, fightSec, base],
  );

  const sorted = useMemo(
    () => [...results].sort((a, b) => b.eval.effectiveAvg - a.eval.effectiveAvg),
    [results],
  );

  const maxEffective = sorted.length > 0 ? sorted[0].eval.effectiveAvg : 0;
  const baseDmg = results.length > 0 ? results[0].eval.damageWithout : calculateDamage(base).totalDamage;

  const handleFightInputBlur = () => {
    const sec = fromMmSs(fightInput);
    setFightSec(sec);
    setFightInput(toMmSs(sec));
  };

  const updateBuff = (id: string, updated: BuffConfig) =>
    setBuffs((prev) => prev.map((b) => (b.id === id ? updated : b)));

  const removeBuff = (id: string) =>
    setBuffs((prev) => prev.filter((b) => b.id !== id));

  const addBuff = () =>
    setBuffs((prev) => [
      ...prev,
      { id: makeId(), name: "New buff", effects: [makeEffect()] },
    ]);

  const handleRefreshBase = () => {
    setHasBase(hasStoredDamageInput());
    setBaseVersion((v) => v + 1);
  };

  if (!hydrated) {
    return (
      <main className="mx-auto max-w-5xl p-4 md:p-8">
        <p className="text-slate-400">Loading...</p>
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-screen max-w-5xl p-4 md:p-8">
      {/* Header */}
      <header className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-widest text-purple-400">
          Tree of Savior Mobile
        </p>
        <h1 className="bg-gradient-to-r from-white to-purple-200 bg-clip-text text-3xl font-bold text-transparent md:text-4xl">
          Buff Uptime Compare
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          Each buff can bundle multiple effects. Mix flat ATK, % bonuses, and ignore defense — each with its own timing.
        </p>
      </header>

      {!hasBase && (
        <div className="mb-6 rounded-2xl border border-amber-500/40 bg-amber-900/20 p-4 text-sm text-amber-300">
          No saved stats found. Go to the{" "}
          <Link href="/" className="underline hover:text-amber-200">Calculator</Link>{" "}
          and enter your stats first — they save automatically.
        </div>
      )}

      {/* Fight duration */}
      <section className="mb-6 rounded-2xl border border-slate-700/60 bg-slate-900/70 p-4">
        <p className="mb-3 text-sm font-semibold text-slate-200">Fight Duration</p>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={fightInput}
              onChange={(e) => setFightInput(e.target.value)}
              onBlur={handleFightInputBlur}
              onKeyDown={(e) => e.key === "Enter" && handleFightInputBlur()}
              placeholder="3:30"
              className={`${INPUT_CLS} w-20 text-center text-base font-bold`}
            />
            <span className="text-xs text-slate-500">(mm:ss or seconds)</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {PRESETS.map((p) => (
              <button
                key={p.label}
                type="button"
                onClick={() => { setFightSec(p.sec); setFightInput(p.label); }}
                className={`rounded-lg border px-3 py-1 text-xs font-medium transition-colors ${
                  fightSec === p.sec
                    ? "border-purple-500 bg-purple-900/40 text-purple-200"
                    : "border-slate-700 bg-slate-900 text-slate-400 hover:bg-slate-800"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Results panel */}
      {sorted.length > 0 && (
        <section className="mb-6 overflow-hidden rounded-2xl border border-purple-500/30 bg-slate-900/80 shadow-lg shadow-purple-900/20">
          <div className="border-b border-purple-500/20 bg-gradient-to-br from-purple-900/40 to-slate-900/60 px-5 py-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-purple-400">
              Results — ranked by effective average damage
            </p>
            <p className="mt-0.5 text-xs text-slate-400">
              Each buff is simulated second-by-second against your base build. Base damage per hit:{" "}
              <span className="text-slate-300 tabular-nums">{formatCompact(baseDmg)}</span>
            </p>
          </div>

          {/* Base row */}
          <div className="flex items-center gap-3 border-b border-slate-700/40 px-5 py-3">
            <div className="w-40 shrink-0">
              <p className="text-sm font-semibold text-slate-400">Base (no buff)</p>
            </div>
            <div className="flex-1 h-2 rounded-full bg-slate-800 overflow-hidden">
              <div
                className="h-full rounded-full bg-slate-600 transition-all duration-300"
                style={{ width: maxEffective > 0 ? `${(baseDmg / maxEffective) * 100}%` : "0%" }}
              />
            </div>
            <div className="shrink-0 text-right w-28">
              <p className="text-sm font-bold text-slate-300 tabular-nums">{formatCompact(baseDmg)}</p>
              <p className="text-xs text-slate-500 tabular-nums">{formatFull(baseDmg)}</p>
            </div>
            <div className="w-20 shrink-0" />
          </div>

          {/* Ranked buff rows */}
          <div className="divide-y divide-slate-700/40">
            {sorted.map(({ buff, eval: ev }, rank) => {
              const isWinner = rank === 0;
              const barWidth = maxEffective > 0 ? (ev.effectiveAvg / maxEffective) * 100 : 0;
              const pct = ev.deltaPctVsBase;
              return (
                <div key={buff.id} className="flex items-center gap-3 px-5 py-3">
                  <div className="w-40 shrink-0">
                    <p className="truncate text-sm font-semibold text-slate-200">{buff.name}</p>
                    <div className="flex flex-wrap gap-1 mt-0.5">
                      {isWinner && (
                        <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-xs font-semibold text-emerald-400">
                          Best
                        </span>
                      )}
                      <span className="rounded-full bg-slate-800 px-2 py-0.5 text-xs text-slate-400">
                        {buff.effects.length} effect{buff.effects.length !== 1 ? "s" : ""}
                      </span>
                    </div>
                  </div>
                  <div className="flex-1 h-2 rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${isWinner ? "bg-emerald-500" : "bg-purple-500"}`}
                      style={{ width: `${barWidth}%` }}
                    />
                  </div>
                  <div className="shrink-0 text-right w-28">
                    <p className="text-sm font-bold text-white tabular-nums">{formatCompact(ev.effectiveAvg)}</p>
                    <p className="text-xs text-slate-500 tabular-nums">{formatFull(ev.effectiveAvg)}</p>
                  </div>
                  <div className="w-20 shrink-0 text-right">
                    <span className={`text-sm font-bold tabular-nums ${pct > 0 ? "text-emerald-400" : pct < 0 ? "text-red-400" : "text-slate-400"}`}>
                      {pct >= 0 ? "+" : ""}{pct.toFixed(2)}%
                    </span>
                    <p className="text-xs text-slate-500">vs base</p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Per-buff detail breakdown */}
      {sorted.length > 0 && (
        <section className="mb-6 rounded-2xl border border-slate-700/60 bg-slate-900/70 p-4 space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            Per-buff breakdown
          </p>
          {sorted.map(({ buff, eval: ev }) => (
            <div key={buff.id} className="rounded-xl border border-slate-700/40 bg-slate-950/60 px-4 py-3">
              <p className="text-sm font-semibold text-slate-200 mb-2">{buff.name}</p>
              <div className="space-y-1">
                {ev.effectUptimes.map(({ effect, activeSeconds, uptime }) => {
                  const meta = BRACKET_META[effect.bracket];
                  const valueStr = meta.unit === "flat"
                    ? `+${effect.value} ${meta.label}`
                    : `+${effect.value}% ${meta.label}`;
                  const timingStr =
                    effect.timing.mode === "always"
                      ? "always active"
                      : `${effect.timing.durationSec}s dur · ${effect.timing.cooldownSec}s CD${effect.timing.initialDelaySec > 0 ? ` · ${effect.timing.initialDelaySec}s delay` : ""}`;
                  return (
                    <div key={effect.id} className="flex flex-wrap items-center gap-x-4 gap-y-0.5 text-xs">
                      <span className="font-medium text-purple-300">{valueStr}</span>
                      <span className="text-slate-500">{timingStr}</span>
                      <span className="text-slate-400">
                        {activeSeconds.toFixed(1)}s active · {(uptime * 100).toFixed(1)}% uptime
                      </span>
                    </div>
                  );
                })}
              </div>
              <div className="mt-2 pt-2 border-t border-slate-700/40 flex flex-wrap gap-x-6 gap-y-0.5 text-xs text-slate-400">
                <span>Effective avg: <span className="tabular-nums text-slate-200">{formatCompact(ev.effectiveAvg)}</span></span>
                <span>vs base: <span className={`tabular-nums font-semibold ${ev.deltaPctVsBase >= 0 ? "text-emerald-400" : "text-red-400"}`}>{ev.deltaPctVsBase >= 0 ? "+" : ""}{ev.deltaPctVsBase.toFixed(2)}%</span></span>
              </div>
            </div>
          ))}
        </section>
      )}

      {/* Buff editor */}
      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm font-semibold text-slate-200">Buffs to compare</p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleRefreshBase}
              className="rounded-xl border border-slate-600 bg-slate-900 px-3 py-1.5 text-xs font-medium text-slate-300 transition-colors hover:bg-slate-800"
            >
              Refresh base from Calculator
            </button>
            <button
              type="button"
              onClick={addBuff}
              className="rounded-xl border border-purple-500/60 bg-purple-900/30 px-3 py-1.5 text-xs font-medium text-purple-200 transition-colors hover:bg-purple-800/40"
            >
              + Add Buff
            </button>
          </div>
        </div>

        {buffs.length === 0 && (
          <p className="text-sm text-slate-500 italic">No buffs yet. Click + Add Buff to start.</p>
        )}

        {buffs.map((buff) => (
          <BuffCard
            key={buff.id}
            buff={buff}
            onChange={(updated) => updateBuff(buff.id, updated)}
            onRemove={() => removeBuff(buff.id)}
            canRemove={buffs.length > 1}
          />
        ))}
      </section>

      <p className="mt-8 text-xs text-slate-600">
        Assumes constant attack rate. Timeline integration accounts for mixed always-on and timed effects within the same buff. Each buff is compared independently on top of the same base build.
      </p>
    </main>
  );
};
