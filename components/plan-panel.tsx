"use client";

import { Users, ArrowRight } from "lucide-react";
import { PlanData } from "@/types";

interface PlanPanelProps {
  planData: PlanData | null;
  teamSize: number;
  isLoading?: boolean;
  error?: string | null;
  onGeneratePlan: () => void;
  onConnectData: () => void;
}

function formatKPITarget(name: string, value: number): string {
  const lower = name.toLowerCase();
  if (lower.includes("rate") || lower.includes("efficiency")) {
    return `${value}%`;
  }
  if (
    lower.includes("revenue") ||
    lower.includes("value") ||
    lower.includes("ticket") ||
    lower.includes("member")
  ) {
    return `$${value.toLocaleString()}`;
  }
  return `${value}`;
}

function formatCompactCurrency(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${Math.round(value / 1_000)}K`;
  return `$${value}`;
}

export function PlanPanel({
  planData,
  teamSize,
  isLoading,
  error,
  onGeneratePlan,
  onConnectData,
}: PlanPanelProps) {
  if (isLoading) {
    return (
      <div className="overflow-clip rounded-[12px] border border-[#e5e5e5] bg-white">
        <div className="flex flex-col items-center justify-center py-16">
          <div className="mb-4 size-8 animate-spin rounded-full border-2 border-[#294be7] border-t-transparent" />
          <p className="text-[14px] text-[#4E4E4E]">
            Generating your personalised plan...
          </p>
        </div>
      </div>
    );
  }

  if (!planData) {
    return (
      <div className="overflow-clip rounded-[12px] border border-[#e5e5e5] bg-white">
        <div className="flex flex-col gap-[12px] px-[20px] py-[24px]">
          <h2 className="font-display text-[24px] font-medium leading-none text-[#171717]">
            Recommended Incentive Plan
          </h2>
          <p className="text-[14px] leading-[18px] text-[#4e4e4e]">
            Generate a plan to see KPI targets and recommended bonus structure
            based on your benchmarks.
          </p>
          {error && (
            <div className="rounded-[8px] border border-[#f4caca] bg-[#fff4f4] px-3 py-2">
              <p className="text-[13px] leading-[18px] text-[#b42318]">
                Last generation failed: {error}
              </p>
            </div>
          )}
          <button
            type="button"
            onClick={onGeneratePlan}
            className="mt-2 flex w-full items-center justify-center gap-[6px] rounded-[10px] bg-[#294be7] px-[8px] py-[12px] text-[16px] font-medium leading-[20px] text-white transition-colors hover:bg-[#294be7]/90"
          >
            Generate Plan
            <ArrowRight className="size-[24px]" />
          </button>
        </div>
      </div>
    );
  }

  const plan = planData;

  return (
    <div className="overflow-clip rounded-[12px] border border-[#e5e5e5] bg-white">
      {/* Header */}
      <div className="flex flex-col gap-[12px] px-[20px] pt-[24px]">
        <h2 className="font-display text-[24px] font-medium leading-none text-[#171717]">
          Recommended Incentive Plan
        </h2>
        <p className="text-[14px] leading-[18px] text-[#4e4e4e]">
          Based on companies like yours, here&apos;s what a plan typically looks
          like.
        </p>
      </div>

      {/* Plan Name */}
      <div className="flex items-center gap-[12px] px-[20px] pt-[20px]">
        <div className="flex size-[32px] shrink-0 items-center justify-center rounded-full bg-[#171717]">
          <Users className="size-[16px] text-white" strokeWidth={2} />
        </div>
        <h3 className="font-display text-[20px] font-medium leading-[24px] tracking-[-0.6px] text-[#171717]">
          Individual Incentive Plan
        </h3>
      </div>

      {/* Plan Details */}
      <div className="border-b border-[#e5e5e5] pb-[20px]">
        <div className="flex flex-col gap-[16px] px-[20px] pt-[20px]">
          <p className="text-[14px] font-medium leading-[18px] text-[#171717]">
            Department: Technicians
          </p>
          <p className="text-[14px] font-medium leading-[18px] text-[#171717]">
            Team members: {teamSize}
          </p>
          <p className="text-[14px] font-medium leading-[18px] text-[#171717]">
            KPI Targets
          </p>

          {/* KPI Table */}
          <div className="flex flex-col gap-[16px]">
            {/* Table Header */}
            <div className="flex items-center border-b border-[#e5e5e5] pb-[12px] text-[14px] font-medium leading-none text-[#171717]">
              <span className="flex-1">KPI</span>
              <span className="w-[120px]">Target</span>
              <span className="w-[80px]">Bonus</span>
            </div>

            {/* Table Rows */}
            {plan.kpis.map((kpi, idx) => (
              <div key={kpi.name} className="flex flex-col gap-[16px]">
                <div className="flex h-[14px] items-center text-[14px] leading-none text-[#171717]">
                  <span className="flex-1">{kpi.name}</span>
                  <span className="w-[120px]">
                    {formatKPITarget(kpi.name, kpi.target)}
                  </span>
                  <span className="w-[80px]">${kpi.bonusPerMonth}</span>
                </div>
                {idx < plan.kpis.length - 1 && (
                  <div className="h-px w-full bg-[#f3f3f3]" />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Plan Summary */}
      <div className="pb-[20px]">
        <div className="flex flex-col gap-[16px] px-[20px] pt-[20px]">
          <h3 className="font-display text-[20px] font-medium leading-[24px] tracking-[-0.6px] text-[#171717]">
            Plan Summary
          </h3>

          {/* Two-column stats */}
          <div className="flex gap-[16px]">
            {/* Bonus per technician */}
            <div className="flex flex-1 flex-col gap-[8px]">
              <div className="flex flex-col gap-[8px]">
                <p className="text-[14px] leading-[18px] text-[#4e4e4e]">
                  Bonus per technician
                </p>
                <p className="font-medium text-[#1a1a1a]">
                  <span className="text-[20px] leading-[24px]">
                    ${plan.bonusPerTech.toLocaleString()}
                  </span>
                  <span className="text-[24px] leading-[24px]"> </span>
                  <span className="text-[16px] font-normal leading-[24px]">
                    / mo
                  </span>
                </p>
              </div>
              <p className="text-[12px] leading-[16px] text-[#4e4e4e]">
                If all {plan.kpis.length} KPI&apos;s hit
              </p>
            </div>

            {/* Monthly Payout */}
            <div className="flex flex-1 flex-col gap-[8px]">
              <div className="flex flex-col gap-[8px]">
                <p className="text-[14px] leading-[18px] text-[#4e4e4e]">
                  Monthly Payout
                </p>
                <p className="font-medium text-[#1a1a1a]">
                  <span className="text-[20px] leading-[24px]">
                    ${plan.monthlyPayout.toLocaleString()}
                  </span>
                  <span className="text-[24px] leading-[24px]"> </span>
                  <span className="text-[16px] font-normal leading-[24px]">
                    / mo
                  </span>
                </p>
              </div>
              <p className="text-[12px] leading-[16px] text-[#4e4e4e]">
                Across {teamSize} Technicians
              </p>
            </div>
          </div>
        </div>

        {/* Projected uplift */}
        <div className="px-[8px] pt-[16px]">
          <div className="rounded-[8px] bg-emerald-100 p-[16px]">
            <div className="flex flex-col gap-[8px]">
              <div className="flex flex-col gap-[12px] font-medium">
                <p className="text-[14px] leading-[18px] text-[#1a1a1a]">
                  Projected revenue uplift
                </p>
                <p className="text-[#1b5d28]">
                  <span className="text-[24px] leading-[28px]">
                    {formatCompactCurrency(plan.projectedUpliftLow)}&ndash;
                    {formatCompactCurrency(plan.projectedUpliftHigh)}{" "}
                  </span>
                  <span className="text-[16px] font-normal leading-[28px]">
                    / yr
                  </span>
                </p>
              </div>
              <p className="text-[12px] leading-[16px] text-[#4e4e4e]">
                Based on median improvement rates for{" "}
                HVAC companies on these {plan.kpis.length} KPIs
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Section */}
      <div className="flex flex-col gap-[12px] border-t border-[#e8e8e8] p-[16px]">
        <p className="text-[16px] font-medium leading-[20px] text-[#1a1a1a]">
          This plan is an illustration based on the info you gave us.
        </p>
        <p className="text-[14px] leading-[20px] text-[#4e4e4e]">
          Connect your ServiceTitan account and we&apos;ll build a plan tailored
          to your team and your numbers.
        </p>
        <button
          type="button"
          onClick={onConnectData}
          className="flex w-full items-center justify-center gap-[6px] rounded-[10px] bg-[#294be7] px-[8px] py-[12px] text-[16px] font-medium leading-[20px] text-white transition-colors hover:bg-[#294be7]/90"
        >
          Get a Personalised Plan
          <ArrowRight className="size-[24px]" />
        </button>
      </div>
    </div>
  );
}
