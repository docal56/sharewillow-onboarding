import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { zodResponseFormat } from "openai/helpers/zod";
import { z } from "zod";
import { buildPlanPrompt, PlanMode } from "@/lib/plan-prompt";
import { HVAC_BENCHMARKS } from "@/lib/benchmarks";
import { BenchmarkMetric, CompanyData, CSVSummary } from "@/types";

const KPIBase = z.object({
  name: z.string(),
  current: z.number(),
  target: z.number(),
  bonusPerMonth: z.number(),
  bonusCap: z.number(),
  rationale: z.string(),
});

const KPICustom = KPIBase.extend({
  tooltipCopy: z.string().nullable(),
});

function getPlanResponseSchema(planMode: PlanMode) {
  const KPI = planMode === "custom" ? KPICustom : KPIBase;
  return z.object({
    reasoning: z.string(),
    kpis: z.array(KPI),
    bonusPerTech: z.number(),
    monthlyPayout: z.number(),
    projectedUpliftLow: z.number(),
    projectedUpliftHigh: z.number(),
    insightCopy: z.object({}).catchall(z.string()),
  });
}

const PlanResponse = z.object({
  reasoning: z.string(),
  kpis: z.array(KPIBase.or(KPICustom)),
  bonusPerTech: z.number(),
  monthlyPayout: z.number(),
  projectedUpliftLow: z.number(),
  projectedUpliftHigh: z.number(),
  insightCopy: z.object({}).catchall(z.string()),
});

export async function POST(request: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { companyData, csvSummary, benchmarks } = body;
  const planMode: PlanMode =
    body.planMode === "custom" || body.planMode === "generic"
      ? body.planMode
      : "generic";

  if (!companyData || !csvSummary) {
    return NextResponse.json(
      { error: "Missing company data or CSV summary" },
      { status: 400 }
    );
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "OpenAI API key not configured" },
      { status: 500 }
    );
  }

  try {
    const openai = new OpenAI({ apiKey });
    const resolvedBenchmarks = (benchmarks as BenchmarkMetric[]) ?? HVAC_BENCHMARKS;
    const { system, user } = buildPlanPrompt(
      companyData as Partial<CompanyData>,
      csvSummary as CSVSummary,
      resolvedBenchmarks,
      planMode
    );
    const planResponseSchema = getPlanResponseSchema(planMode);

    const completion = await openai.chat.completions.parse({
      model: "gpt-4o-2024-08-06",
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      response_format: zodResponseFormat(planResponseSchema, "incentive_plan"),
    });

    const parsed = completion.choices[0]?.message?.parsed;
    if (!parsed) {
      return NextResponse.json(
        { error: "No valid structured response from OpenAI" },
        { status: 502 }
      );
    }

    const planData = PlanResponse.omit({ reasoning: true }).parse(parsed);

    return NextResponse.json(planData);
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to generate plan";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
