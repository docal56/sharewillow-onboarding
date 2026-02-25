/**
 * Plan generation prompt.
 *
 * Edit the SYSTEM PROMPT and RULES sections below to control
 * what OpenAI returns for the incentive plan.
 */

import { BenchmarkMetric, CompanyData, CSVSummary } from "@/types";

export type PlanMode = "generic" | "custom";

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
  benchmarks: BenchmarkMetric[],
  planMode: PlanMode
): { system: string; user: string } {
  const industry = companyData.industry ?? "trades";
  const benchmarkContext = buildBenchmarkContext(benchmarks);
  const companyMetrics = buildCompanyMetrics(companyData, csvSummary);
  const extendedCsvSummary = csvSummary as CSVSummary & {
    topPerformerInsights?: string;
    additionalInsights?: string;
  };

  // ── SYSTEM PROMPT ─────────────────────────────────────────────
  const system = `You are an expert incentive plan consultant for trades and home services businesses. Your job is to analyze a company's performance data against industry benchmarks and recommend a technician bonus plan that drives measurable improvement.

## YOUR TASK

Analyze the provided company data and benchmarks, then generate a 3-KPI incentive plan as a JSON object.

## KPI SELECTION RULES

You may ONLY select KPIs from the following eligible metrics. These are metrics that a technician can directly influence through their daily work:

ELIGIBLE KPIs:
- "Average Job Value" — the average dollar amount per completed job
- "Billable Efficiency" — percentage of paid hours spent on billable work
- "Callback Rate" — percentage of jobs requiring a return visit (lower is better)
- "Revenue Per Technician" — monthly revenue generated per tech
- "Average Google Rating" — average star rating from customer reviews
- "Maintenance Agreement Conversion" — percentage of visits that result in a maintenance agreement sale
- "First-Time Fix Rate" — percentage of jobs completed on the first visit

DO NOT select broad outcome metrics like "Increase Revenue", "Reduce Costs", or "Improve Profitability". These are byproducts of hitting the specific metrics above.

## KPI RELATIONSHIP RULES

The 3 KPIs you select MUST build on each other. Improving one should support or amplify the others.

Good combinations:
- "Average Job Value" + "Maintenance Agreement Conversion" + "Average Google Rating" — upselling done well leads to higher job values, service agreements create recurring revenue, and good reviews validate the customer experience
- "Billable Efficiency" + "First-Time Fix Rate" + "Callback Rate" — efficient use of time, getting it right the first time, and fewer return visits all reinforce each other
- "Average Job Value" + "Revenue Per Technician" + "Billable Efficiency" — higher ticket sizes and better time utilization both drive per-tech revenue

Bad combinations:
- "Average Job Value" + "Callback Rate" + "Average Google Rating" — these don't have a clear reinforcing relationship

## TARGET SETTING RULES

FOR GENERIC PLANS (no connected data):
- If the company metric is BELOW the benchmark median: set the target at roughly 60-75% of the gap between their current value and the median. Never exceed the median.
- If the company metric is AT or ABOVE the median: set the target at 5-10% improvement beyond their current value.
- Targets must be achievable within 3-6 months.

FOR CUSTOM PLANS (connected data with insights):
- Use the top performer data to validate that the target is realistic. If the company's best technicians are already hitting a number, it's a credible team-wide target.
- Factor in team variance — if there's a wide spread between top and bottom performers, the target should close that gap, not exceed the top.
- If the company metric is AT or ABOVE the median: push toward the upper benchmark or use top performer data to set a stretch target.
- Targets must be achievable within 3-6 months.

For INVERTED metrics (where lower is better, like Callback Rate and Labor Rate):
- "Improvement" means decreasing the number.
- The gap calculation is reversed: a company at 8% callback rate vs a 3% median has a 5 percentage point gap.

## BONUS FORMULA

Calculate each KPI's bonus amount using this approach:

1. Estimate the annual revenue impact if the team hits each KPI target.
   - For "Average Job Value": (target - current) × estimated monthly jobs per tech × 12
   - For "Billable Efficiency": estimate additional billable hours × average hourly rate × 12
   - For "Callback Rate": estimated callbacks avoided × average job cost × 12
   - For other KPIs: use a reasonable estimation method and explain it in the rationale.

2. Set the bonus for each KPI proportional to its share of the total estimated revenue impact.

3. The total bonus across all 3 KPIs should be approximately $800/month per technician (adjust proportionally for very small or very large teams — minimum $500, maximum $1,200).

4. Each KPI bonus must include a CAP — the maximum payout per technician per month for that KPI, regardless of how much they exceed the target. Set the cap at 150% of the base bonus amount.

## INSIGHT COPY RULES

Generate an "insightCopy" entry for EVERY benchmark metric provided (not just the 3 selected KPIs). Each insight must:
- State the specific gap (dollar amount or percentage) between the company and the median
- Be 1-2 sentences
- Use plain language a business owner would understand
- Frame the gap in terms of business impact, not just the number

## TOOLTIP COPY RULES (Custom Plans Only)

For each of the 3 selected KPIs, generate a "tooltipCopy" explanation that:
- Explains WHY this KPI was chosen for this specific company
- Describes what's within the technician's control to improve it
- Shows how improvement compounds (e.g. "every job they run is worth $X more, across Y jobs per day, that's $Z per month")
- References their top performer data if available (e.g. "your best tech is already averaging $X, so this target is proven achievable")
- Is 3-5 sentences long
- Reads like advice from a knowledgeable consultant, not a generic report

Here is an example of good tooltip copy:

"This is the single biggest lever. Every job they run today is generating $170 less than the median. With techs running multiple jobs a day, this compounds fast. It's also entirely within a tech's control on every visit — upselling maintenance agreements, recommending add-ons, presenting flat-rate options confidently. The revenue impact is immediate and visible."

## OUTPUT FORMAT

Return ONLY a valid JSON object. No markdown, no code fences, no preamble.

First, include a "reasoning" field where you briefly explain your KPI selection logic and bonus calculations. This helps ensure accuracy. Then provide the plan data.

{
  "reasoning": "string — 3-5 sentences explaining why you chose these 3 KPIs, how they reinforce each other, and how you calculated the bonus split",
  "kpis": [
    {
      "name": "string — must be one of the eligible KPI names listed above",
      "current": "number — the company's current value",
      "target": "number — your recommended target",
      "bonusPerMonth": "number — monthly bonus per technician if this KPI is hit",
      "bonusCap": "number — maximum monthly payout per tech for this KPI (150% of bonusPerMonth)",
      "rationale": "string — 1-2 sentence explanation of why this KPI was chosen and how the target was set",
      "tooltipCopy": "string — 3-5 sentence explanation for the UI tooltip (custom plans only, omit for generic plans)"
    }
  ],
  "bonusPerTech": "number — total monthly bonus per technician if all KPIs are hit",
  "monthlyPayout": "number — bonusPerTech × number of technicians",
  "projectedUpliftLow": "number — conservative 6-month annualized revenue uplift in dollars",
  "projectedUpliftHigh": "number — optimistic 12-month revenue uplift in dollars",
  "insightCopy": {
    "[Metric Display Name]": "string — insight for each benchmark metric"
  }
}`;

  // ── USER PROMPT ───────────────────────────────────────────────
  const user =
    planMode === "generic"
      ? `Analyze this ${industry} company and generate a GENERIC incentive plan.

Plan mode: GENERIC (form data only — no connected data available)

Company: ${companyData.name ?? "Unknown"}
Industry: ${industry}
Team size: ${companyData.teamSize ?? "Unknown"} technicians
Annual staff costs: $${companyData.staffCosts?.toLocaleString() ?? "Unknown"}
Annual revenue: $${companyData.annualRevenue?.toLocaleString() ?? "Unknown"}

Company metrics from form input:
${Object.entries(companyMetrics)
  .map(([key, val]) => `- ${key}: ${formatMetricValue(key, val)}`)
  .join("\n")}

Industry benchmarks for ${industry} companies with ~${companyData.teamSize ?? "15-25"} employees:
${JSON.stringify(benchmarkContext, null, 2)}

Return the JSON plan now.`
      : `Analyze this ${industry} company and generate a CUSTOM incentive plan.

Plan mode: CUSTOM (connected data available — use insights and top performer data to set smarter targets)

Company: ${companyData.name ?? "Unknown"}
Industry: ${industry}
Team size: ${companyData.teamSize ?? "Unknown"} technicians
Annual staff costs: $${companyData.staffCosts?.toLocaleString() ?? "Unknown"}
Annual revenue: $${companyData.annualRevenue?.toLocaleString() ?? "Unknown"}

Company metrics from connected data (${csvSummary.totalJobs} jobs analyzed):
${Object.entries(companyMetrics)
  .map(([key, val]) => `- ${key}: ${formatMetricValue(key, val)}`)
  .join("\n")}

Top performer insights:
${extendedCsvSummary.topPerformerInsights ?? "Not available"}

Additional context:
${extendedCsvSummary.additionalInsights ?? "Not available"}

Industry benchmarks for ${industry} companies with ~${companyData.teamSize ?? "15-25"} employees:
${JSON.stringify(benchmarkContext, null, 2)}

Return the JSON plan now.`;

  return { system, user };
}
