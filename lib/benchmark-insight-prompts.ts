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

interface InsightPromptVariables {
  industry: string;
  band: string;
  median: string;
  lower: string;
  upper: string;
  delta?: string;
  monthly_delta?: string;
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

function colorFromTone(tone: InsightTone): TextSegment["color"] {
  return tone === "positive" ? "green" : "red";
}

function interpolate(text: string, vars: InsightPromptVariables): string {
  return text
    .replaceAll("{{industry}}", vars.industry)
    .replaceAll("{{band}}", vars.band)
    .replaceAll("{{median}}", vars.median)
    .replaceAll("{{lower}}", vars.lower)
    .replaceAll("{{upper}}", vars.upper);
}

/**
 * Edit these prompt templates to control benchmark insight copy.
 *
 * Use {{industry}}, {{band}}, {{median}}, {{lower}}, {{upper}} placeholders.
 * For highlighted text, use { text: "...", tone: "positive" | "negative" }.
 * - positive => medium weight green
 * - negative => medium weight red
 */
export const BENCHMARK_INSIGHT_PROMPTS: Record<
  InsightMetricName,
  InsightPromptTemplate
> = {
  annualRevenue: {
    paragraphs: [
      [
        "You're generating ",
        { text: "{{delta}} less", tone: "negative" },
        " than the median for {{industry}} companies your size.",
      ],
      [
        "Close that gap and you're looking at an ",
        { text: "extra {{monthly_delta}} per month.", tone: "positive" },
      ],
    ],
  },
  monthlyRevenuePerMember: {
    paragraphs: [
      [
        "Median monthly revenue per team member in {{industry}} ({{band}}) is ",
        { text: "{{median}}.", tone: "positive" },
      ],
      ["Most teams in this group fall between {{lower}} and {{upper}}."],
    ],
  },
  laborRate: {
    paragraphs: [
      [
        "For {{industry}} companies with {{band}} team members, the median labor rate is ",
        { text: "{{median}}.", tone: "negative" },
      ],
      ["Typical range runs from {{lower}} to {{upper}}."],
    ],
  },
  avgJobValue: {
    paragraphs: [
      [
        "For {{industry}} companies with {{band}} team members, the median average job value is ",
        { text: "{{median}}.", tone: "positive" },
      ],
      ["Typical range runs from {{lower}} to {{upper}}."],
    ],
  },
  billableEfficiency: {
    paragraphs: [
      [
        "Median billable efficiency for {{industry}} companies with {{band}} team members is ",
        { text: "{{median}}.", tone: "positive" },
      ],
      ["Most teams in this group fall between {{lower}} and {{upper}}."],
    ],
  },
  callbackRate: {
    paragraphs: [
      [
        "Median callback rate in {{industry}} for {{band}} team members is ",
        { text: "{{median}}.", tone: "negative" },
      ],
      ["Typical range runs from {{lower}} to {{upper}}."],
    ],
  },
  googleRating: {
    paragraphs: [
      [
        "For {{industry}} companies with {{band}} team members, median Google rating is ",
        { text: "{{median}}.", tone: "positive" },
      ],
      ["Most teams in this segment sit between {{lower}} and {{upper}}."],
    ],
  },
  monthlyOvertimeSpend: {
    paragraphs: [
      [
        "Median monthly overtime spend for {{industry}} companies with {{band}} team members is ",
        { text: "{{median}}.", tone: "negative" },
      ],
      ["Typical range runs from {{lower}} to {{upper}}."],
    ],
  },
};

export function renderInsightPrompt(
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
