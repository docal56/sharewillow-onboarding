"use client";

import { useRouter } from "next/navigation";
import { BenchmarkCard } from "@/components/benchmark-card";
import { PlanPanel } from "@/components/plan-panel";
import { HVAC_BENCHMARKS } from "@/lib/benchmarks";
import { useOnboarding } from "@/context/onboarding-context";
import { CompanyData, CSVSummary } from "@/types";

function getCurrentValue(
  metricName: string,
  companyData: Partial<CompanyData>,
  csvSummary: CSVSummary | null
): number | null {
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
      return csvSummary?.avgTicket ?? null;
    case "monthlyRevenuePerMember":
      if (companyData.annualRevenue && companyData.teamSize) {
        return Math.round(
          companyData.annualRevenue / 12 / companyData.teamSize
        );
      }
      return null;
    case "billableEfficiency":
      return csvSummary?.billableEfficiency ?? null;
    case "callbackRate":
      return csvSummary?.callbackRate ?? null;
    default:
      return null;
  }
}

export default function BenchmarksPage() {
  const router = useRouter();
  const { companyData, csvSummary, planData, isGeneratingPlan } =
    useOnboarding();

  const hasData = csvSummary !== null;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b px-6 py-4">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <p className="text-sm font-semibold tracking-wide text-primary">
            ShareWillow
          </p>
          <p className="text-sm text-muted-foreground">
            {companyData.name ?? "Your Company"}
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8">
        <div className="mb-8">
          <h1 className="font-display text-3xl tracking-tight">
            Your HVAC Benchmarks
          </h1>
          <p className="mt-1 text-muted-foreground">
            {hasData
              ? "Your metrics compared against HVAC companies with 15-25 employees"
              : "Industry benchmarks for HVAC companies with 15-25 employees"}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-5">
          {/* Left — Benchmark cards */}
          <div className="space-y-4 lg:col-span-3">
            {HVAC_BENCHMARKS.map((metric) => (
              <BenchmarkCard
                key={metric.name}
                metric={metric}
                currentValue={
                  hasData
                    ? getCurrentValue(metric.name, companyData, csvSummary)
                    : null
                }
                insightCopy={planData?.insightCopy?.[metric.displayName]}
              />
            ))}
          </div>

          {/* Right — Plan panel */}
          <div className="lg:col-span-2">
            <div className="sticky top-8">
              <PlanPanel
                planData={planData}
                teamSize={companyData.teamSize ?? 15}
                isLoading={isGeneratingPlan}
                onConnectData={() => router.push("/connect")}
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
