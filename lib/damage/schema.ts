import { z } from "zod";

const multiplierEntrySchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Name is required"),
  value: z.number(),
});

export const damageInputSchema = z.object({
  attack: z.number().nonnegative(),
  criticalDamage: z.number().nonnegative(),
  skillDamagePercent: z.number(),
  bonusPchPercent: z.number(),
  criticalHit: z.boolean(),
  pierce: z.boolean(),
  weakness: z.boolean(),
  elementalWeaknessPercent: z.number(),
  highDefMon: z.boolean(),
  defense: z.number().nonnegative(),
  ignoreDefenseCustomizations: z.array(multiplierEntrySchema),
  finalReductPercent: z.number(),
  generalMultiplier: z.array(multiplierEntrySchema),
  skillMultiplier: z.array(multiplierEntrySchema),
  buffDebuffMultiplier: z.array(multiplierEntrySchema),
  conditionDamageMultiplier: z.array(multiplierEntrySchema),
});

export type DamageInputForm = z.infer<typeof damageInputSchema>;
