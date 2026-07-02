import { DamageInput } from "@/lib/damage/types";
import { calculateDamage } from "@/lib/damage/calculate";

// ─── Bracket types ────────────────────────────────────────────────────────────

export type BuffBracket =
  | "attackFlat"          // flat add to attack
  | "criticalDamageFlat"  // flat add to criticalDamage
  | "skillDamage"         // top-level: 1 + skillDamagePercent/100
  | "general"             // additive sum row: Boss/Race/Target Element
  | "buffDebuff"          // additive sum row: Skill damage buff, weakness buff…
  | "skillMultiplier"     // multiplicative row: 1 + value/100
  | "conditional"         // additive sum row: Skia card, emblem…
  | "ignoreDefense";      // multiplicative ignore-def row: 1 - value/100

export type BracketMeta = { label: string; unit: "flat" | "percent" };

export const BRACKET_META: Record<BuffBracket, BracketMeta> = {
  attackFlat:         { label: "ATK (flat)",                    unit: "flat"    },
  criticalDamageFlat: { label: "Critical Damage (flat)",        unit: "flat"    },
  skillDamage:        { label: "Skill Damage Bonus",            unit: "percent" },
  general:            { label: "General (Boss/Race/Element)",   unit: "percent" },
  buffDebuff:         { label: "Buff / Debuff",                 unit: "percent" },
  skillMultiplier:    { label: "Skill Multiplier (row)",        unit: "percent" },
  conditional:        { label: "Conditional / Equipment",       unit: "percent" },
  ignoreDefense:      { label: "Ignore Defense",                unit: "percent" },
};

// ─── Timing types ─────────────────────────────────────────────────────────────

export type BuffTiming =
  | { mode: "always" }
  | {
      mode: "timed";
      durationSec: number;
      cooldownSec: number;
      initialDelaySec: number;
    };

// ─── Buff structure ───────────────────────────────────────────────────────────

export type BuffEffect = {
  id: string;
  value: number;
  bracket: BuffBracket;
  timing: BuffTiming;
};

export type BuffConfig = {
  id: string;
  name: string;
  effects: BuffEffect[];
};

// ─── Evaluation result ────────────────────────────────────────────────────────

export type EffectUptimeInfo = {
  effect: BuffEffect;
  activeSeconds: number;
  uptime: number;
};

export type BuffEvalResult = {
  damageWithout: number;
  effectiveAvg: number;
  deltaPctVsBase: number;
  fightSeconds: number;
  effectUptimes: EffectUptimeInfo[];
};

// ─── Apply effects to a DamageInput clone ────────────────────────────────────

type ActiveEffect = { bracket: BuffBracket; value: number; name: string };

export const applyEffectsToInput = (
  base: DamageInput,
  activeEffects: ActiveEffect[],
): DamageInput => {
  let result = { ...base };
  const extraGeneral: DamageInput["generalMultiplier"] = [...base.generalMultiplier];
  const extraBuffDebuff: DamageInput["buffDebuffMultiplier"] = [...base.buffDebuffMultiplier];
  const extraSkill: DamageInput["skillMultiplier"] = [...base.skillMultiplier];
  const extraConditional: DamageInput["conditionDamageMultiplier"] = [...base.conditionDamageMultiplier];
  const extraIgnoreDef: DamageInput["ignoreDefenseCustomizations"] = [...base.ignoreDefenseCustomizations];

  let atkFlat = 0;
  let critFlat = 0;
  let skillDmgPct = 0;

  for (const eff of activeEffects) {
    const rowId = `eff-${eff.bracket}-${Math.random().toString(36).slice(2)}`;
    switch (eff.bracket) {
      case "attackFlat":         atkFlat += eff.value; break;
      case "criticalDamageFlat": critFlat += eff.value; break;
      case "skillDamage":        skillDmgPct += eff.value; break;
      case "general":            extraGeneral.push({ id: rowId, name: eff.name, value: eff.value }); break;
      case "buffDebuff":         extraBuffDebuff.push({ id: rowId, name: eff.name, value: eff.value }); break;
      case "skillMultiplier":    extraSkill.push({ id: rowId, name: eff.name, value: eff.value }); break;
      case "conditional":        extraConditional.push({ id: rowId, name: eff.name, value: eff.value }); break;
      case "ignoreDefense":      extraIgnoreDef.push({ id: rowId, name: eff.name, value: eff.value }); break;
    }
  }

  result = {
    ...result,
    attack: result.attack + atkFlat,
    criticalDamage: result.criticalDamage + critFlat,
    skillDamagePercent: result.skillDamagePercent + skillDmgPct,
    generalMultiplier: extraGeneral,
    buffDebuffMultiplier: extraBuffDebuff,
    skillMultiplier: extraSkill,
    conditionDamageMultiplier: extraConditional,
    ignoreDefenseCustomizations: extraIgnoreDef,
  };

  return result;
};

