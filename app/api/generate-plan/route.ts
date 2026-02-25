import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import {
  buildCopyPrompt,
  buildKPISelectionPrompt,
  calculatePlanTargets,
  estimateGrossUplift,
} from "@/lib/plan-prompt";
import { HVAC_BENCHMARKS } from "@/lib/benchmarks";
import { BenchmarkMetric, CompanyData, CSVSummary, PlanMode } from "@/types";

const FALLBACK_SELECTED_KPIS = [
  { name: "Average Job Value", reason: "Core revenue lever tied to ticket size." },
  { name: "Billable Efficiency", reason: "Improves technician productivity." },
  { name: "Callback Rate", reason: "Reducing rework improves margin and capacity." },
];

function createAnthropicClient(): Anthropic | null {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;
  try {
    return new Anthropic({ apiKey });
  } catch {
    return null;
  }
}

function getTextContent(
  content: Anthropic.Messages.Message["content"]
): string {
  const block = content.find((item) => item.type === "text");
  if (block?.type === "text") return block.text;
  const blockTypes = content.map((item) => item.type).join(", ");
  throw new Error(`No text content returned by model. Blocks: [${blockTypes}]`);
}

function getMessageContent(
  response: unknown
): Anthropic.Messages.Message["content"] {
  if (
    typeof response === "object" &&
    response !== null &&
    "content" in response &&
    Array.isArray((response as { content?: unknown }).content)
  ) {
    return (response as Anthropic.Messages.Message).content;
  }
  throw new Error("Model returned a streaming or unexpected response shape.");
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      companyData,
      csvSummary,
      benchmarks,
      planMode = "generic",
    }: {
      companyData?: Partial<CompanyData>;
      csvSummary?: CSVSummary;
      benchmarks?: BenchmarkMetric[];
      planMode?: PlanMode;
    } = body;

    if (!companyData || !csvSummary) {
      return NextResponse.json(
        { error: "Missing company data or CSV summary" },
        { status: 400 }
      );
    }

    const resolvedBenchmarks = benchmarks ?? HVAC_BENCHMARKS;
    const resolvedPlanMode: PlanMode =
      planMode === "custom" || planMode === "generic" ? planMode : "generic";
    const anthropic = createAnthropicClient();

    // ── Step 1: AI picks KPIs ──────────────────────────────
    let selectedKPIs: { name: string; reason: string }[] = FALLBACK_SELECTED_KPIS;
    let step1Error: string | null = null;
    if (anthropic) {
      try {
        const { system: selectionSystem, user: selectionUser } =
          buildKPISelectionPrompt(
            companyData,
            csvSummary,
            resolvedBenchmarks,
            resolvedPlanMode
          );

        const selectionResponse = await anthropic.messages.create({
          model: "claude-sonnet-4-6",
          max_tokens: 1024,
          system: selectionSystem,
          messages: [{ role: "user", content: selectionUser }],
          output_config: {
            format: {
              type: "json_schema",
              schema: {
                type: "object",
                properties: {
                  selectedKPIs: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        name: { type: "string" },
                        reason: { type: "string" },
                      },
                      required: ["name", "reason"],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["selectedKPIs"],
                additionalProperties: false,
              },
            },
          },
        } as unknown as Anthropic.Messages.MessageCreateParams);

        const selectionText = getTextContent(getMessageContent(selectionResponse));
        const selectionJson = JSON.parse(selectionText) as {
          selectedKPIs?: { name: string; reason: string }[];
        };
        const parsedSelected = selectionJson.selectedKPIs ?? [];
        if (parsedSelected.length > 0) {
          selectedKPIs = parsedSelected;
        } else {
          step1Error = "AI returned no selected KPIs";
        }
      } catch (error: unknown) {
        step1Error = error instanceof Error ? error.message : "KPI selection failed";
        console.error("Step 1 (KPI selection) failed:", error);
      }
    } else {
      step1Error = "ANTHROPIC_API_KEY missing; using deterministic KPI fallback.";
    }

    // ── Step 2: Code calculates targets and bonuses ────────
    const calculatedKPIs = calculatePlanTargets(
      selectedKPIs,
      companyData,
      csvSummary,
      resolvedBenchmarks,
      resolvedPlanMode
    );
    if (calculatedKPIs.length === 0) {
      return NextResponse.json(
        { error: "No calculable KPIs from available data." },
        { status: 422 }
      );
    }

    // ── Step 3: AI writes copy ─────────────────────────────
    const totalBonus = calculatedKPIs.reduce((sum, k) => sum + k.bonusPerMonth, 0);
    const monthlyPayout = totalBonus * (companyData.teamSize ?? 1);
    const defaultAnnual = companyData.annualRevenue ?? 1_000_000;
    let copy: {
      kpiCopy: { name: string; rationale: string; tooltipCopy?: string }[];
      projectedUpliftLow: number;
      projectedUpliftHigh: number;
      insightCopy: Record<string, string>;
    } = {
      kpiCopy: calculatedKPIs.map((kpi) => ({
        name: kpi.name,
        rationale: selectedKPIs.find((s) => s.name === kpi.name)?.reason ?? "",
      })),
      projectedUpliftLow: Math.round(defaultAnnual * 0.04),
      projectedUpliftHigh: Math.round(defaultAnnual * 0.08),
      insightCopy: Object.fromEntries(
        resolvedBenchmarks.map((b) => [
          b.displayName,
          `You're currently below the benchmark median on ${b.displayName}; improving toward median performance should lift profitability.`,
        ])
      ),
    };
    if (anthropic) {
      try {
        const { system: copySystem, user: copyUser } = buildCopyPrompt(
          companyData,
          csvSummary,
          resolvedBenchmarks,
          calculatedKPIs,
          resolvedPlanMode
        );

        const copyResponse = await anthropic.messages.create({
          model: "claude-sonnet-4-6",
          max_tokens: 4096,
          system: copySystem,
          messages: [{ role: "user", content: copyUser }],
          output_config: {
            format: {
              type: "json_schema",
              schema: {
                type: "object",
                properties: {
                  kpiCopy: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        name: { type: "string" },
                        rationale: { type: "string" },
                        tooltipCopy: { type: "string" },
                      },
                      required: ["name", "rationale"],
                      additionalProperties: false,
                    },
                  },
                  projectedUpliftLow: { type: "number" },
                  projectedUpliftHigh: { type: "number" },
                  insightCopy: {
                    type: "object",
                    additionalProperties: { type: "string" },
                  },
                },
                required: [
                  "kpiCopy",
                  "projectedUpliftLow",
                  "projectedUpliftHigh",
                  "insightCopy",
                ],
                additionalProperties: false,
              },
            },
          },
        } as unknown as Anthropic.Messages.MessageCreateParams);

        const copyText = getTextContent(getMessageContent(copyResponse));
        copy = JSON.parse(copyText) as {
          kpiCopy: { name: string; rationale: string; tooltipCopy?: string }[];
          projectedUpliftLow: number;
          projectedUpliftHigh: number;
          insightCopy: Record<string, string>;
        };
      } catch {
        console.error("Step 3 (copy generation) failed; using deterministic fallback copy.");
      }
    }

    // ── Combine into final plan response ───────────────────
    const teamSize = companyData.teamSize ?? 1;
    const annualBonusCost = totalBonus * teamSize * 12;
    const grossUplift = estimateGrossUplift(calculatedKPIs, teamSize, companyData);
    const netUpliftLow = Math.max(0, Math.round(grossUplift * 0.5) - annualBonusCost);
    const netUpliftHigh = Math.max(
      0,
      Math.round(grossUplift * 0.85) - annualBonusCost
    );

    const planData = {
      kpis: calculatedKPIs.map((kpi, i) => ({
        name: kpi.name,
        current: kpi.current,
        target: kpi.target,
        bonusPerMonth: kpi.bonusPerMonth,
        bonusCap: kpi.bonusCap,
        rationale: copy.kpiCopy[i]?.rationale ?? "",
        tooltipCopy: copy.kpiCopy[i]?.tooltipCopy ?? undefined,
      })),
      bonusPerTech: totalBonus,
      monthlyPayout: monthlyPayout,
      projectedUpliftLow: netUpliftLow,
      projectedUpliftHigh: netUpliftHigh,
      insightCopy: copy.insightCopy,
      _meta: step1Error ? { warning: step1Error } : undefined,
    };

    return NextResponse.json(planData);
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to generate plan";
    console.error("Plan generation error:", error);
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
