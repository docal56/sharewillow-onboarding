"use client";

import { BenchmarkMetric, RichDescription, TextSegment } from "@/types";

interface BenchmarkCardProps {
  metric: BenchmarkMetric;
  currentValue?: number | null;
  insightCopy?: string;
}

const HIGHLIGHT_COLORS = {
  red: "font-medium text-[#de2424]",
  green: "font-medium text-[#317e0d]",
} as const;

function RichText({ paragraphs }: { paragraphs: RichDescription }) {
  return (
    <div className="text-[14px] leading-[1.5] text-slate-600">
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

function getBarWidthPercent(value: number, metric: BenchmarkMetric): number {
  const MAX = 95;
  if (metric.invertedScale) {
    const best = metric.upper;
    if (value === 0) return 0;
    return Math.max(8, Math.min(MAX, (best / value) * MAX));
  }
  const best = metric.upper;
  if (best === 0) return 0;
  return Math.max(8, Math.min(MAX, (value / best) * MAX));
}

export function BenchmarkCard({
  metric,
  currentValue,
  insightCopy,
}: BenchmarkCardProps) {
  const hasYou = currentValue != null;

  const rows = [
    ...(hasYou
      ? [{ label: "You", value: currentValue!, isYou: true }]
      : []),
    { label: "Upper", value: metric.upper, isYou: false },
    { label: "Median", value: metric.median, isYou: false },
    { label: "Lower", value: metric.lower, isYou: false },
  ];

  return (
    <div className="rounded-[16px] border border-[#e8e8e8] bg-white p-5">
      <h2 className="font-display text-[24px] font-medium leading-none text-[#171717]">
        {metric.displayName}
      </h2>

      <div className="mt-5 flex items-start gap-5">
        {/* Left — Insight text */}
        <div className="w-[360px] shrink-0">
          {insightCopy ? (
            <p className="text-[14px] leading-[1.5] text-slate-600">
              {insightCopy}
            </p>
          ) : (
            <RichText paragraphs={metric.description} />
          )}
        </div>

        {/* Right — Bar chart */}
        <div className="flex min-w-0 flex-1 flex-col justify-center gap-3">
          {rows.map((row) => (
            <div key={row.label} className="flex w-full items-start gap-1">
              <div className="flex h-8 w-[100px] shrink-0 items-center gap-2">
                <span className="text-[14px] font-medium leading-none text-[#171717]">
                  {row.label}
                </span>
              </div>
              <div className="relative h-8 min-w-0 flex-1 overflow-clip rounded-[8px]">
                <div
                  className={`absolute left-0 top-0 h-8 rounded-[8px] ${
                    row.isYou ? "bg-[#8136e7]" : "bg-[#f1e8ff]"
                  }`}
                  style={{
                    width: `${getBarWidthPercent(row.value, metric)}%`,
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
