import { RichDescription, TextSegment } from "@/types";

type InsightTone = "positive" | "negative";
type InsightPart =
  | string
  | {
      text: string;
      tone: InsightTone;
    };

interface InsightPromptTemplate {
  paragraphs: InsightPart[][];
}

interface InsightPromptVariants {
  below: InsightPromptTemplate;
  above: InsightPromptTemplate;
  atMedian: InsightPromptTemplate;
}

export type InsightMetricName =
  | "annualRevenue"
  | "monthlyRevenuePerMember"
  | "laborRate"
  | "avgJobValue"
  | "billableEfficiency"
  | "callbackRate"
  | "googleRating"
  | "monthlyOvertimeSpend";

export type InsightDataState = "formOnly" | "dataUploaded";
export type MetricPolarity = "higherIsBetter" | "lowerIsBetter";

export interface InsightResolverInput {
  metric: InsightMetricName;
  dataState: InsightDataState;
  polarity: MetricPolarity;
  industry: string;
  band: string;
  median: string;
  lower: string;
  upper: string;
  currentValue?: string;
  delta?: string;
  monthly_delta?: string;
  techCount?: string;
  callsPerDay?: string;
  dailyRevenueLoss?: string;
  annualLaborCostImpact?: string;
  comparison: "below" | "above" | "atMedian";
}

type InsightPromptVariables = Omit<
  InsightResolverInput,
  "metric" | "dataState" | "polarity" | "comparison"
>;

function colorFromTone(tone: InsightTone): TextSegment["color"] {
  return tone === "positive" ? "green" : "red";
}

function interpolate(text: string, vars: InsightPromptVariables): string {
  return text
    .replaceAll("{{industry}}", vars.industry)
    .replaceAll("{{band}}", vars.band)
    .replaceAll("{{median}}", vars.median)
    .replaceAll("{{lower}}", vars.lower)
    .replaceAll("{{upper}}", vars.upper)
    .replaceAll("{{currentValue}}", vars.currentValue ?? "")
    .replaceAll("{{delta}}", vars.delta ?? "")
    .replaceAll("{{monthly_delta}}", vars.monthly_delta ?? "")
    .replaceAll("{{techCount}}", vars.techCount ?? "")
    .replaceAll("{{callsPerDay}}", vars.callsPerDay ?? "")
    .replaceAll("{{dailyRevenueLoss}}", vars.dailyRevenueLoss ?? "")
    .replaceAll("{{annualLaborCostImpact}}", vars.annualLaborCostImpact ?? "");
}

function renderInsightPrompt(
  template: InsightPromptTemplate,
  vars: InsightPromptVariables
): RichDescription {
  return template.paragraphs.map((paragraph) =>
    paragraph.map((part) => {
      if (typeof part === "string") {
        return { text: interpolate(part, vars) };
      }
      return {
        text: interpolate(part.text, vars),
        color: colorFromTone(part.tone),
      };
    })
  );
}

function t(paragraphs: InsightPart[][]): InsightPromptTemplate {
  return { paragraphs };
}

/**
 * Prompt set for users with form-only data (no connected CSV upload).
 */
export const FORM_ONLY_INSIGHT_PROMPTS: Record<
  InsightMetricName,
  InsightPromptVariants
