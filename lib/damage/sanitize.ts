import { DamageInput } from "@/lib/damage/types";

const n = (x: unknown): number => (Number.isFinite(x as number) ? (x as number) : 0);

export const sanitizeDamageInput = (raw: Partial<DamageInput> | Record<string, unknown>): DamageInput => {
  const r = raw as Record<string, unknown>;
  return {
    attack: n(r.attack),
    criticalDamage: n(r.criticalDamage),
    skillDamagePercent: n(r.skillDamagePercent),
    bonusPchPercent: n(r.bonusPchPercent),
    criticalHit: Boolean(r.criticalHit),
    pierce: Boolean(r.pierce),
    weakness: Boolean(r.weakness),
    elementalWeaknessPercent: n(r.elementalWeaknessPercent),
    highDefMon: Boolean(r.highDefMon),
    defense: n(r.defense),
    finalReductPercent: n(r.finalReductPercent),
    ignoreDefenseCustomizations: Array.isArray(r.ignoreDefenseCustomizations)
      ? r.ignoreDefenseCustomizations.map((e: Record<string, unknown>) => ({ id: String(e.id ?? ""), name: String(e.name ?? ""), value: n(e.value) }))
      : [],
    generalMultiplier: Array.isArray(r.generalMultiplier)
      ? r.generalMultiplier.map((e: Record<string, unknown>) => ({ id: String(e.id ?? ""), name: String(e.name ?? ""), value: n(e.value) }))
      : [],
    skillMultiplier: Array.isArray(r.skillMultiplier)
      ? r.skillMultiplier.map((e: Record<string, unknown>) => ({ id: String(e.id ?? ""), name: String(e.name ?? ""), value: n(e.value) }))
      : [],
    buffDebuffMultiplier: Array.isArray(r.buffDebuffMultiplier)
      ? r.buffDebuffMultiplier.map((e: Record<string, unknown>) => ({ id: String(e.id ?? ""), name: String(e.name ?? ""), value: n(e.value) }))
      : [],
    conditionDamageMultiplier: Array.isArray(r.conditionDamageMultiplier)
      ? r.conditionDamageMultiplier.map((e: Record<string, unknown>) => ({ id: String(e.id ?? ""), name: String(e.name ?? ""), value: n(e.value) }))
      : [],
  };
};
