import { describe, expect, it } from "vitest";
import { calculateDamage } from "@/lib/damage/calculate";
import { DamageInput } from "@/lib/damage/types";

// Explicit baseline matching the original Python script values.
// Kept separate from defaultDamageInput so UI defaults can change freely.
const pythonBaselineInput: DamageInput = {
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
  ignoreDefenseCustomizations: [{ id: "ignore-def-1", name: "Ignore DEF 2", value: 0 }],
  finalReductPercent: 0,
  generalMultiplier: [
    { id: "general-1", name: "Boss Damage Bonus", value: 24.52 },
    { id: "general-2", name: "Race Damage Bonus", value: 9.79 },
    { id: "general-3", name: "Target Element Bonus", value: 3.14 },
  ],
  skillMultiplier: [
    { id: "skill-1", name: "Skill multiplier", value: 409 },
    { id: "skill-2", name: "Skill tree 1", value: 75 },
    { id: "skill-3", name: "Skill tree 2", value: 70 },
    { id: "skill-4", name: "Skill tree 3", value: 0 },
    { id: "skill-5", name: "Skill buff 1", value: 0 },
    { id: "skill-6", name: "Skill buff 2", value: 0 },
    { id: "skill-7", name: "Skill buff 3", value: 0 },
  ],
  buffDebuffMultiplier: [
    { id: "buff-1", name: "Skill damage buff 1", value: 60 },
    { id: "buff-2", name: "Skill damage buff 2", value: 50 },
    { id: "buff-3", name: "Weakness buff", value: 1.8 },
    { id: "buff-4", name: "Kupole damage buff 1", value: 0 },
    { id: "buff-5", name: "Kupole damage debuff 2", value: 0 },
    { id: "buff-6", name: "Fellow damage buff 1", value: 0 },
    { id: "buff-7", name: "Fellow damage debuff 2", value: 0 },
  ],
  conditionDamageMultiplier: [
    { id: "condition-1", name: "Skia card", value: 1.46 },
    { id: "condition-2", name: "Emblem buff", value: 36 },
    { id: "condition-3", name: "Sub weapon", value: 0 },
  ],
};

describe("damage calculator parity", () => {
  it("matches the baseline Python output", () => {
    const result = calculateDamage(pythonBaselineInput);

    expect(result.attackPart).toBeCloseTo(7407466.261415829, 8);
    expect(result.criticalPart).toBeCloseTo(1050081.2185077819, 8);
    expect(result.totalDamage).toBeCloseTo(8457547.479923612, 8);
  });
});
