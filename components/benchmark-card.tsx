"use client";

import { BenchmarkMetric, RichDescription, TextSegment } from "@/types";
import {
  buildBenchmarkInsightDescription,
  getComparisonBucket,
  InsightDataState,
  InsightMetricName,
  METRIC_POLARITY,
} from "@/lib/benchmark-insight-prompts";

interface BenchmarkCardProps {
  metric: BenchmarkMetric;
  currentValue?: number | null;
  industry: string;
  teamSizeBand: string;
  insightState: InsightDataState;
  techCount?: number;
  annualRevenue?: number;
}

const HIGHLIGHT_COLORS = {
  red: "font-medium text-[#de2424]",
  green: "font-medium text-[#317e0d]",
} as const;

function RichText({ paragraphs }: { paragraphs: RichDescription }) {
  return (
    <div className="text-[14px] leading-[1.5] text-[#4e4e4e]">
      {paragraphs.map((segments, pIdx) => (
        <p key={pIdx} className={pIdx < paragraphs.length - 1 ? "mb-3" : ""}>
          {segments.map((seg: TextSegment, sIdx: number) =>
            seg.color ? (
              <span key={sIdx} className={HIGHLIGHT_COLORS[seg.color]}>
                {seg.text}
              </span>
            ) : (
              <span key={sIdx}>{seg.text}</span>
            )
          )}
        </p>
      ))}
    </div>
  );
}

function formatValue(value: number, metric: BenchmarkMetric): string {
  if (metric.unit === "currency" || metric.unit === "currencyPerMonth") {
    if (value >= 1_000_000) {
      return `${metric.prefix ?? ""}${(value / 1_000_000).toFixed(1)}M`;
    }
    if (value >= 1_000) {
      return `${metric.prefix ?? ""}${Math.round(value / 1_000)}K`;
    }
    return `${metric.prefix ?? ""}${value}`;
  }
  if (metric.unit === "percentage") {
    return `${value}${metric.suffix ?? ""}`;
  }
  if (metric.unit === "rating") {
    return `${value}`;
  }
  return `${metric.prefix ?? ""}${value}${metric.suffix ?? ""}`;
}

function formatCompactCurrency(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${Math.round(value / 1_000)}K`;
  return `$${Math.round(value).toLocaleString()}`;
}

function formatDelta(value: number, metric: BenchmarkMetric): string {
  const abs = Math.abs(value);
  if (metric.unit === "currency" || metric.unit === "currencyPerMonth") {
    return formatCompactCurrency(abs);
  }
  if (metric.unit === "percentage") {
    return `${Number(abs.toFixed(2)).toString()}%`;
  }
  if (metric.unit === "rating") {
    return Number(abs.toFixed(1)).toString();
  }
  return Number(abs.toFixed(2)).toString();
}

const FIGMA_BAR_WIDTHS: Record<string, number> = {
  You: 142,
  Upper: 372,
  Median: 186,
  Lower: 124,
};

export function BenchmarkCard({
  metric,
  currentValue,
  industry,
  teamSizeBand,
  insightState,
  techCount,
  annualRevenue,
}: BenchmarkCardProps) {
  const resolvedCurrentValue =
    currentValue ?? (insightState === "dataUploaded" ? metric.median : null);
  const hasYou = resolvedCurrentValue != null;
  const description: RichDescription = (() => {
    const metricName = metric.name as InsightMetricName;
    const polarity = METRIC_POLARITY[metricName];
    if (!polarity) {
      return metric.description;
    }

    const safeCurrent = resolvedCurrentValue ?? metric.median;
    const delta = Math.abs(safeCurrent - metric.median);
    const monthlyGap = delta / 12;
    const comparison = getComparisonBucket(currentValue, metric.median, 0.01);

    const annualLaborImpact =
      metricName === "laborRate" &&
      currentValue != null &&
      annualRevenue != null &&
      currentValue > metric.median
        ? ((currentValue - metric.median) / 100) * annualRevenue
        : null;

    return buildBenchmarkInsightDescription({
      metric: metricName,
      dataState: insightState,
      polarity,
      comparison,
      industry,
      band: teamSizeBand,
      median: formatValue(metric.median, metric),
      lower: formatValue(metric.lower, metric),
      upper: formatValue(metric.upper, metric),
      currentValue: formatValue(safeCurrent, metric),
      delta: formatDelta(delta, metric),
      monthly_delta: formatCompactCurrency(monthlyGap),
      techCount: techCount != null ? techCount.toLocaleString() : undefined,
      callsPerDay: undefined,
      dailyRevenueLoss: undefined,
      annualLaborCostImpact:
        annualLaborImpact != null ? formatCompactCurrency(annualLaborImpact) : undefined,
    });
  })();

  const rows = [
    ...(hasYou
      ? [{ label: "You", value: resolvedCurrentValue!, isYou: true }]
      : []),
    {
      label: "Upper",
      value: metric.invertedScale ? metric.lower : metric.upper,
      isYou: false,
    },
    { label: "Median", value: metric.median, isYou: false },
    {
      label: "Lower",
      value: metric.invertedScale ? metric.upper : metric.lower,
      isYou: false,
    },
  ];

  return (
    <div className="rounded-[16px] border border-[#e8e8e8] bg-white p-5">
      <h2 className="font-display text-[24px] font-medium leading-none text-[#171717]">
        {metric.displayName}
      </h2>

      <div className="mt-5 flex items-start gap-5">
        {/* Left — Insight text */}
        <div className="w-[360px] shrink-0">
          <RichText paragraphs={description} />
        </div>

        {/* Right — Bar chart */}
        <div className="flex w-[476px] shrink-0 flex-col justify-center gap-3">
          {rows.map((row) => (
            <div key={row.label} className="flex w-full items-start gap-1">
              <div className="flex h-8 w-[100px] shrink-0 items-center gap-2">
                <span className="text-[14px] font-medium leading-none text-[#171717]">
                  {row.label}
                </span>
              </div>
              <div className="relative h-8 w-[372px] shrink-0 overflow-clip rounded-[8px]">
                <div
                  className={`absolute left-0 top-0 h-8 rounded-[8px] ${
                    row.isYou ? "bg-[#8136e7]" : "bg-[#f1e8ff]"
                  }`}
                  style={{
                    width: `${FIGMA_BAR_WIDTHS[row.label] ?? 124}px`,
                  }}
                />
                <span
                  className={`absolute left-[8px] top-1/2 -translate-y-1/2 text-[14px] font-medium leading-none ${
                    row.isYou ? "text-white" : "text-[#171717]"
                  }`}
                >
                  {formatValue(row.value, metric)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
