"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Home, ChevronRight, RotateCcw } from "lucide-react";
import { BenchmarkCard } from "@/components/benchmark-card";
import { PlanPanel } from "@/components/plan-panel";
import { useBenchmarks } from "@/hooks/use-benchmarks";
import { useConnectFlow } from "@/hooks/use-connect-flow";
import { useOnboarding, useResetOnboarding } from "@/context/onboarding-context";
import { CompanyData, CSVSummary, PlanData } from "@/types";
import { getTeamSizeBand } from "@/lib/benchmark-catalog";

function getPlanKpiCurrentValue(
  metricName: string,
  planData: PlanData | null
): number | null {
  if (!planData) return null;

  const metricToKpiName: Record<string, string> = {
    avgJobValue: "Average Job Value",
    billableEfficiency: "Billable Efficiency",
    callbackRate: "Callback Rate",
    monthlyRevenuePerMember: "Revenue Per Technician",
    laborRate: "Labor Rate",
    googleRating: "Average Google Rating",
  };

  const kpiName = metricToKpiName[metricName];
  if (!kpiName) return null;
  return planData.kpis.find((kpi) => kpi.name === kpiName)?.current ?? null;
}

function getCurrentValue(
  metricName: string,
  companyData: Partial<CompanyData>,
  csvSummary: CSVSummary | null,
  planData: PlanData | null
): number | null {
  const teamCount = companyData.numberOfTechs ?? companyData.teamSize;
  const fromPlan = getPlanKpiCurrentValue(metricName, planData);

  switch (metricName) {
    case "annualRevenue":
      return companyData.annualRevenue ?? null;
    case "laborRate":
      if (companyData.staffCosts && companyData.annualRevenue) {
        return Math.round(
          (companyData.staffCosts / companyData.annualRevenue) * 100
        );
      }
      return null;
    case "avgJobValue":
      return csvSummary?.avgTicket ?? companyData.avgJobValue ?? null;
    case "monthlyRevenuePerMember":
      if (companyData.annualRevenue && teamCount) {
        return Math.round(
          companyData.annualRevenue / 12 / teamCount
        );
      }
      if (csvSummary?.totalRevenue && teamCount) {
        return Math.round(csvSummary.totalRevenue / 12 / teamCount);
      }
      return null;
    case "billableEfficiency":
      return csvSummary?.billableEfficiency ?? fromPlan;
    case "callbackRate":
      return csvSummary?.callbackRate ?? fromPlan;
    case "googleRating":
      return csvSummary?.googleRating ?? fromPlan;
    case "monthlyOvertimeSpend":
      return csvSummary?.monthlyOvertimeSpend ?? null;
    default:
      return null;
  }
}

