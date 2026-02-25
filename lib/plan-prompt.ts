import {
  BenchmarkMetric,
  CalculatedKPI,
  CompanyData,
  CSVSummary,
  PlanMode,
  SelectedKPI,
} from "@/types";

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

  const avgJobValue = csvSummary.avgTicket ?? companyData.avgJobValue ?? null;
  if (avgJobValue !== null)
    metrics["Average Job Value"] = avgJobValue;
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

function calculateTarget(
  current: number,
  median: number,
  topPerformer: number | null,
  invertedScale: boolean,
  planMode: PlanMode,
  gapClosureRate: number
): number {
  const reference =
    planMode === "custom" && topPerformer !== null ? topPerformer : median;

  let gap: number;
  if (invertedScale) {
    gap = current - reference;
  } else {
    gap = reference - current;
  }

  if (gap <= 0) {
    if (invertedScale) {
      return Math.round(current * 0.93 * 100) / 100;
    } else {
      return Math.round(current * 1.07 * 100) / 100;
    }
  }

  const improvement = gap * gapClosureRate;

  if (invertedScale) {
    return Math.round((current - improvement) * 100) / 100;
  } else {
    return Math.round((current + improvement) * 100) / 100;
  }
}

function calculateBonuses(
  kpis: { current: number; target: number }[],
  teamSize: number,
  totalBonus: number
): { bonusPerMonth: number; bonusCap: number }[] {
  void teamSize;

  const gaps = kpis.map((kpi) => Math.abs(kpi.target - kpi.current));
  const totalGap = gaps.reduce((sum, g) => sum + g, 0);

  if (totalGap === 0) {
    const even = Math.min(400, Math.round(totalBonus / 3));
    return kpis.map(() => ({
      bonusPerMonth: even,
      bonusCap: Math.min(400, Math.round(even * 1.5)),
    }));
  }

  let rawBonuses = gaps.map((gap) => {
    const proportion = gap / totalGap;
    return Math.max(100, Math.round(totalBonus * proportion));
  });

  const rawTotal = rawBonuses.reduce((sum, b) => sum + b, 0);
  const scale = totalBonus / rawTotal;
  rawBonuses = rawBonuses.map((b) => Math.round(b * scale));

  const adjustedTotal = rawBonuses.reduce((sum, b) => sum + b, 0);
  const diff = totalBonus - adjustedTotal;
  const largestIndex = rawBonuses.indexOf(Math.max(...rawBonuses));
  rawBonuses[largestIndex] += diff;

  // Hard cap each KPI monthly bonus at $400 and redistribute any overflow.
  const CAP = 400;
  let overflow = 0;
  rawBonuses = rawBonuses.map((b) => {
    if (b > CAP) {
      overflow += b - CAP;
      return CAP;
    }
    return b;
  });

  while (overflow > 0) {
    const candidates = rawBonuses
      .map((bonus, index) => ({ bonus, index }))
      .filter(({ bonus }) => bonus < CAP)
      .sort((a, b) => b.bonus - a.bonus);

    if (candidates.length === 0) break;

    for (const { index } of candidates) {
      if (overflow <= 0) break;
      const room = CAP - rawBonuses[index];
      if (room <= 0) continue;
      const add = Math.min(room, overflow);
      rawBonuses[index] += add;
      overflow -= add;
    }
  }

  return rawBonuses.map((bonus) => ({
    bonusPerMonth: bonus,
    bonusCap: Math.min(400, Math.round(bonus * 1.5)),
  }));
}

function getCurrentValue(
  kpiName: string,
  companyData: Partial<CompanyData>,
  csvSummary: CSVSummary
): number | null {
  const teamSize = companyData.numberOfTechs ?? companyData.teamSize;
  switch (kpiName) {
    case "Average Job Value":
      return csvSummary.avgTicket ?? companyData.avgJobValue ?? null;
    case "Billable Efficiency":
      return csvSummary.billableEfficiency ?? null;
    case "Callback Rate":
      return csvSummary.callbackRate ?? null;
    case "Labor Rate":
      if (companyData.staffCosts && companyData.annualRevenue) {
        return Math.round((companyData.staffCosts / companyData.annualRevenue) * 100);
      }
      return null;
    case "Revenue Per Technician":
      if (companyData.annualRevenue && teamSize) {
        return Math.round(companyData.annualRevenue / 12 / teamSize);
      }
      return null;
    case "Average Google Rating":
      return csvSummary.avgGoogleRating ?? csvSummary.googleRating ?? null;
    case "Maintenance Agreement Conversion":
      return csvSummary.maintenanceConversion ?? null;
    case "First-Time Fix Rate":
      return csvSummary.firstTimeFixRate ?? null;
    default:
      return null;
  }
}

