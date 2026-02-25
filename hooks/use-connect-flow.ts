"use client";

import { useCallback, useEffect, useState } from "react";
import {
  useOnboarding,
  useOnboardingDispatch,
} from "@/context/onboarding-context";
import { CSVRow, CSVSummary } from "@/types";

export function useConnectFlow() {
  const { companyData, csvSummary, benchmarks } = useOnboarding();
  const dispatch = useOnboardingDispatch();
  const [localSummary, setLocalSummary] = useState<CSVSummary | null>(
    csvSummary
  );
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (csvSummary) {
      setLocalSummary(csvSummary);
    }
  }, [csvSummary]);

  const handleCSVParsed = useCallback((data: { rows: CSVRow[]; summary: CSVSummary }) => {
    setLocalSummary(data.summary);
    dispatch({ type: "SET_CSV_DATA", payload: data });
  }, [dispatch]);

  const handleGenerate = useCallback(async (): Promise<boolean> => {
    dispatch({ type: "SET_GENERATING", payload: true });
    setIsGenerating(true);
    setError(null);

    try {
      // Strip password from company data before sending to API
      const { password: _, ...safeCompanyData } = companyData as Record<
        string,
        unknown
      >;

      const fallbackSummary: CSVSummary = {
        avgTicket: null,
        billableEfficiency: null,
        callbackRate: null,
        googleRating: null,
        monthlyOvertimeSpend: null,
        totalJobs: 0,
        totalRevenue: null,
      };
      const resolvedSummary = localSummary ?? csvSummary;
      const effectiveSummary = resolvedSummary ?? fallbackSummary;
      const planMode = resolvedSummary ? "custom" : "generic";

      const response = await fetch("/api/generate-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyData: safeCompanyData,
          csvSummary: effectiveSummary,
          benchmarks,
          planMode,
        }),
      });

      if (!response.ok) {
        let errorMessage = "Failed to generate plan";
        try {
          const data = await response.json();
          errorMessage = data.error || errorMessage;
        } catch {
          // response body was not JSON
        }
        throw new Error(errorMessage);
      }

      const planData = await response.json();
      dispatch({ type: "SET_PLAN_DATA", payload: planData });
      return true;
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Something went wrong";
      setError(message);
      dispatch({ type: "SET_PLAN_ERROR", payload: message });
      return false;
    } finally {
      setIsGenerating(false);
    }
  }, [benchmarks, companyData, csvSummary, dispatch, localSummary]);

  const canGenerate = true;

  return {
    localSummary,
    handleCSVParsed,
    handleGenerate,
    canGenerate,
    isGenerating,
    error,
  };
}
