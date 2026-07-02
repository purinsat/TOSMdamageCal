import { damageInputSchema, DamageInputForm } from "@/lib/damage/schema";
import { defaultDamageInput } from "@/lib/damage/defaults";

export const DAMAGE_STORAGE_KEY = "tosm-damage-input-v1";

export const loadStoredDamageInput = (): DamageInputForm => {
  try {
    const stored = localStorage.getItem(DAMAGE_STORAGE_KEY);
    if (stored) {
      const result = damageInputSchema.safeParse(JSON.parse(stored));
      if (result.success) return result.data;
    }
  } catch {
    // Ignore corrupt or missing data
  }
  return defaultDamageInput;
};

export const hasStoredDamageInput = (): boolean => {
  try {
    return localStorage.getItem(DAMAGE_STORAGE_KEY) !== null;
  } catch {
    return false;
  }
};
