import { DamageBreakdown, DamageInput, MultiplierEntry } from "@/lib/damage/types";

const makePercent = (number: number) => number / 100;

const sumMultiplier = (entries: MultiplierEntry[]) =>
  entries.reduce((sum, entry) => sum + entry.value, 0);

const computeSkillMultiplier = (entries: MultiplierEntry[]) => {
  let result = 1;
  for (const entry of entries) {
    if (entry.name.trim().toLowerCase() === "skill multiplier") {
      result *= entry.value / 100;
    } else if (entry.value !== 0) {
      result *= 1 + entry.value / 100;
    }
  }
  return result;
};

export const calculateDamage = (input: DamageInput): DamageBreakdown => {
  const elementalWeaknessFactor = input.weakness
    ? 1 + makePercent(input.elementalWeaknessPercent)
    : 1;

  const resolvedDefense = input.highDefMon ? 3 * input.attack : input.defense;
  const ignoreDef1Percent = input.pierce ? 20 : 0;
  const ignoreDefenseFactor = input.ignoreDefenseCustomizations.reduce(
    (factor, entry) => factor * (1 - makePercent(entry.value)),
    1,
  );
  const finalDefense = resolvedDefense * (1 - makePercent(ignoreDef1Percent)) * ignoreDefenseFactor;
  const defenseRatio = input.attack / (input.attack + finalDefense);

  const finalConditionalDamage = 1 + sumMultiplier(input.conditionDamageMultiplier) / 100;
  const finalBuffDebuffMultiplier = 1 + sumMultiplier(input.buffDebuffMultiplier) / 100;
  const finalSkillMultiplier = computeSkillMultiplier(input.skillMultiplier);
  const finalGeneralMultiplier = 1 + sumMultiplier(input.generalMultiplier) / 100;
  const multipliers =
    finalBuffDebuffMultiplier *
    finalConditionalDamage *
    finalGeneralMultiplier *
    finalSkillMultiplier;

  const extraDamageCh = 0.05 * input.attack;
  const skillDamageFactor = 1 + makePercent(input.skillDamagePercent);
  const reductionFactor = 1 - makePercent(input.finalReductPercent);

  const attackPart =
    (input.attack * (1 + makePercent(input.bonusPchPercent)) + extraDamageCh) *
    defenseRatio *
    skillDamageFactor *
    multipliers *
    reductionFactor *
    elementalWeaknessFactor;
  const criticalPart = input.criticalHit
    ? input.criticalDamage *
      skillDamageFactor *
      multipliers *
      reductionFactor *
      elementalWeaknessFactor
    : 0;
  const totalDamage = attackPart + criticalPart;

  return {
    elementalWeaknessFactor,
    defense: resolvedDefense,
    ignoreDef1Percent,
    finalDefense,
    defenseRatio,
    finalConditionalDamage,
    finalBuffDebuffMultiplier,
    finalSkillMultiplier,
    finalGeneralMultiplier,
    multipliers,
    attackPart,
    criticalPart,
    totalDamage,
  };
};