// ─── Timeline helpers ─────────────────────────────────────────────────────────

// Returns all [start, end] intervals the buff is active within [0, fightSec]
export const computeActiveIntervals = (
  durationSec: number,
  cooldownSec: number,
  fightSec: number,
  initialDelaySec: number = 0,
): [number, number][] => {
  if (fightSec <= 0 || initialDelaySec >= fightSec) return [];

  const safeCD = Math.max(cooldownSec, 0.001);
  const safeDur = Math.max(durationSec, 0);
  const intervals: [number, number][] = [];
  let castTime = initialDelaySec;

  while (castTime < fightSec) {
    const start = castTime;
    const end = Math.min(castTime + safeDur, fightSec);
    if (end > start) intervals.push([start, end]);
    castTime += safeCD;
    if (safeCD <= safeDur) {
      // Continuous from first cast — one big interval
      intervals.length = 0;
      intervals.push([initialDelaySec, fightSec]);
      break;
    }
  }
  return intervals;
};

// Total active seconds (for per-effect uptime display)
export const computeActiveSeconds = (
  durationSec: number,
  cooldownSec: number,
  fightSec: number,
  initialDelaySec: number = 0,
): number =>
  computeActiveIntervals(durationSec, cooldownSec, fightSec, initialDelaySec)
    .reduce((sum, [s, e]) => sum + (e - s), 0);

// ─── Timeline-based buff evaluation ──────────────────────────────────────────

export const evaluateBuff = (
  base: DamageInput,
  buff: BuffConfig,
  fightSec: number,
): BuffEvalResult => {
  const damageWithout = calculateDamage(base).totalDamage;

  if (fightSec <= 0 || buff.effects.length === 0) {
    return {
      damageWithout,
      effectiveAvg: damageWithout,
      deltaPctVsBase: 0,
      fightSeconds: fightSec,
      effectUptimes: [],
    };
  }

  // Per-effect: collect active intervals and uptime info
  const effectIntervals: [number, number][][] = buff.effects.map((eff) =>
    eff.timing.mode === "always"
      ? [[0, fightSec]]
      : computeActiveIntervals(
          eff.timing.durationSec,
          eff.timing.cooldownSec,
          fightSec,
          eff.timing.initialDelaySec,
        ),
  );

  const effectUptimes: EffectUptimeInfo[] = buff.effects.map((eff, i) => {
    const active = effectIntervals[i].reduce((s, [a, b]) => s + (b - a), 0);
    return { effect: eff, activeSeconds: active, uptime: fightSec > 0 ? active / fightSec : 0 };
  });

  // Collect all breakpoints from every effect's intervals
  const bpSet = new Set<number>([0, fightSec]);
  for (const intervals of effectIntervals) {
    for (const [s, e] of intervals) {
      bpSet.add(s);
      bpSet.add(e);
    }
  }
  const breakpoints = Array.from(bpSet).sort((a, b) => a - b);

  // Integrate: for each segment, find which effects are active at its midpoint
  let totalDamageTime = 0;

  for (let i = 0; i < breakpoints.length - 1; i++) {
    const t0 = breakpoints[i];
    const t1 = breakpoints[i + 1];
    const segLen = t1 - t0;
    if (segLen <= 0) continue;

    const mid = (t0 + t1) / 2;

    const activeEffects: ActiveEffect[] = [];
    for (let ei = 0; ei < buff.effects.length; ei++) {
      const isActive = effectIntervals[ei].some(([s, e]) => mid >= s && mid < e);
      if (isActive) {
        activeEffects.push({
          bracket: buff.effects[ei].bracket,
          value: buff.effects[ei].value,
          name: buff.name,
        });
      }
    }

    const inputForSeg = applyEffectsToInput(base, activeEffects);
    const dmg = calculateDamage(inputForSeg).totalDamage;
    totalDamageTime += dmg * segLen;
  }

  const effectiveAvg = totalDamageTime / fightSec;
  const deltaPctVsBase =
    damageWithout > 0 ? ((effectiveAvg - damageWithout) / damageWithout) * 100 : 0;

  return { damageWithout, effectiveAvg, deltaPctVsBase, fightSeconds: fightSec, effectUptimes };
};
