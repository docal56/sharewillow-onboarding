import { CompanyData, CSVSummary } from "@/types";
import { HVAC_BENCHMARKS } from "./benchmarks";

export function buildPlanPrompt(
  companyData: Partial<CompanyData>,
  csvSummary: CSVSummary
): { system: string; user: string } {
  const benchmarkContext = HVAC_BENCHMARKS.map((b) => ({
    metric: b.displayName,
    lower: b.lower,
    median: b.median,
    upper: b.upper,
    invertedScale: b.invertedScale ?? false,
  }));

  const system = `You are an expert HVAC business consultant who specializes in technician incentive plans. Your job is to analyze a company's performance data against industry benchmarks and recommend a bonus plan that drives measurable improvement.

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
    "Annual Revenue": "string — insight for this metric",
    "Labor Rate": "string — insight for this metric",
    "Average Job Value": "string — insight for this metric",
    "Monthly Revenue per Team Member": "string — insight for this metric",
    "Billable Efficiency": "string — insight for this metric",
    "Callback Rate": "string — insight for this metric",
    "Google Rating": "string — insight for this metric"
  }
}

Rules for generating the plan:
1. Select the 3 highest-impact KPIs based on the largest gaps between the company's current metrics and the industry median.
2. Set targets that are realistic but stretching — between the company's current position and the median (not exceeding the median).
3. Bonus amounts across all 3 KPIs should total approximately $800/month per technician.
4. Weight bonus amounts toward the KPIs with the largest potential revenue impact.
5. Generate insightCopy for ALL 7 benchmark metrics using the exact display names as keys: "Annual Revenue", "Labor Rate", "Average Job Value", "Monthly Revenue per Team Member", "Billable Efficiency", "Callback Rate", "Google Rating". Each insight should be 1-2 sentences including the specific dollar or percentage gap vs the median.
6. For inverted metrics (where lower is better, like labor rate and callback rate), frame the gap and targets accordingly.
7. The projectedUpliftLow should be a conservative 6-month annualized estimate; projectedUpliftHigh should be an optimistic 12-month estimate.
8. monthlyPayout = bonusPerTech × number of technicians (team size).`;

  const companyMetrics: Record<string, number | string> = {};

  if (csvSummary.avgTicket !== null) {
    companyMetrics["Average Job Value"] = csvSummary.avgTicket;
  }
  if (csvSummary.billableEfficiency !== null) {
    companyMetrics["Billable Efficiency"] = `${csvSummary.billableEfficiency}%`;
  }
  if (csvSummary.callbackRate !== null) {
    companyMetrics["Callback Rate"] = `${csvSummary.callbackRate}%`;
  }
  if (companyData.annualRevenue) {
    companyMetrics["Annual Revenue"] = companyData.annualRevenue;
  }
  if (companyData.staffCosts && companyData.annualRevenue) {
    companyMetrics["Labor Rate"] = `${Math.round((companyData.staffCosts / companyData.annualRevenue) * 100)}%`;
  }
  if (companyData.annualRevenue && companyData.teamSize) {
    companyMetrics["Monthly Revenue per Team Member"] = Math.round(
      companyData.annualRevenue / 12 / companyData.teamSize
    );
  }

  const user = `Analyze this HVAC company and generate an incentive plan.

Company: ${companyData.name ?? "Unknown"}
Industry: ${companyData.industry ?? "HVAC"}
Team size: ${companyData.teamSize ?? "Unknown"} technicians
Annual staff costs: $${companyData.staffCosts?.toLocaleString() ?? "Unknown"}
Annual revenue: $${companyData.annualRevenue?.toLocaleString() ?? "Unknown"}

Extracted metrics from their job data (${csvSummary.totalJobs} jobs analyzed):
${Object.entries(companyMetrics)
  .map(([key, val]) => `- ${key}: ${typeof val === "number" ? (key.includes("Revenue") || key.includes("Value") || key.includes("Member") ? `$${val.toLocaleString()}` : val) : val}`)
  .join("\n")}

Industry benchmarks for HVAC companies with 15-25 employees:
${JSON.stringify(benchmarkContext, null, 2)}

Return the JSON plan now.`;

  return { system, user };
}