function getBenchmarkForKPI(
  kpiName: string,
  benchmarks: BenchmarkMetric[]
): BenchmarkMetric | null {
  const benchmarkNameMap: Record<string, string> = {
    "Revenue Per Technician": "Monthly Revenue per Team Member",
    "Average Google Rating": "Google Rating",
  };
  const mapped = benchmarkNameMap[kpiName] ?? kpiName;
  return benchmarks.find((b) => b.displayName === mapped) ?? null;
}

function formatKPIValue(kpiName: string, value: number): string {
  const isDollar = kpiName.includes("Value") || kpiName.includes("Revenue");
  const isPercent =
    kpiName.includes("Efficiency") ||
    kpiName.includes("Rate") ||
    kpiName.includes("Conversion");

  if (isDollar) return `$${value.toLocaleString()}`;
  if (isPercent) return `${value}%`;
  return String(value);
}

function createFallbackKPI(
  kpiName: string,
  current: number,
  benchmark: BenchmarkMetric | null
): CalculatedKPI {
  return {
    name: kpiName,
    current,
    currentFormatted: formatKPIValue(kpiName, current),
    target: current,
    targetFormatted: formatKPIValue(kpiName, current),
    bonusPerMonth: 0,
    bonusCap: 0,
    invertedScale: benchmark?.invertedScale ?? false,
  };
}

export function estimateGrossUplift(
  kpis: CalculatedKPI[],
  teamSize: number,
  companyData: Partial<CompanyData>
): number {
  const annualRevenue = companyData.annualRevenue ?? 0;
  let totalUplift = 0;

  for (const kpi of kpis) {
    const improvement = Math.abs(kpi.target - kpi.current);

    switch (kpi.name) {
      case "Average Job Value": {
        const estimatedJobsPerTechPerMonth = 60;
        totalUplift += improvement * estimatedJobsPerTechPerMonth * teamSize * 12;
        break;
      }
      case "Revenue Per Technician": {
        totalUplift += improvement * teamSize * 12;
        break;
      }
      case "Billable Efficiency": {
        const revenueImpactPerPoint = annualRevenue * 0.01;
        totalUplift += improvement * revenueImpactPerPoint;
        break;
      }
      case "Labor Rate": {
        const savingsPerPoint = annualRevenue * 0.01;
        totalUplift += improvement * savingsPerPoint;
        break;
      }
      case "Callback Rate": {
        const avgJobValue =
          kpis.find((k) => k.name === "Average Job Value")?.current ?? 350;
        const estimatedJobsPerYear = 60 * teamSize * 12;
        const callbacksAvoided = (improvement / 100) * estimatedJobsPerYear;
        totalUplift += callbacksAvoided * avgJobValue;
        break;
      }
      case "Maintenance Agreement Conversion": {
        const estimatedJobsPerYear = 60 * teamSize * 12;
        const newAgreements = (improvement / 100) * estimatedJobsPerYear;
        totalUplift += newAgreements * 500;
        break;
      }
      case "Average Google Rating": {
        const starImprovement = improvement / 0.1;
        totalUplift += starImprovement * annualRevenue * 0.02;
        break;
      }
      case "First-Time Fix Rate": {
        const avgJobValue =
          kpis.find((k) => k.name === "Average Job Value")?.current ?? 350;
        const estimatedJobsPerYear = 60 * teamSize * 12;
        const extraFixedJobs = (improvement / 100) * estimatedJobsPerYear;
        totalUplift += extraFixedJobs * (avgJobValue * 0.3);
        break;
      }
      default:
        break;
    }
  }

  return totalUplift;
}