> = {
  annualRevenue: {
    below: t([
      [
        "You're generating ",
        { text: "{{delta}} less", tone: "negative" },
        " than the median for {{industry}} companies your size.",
      ],
      [
        "Close that gap and you're looking at an ",
        { text: "extra {{monthly_delta}} per month.", tone: "positive" },
      ],
    ]),
    above: t([
      [
        "You're generating ",
        { text: "{{delta}} more", tone: "positive" },
        " than the median for {{industry}} companies your size.",
      ],
      [{ text: "You're outperforming most companies in your bracket.", tone: "positive" }],
    ]),
    atMedian: t([
      ["You're right in line with the median for {{industry}} companies your size."],
      ["Most companies in this group fall between {{lower}} and {{upper}}."],
    ]),
  },
  monthlyRevenuePerMember: {
    below: t([
      [
        "Your revenue per team member is ",
        { text: "{{delta}} below the median", tone: "negative" },
        " for {{industry}} companies with {{band}} team members.",
      ],
      ["Most teams in this group fall between {{lower}} and {{upper}}."],
    ]),
    above: t([
      [
        "Your revenue per team member is ",
        { text: "{{delta}} above the median", tone: "positive" },
        " for {{industry}} companies with {{band}} team members.",
      ],
      ["You're getting strong output from your team relative to peers."],
    ]),
    atMedian: t([
      [
        "Your revenue per team member is in line with the median for {{industry}} companies with {{band}} team members.",
      ],
      ["Most teams in this group fall between {{lower}} and {{upper}}."],
    ]),
  },
  laborRate: {
    below: t([
      [
        "You're spending ",
        { text: "less on labor than most", tone: "positive" },
        " {{industry}} companies your size.",
      ],
      [
        "The median labor rate is {{median}}. You're at ",
        { text: "{{currentValue}}.", tone: "positive" },
      ],
    ]),
    above: t([
      [
        "You're spending ",
        { text: "more on labor than most", tone: "negative" },
        " {{industry}} companies your size.",
      ],
      [
        "The median labor rate is {{median}}. That gap is ",
        { text: "eating into your margins.", tone: "negative" },
      ],
    ]),
    atMedian: t([
      ["Your labor rate is in line with the median for {{industry}} companies your size."],
      ["Typical range runs from {{lower}} to {{upper}}."],
    ]),
  },
  avgJobValue: {
    below: t([
      [
        "Your average job value is ",
        { text: "{{delta}} below the median", tone: "negative" },
        " for {{industry}} companies with {{band}} team members.",
      ],
      ["The typical range is {{lower}} to {{upper}}."],
    ]),
    above: t([
      [
        "Your average job value is ",
        { text: "{{delta}} above the median", tone: "positive" },
        " for {{industry}} companies with {{band}} team members.",
      ],
      [
        "You're ",
        { text: "commanding higher value per job than most peers.", tone: "positive" },
      ],
    ]),
    atMedian: t([
      [
        "Your average job value is in line with the median for {{industry}} companies with {{band}} team members.",
      ],
      ["Typical range runs from {{lower}} to {{upper}}."],
    ]),
  },
  billableEfficiency: {
    below: t([
      [
        "Your billable efficiency is ",
        { text: "{{delta}} below the median", tone: "negative" },
        " for {{industry}} companies with {{band}} team members.",
      ],
      ["Most teams in this group fall between {{lower}} and {{upper}}."],
    ]),
    above: t([
      [
        "Your billable efficiency is ",
        { text: "{{delta}} above the median", tone: "positive" },
        " for {{industry}} companies with {{band}} team members.",
      ],
      [{ text: "Your team is converting more hours into billable work than most.", tone: "positive" }],
    ]),
    atMedian: t([
      [
        "Your billable efficiency is in line with the median for {{industry}} companies with {{band}} team members.",
      ],
      ["Most teams in this group fall between {{lower}} and {{upper}}."],
    ]),
  },
  callbackRate: {
    below: t([
      [
        "Your callback rate is ",
        { text: "below the median of {{median}}", tone: "positive" },
        " for {{industry}} companies with {{band}} team members.",
      ],
      [{ text: "Fewer callbacks means less rework and happier customers.", tone: "positive" }],
    ]),
    above: t([
      [
        "Your callback rate is ",
        { text: "above the median of {{median}}", tone: "negative" },
        " for {{industry}} companies with {{band}} team members.",
      ],
      [
        "Typical range runs from {{lower}} to {{upper}}. ",
        { text: "Each callback costs you a truck roll and a time slot.", tone: "negative" },
      ],
    ]),
    atMedian: t([
      [
        "Your callback rate is in line with the median for {{industry}} companies with {{band}} team members.",
      ],
      ["Typical range runs from {{lower}} to {{upper}}."],
    ]),
  },
  googleRating: {
    below: t([
      [
        "Your Google rating is ",
        { text: "{{delta}} below the median", tone: "negative" },
        " for {{industry}} companies with {{band}} team members.",
      ],
      ["Most companies in this segment sit between {{lower}} and {{upper}}."],
    ]),
    above: t([
      [
        "Your Google rating is ",
        { text: "{{delta}} above the median", tone: "positive" },
        " for {{industry}} companies with {{band}} team members.",
      ],
      [{ text: "Strong reviews help you win more calls from search.", tone: "positive" }],
    ]),
    atMedian: t([
      [
        "Your Google rating is in line with the median for {{industry}} companies with {{band}} team members.",
      ],
      ["Most companies in this segment sit between {{lower}} and {{upper}}."],
    ]),
  },
  monthlyOvertimeSpend: {
    below: t([
      [
        "Your monthly overtime spend is ",
        { text: "below the median of {{median}}", tone: "positive" },
        " for {{industry}} companies with {{band}} team members.",
      ],
      ["You're keeping overtime ", { text: "well controlled.", tone: "positive" }],
    ]),
    above: t([
      [
        "Your monthly overtime spend is ",
        { text: "above the median of {{median}}", tone: "negative" },
        " for {{industry}} companies with {{band}} team members.",
      ],
      [
        "Typical range is {{lower}} to {{upper}}. ",
        { text: "That excess overtime is straight off your bottom line.", tone: "negative" },
      ],
    ]),
    atMedian: t([
      [
        "Your monthly overtime spend is in line with the median for {{industry}} companies with {{band}} team members.",
      ],
      ["Typical range runs from {{lower}} to {{upper}}."],
    ]),
  },
};

