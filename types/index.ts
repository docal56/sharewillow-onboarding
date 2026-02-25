export interface CompanyData {
  name: string;
  email: string;
  password: string;
  industry: string;
  teamSize: number;
  numberOfTechs: number;
  staffCosts: number;
  annualRevenue: number;
  avgJobValue: number;
}

export type TextSegment = { text: string; color?: "red" | "green" };
export type RichParagraph = TextSegment[];
export type RichDescription = RichParagraph[];

export interface BenchmarkMetric {
  name: string;
  displayName: string;
  description: RichDescription;
  lower: number;
  median: number;
  upper: number;
  unit: "currency" | "percentage" | "rating" | "currencyPerMonth";
  prefix?: string;
  suffix?: string;
  invertedScale?: boolean; // true when lower numeric value = better performance (e.g. labor rate, callback rate)
}

export interface KPI {
  name: string;
  current: number;
  target: number;
  bonusPerMonth: number;
  bonusCap?: number;
  rationale: string;
  tooltipCopy?: string;
}

export type PlanMode = "generic" | "custom";

export interface SelectedKPI {
  name: string;
  reason: string;
}

export interface PlanData {
  kpis: KPI[];
  bonusPerTech: number;
  monthlyPayout: number;
  projectedUpliftLow: number;
  projectedUpliftHigh: number;
  insightCopy: Record<string, string>;
}

export interface CSVRow {
  [key: string]: string | number | undefined;
}

export interface CSVSummary {
  avgTicket: number | null;
  billableEfficiency: number | null;
  callbackRate: number | null;
  googleRating: number | null;
  avgGoogleRating?: number | null;
  maintenanceConversion?: number | null;
  firstTimeFixRate?: number | null;
  topPerformerInsights?: string | null;
  additionalInsights?: string | null;
  monthlyOvertimeSpend: number | null;
  totalJobs: number;
  totalRevenue: number | null;
}

export interface CalculatedKPI {
  name: string;
  current: number;
  currentFormatted: string;
  target: number;
  targetFormatted: string;
  bonusPerMonth: number;
  bonusCap: number;
  invertedScale: boolean;
}