export function buildKPISelectionPrompt(
  companyData: Partial<CompanyData>,
  csvSummary: CSVSummary,
  benchmarks: BenchmarkMetric[],
  planMode: PlanMode
): { system: string; user: string } {
  const industry = companyData.industry ?? "trades";
  const benchmarkContext = buildBenchmarkContext(benchmarks);
  const companyMetrics = buildCompanyMetrics(companyData, csvSummary);
  const taskBlock =
    planMode === "generic"
      ? `The company has 3 available metrics. Select all 3 as KPIs for the incentive plan and explain why each matters. Return them as a JSON object.`
      : `Select exactly 3 KPIs from the eligible list below. You must always return exactly 3 KPIs, no more, no fewer. If fewer than 3 metrics have company data available, select the closest matching metrics based on the company profile and industry benchmarks — you can infer reasonable current values from the available data (e.g. estimate Revenue Per Technician from annual revenue and team size). Return them as a JSON object.`;
  const eligibleKPIsBlock =
    planMode === "generic"
      ? `You have exactly 3 metrics available. Select all 3 as the plan KPIs:

- "Average Job Value" — the average dollar amount per completed job
- "Revenue Per Technician" — monthly revenue generated per tech
- "Labor Rate" — percentage of revenue spent on staff costs (lower is better)

Select all 3. These are the only metrics available from the form data.`
      : `Select from this list. Only select a KPI if the company has data for it in their connected data.

- "Average Job Value" — the average dollar amount per completed job
- "Billable Efficiency" — percentage of paid hours spent on billable work
- "Callback Rate" — percentage of jobs requiring a return visit (lower is better)
- "Revenue Per Technician" — monthly revenue generated per tech
- "Average Google Rating" — average star rating from customer reviews
- "Maintenance Agreement Conversion" — percentage of visits that result in a maintenance agreement sale
- "First-Time Fix Rate" — percentage of jobs completed on the first visit
- "Labor Rate" — percentage of revenue spent on staff costs (lower is better)`;

  const system = `You are an expert incentive plan consultant for trades and home services businesses. Your role is to select the 3 highest-impact KPIs for a technician bonus plan based on company data and industry benchmarks.

<task>
${taskBlock}
</task>

<eligible_kpis>
${eligibleKPIsBlock}
</eligible_kpis>

<selection_criteria>
Prioritize KPIs where the company has the largest gap versus the benchmark median (or versus top performers if available).

The 3 KPIs must build on each other — improving one should support or amplify the others. This creates a flywheel effect where hitting one KPI makes the others easier to achieve.

Good combinations that reinforce each other:
- "Average Job Value" + "Maintenance Agreement Conversion" + "Average Google Rating" — upselling done well leads to higher job values, service agreements create recurring revenue, and good reviews validate the customer experience
- "Billable Efficiency" + "First-Time Fix Rate" + "Callback Rate" — efficient use of time, getting it right the first time, and fewer return visits all reinforce each other
- "Average Job Value" + "Revenue Per Technician" + "Billable Efficiency" — higher ticket sizes and better time utilization both drive per-tech revenue

Weak combinations to avoid:
- "Average Job Value" + "Callback Rate" + "Average Google Rating" — no clear reinforcing relationship between all three
</selection_criteria>

<output_format>
Return ONLY a valid JSON object with this structure:

{
  "selectedKPIs": [
    {
      "name": "string — must exactly match one of the eligible KPI names",
      "reason": "string — 1 sentence explaining why this KPI was selected based on the gap in the data"
    }
  ]
}
</output_format>`;

  const genericUser = `Select 3 KPIs for this ${industry} company's incentive plan.

<company_data>
Company: ${companyData.name ?? "Unknown"}
Industry: ${industry}
Team size: ${companyData.teamSize ?? "Unknown"} technicians
</company_data>

<company_metrics>
${Object.entries(companyMetrics)
  .map(([key, val]) => `- ${key}: ${formatMetricValue(key, val)}`)
  .join("\n")}
</company_metrics>

<industry_benchmarks>
${JSON.stringify(benchmarkContext, null, 2)}
</industry_benchmarks>`;

  const customUser = `Select 3 KPIs for this ${industry} company's incentive plan.

<company_data>
Company: ${companyData.name ?? "Unknown"}
Industry: ${industry}
Team size: ${companyData.teamSize ?? "Unknown"} technicians
</company_data>

<company_metrics>
${Object.entries(companyMetrics)
  .map(([key, val]) => `- ${key}: ${formatMetricValue(key, val)}`)
  .join("\n")}
</company_metrics>

<industry_benchmarks>
${JSON.stringify(benchmarkContext, null, 2)}
</industry_benchmarks>

<top_performer_insights>
${csvSummary.topPerformerInsights ?? "Not available"}
</top_performer_insights>

<additional_context>
${csvSummary.additionalInsights ?? "Not available"}
</additional_context>`;

  return {
    system,
    user: planMode === "custom" ? customUser : genericUser,
  };
}

