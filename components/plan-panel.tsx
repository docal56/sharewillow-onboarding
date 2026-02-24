"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { PlanData } from "@/types";

interface PlanPanelProps {
  planData: PlanData | null;
  teamSize: number;
  isLoading?: boolean;
  onConnectData: () => void;
}

export function PlanPanel({
  planData,
  teamSize,
  isLoading,
  onConnectData,
}: PlanPanelProps) {
  if (isLoading) {
    return (
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="flex flex-col items-center justify-center py-16">
          <div className="mb-4 size-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">
            Generating your personalised plan...
          </p>
        </CardContent>
      </Card>
    );
  }

  if (!planData) {
    return <TeaserPanel onConnectData={onConnectData} />;
  }

  return <FullPanel planData={planData} teamSize={teamSize} />;
}

function TeaserPanel({ onConnectData }: { onConnectData: () => void }) {
  return (
    <Card className="border-dashed">
      <CardHeader>
        <CardTitle className="font-display text-xl">
          Recommended Incentive Plan
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Connect your job data to get a personalised incentive plan based on
          your actual performance vs industry benchmarks.
        </p>

        <div className="space-y-3 rounded-lg bg-muted/50 p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            What you&apos;ll get
          </p>
          <ul className="space-y-2 text-sm">
            <li className="flex gap-2">
              <span className="text-primary">&#10003;</span>
              Top 3 KPIs for your team
            </li>
            <li className="flex gap-2">
              <span className="text-primary">&#10003;</span>
              Personalised bonus targets
            </li>
            <li className="flex gap-2">
              <span className="text-primary">&#10003;</span>
              Projected revenue uplift
            </li>
          </ul>
        </div>

        <Button className="w-full" size="lg" onClick={onConnectData}>
          Get a Personalised Plan
        </Button>
      </CardContent>
    </Card>
  );
}

function FullPanel({
  planData,
  teamSize,
}: {
  planData: PlanData;
  teamSize: number;
}) {
  return (
    <Card className="border-primary/20">
      <CardHeader>
        <CardTitle className="font-display text-xl">
          Recommended Incentive Plan
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Based on your data vs HVAC industry benchmarks
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* KPI table */}
        <div className="rounded-lg border">
          <div className="grid grid-cols-4 gap-2 border-b bg-muted/50 px-3 py-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            <span className="col-span-1">KPI</span>
            <span className="text-right">Current</span>
            <span className="text-right">Target</span>
            <span className="text-right">Bonus/mo</span>
          </div>
          {planData.kpis.map((kpi) => (
            <div
              key={kpi.name}
              className="grid grid-cols-4 gap-2 border-b px-3 py-2.5 text-sm last:border-b-0"
            >
              <span className="col-span-1 font-medium">{kpi.name}</span>
              <span className="text-right text-muted-foreground">
                {typeof kpi.current === "number"
                  ? kpi.current.toLocaleString()
                  : kpi.current}
              </span>
              <span className="text-right font-medium text-primary">
                {typeof kpi.target === "number"
                  ? kpi.target.toLocaleString()
                  : kpi.target}
              </span>
              <span className="text-right font-semibold">
                ${kpi.bonusPerMonth}
              </span>
            </div>
          ))}
        </div>

        {/* Summary stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg bg-muted/50 p-3">
            <p className="text-xs text-muted-foreground">Bonus per tech</p>
            <p className="text-lg font-semibold">
              ${planData.bonusPerTech}/mo
            </p>
          </div>
          <div className="rounded-lg bg-muted/50 p-3">
            <p className="text-xs text-muted-foreground">Monthly payout</p>
            <p className="text-lg font-semibold">
              ${planData.monthlyPayout.toLocaleString()}
            </p>
            <p className="text-xs text-muted-foreground">
              ({teamSize} techs)
            </p>
          </div>
        </div>

        <Separator />

        {/* Projected uplift */}
        <div className="rounded-lg bg-primary/5 p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Projected Annual Revenue Uplift
          </p>
          <p className="mt-1 text-2xl font-bold text-primary">
            ${planData.projectedUpliftLow.toLocaleString()} &ndash; $
            {planData.projectedUpliftHigh.toLocaleString()}
          </p>
        </div>

        {/* CTAs */}
        <div className="flex flex-col gap-2">
          <Button className="w-full" size="lg">
            Publish this plan
          </Button>
          <Button variant="outline" className="w-full" size="lg">
            Adjust the plan
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
