export type MultiplierEntry = {
  id: string;
  name: string;
  value: number;
};

export type DamageInput = {
  attack: number;
  criticalDamage: number;
  skillDamagePercent: number;
  bonusPchPercent: number;
  criticalHit: boolean;
  pierce: boolean;
  weakness: boolean;
  elementalWeaknessPercent: number;
  highDefMon: boolean;
  defense: number;
  ignoreDefenseCustomizations: MultiplierEntry[];
  finalReductPercent: number;
  generalMultiplier: MultiplierEntry[];
  skillMultiplier: MultiplierEntry[];
  buffDebuffMultiplier: MultiplierEntry[];
  conditionDamageMultiplier: MultiplierEntry[];
};

export type DamageBreakdown = {
  elementalWeaknessFactor: number;
  defense: number;
  ignoreDef1Percent: number;
  finalDefense: number;
  defenseRatio: number;
  finalConditionalDamage: number;
  finalBuffDebuffMultiplier: number;
  finalSkillMultiplier: number;
  finalGeneralMultiplier: number;
  multipliers: number;
  attackPart: number;
  criticalPart: number;
  totalDamage: number;
};
