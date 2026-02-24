import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { buildPlanPrompt } from "@/lib/plan-prompt";
import { HVAC_BENCHMARKS } from "@/lib/benchmarks";
import { BenchmarkMetric, CompanyData, CSVSummary } from "@/types";

export async function POST(request: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { companyData, csvSummary, benchmarks } = body;

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
      resolvedBenchmarks
    );

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      max_tokens: 2000,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    });

    const responseText = completion.choices[0]?.message?.content;
    if (!responseText) {
      return NextResponse.json(
        { error: "No response from OpenAI" },
        { status: 502 }
      );
    }

    let jsonText = responseText.trim();

    // Strip markdown code fences if present
    const fenceMatch = jsonText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (fenceMatch) {
      jsonText = fenceMatch[1];
    }

    let planData: Record<string, unknown>;
    try {
      planData = JSON.parse(jsonText);
    } catch {
      return NextResponse.json(
        { error: "AI returned invalid JSON. Please try again." },
        { status: 502 }
      );
    }

    // Basic shape validation
    if (!Array.isArray(planData.kpis) || typeof planData.bonusPerTech !== "number") {
      return NextResponse.json(
        { error: "AI response did not match expected format. Please try again." },
        { status: 502 }
      );
    }

    return NextResponse.json(planData);
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to generate plan";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