/**
 * Prompt set for users with uploaded/connected data.
 * Mostly mirrors form-only prompts with targeted upgrades.
 */
export const DATA_UPLOADED_INSIGHT_PROMPTS: Record<
  InsightMetricName,
  InsightPromptVariants
> = {
  ...FORM_ONLY_INSIGHT_PROMPTS,
  avgJobValue: {
    ...FORM_ONLY_INSIGHT_PROMPTS.avgJobValue,
    below: t([
      ["Your average job is worth ", { text: "{{delta}} less", tone: "negative" }, " than the median."],
      [
        "With {{techCount}} techs running {{callsPerDay}} calls a day, that's ",
        { text: "{{dailyRevenueLoss}} in unrealised revenue every single day.", tone: "negative" },
      ],
    ]),
  },
  laborRate: {
    ...FORM_ONLY_INSIGHT_PROMPTS.laborRate,
    above: t([
      [
        "You're spending ",
        { text: "{{currentValue}} of every dollar on staff costs.", tone: "negative" },
        " Healthy {{industry}} companies spend closer to ",
        { text: "{{median}}.", tone: "positive" },
      ],
      [
        "That gap on your current revenue is ",
        { text: "costing you around {{annualLaborCostImpact}} in profit per year.", tone: "negative" },
      ],
    ]),
  },
};

export const METRIC_POLARITY: Record<InsightMetricName, MetricPolarity> = {
  annualRevenue: "higherIsBetter",
  monthlyRevenuePerMember: "higherIsBetter",
  laborRate: "lowerIsBetter",
  avgJobValue: "higherIsBetter",
  billableEfficiency: "higherIsBetter",
  callbackRate: "lowerIsBetter",
  googleRating: "higherIsBetter",
  monthlyOvertimeSpend: "lowerIsBetter",
};

export function getComparisonBucket(
  currentValue: number | null | undefined,
  medianValue: number,
  toleranceRatio = 0.01
): "below" | "above" | "atMedian" {
  if (currentValue == null || !Number.isFinite(currentValue) || medianValue === 0) {
    return "atMedian";
  }
  const tolerance = Math.abs(medianValue) * toleranceRatio;
  if (Math.abs(currentValue - medianValue) <= tolerance) {
    return "atMedian";
  }
  return currentValue < medianValue ? "below" : "above";
}

function hasRequiredDerivedVarsForUploadedUpgrade(
  metric: InsightMetricName,
  comparison: "below" | "above" | "atMedian",
  vars: InsightPromptVariables
): boolean {
  if (metric === "avgJobValue" && comparison === "below") {
    return Boolean(vars.techCount && vars.callsPerDay && vars.dailyRevenueLoss);
  }
  if (metric === "laborRate" && comparison === "above") {
    return Boolean(vars.annualLaborCostImpact);
  }
  return true;
}

export function buildBenchmarkInsightDescription(
  input: InsightResolverInput
): RichDescription {
  const {
    metric,
    dataState,
    comparison,
    industry,
    band,
    median,
    lower,
    upper,
    currentValue,
    delta,
    monthly_delta,
    techCount,
    callsPerDay,
    dailyRevenueLoss,
    annualLaborCostImpact,
  } = input;

  const vars: InsightPromptVariables = {
    industry,
    band,
    median,
    lower,
    upper,
    currentValue,
    delta,
    monthly_delta,
    techCount,
    callsPerDay,
    dailyRevenueLoss,
    annualLaborCostImpact,
  };

  const formTemplate = FORM_ONLY_INSIGHT_PROMPTS[metric][comparison];
  if (dataState === "formOnly") {
    return renderInsightPrompt(formTemplate, vars);
  }

  if (!hasRequiredDerivedVarsForUploadedUpgrade(metric, comparison, vars)) {
    return renderInsightPrompt(formTemplate, vars);
  }

  const uploadedTemplate = DATA_UPLOADED_INSIGHT_PROMPTS[metric][comparison];
  return renderInsightPrompt(uploadedTemplate, vars);
}