export default function BenchmarksPage() {
  const router = useRouter();
  const { companyData, csvSummary, planData, isGeneratingPlan, planError } =
    useOnboarding();
  const { handleGenerate } = useConnectFlow();
  const autoGenerationStarted = useRef(false);
  const resetOnboarding = useResetOnboarding();
  const { benchmarks } = useBenchmarks();

  const hasConnectedData = csvSummary !== null;
  const PRE_CONNECT_METRICS = ["annualRevenue", "laborRate", "avgJobValue"];
  const visibleBenchmarks = hasConnectedData
    ? benchmarks
    : benchmarks.filter((m) => PRE_CONNECT_METRICS.includes(m.name));
  const benchmarkCurrentValues = Object.fromEntries(
    benchmarks.map((metric) => [
      metric.displayName,
      getCurrentValue(metric.name, companyData, csvSummary, planData),
    ])
  );

  const industryLabel = companyData.industry ?? "HVAC";
  const teamSizeBand = getTeamSizeBand(companyData.teamSize ?? 12);
  const hasRequiredCompanyInputs = Boolean(
    companyData.industry &&
      (companyData.numberOfTechs ?? companyData.teamSize) &&
      companyData.annualRevenue &&
      companyData.staffCosts &&
      companyData.avgJobValue
  );

  useEffect(() => {
    if (autoGenerationStarted.current) return;
    if (!hasRequiredCompanyInputs) return;
    if (isGeneratingPlan || planData) return;

    autoGenerationStarted.current = true;
    void handleGenerate();
  }, [handleGenerate, hasRequiredCompanyInputs, isGeneratingPlan, planData]);

  function handleReset() {
    resetOnboarding();
    router.push("/company");
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="relative h-[64px] border-b-[0.5px] border-[#e5e5e5]">
        <div className="relative h-full w-full px-6">
          <nav className="absolute left-[24px] top-[22px] flex items-center gap-[12px]">
            <Link href="/" className="text-[#171717]">
              <Home className="size-6" strokeWidth={1.5} />
            </Link>
            <ChevronRight className="size-6 text-[#171717]" strokeWidth={1.5} />
            <span className="text-[16px] font-medium leading-none text-[#294be7]">
              Benchmarks
            </span>
          </nav>

          <button
            type="button"
            onClick={handleReset}
            className="absolute right-[16px] top-[calc(50%+0.25px)] flex h-[36px] -translate-y-1/2 items-center justify-center gap-[4px] rounded-[8px] border border-[#d5d5d5] bg-white px-[12px] py-[8px]"
          >
            <span className="text-[14px] font-medium leading-[14px] text-[#171717]">
              Reset
            </span>
            <RotateCcw className="size-4 text-[#171717]" strokeWidth={1.8} />
          </button>
        </div>
      </header>

      <main className="w-full pb-8 pt-12">
        <div className="mx-auto flex w-[1436px] items-start gap-[40px]">
          {/* Left — Benchmark cards */}
          <div className="flex w-[896px] shrink-0 flex-col gap-6">
            <div className="flex w-full flex-col gap-3">
              <h1 className="font-display text-[32px] font-medium leading-none text-[#1a1a1a]">
                Here&apos;s how you compare to similar companies
              </h1>
              <p className="w-[720px] text-[16px] leading-[20px] tracking-[-0.3px] text-[#4e4e4e]">
                We&apos;ve compared your numbers against {industryLabel} companies
                just like yours — same size, same industry.
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <p className="w-[720px] text-[14px] leading-[18px] text-[#4e4e4e]">
                Benchmarks are drawn from ACCA, ServiceTitan, and HVACR Business
                data.
              </p>
              {visibleBenchmarks.map((metric) => (
                <BenchmarkCard
                  key={metric.name}
                  metric={metric}
                  currentValue={getCurrentValue(
                    metric.name,
                    companyData,
                    csvSummary,
                    planData
                  )}
                  industry={industryLabel}
                  teamSizeBand={teamSizeBand}
                  insightState={hasConnectedData ? "dataUploaded" : "formOnly"}
                  techCount={companyData.numberOfTechs ?? companyData.teamSize}
                  annualRevenue={companyData.annualRevenue}
                />
              ))}

              {!hasConnectedData && (
                <div className="flex flex-col items-center justify-center gap-7 rounded-[16px] border border-[#ede2d8] bg-[#f9f4f1] px-5 py-8">
                  <p className="font-display text-[24px] font-medium leading-none text-[#171717]">
                    Looking for a more detailed report? Connect your data.
                  </p>
                  <button
                    type="button"
                    onClick={() => router.push("/connect")}
                    className="rounded-[10px] bg-[#180600] p-3 text-[16px] font-medium leading-5 text-white transition-colors hover:bg-[#180600]/90"
                  >
                    Connect Your Data
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Right — Plan panel */}
          <div className="w-[500px] shrink-0">
            <PlanPanel
              planData={planData}
              teamSize={companyData.numberOfTechs ?? companyData.teamSize ?? 12}
              isCustomPlan={hasConnectedData}
              benchmarkCurrentValues={benchmarkCurrentValues}
              isLoading={isGeneratingPlan}
              error={planError}
              onGeneratePlan={handleGenerate}
              onConnectData={() => router.push("/connect")}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
