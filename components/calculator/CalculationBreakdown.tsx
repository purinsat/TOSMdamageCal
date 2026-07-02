import { DamageBreakdown } from "@/lib/damage/types";
import { formatFull, formatCompact } from "@/lib/damage/format";

type CalculationBreakdownProps = {
  breakdown: DamageBreakdown;
  showDetails: boolean;
  savedDamages: Array<{ id: number; label: string; totalDamage: number }>;
  onRenameSavedDamage: (id: number, label: string) => void;
  onRemoveSavedDamage: (id: number) => void;
};


export const CalculationBreakdown = ({
  breakdown,
  showDetails,
  savedDamages,
  onRenameSavedDamage,
  onRemoveSavedDamage,
}: CalculationBreakdownProps) => {
  return (
    <section className="overflow-hidden rounded-2xl border border-purple-500/30 bg-slate-900/80 shadow-lg shadow-purple-900/20">
      {/* Total Damage Hero */}
      <div className="relative border-b border-purple-500/20 bg-gradient-to-br from-purple-900/40 to-slate-900/60 p-5">
        <p className="text-xs font-semibold uppercase tracking-widest text-purple-400">
          Total Damage
        </p>
        <p className="mt-1 break-words text-4xl font-bold leading-tight text-white">
          {formatCompact(breakdown.totalDamage)}
        </p>
        <p className="mt-1 break-all text-xs text-slate-400">{formatFull(breakdown.totalDamage)}</p>
        {/* subtle glow orb */}
        <div className="pointer-events-none absolute right-4 top-4 h-16 w-16 rounded-full bg-purple-500/10 blur-2xl" />
      </div>

      {/* Component Stats */}
      <div className="grid grid-cols-2 divide-x divide-slate-700/60 border-b border-slate-700/60">
        <div className="p-4">
          <p className="text-xs uppercase tracking-wide text-slate-400">From Attack</p>
          <p className="mt-1 text-lg font-semibold text-slate-100">
            {formatCompact(breakdown.attackPart)}
          </p>
          <p className="mt-0.5 text-xs text-slate-500">{formatFull(breakdown.attackPart)}</p>
        </div>
        <div className="p-4">
          <p className="text-xs uppercase tracking-wide text-slate-400">From Critical</p>
          <p className="mt-1 text-lg font-semibold text-slate-100">
            {formatCompact(breakdown.criticalPart)}
          </p>
          <p className="mt-0.5 text-xs text-slate-500">{formatFull(breakdown.criticalPart)}</p>
        </div>
      </div>

      {/* Saved Comparisons */}
      <div className="p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
          Saved Comparisons
        </p>
        {savedDamages.length === 0 ? (
          <p className="mt-2 text-sm text-slate-500">
            Click Save Damage to compare versions.
          </p>
        ) : (
          <div className="mt-2 space-y-2">
            {savedDamages.map((item) => {
              const percent =
                item.totalDamage === 0
                  ? null
                  : ((breakdown.totalDamage - item.totalDamage) / item.totalDamage) * 100;
              const percentText =
                percent === null
                  ? "—"
                  : `${percent >= 0 ? "+" : ""}${percent.toFixed(1)}%`;
              const percentColor =
                percent === null || percent === 0
                  ? "text-slate-400"
                  : percent > 0
                    ? "text-emerald-400"
                    : "text-red-400";
              return (
                <div
                  key={item.id}
                  className="rounded-xl border border-slate-700/60 bg-slate-950/60 p-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <input
                      type="text"
                      value={item.label}
                      onChange={(event) => onRenameSavedDamage(item.id, event.target.value)}
                      className="min-w-0 flex-1 rounded-md border border-slate-700 bg-slate-900 px-2 py-1 text-sm font-medium text-slate-200 focus:border-purple-400 focus:outline-none"
                      placeholder="Label"
                    />
                    <span className={`shrink-0 text-lg font-bold tabular-nums ${percentColor}`}>
                      {percentText}
                    </span>
                    <button
                      type="button"
                      onClick={() => onRemoveSavedDamage(item.id)}
                      className="shrink-0 rounded-md border border-red-500/50 px-2 py-1 text-xs text-red-300 transition-colors hover:bg-red-900/30"
                    >
                      ×
                    </button>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">{formatFull(item.totalDamage)}</p>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Calculation Details */}
      {showDetails && (
        <div className="border-t border-slate-700/60 p-4 space-y-2 text-sm text-slate-200">
          <DetailRow label="Elemental Weakness" value={breakdown.elementalWeaknessFactor} />
          <DetailRow label="Defense Ratio" value={breakdown.defenseRatio} />
          <DetailRow label="General Multiplier" value={breakdown.finalGeneralMultiplier} />
          <DetailRow label="Skill Multiplier" value={breakdown.finalSkillMultiplier} />
          <DetailRow label="Buff / Debuff Multiplier" value={breakdown.finalBuffDebuffMultiplier} />
          <DetailRow label="Conditional Multiplier" value={breakdown.finalConditionalDamage} />
          <DetailRow label="Combined Multipliers" value={breakdown.multipliers} />
          <div className="mt-3 rounded-xl border border-slate-700 bg-slate-950/80 p-3 text-xs leading-relaxed text-slate-400">
            <p>
              <span className="font-medium text-slate-300">Attack Part</span> = ((ATK × (1 + BonusPCH%) + (0.05 × ATK)) × DefRatio × SkillDamageFactor × Multipliers × ReductionFactor × ElementWeaknessFactor)
            </p>
            <p className="mt-2">
              <span className="font-medium text-slate-300">Critical Part</span> = CriticalDamage × SkillDamageFactor × Multipliers × ReductionFactor × ElementWeaknessFactor
            </p>
          </div>
        </div>
      )}
    </section>
  );
};

const DetailRow = ({ label, value }: { label: string; value: number }) => (
  <div className="flex items-center justify-between gap-2 rounded-lg border border-slate-800 bg-slate-950/70 px-3 py-2">
    <span className="text-slate-400">{label}</span>
    <span className="font-medium tabular-nums text-slate-200">{formatFull(value)}</span>
  </div>
);
