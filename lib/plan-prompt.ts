/**
 * Plan generation prompt.
 *
 * Edit the SYSTEM PROMPT and RULES sections below to control
 * what OpenAI returns for the incentive plan.
 */

import { BenchmarkMetric, CompanyData, CSVSummary } from "@/types";

// ── HELPERS ───────────────────────────────────────────────────────

/** Slim benchmark summary for the prompt context. */
function buildBenchmarkContext(benchmarks: BenchmarkMetric[]) {
  return benchmarks.map((b) => ({
    metric: b.displayName,
    lower: b.lower,
    median: b.median,
    upper: b.upper,
    invertedScale: b.invertedScale ?? false,
  }));
}

/** Extract company metrics we know about into a readable list. */
function buildCompanyMetrics(
  companyData: Partial<CompanyData>,
  csvSummary: CSVSummary
): Record<string, number | string> {
  const metrics: Record<string, number | string> = {};

  if (csvSummary.avgTicket !== null)
    metrics["Average Job Value"] = csvSummary.avgTicket;
  if (csvSummary.billableEfficiency !== null)
    metrics["Billable Efficiency"] = `${csvSummary.billableEfficiency}%`;
  if (csvSummary.callbackRate !== null)
    metrics["Callback Rate"] = `${csvSummary.callbackRate}%`;
  if (companyData.annualRevenue)
    metrics["Annual Revenue"] = companyData.annualRevenue;
  if (companyData.staffCosts && companyData.annualRevenue)
    metrics["Labor Rate"] = `${Math.round((companyData.staffCosts / companyData.annualRevenue) * 100)}%`;
  if (companyData.annualRevenue && companyData.teamSize)
    metrics["Monthly Revenue per Team Member"] = Math.round(
      companyData.annualRevenue / 12 / companyData.teamSize
    );

  return metrics;
}

/** Format a metric value for display in the prompt. */
function formatMetricValue(key: string, val: number | string): string {
  if (typeof val === "number") {
    const isDollar =
      key.includes("Revenue") ||
      key.includes("Value") ||
      key.includes("Member");
    return isDollar ? `$${val.toLocaleString()}` : String(val);
  }
  return val;
}

// ── MAIN BUILDER ─────────────────────────────────────────────────

export function buildPlanPrompt(
  companyData: Partial<CompanyData>,
  csvSummary: CSVSummary,
  benchmarks: BenchmarkMetric[]
): { system: string; user: string } {
  const industry = companyData.industry ?? "trades";
  const benchmarkContext = buildBenchmarkContext(benchmarks);
  const companyMetrics = buildCompanyMetrics(companyData, csvSummary);

  const insightCopySchema = benchmarks
    .map((b) => `    "${b.displayName}": "string — insight for this metric"`)
    .join(",\n");

  const insightCopyKeys = benchmarks
    .map((b) => `"${b.displayName}"`)
    .join(", ");

  // ── SYSTEM PROMPT ─────────────────────────────────────────────
  const system = `You are an expert ${industry} business consultant who specializes in technician incentive plans. Your job is to analyze a company's performance data against industry benchmarks and recommend a bonus plan that drives measurable improvement.

You must return ONLY a valid JSON object — no markdown, no code fences, no preamble, no explanation. Just the raw JSON.

The JSON must match this exact structure:
{
  "kpis": [
    {
      "name": "string — the metric name matching one of the benchmark names",
      "current": "number — the company's current value for this metric",
      "target": "number — the recommended target",
      "bonusPerMonth": "number — monthly bonus per technician if this KPI is hit",
      "rationale": "string — 1-2 sentence explanation of why this KPI was chosen"
    }
  ],
  "bonusPerTech": "number — total monthly bonus per technician if all KPIs are hit (should be ~$800)",
  "monthlyPayout": "number — total monthly payout across all technicians",
  "projectedUpliftLow": "number — conservative annual revenue uplift estimate in dollars",
  "projectedUpliftHigh": "number — optimistic annual revenue uplift estimate in dollars",
  "insightCopy": {
${insightCopySchema}
  }
}

Rules:
1. Select the 3 highest-impact KPIs based on the largest gaps between the company's current metrics and the industry median.
2. Set targets that are realistic but stretching — between the company's current position and the median (not exceeding the median).
3. Bonus amounts across all 3 KPIs should total approximately $800/month per technician.
4. Weight bonus amounts toward the KPIs with the largest potential revenue impact.
5. Generate insightCopy for ALL benchmark metrics using the exact display names as keys: ${insightCopyKeys}. Each insight should be 1-2 sentences including the specific dollar or percentage gap vs the median.
6. For inverted metrics (where lower is better, like labor rate and callback rate), frame the gap and targets accordingly.
7. The projectedUpliftLow should be a conservative 6-month annualized estimate; projectedUpliftHigh should be an optimistic 12-month estimate.
8. monthlyPayout = bonusPerTech × number of technicians (team size).`;

  // ── USER PROMPT ───────────────────────────────────────────────
  const user = `Analyze this ${industry} company and generate an incentive plan.

Company: ${companyData.name ?? "Unknown"}
Industry: ${industry}
Team size: ${companyData.teamSize ?? "Unknown"} technicians
Annual staff costs: $${companyData.staffCosts?.toLocaleString() ?? "Unknown"}
Annual revenue: $${companyData.annualRevenue?.toLocaleString() ?? "Unknown"}

Extracted metrics from their job data (${csvSummary.totalJobs} jobs analyzed):
${Object.entries(companyMetrics)
  .map(([key, val]) => `- ${key}: ${formatMetricValue(key, val)}`)
  .join("\n")}

Industry benchmarks for ${industry} companies with ~${companyData.teamSize ?? "15-25"} employees:
${JSON.stringify(benchmarkContext, null, 2)}

Return the JSON plan now.`;

  return { system, user };
}
