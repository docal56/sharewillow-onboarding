"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { Home, ChevronRight } from "lucide-react";
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
      <header className="border-b border-[#e5e5e5] px-6 py-5">
        <nav className="flex items-center gap-3">
          <Link href="/" className="text-slate-600 hover:text-slate-800">
            <Home className="size-5" strokeWidth={1.5} />
          </Link>
          <ChevronRight className="size-5 text-slate-400" strokeWidth={1.5} />
          <span className="text-md font-medium text-[#294be7]">
            Benchmarks
          </span>
        </nav>
      </header>

      <main className="mx-auto max-w-[1436px] px-6 py-8">
        <div className="mb-6 flex flex-col gap-3">
          <h1 className="font-display text-[32px] font-medium leading-none text-slate-800">
            Here&apos;s how you compare to similar companies
          </h1>
          <p className="max-w-[720px] text-[16px] leading-[20px] tracking-[-0.3px] text-slate-600">
            We&apos;ve compared your numbers against HVAC companies just like
            yours — same size, same industry.
          </p>
        </div>

        <div className="flex items-start gap-[40px]">
          {/* Left — Benchmark cards */}
          <div className="w-[896px] shrink-0 space-y-4">
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
          <div className="w-[500px] shrink-0">
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
