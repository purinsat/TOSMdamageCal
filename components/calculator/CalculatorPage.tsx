"use client";

import { useState, useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { defaultDamageInput } from "@/lib/damage/defaults";
import { calculateDamage } from "@/lib/damage/calculate";
import { damageInputSchema, DamageInputForm } from "@/lib/damage/schema";
import { DAMAGE_STORAGE_KEY } from "@/lib/damage/storage";
import { sanitizeDamageInput } from "@/lib/damage/sanitize";
import { DamageForm } from "@/components/calculator/DamageForm";
import { CalculationBreakdown } from "@/components/calculator/CalculationBreakdown";

export const CalculatorPage = () => {
  const [showDetails, setShowDetails] = useState(false);
  const [savedDamages, setSavedDamages] = useState<
    Array<{ id: number; label: string; totalDamage: number }>
  >([]);
  const [hydrated, setHydrated] = useState(false);
  const form = useForm<DamageInputForm>({
    resolver: zodResolver(damageInputSchema),
    defaultValues: defaultDamageInput,
    mode: "onChange",
  });

  // Load saved inputs from localStorage on first mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(DAMAGE_STORAGE_KEY);
      if (stored) {
        const result = damageInputSchema.safeParse(JSON.parse(stored));
        if (result.success) {
          form.reset(result.data);
        }
      }
    } catch {
      // Ignore corrupt or missing data — defaults are already set
    } finally {
      setHydrated(true);
    }
  }, [form]);

  const formValues = useWatch({ control: form.control });

  // Persist inputs to localStorage after hydration
  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(DAMAGE_STORAGE_KEY, JSON.stringify(formValues));
    } catch {
      // Storage may be unavailable (private browsing quota etc.)
    }
  }, [formValues, hydrated]);

  const breakdown = calculateDamage(sanitizeDamageInput(formValues));

  const handleResetToZero = () => {
    const current = form.getValues();
    form.reset({
      ...current,
      attack: 0,
      criticalDamage: 0,
      skillDamagePercent: 0,
      bonusPchPercent: 0,
      criticalHit: false,
      pierce: false,
      weakness: false,
      elementalWeaknessPercent: 0,
      highDefMon: false,
      defense: 0,
      finalReductPercent: 0,
      generalMultiplier: current.generalMultiplier.map((entry) => ({ ...entry, value: 0 })),
      skillMultiplier: current.skillMultiplier.map((entry) => ({ ...entry, value: 0 })),
      buffDebuffMultiplier: current.buffDebuffMultiplier.map((entry) => ({ ...entry, value: 0 })),
      conditionDamageMultiplier: current.conditionDamageMultiplier.map((entry) => ({ ...entry, value: 0 })),
      ignoreDefenseCustomizations: current.ignoreDefenseCustomizations.map((entry) => ({ ...entry, value: 0 })),
    });
    setShowDetails(false);
    setSavedDamages([]);
  };

  const handleSaveDamage = () => {
    setSavedDamages((previous) => {
      const nextVersion = previous.length + 1;
      const next = [
        ...previous,
        { id: Date.now(), label: `V${nextVersion}`, totalDamage: breakdown.totalDamage },
      ];
      return next.slice(-6);
    });
  };

  const handleRenameSavedDamage = (id: number, label: string) => {
    setSavedDamages((previous) =>
      previous.map((item) => (item.id === id ? { ...item, label } : item)),
    );
  };

  const handleRemoveSavedDamage = (id: number) => {
    setSavedDamages((previous) => previous.filter((item) => item.id !== id));
  };

  const handleResetToDefault = () => {
    form.reset(defaultDamageInput);
    setShowDetails(false);
    setSavedDamages([]);
  };

  return (
    <main className="mx-auto min-h-screen max-w-7xl p-4 md:p-8">
      {/* Header */}
      <header className="mb-8">
        <div className="flex flex-col gap-1">
          <p className="text-xs font-semibold uppercase tracking-widest text-purple-400">
            Tree of Savior Mobile
          </p>
          <h1 className="bg-gradient-to-r from-white to-purple-200 bg-clip-text text-3xl font-bold text-transparent md:text-4xl">
            Extreme Damage Calculator
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Full formula transparency · custom multipliers · by PonderingTH
          </p>
        </div>

        <div className="mt-5 flex flex-wrap gap-3">
          <a
            href="https://www.youtube.com/@KRUN-KID"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-lg border border-red-500/40 bg-red-900/20 px-3 py-2 text-sm text-red-300 transition-colors hover:bg-red-900/30"
          >
            <YoutubeIcon />
            Subscribe on YouTube
          </a>
          <a
            href="https://www.youtube.com/channel/UCrREEp9fyOoCBiLn3LjW5OA/join"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-lg border border-purple-500/40 bg-purple-900/20 px-3 py-2 text-sm text-purple-300 transition-colors hover:bg-purple-900/30"
          >
            <HeartIcon />
            Support us
          </a>
          <a
            href="https://discord.gg/Q2EqBhCe5G"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-lg border border-indigo-500/40 bg-indigo-900/20 px-3 py-2 text-sm text-indigo-300 transition-colors hover:bg-indigo-900/30"
          >
            <DiscordIcon />
            Join Discord
          </a>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-5">
        <form className="lg:col-span-3">
          <DamageForm form={form} breakdown={breakdown} />
        </form>

        {/* Sticky result panel */}
        <div className="space-y-3 lg:sticky lg:top-4 lg:col-span-2 lg:h-fit">
          <CalculationBreakdown
            breakdown={breakdown}
            showDetails={showDetails}
            savedDamages={savedDamages}
            onRenameSavedDamage={handleRenameSavedDamage}
            onRemoveSavedDamage={handleRemoveSavedDamage}
          />

          <div className="grid grid-cols-1 gap-2">
            <button
              type="button"
              onClick={() => setShowDetails((value) => !value)}
              className="w-full rounded-xl border border-slate-600 bg-slate-900 px-4 py-2.5 text-sm font-medium text-slate-200 transition-colors hover:bg-slate-800"
            >
              {showDetails ? "Hide Calculation Details" : "Show Calculation Details"}
            </button>
            <button
              type="button"
              onClick={handleSaveDamage}
              className="w-full rounded-xl border border-purple-500/70 bg-purple-900/30 px-4 py-2.5 text-sm font-medium text-purple-200 transition-colors hover:bg-purple-800/40"
            >
              Save Damage
            </button>
            <button
              type="button"
              onClick={handleResetToZero}
              className="w-full rounded-xl border border-slate-600 bg-slate-900 px-4 py-2.5 text-sm font-medium text-slate-400 transition-colors hover:bg-slate-800 hover:text-slate-200"
            >
              Reset All to Zero
            </button>
            <button
              type="button"
              onClick={handleResetToDefault}
              className="w-full rounded-xl border border-slate-600 bg-slate-900 px-4 py-2.5 text-sm font-medium text-slate-400 transition-colors hover:bg-slate-800 hover:text-slate-200"
            >
              Reset to Default Values
            </button>
          </div>
        </div>
      </div>
    </main>
  );
};

const YoutubeIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
  </svg>
);

const HeartIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
  </svg>
);

const DiscordIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
  </svg>
);
