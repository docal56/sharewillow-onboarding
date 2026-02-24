"use client";

import { useState } from "react";
import {
  useOnboarding,
  useOnboardingDispatch,
} from "@/context/onboarding-context";
import { CSVRow, CSVSummary } from "@/types";

export function useConnectFlow() {
  const { companyData, anthropicApiKey, csvSummary } = useOnboarding();
  const dispatch = useOnboardingDispatch();
  const [localApiKey, setLocalApiKey] = useState(anthropicApiKey);
  const [localSummary, setLocalSummary] = useState<CSVSummary | null>(
    csvSummary
  );
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleCSVParsed(data: { rows: CSVRow[]; summary: CSVSummary }) {
    setLocalSummary(data.summary);
    dispatch({ type: "SET_CSV_DATA", payload: data });
  }

  async function handleGenerate(): Promise<boolean> {
    if (!localApiKey || !localSummary) return false;

    dispatch({ type: "SET_API_KEY", payload: localApiKey });
    dispatch({ type: "SET_GENERATING", payload: true });
    setIsGenerating(true);
    setError(null);

    try {
      // Strip password from company data before sending to API
      const { password: _, ...safeCompanyData } = companyData as Record<
        string,
        unknown
      >;

      const response = await fetch("/api/generate-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyData: safeCompanyData,
          csvSummary: localSummary,
          anthropicApiKey: localApiKey,
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
      dispatch({ type: "SET_GENERATING", payload: false });
      return false;
    } finally {
      setIsGenerating(false);
    }
  }

  const canGenerate =
    localApiKey.startsWith("sk-ant-") && localSummary !== null;

  return {
    localApiKey,
    setLocalApiKey,
    localSummary,
    handleCSVParsed,
    handleGenerate,
    canGenerate,
    isGenerating,
    error,
  };
}
