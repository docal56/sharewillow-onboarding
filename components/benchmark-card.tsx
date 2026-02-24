"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BenchmarkMetric } from "@/types";

interface BenchmarkCardProps {
  metric: BenchmarkMetric;
  currentValue?: number | null;
  insightCopy?: string;
}

function formatValue(
  value: number,
  metric: BenchmarkMetric
): string {
  if (metric.unit === "currency" || metric.unit === "currencyPerMonth") {
    if (value >= 1_000_000) {
      return `${metric.prefix ?? ""}${(value / 1_000_000).toFixed(1)}M`;
    }
    if (value >= 1_000) {
      return `${metric.prefix ?? ""}${(value / 1_000).toFixed(1)}K`;
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

function getBarPercent(value: number, metric: BenchmarkMetric): number {
  const values = [metric.lower, metric.median, metric.upper];
  if (metric.invertedScale) {
    // For inverted metrics, lower numeric value = better. Scale from upper (best) to lower (worst).
    const min = metric.upper;
    const max = metric.lower;
    const range = max - min;
    if (range === 0) return 50;
    return Math.max(5, Math.min(95, ((value - min) / range) * 100));
  }
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min;
  if (range === 0) return 50;
  // Add some padding so bars don't start at 0
  const paddedMin = min - range * 0.2;
  const paddedMax = max + range * 0.2;
  return Math.max(5, Math.min(95, ((value - paddedMin) / (paddedMax - paddedMin)) * 100));
}

export function BenchmarkCard({
  metric,
  currentValue,
  insightCopy,
}: BenchmarkCardProps) {
  const lowerPct = getBarPercent(metric.lower, metric);
  const medianPct = getBarPercent(metric.median, metric);
  const upperPct = getBarPercent(metric.upper, metric);
  const youPct =
    currentValue != null ? getBarPercent(currentValue, metric) : null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold">
          {metric.displayName}
        </CardTitle>
        {insightCopy && (
          <p className="text-sm text-muted-foreground">{insightCopy}</p>
        )}
      </CardHeader>
      <CardContent>
        {/* Bar chart */}
        <div className="relative h-12 rounded-md bg-muted">
          {/* Benchmark tier markers */}
          <BenchmarkMarker
            position={lowerPct}
            label="Lower"
            value={formatValue(metric.lower, metric)}
            color="bg-benchmark-range"
          />
          <BenchmarkMarker
            position={medianPct}
            label="Median"
            value={formatValue(metric.median, metric)}
            color="bg-benchmark-range"
          />
          <BenchmarkMarker
            position={upperPct}
            label="Upper"
            value={formatValue(metric.upper, metric)}
            color="bg-benchmark-range"
          />

          {/* Your value */}
          {youPct != null && currentValue != null && (
            <div
              className="absolute top-0 flex h-full flex-col items-center justify-center"
              style={{ left: `${youPct}%`, transform: "translateX(-50%)" }}
            >
              <div className="h-full w-1 rounded-full bg-benchmark-you" />
              <div className="absolute -top-6 whitespace-nowrap text-xs font-bold text-benchmark-you">
                You: {formatValue(currentValue, metric)}
              </div>
            </div>
          )}
        </div>

        {/* Legend row */}
        <div className="mt-3 flex justify-between text-xs text-muted-foreground">
          <span>
            Lower: {formatValue(metric.lower, metric)}
          </span>
          <span>
            Median: {formatValue(metric.median, metric)}
          </span>
          <span>
            Upper: {formatValue(metric.upper, metric)}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

function BenchmarkMarker({
  position,
  label,
  value,
  color,
}: {
  position: number;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div
      className="absolute top-0 flex h-full flex-col items-center justify-center"
      style={{ left: `${position}%`, transform: "translateX(-50%)" }}
    >
      <div className={`h-full w-0.5 rounded-full ${color} opacity-60`} />
    </div>
  );
}
