import { DamageInput } from "@/lib/damage/types";

type DiffEntry = {
  label: string;
  from: string;
  to: string;
};

const fmt = (v: number) =>
  Intl.NumberFormat("en-US", { maximumFractionDigits: 4 }).format(v);

const boolLabel = (v: boolean) => (v ? "Yes" : "No");

export const diffDamageInput = (base: DamageInput, scenario: DamageInput): DiffEntry[] => {
  const diffs: DiffEntry[] = [];

  const num = (label: string, a: number, b: number) => {
    if (a !== b) diffs.push({ label, from: fmt(a), to: fmt(b) });
  };
  const bool = (label: string, a: boolean, b: boolean) => {
    if (a !== b) diffs.push({ label, from: boolLabel(a), to: boolLabel(b) });
  };

  num("Attack", base.attack, scenario.attack);
  num("Critical Damage", base.criticalDamage, scenario.criticalDamage);
  num("Skill Damage Bonus (%)", base.skillDamagePercent, scenario.skillDamagePercent);
  num("Clean Hit / Pierce Bonus (%)", base.bonusPchPercent, scenario.bonusPchPercent);
  bool("Critical Hit", base.criticalHit, scenario.criticalHit);
  bool("Pierce", base.pierce, scenario.pierce);
  bool("Elemental Weakness", base.weakness, scenario.weakness);
  num("Elemental Weakness Bonus (%)", base.elementalWeaknessPercent, scenario.elementalWeaknessPercent);
  bool("High DEF Monster", base.highDefMon, scenario.highDefMon);
  num("Defense", base.defense, scenario.defense);
  num("Final Damage Reduction (%)", base.finalReductPercent, scenario.finalReductPercent);

  const diffRows = (
    sectionLabel: string,
    baseRows: DamageInput["generalMultiplier"],
    scenarioRows: DamageInput["generalMultiplier"],
  ) => {
    const maxLen = Math.max(baseRows.length, scenarioRows.length);
    for (let i = 0; i < maxLen; i++) {
      const a = baseRows[i];
      const b = scenarioRows[i];
      if (!a && b) {
        diffs.push({ label: `${sectionLabel} › ${b.name} (added)`, from: "—", to: fmt(b.value) });
      } else if (a && !b) {
        diffs.push({ label: `${sectionLabel} › ${a.name} (removed)`, from: fmt(a.value), to: "—" });
      } else if (a && b) {
        if (a.name !== b.name || a.value !== b.value) {
          const rowLabel = b.name || a.name;
          diffs.push({ label: `${sectionLabel} › ${rowLabel}`, from: `${a.name}: ${fmt(a.value)}`, to: `${b.name}: ${fmt(b.value)}` });
        }
      }
    }
  };

  diffRows("Ignore Defense", base.ignoreDefenseCustomizations, scenario.ignoreDefenseCustomizations);
  diffRows("General", base.generalMultiplier, scenario.generalMultiplier);
  diffRows("Skill", base.skillMultiplier, scenario.skillMultiplier);
  diffRows("Buff/Debuff", base.buffDebuffMultiplier, scenario.buffDebuffMultiplier);
  diffRows("Conditional", base.conditionDamageMultiplier, scenario.conditionDamageMultiplier);

  return diffs;
};