export function calculatePlanTargets(
  selectedKPIs: SelectedKPI[],
  companyData: Partial<CompanyData>,
  csvSummary: CSVSummary,
  benchmarks: BenchmarkMetric[],
  planMode: PlanMode
): CalculatedKPI[] {
  const teamSize = companyData.teamSize ?? 15;
  const annualRevenue = companyData.annualRevenue ?? 0;
  const minimumNetUplift = annualRevenue * 0.2;

  let gapClosureRate = 0.4;
  const maxGapClosureRate = 0.65;
  let totalBonus = 800;
  const minTotalBonus = 500;

  if (teamSize <= 3) totalBonus = 500;
  else if (teamSize >= 50) totalBonus = 1200;

  const genericEligibleKPINames = [
    "Average Job Value",
    "Revenue Per Technician",
    "Labor Rate",
  ];
  const customEligibleKPINames = [
    "Average Job Value",
    "Billable Efficiency",
    "Callback Rate",
    "Revenue Per Technician",
    "Average Google Rating",
    "Maintenance Agreement Conversion",
    "First-Time Fix Rate",
    "Labor Rate",
  ];
  const eligibleKPINames =
    planMode === "generic" ? genericEligibleKPINames : customEligibleKPINames;

  const availableKPINames = eligibleKPINames.filter((name) => {
    const current = getCurrentValue(name, companyData, csvSummary);
    const benchmark = getBenchmarkForKPI(name, benchmarks);
    return current !== null && benchmark !== null;
  });

  const byGapDesc = [...availableKPINames].sort((a, b) => {
    const aCurrent = getCurrentValue(a, companyData, csvSummary) ?? 0;
    const bCurrent = getCurrentValue(b, companyData, csvSummary) ?? 0;
    const aBenchmark = getBenchmarkForKPI(a, benchmarks);
    const bBenchmark = getBenchmarkForKPI(b, benchmarks);
    if (!aBenchmark || !bBenchmark) return 0;
    const aGap = Math.abs(aBenchmark.median - aCurrent);
    const bGap = Math.abs(bBenchmark.median - bCurrent);
    return bGap - aGap;
  });

  const selectedNames = selectedKPIs
    .map((kpi) => kpi.name)
    .filter((name, idx, arr) => arr.indexOf(name) === idx)
    .filter((name) =>
      planMode === "generic"
        ? eligibleKPINames.includes(name)
        : availableKPINames.includes(name)
    );

  if (planMode === "generic") {
    for (const candidate of genericEligibleKPINames) {
      if (selectedNames.length >= 3) break;
      if (!selectedNames.includes(candidate)) selectedNames.push(candidate);
    }
  } else {
    for (const candidate of byGapDesc) {
      if (selectedNames.length >= 3) break;
      if (!selectedNames.includes(candidate)) selectedNames.push(candidate);
    }

    for (const candidate of availableKPINames) {
      if (selectedNames.length >= 3) break;
      if (!selectedNames.includes(candidate)) selectedNames.push(candidate);
    }
  }

  const namesForPlan = selectedNames.slice(0, 3);
  let kpis: CalculatedKPI[] = [];

  for (let attempt = 0; attempt < 10; attempt++) {
    kpis = namesForPlan.map((name) => {
      const selected = selectedKPIs.find((kpi) => kpi.name === name) ?? {
        name,
        reason: "",
      };
      const current = getCurrentValue(selected.name, companyData, csvSummary);
      const benchmark = getBenchmarkForKPI(selected.name, benchmarks);
      const inferredCurrent = current ?? benchmark?.median ?? 0;

      if (benchmark === null) {
        return createFallbackKPI(selected.name, inferredCurrent, benchmark);
      }

      const invertedScale = benchmark.invertedScale ?? false;
      const target = calculateTarget(
        inferredCurrent,
        benchmark.median,
        null,
        invertedScale,
        planMode,
        gapClosureRate
      );

      return {
        name: selected.name,
        current: inferredCurrent,
        currentFormatted: formatKPIValue(selected.name, inferredCurrent),
        target,
        targetFormatted: formatKPIValue(selected.name, target),
        bonusPerMonth: 0,
        bonusCap: 0,
        invertedScale,
      };
    });

    const bonuses = calculateBonuses(kpis, teamSize, totalBonus);
    kpis.forEach((kpi, i) => {
      kpi.bonusPerMonth = bonuses[i].bonusPerMonth;
      kpi.bonusCap = bonuses[i].bonusCap;
    });

    const estimatedGrossUplift = estimateGrossUplift(kpis, teamSize, companyData);
    const annualBonusCost = totalBonus * teamSize * 12;
    const netUplift = estimatedGrossUplift - annualBonusCost;

    if (netUplift >= minimumNetUplift) break;

    const canIncreaseGap = gapClosureRate < maxGapClosureRate;
    const canReduceBonus = totalBonus > minTotalBonus;
    if (!canIncreaseGap && !canReduceBonus) break;

    if (canIncreaseGap) {
      gapClosureRate = Math.min(gapClosureRate + 0.05, maxGapClosureRate);
    }
    if (canReduceBonus) {
      totalBonus = Math.max(totalBonus - 50, minTotalBonus);
    }
  }

  return kpis;
}

