"use client";

import { useEffect, useMemo, useState } from "react";
import { useOnboarding } from "@/context/onboarding-context";
import { resolveBenchmarksForIndustryAndTeamSize } from "@/lib/benchmark-catalog";
import { BenchmarkMetric } from "@/types";

export function useBenchmarks() {
  const { companyData } = useOnboarding();
  const [csvText, setCsvText] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    fetch("/benchmarks.csv")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load benchmarks.csv");
        return res.text();
      })
      .then((text) => {
        if (active) setCsvText(text);
      })
      .catch(() => {
        // Keep fallback dataset from benchmark-catalog.ts
      });

    return () => {
      active = false;
    };
  }, []);

  const resolvedBenchmarks: BenchmarkMetric[] = useMemo(
    () =>
      resolveBenchmarksForIndustryAndTeamSize(
        companyData.industry,
        companyData.teamSize,
        csvText ?? undefined
      ),
    [companyData.industry, companyData.teamSize, csvText]
  );

  return {
    benchmarks: resolvedBenchmarks,
    isLoading: false,
  };
}
