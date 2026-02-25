import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { buildBenchmarkPrompt } from "@/lib/benchmark-prompt";

export async function POST(request: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { industry, teamSize, userValues } = body;

  if (!industry || typeof industry !== "string") {
    return NextResponse.json({ error: "Missing industry" }, { status: 400 });
  }
  if (!teamSize || typeof teamSize !== "number" || teamSize <= 0) {
    return NextResponse.json(
      { error: "Missing or invalid team size" },
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

    const industryLabel =
      industry === "Other" ? "general trades/contracting" : industry;

    const { system, user } = buildBenchmarkPrompt({
      industryLabel,
      teamSize: teamSize as number,
      userValues: (userValues ?? {}) as Record<string, number>,
    });

    const response = await openai.responses.create({
      model: "gpt-4o",
      tools: [{ type: "web_search_preview" }],
      input: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    });

    // Extract text from the response
    const textOutput = response.output.find((o) => o.type === "message");
    if (!textOutput || textOutput.type !== "message") {
      return NextResponse.json(
        { error: "No text response from OpenAI" },
        { status: 502 }
      );
    }

    const textContent = textOutput.content.find((c) => c.type === "output_text");
    if (!textContent || textContent.type !== "output_text") {
      return NextResponse.json(
        { error: "No text content in response" },
        { status: 502 }
      );
    }

    let jsonText = textContent.text.trim();

    // Strip markdown code fences if present
    const fenceMatch = jsonText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (fenceMatch) {
      jsonText = fenceMatch[1];
    }

    let parsed: { benchmarks: unknown[] };
    try {
      parsed = JSON.parse(jsonText);
    } catch {
      return NextResponse.json(
        { error: "AI returned invalid JSON" },
        { status: 502 }
      );
    }

    // Validate structure
    if (!Array.isArray(parsed.benchmarks) || parsed.benchmarks.length < 3) {
      return NextResponse.json(
        { error: "Invalid benchmark data structure" },
        { status: 502 }
      );
    }

    // Validate first 3 metric names
    const requiredNames = ["annualRevenue", "laborRate", "avgJobValue"];
    const firstThreeNames = parsed.benchmarks
      .slice(0, 3)
      .map((b) =>
        typeof b === "object" && b !== null && "name" in b
          ? (b as { name?: unknown }).name
          : undefined
      );
    const hasRequired = requiredNames.every((name) =>
      firstThreeNames.includes(name)
    );

    if (!hasRequired) {
      return NextResponse.json(
        { error: "Missing required benchmark metrics" },
        { status: 502 }
      );
    }

    return NextResponse.json({ benchmarks: parsed.benchmarks });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to generate benchmarks";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