export function buildCopyPrompt(
  companyData: Partial<CompanyData>,
  csvSummary: CSVSummary,
  benchmarks: BenchmarkMetric[],
  calculatedKPIs: CalculatedKPI[],
  planMode: PlanMode
): { system: string; user: string } {
  const industry = companyData.industry ?? "trades";
  const benchmarkContext = buildBenchmarkContext(benchmarks);
  const companyMetrics = buildCompanyMetrics(companyData, csvSummary);
  const totalBonus = calculatedKPIs.reduce((sum, k) => sum + k.bonusPerMonth, 0);
  const monthlyPayout = totalBonus * (companyData.teamSize ?? 1);

  const system = `You are an expert incentive plan consultant for trades and home services businesses. You have been given a fully calculated incentive plan with KPIs, targets, and bonus amounts already determined. Your job is to write compelling copy that explains the plan to a business owner.

<insight_copy_rules>
Write an insight for EVERY benchmark metric provided, not just the 3 selected KPIs.

Each insight should:
- State the specific gap (dollar amount or percentage) between the company and the median
- Be 1-2 sentences in plain language a business owner would understand
- Frame the gap in terms of business impact, not just the number

Example of good insight copy:
"Your average job value is $185 below the median for HVAC companies your size. Closing that gap across your team's daily jobs would add roughly $12K per month in revenue."
</insight_copy_rules>

<rationale_rules>
For each of the 3 KPIs, write a 1-2 sentence rationale explaining why this KPI was chosen and why the target makes sense for this company.
</rationale_rules>

<tooltip_copy_rules>
For custom plans only: write a 3-5 sentence tooltip for each KPI that:
- Explains why this KPI was chosen for this specific company
- Describes what is within the technician's control to improve it
- Shows how improvement compounds over time
- References top performer data when available to validate the target

Example of excellent tooltip copy:
"This is the single biggest lever. Every job they run today is generating $170 less than the median. With techs running multiple jobs a day, this compounds fast. It's also entirely within a tech's control on every visit — upselling maintenance agreements, recommending add-ons, presenting flat-rate options confidently. The revenue impact is immediate and visible."

Another good example:
"Your top 3 techs are already running at 18% labor rate. A 21% team-wide target is realistic — it's about bringing the middle of the pack closer to what your best people already do. Every percentage point saved on labor goes straight to your bottom line."
</tooltip_copy_rules>

<projected_uplift_rules>
Estimate projected revenue uplift based on the KPI targets:
- projectedUpliftLow: conservative 6-month annualized estimate
- projectedUpliftHigh: optimistic 12-month estimate
- Base these on the gap between current and target values, extrapolated across the team size
</projected_uplift_rules>

<output_format>
Return ONLY a valid JSON object:

{
  "kpiCopy": [
    {
      "name": "string — the KPI name",
      "rationale": "string — 1-2 sentence explanation",
      "tooltipCopy": "string — 3-5 sentence tooltip (custom plans only, omit for generic plans)"
    }
  ],
  "projectedUpliftLow": number,
  "projectedUpliftHigh": number,
  "insightCopy": {
    "Metric Display Name": "string — insight for each benchmark metric"
  }
}
</output_format>`;

  const user = `Write copy for this ${industry} incentive plan.

<plan_mode>${planMode.toUpperCase()}</plan_mode>

<company_data>
Company: ${companyData.name ?? "Unknown"}
Industry: ${industry}
Team size: ${companyData.teamSize ?? "Unknown"} technicians
Annual revenue: $${companyData.annualRevenue?.toLocaleString() ?? "Unknown"}
</company_data>

<calculated_plan>
${calculatedKPIs.map(kpi => `- ${kpi.name}: Current ${kpi.currentFormatted}, Target ${kpi.targetFormatted}, Bonus $${kpi.bonusPerMonth}/mo, Cap $${kpi.bonusCap}/mo`).join("\n")}

Total bonus per technician: $${totalBonus}/mo
Monthly payout across team: $${monthlyPayout}/mo
</calculated_plan>

${planMode === "custom" && csvSummary.topPerformerInsights ? `<top_performer_insights>\n${csvSummary.topPerformerInsights}\n</top_performer_insights>` : ""}

<all_benchmarks>
${JSON.stringify(benchmarkContext, null, 2)}
</all_benchmarks>

<company_metrics>
${Object.entries(companyMetrics)
  .map(([key, val]) => `- ${key}: ${formatMetricValue(key, val)}`)
  .join("\n")}
</company_metrics>`;

  return { system, user };
}
