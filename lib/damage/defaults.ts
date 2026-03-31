import { DamageInput, MultiplierEntry } from "@/lib/damage/types";

const entry = (id: string, name: string, value: number): MultiplierEntry => ({
  id,
  name,
  value,
});

export const defaultDamageInput: DamageInput = {
  attack: 74137,
  criticalDamage: 11981,
  skillDamagePercent: 20,
  bonusPchPercent: 9,
  criticalHit: true,
  pierce: true,
  weakness: true,
  elementalWeaknessPercent: 50,
  highDefMon: false,
  defense: 0,
  ignoreDefenseCustomizations: [entry("ignore-def-1", "Ignore DEF 2", 0)],
  finalReductPercent: 0,
  generalMultiplier: [
    entry("general-1", "Boss Damage Bonus", 24.52),
    entry("general-2", "Race Damage Bonus", 9.79),
    entry("general-3", "Target Element Bonus", 3.14),
  ],
  skillMultiplier: [
    entry("skill-1", "Skill multiplier", 409),
    entry("skill-2", "Skill tree 1", 75),
    entry("skill-3", "Skill tree 2", 70),
    entry("skill-4", "Skill tree 3", 0),
    entry("skill-5", "Skill buff 1", 0),
    entry("skill-6", "Skill buff 2", 0),
    entry("skill-7", "Skill buff 3", 0),
  ],
  buffDebuffMultiplier: [
    entry("buff-1", "Skill damage buff 1", 60),
    entry("buff-2", "Skill damage buff 2", 50),
    entry("buff-3", "Weakness buff", 1.8),
    entry("buff-4", "Kupole damage buff 1", 0),
    entry("buff-5", "Kupole damage debuff 2", 0),
    entry("buff-6", "Fellow damage buff 1", 0),
    entry("buff-7", "Fellow damage debuff 2", 0),
  ],
  conditionDamageMultiplier: [
    entry("condition-1", "Skia card", 1.46),
    entry("condition-2", "Emblem buff", 36),
    entry("condition-3", "Sub weapon", 0),
  ],
};
