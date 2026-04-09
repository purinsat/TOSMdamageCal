import { DamageBreakdown } from "@/lib/damage/types";

type CalculationBreakdownProps = {
  breakdown: DamageBreakdown;
  showDetails: boolean;
  savedDamages: Array<{ id: number; label: string; totalDamage: number }>;
};

const formatFull = (value: number) =>
  Intl.NumberFormat("en-US", { maximumFractionDigits: 4 }).format(value);

const formatCompact = (value: number) =>
  Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 2,
  }).format(value);

export const CalculationBreakdown = ({
  breakdown,
  showDetails,
  savedDamages,
}: CalculationBreakdownProps) => {
  return (
    <section className="rounded-2xl border border-purple-500/30 bg-slate-900/80 p-5">
      <h2 className="text-xl font-bold text-purple-300">Result Breakdown</h2>
      <div className="mt-4 grid gap-2">
        <StatCard label="Damage from Attack" value={breakdown.attackPart} />
        <StatCard label="Damage from Critical" value={breakdown.criticalPart} />
        <StatCard label="Total Damage" value={breakdown.totalDamage} highlight />
      </div>

      <div className="mt-4 rounded-xl border border-slate-700 bg-slate-950/70 p-3">
        <p className="text-xs uppercase tracking-wide text-slate-300">Saved Damage</p>
        {savedDamages.length === 0 ? (
          <p className="mt-2 text-sm text-slate-400">
            No saved values yet. Click Save Damage to compare versions.
          </p>
        ) : (
          <div className="mt-2 space-y-2">
            {savedDamages.map((item) => {
              const delta = breakdown.totalDamage - item.totalDamage;
              const deltaPrefix = delta >= 0 ? "+" : "";
              return (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-3 rounded-lg border border-slate-800 bg-slate-900/60 px-3 py-2"
                >
                  <div>
                    <p className="text-sm font-medium text-slate-200">{item.label}</p>
                    <p className="text-xs text-slate-400">{formatFull(item.totalDamage)}</p>
                  </div>
                  <p className="text-right text-xs text-slate-300">
                    Delta: {deltaPrefix}
                    {formatFull(delta)}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showDetails ? (
        <div className="mt-5 space-y-2 text-sm text-slate-200">
          <DetailRow label="Elemental Weakness Factor" value={breakdown.elementalWeaknessFactor} />
          <DetailRow label="Defense Ratio" value={breakdown.defenseRatio} />
          <DetailRow label="General Multiplier" value={breakdown.finalGeneralMultiplier} />
          <DetailRow label="Skill Multiplier" value={breakdown.finalSkillMultiplier} />
          <DetailRow label="Buff/Debuff Multiplier" value={breakdown.finalBuffDebuffMultiplier} />
          <DetailRow label="Conditional Multiplier" value={breakdown.finalConditionalDamage} />
          <DetailRow label="Combined Multipliers" value={breakdown.multipliers} />
          <div className="rounded-xl border border-slate-700 bg-slate-950/80 p-3 text-xs text-slate-300">
            <p>
              Attack Part = ((ATK x (1 + BonusPCH%) + (0.05 x ATK)) x DefRatio x
              SkillDamageFactor x Multipliers x ReductionFactor x ElementWeaknessFactor)
            </p>
            <p className="mt-2">
              Critical Part = CriticalDamage x SkillDamageFactor x Multipliers x
              ReductionFactor x ElementWeaknessFactor
            </p>
          </div>
        </div>
      ) : null}
    </section>
  );
};

const StatCard = ({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: number;
  highlight?: boolean;
}) => (
  <div
    className={`rounded-xl border p-3 ${
      highlight
        ? "border-purple-400/60 bg-purple-900/20"
        : "border-slate-700 bg-slate-950/80"
    }`}
  >
    <p className="text-xs uppercase tracking-wide text-slate-300">{label}</p>
    <p className="mt-1 break-words text-xl font-semibold leading-tight">
      {formatCompact(value)}
    </p>
    <p className="mt-1 break-all text-xs text-slate-400">{formatFull(value)}</p>
  </div>
);

const DetailRow = ({ label, value }: { label: string; value: number }) => (
  <p className="flex items-center justify-between gap-2 rounded-lg border border-slate-800 bg-slate-950/70 px-3 py-2">
    <span className="text-slate-300">{label}</span>
    <span className="text-right font-medium">{formatFull(value)}</span>
  </p>
);
