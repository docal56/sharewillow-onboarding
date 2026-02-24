import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { buildPlanPrompt } from "@/lib/plan-prompt";
import { CompanyData, CSVSummary } from "@/types";

export async function POST(request: NextRequest) {
  // Parse request body
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { companyData, csvSummary, anthropicApiKey } = body;

  if (!anthropicApiKey || typeof anthropicApiKey !== "string") {
    return NextResponse.json(
      { error: "Missing Anthropic API key" },
      { status: 400 }
    );
  }
  if (!companyData || !csvSummary) {
    return NextResponse.json(
      { error: "Missing company data or CSV summary" },
      { status: 400 }
    );
  }

  try {
    const anthropic = new Anthropic({ apiKey: anthropicApiKey });
    const { system, user } = buildPlanPrompt(
      companyData as Partial<CompanyData>,
      csvSummary as CSVSummary
    );

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2000,
      system,
      messages: [{ role: "user", content: user }],
    });

    const textBlock = message.content.find((c) => c.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      return NextResponse.json(
        { error: "No text response from Claude" },
        { status: 502 }
      );
    }

    let jsonText = textBlock.text.trim();

    // Strip markdown code fences if present
    const fenceMatch = jsonText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (fenceMatch) {
      jsonText = fenceMatch[1];
    }

    // Parse and validate the JSON structure
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
    if (error instanceof Anthropic.AuthenticationError) {
      return NextResponse.json(
        { error: "Invalid API key. Please check your Anthropic API key." },
        { status: 401 }
      );
    }
    const message =
      error instanceof Error ? error.message : "Failed to generate plan";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
