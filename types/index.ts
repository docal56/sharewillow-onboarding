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
  rationale: string;
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
  monthlyOvertimeSpend: number | null;
  totalJobs: number;
  totalRevenue: number | null;
}
