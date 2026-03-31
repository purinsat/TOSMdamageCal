import { describe, expect, it } from "vitest";
import { calculateDamage } from "@/lib/damage/calculate";
import { defaultDamageInput } from "@/lib/damage/defaults";

describe("damage calculator parity", () => {
  it("matches the baseline Python output", () => {
    const result = calculateDamage(defaultDamageInput);

    expect(result.attackPart).toBeCloseTo(7407466.261415829, 8);
    expect(result.criticalPart).toBeCloseTo(1050081.2185077819, 8);
    expect(result.totalDamage).toBeCloseTo(8457547.479923612, 8);
  });
});
