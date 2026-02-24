"use client";

import { useEffect, useRef } from "react";
import {
  useOnboarding,
  useOnboardingDispatch,
} from "@/context/onboarding-context";
import { HVAC_BENCHMARKS } from "@/lib/benchmarks";
import { BenchmarkMetric } from "@/types";

/**
 * Compute the user's known values for the core benchmarks
 * so the API can personalise insight text.
 */
function buildUserValues(companyData: Record<string, unknown>): Record<string, number> {
  const vals: Record<string, number> = {};

  const revenue = companyData.annualRevenue as number | undefined;
  const staffCosts = companyData.staffCosts as number | undefined;
  const teamSize = companyData.teamSize as number | undefined;
  const avgJobValue = companyData.avgJobValue as number | undefined;

  if (revenue) vals.annualRevenue = revenue;
  if (staffCosts && revenue) vals.laborRate = Math.round((staffCosts / revenue) * 100);
  if (avgJobValue) vals.avgJobValue = avgJobValue;
  if (revenue && teamSize) {
    vals.monthlyRevenuePerMember = Math.round(revenue / 12 / teamSize);
  }

  return vals;
}

export function useBenchmarks() {
  const { companyData, benchmarks, isGeneratingBenchmarks } = useOnboarding();
  const dispatch = useOnboardingDispatch();
  const fetchedForRef = useRef<string | null>(null);

  useEffect(() => {
    const industry = companyData.industry;
    const teamSize = companyData.teamSize;

    if (!industry || !teamSize) return;

    const cacheKey = `${industry}-${teamSize}`;

    // Skip if we already have benchmarks for this combination
    if (benchmarks && fetchedForRef.current === cacheKey) return;

    // Skip if currently fetching
    if (isGeneratingBenchmarks) return;

    fetchedForRef.current = cacheKey;
    dispatch({ type: "SET_GENERATING_BENCHMARKS", payload: true });

    const userValues = buildUserValues(companyData);

    fetch("/api/generate-benchmarks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ industry, teamSize, userValues }),
    })
      .then(async (res) => {
        if (!res.ok) throw new Error("Failed to generate benchmarks");
        const data = await res.json();
        dispatch({ type: "SET_BENCHMARKS", payload: data.benchmarks });
      })
      .catch(() => {
        // Fallback to HVAC_BENCHMARKS on error
        dispatch({ type: "SET_BENCHMARKS", payload: HVAC_BENCHMARKS });
      });
  }, [companyData, benchmarks, isGeneratingBenchmarks, dispatch]);

  const resolvedBenchmarks: BenchmarkMetric[] = benchmarks ?? HVAC_BENCHMARKS;

  return {
    benchmarks: resolvedBenchmarks,
    isLoading: isGeneratingBenchmarks,
  };
}
