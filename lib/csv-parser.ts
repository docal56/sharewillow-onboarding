import Papa from "papaparse";
import { CSVRow, CSVSummary } from "@/types";

export function parseCSV(
  file: File
): Promise<{ rows: CSVRow[]; summary: CSVSummary }> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
      complete: (results) => {
        const rows = results.data as CSVRow[];
        const summary = extractSummary(rows);
        resolve({ rows, summary });
      },
      error: (error: Error) => reject(error),
    });
  });
}

function findColumn(row: CSVRow, candidates: string[]): string | undefined {
  const keys = Object.keys(row);
  const normalized = keys.map((key) => ({
    key,
    normalizedKey: key.toLowerCase().replace(/[^a-z0-9]/g, ""),
  }));

  for (const candidate of candidates) {
    const normalizedCandidate = candidate.toLowerCase().replace(/[^a-z0-9]/g, "");
    const exact = normalized.find((k) => k.normalizedKey === normalizedCandidate);
    if (exact) return exact.key;
  }

  for (const candidate of candidates) {
    const normalizedCandidate = candidate.toLowerCase().replace(/[^a-z0-9]/g, "");
    const partial = normalized.find((k) =>
      k.normalizedKey.includes(normalizedCandidate) ||
      normalizedCandidate.includes(k.normalizedKey)
    );
    if (partial) return partial.key;
  }

  return undefined;
}

function toNumber(value: string | number | undefined): number | null {
  if (value == null) return null;
  if (typeof value === "number") return Number.isFinite(value) ? value : null;

  const cleaned = value
    .replace(/\(([^)]+)\)/g, "-$1")
    .replace(/[$,%\s]/g, "")
    .replace(/,/g, "");
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : null;
}

function extractSummary(rows: CSVRow[]): CSVSummary {
  if (rows.length === 0) {
    return {
      avgTicket: null,
      billableEfficiency: null,
      callbackRate: null,
      googleRating: null,
      monthlyOvertimeSpend: null,
      totalJobs: 0,
      totalRevenue: null,
    };
  }

  const sample = rows[0];

  // Average ticket / job total
  const jobTotalCol = findColumn(sample, [
    "jobtotal",
    "job_total",
    "total",
    "invoicetotal",
    "invoice_total",
    "tickettotal",
    "ticket_total",
    "amount",
    "revenue",
  ]);

  let avgTicket: number | null = null;
  let totalRevenue: number | null = null;
  if (jobTotalCol) {
    const values = rows
      .map((r) => toNumber(r[jobTotalCol]))
      .filter((v): v is number => v != null && v > 0);
    if (values.length > 0) {
      totalRevenue = values.reduce((a, b) => a + b, 0);
      avgTicket = Math.round(totalRevenue / values.length);
    }
  }

  // Billable efficiency
  const billableCol = findColumn(sample, [
    "billablehours",
    "billable_hours",
    "billable",
    "billabletime",
    "productivehours",
  ]);
  const totalHoursCol = findColumn(sample, [
    "totalhours",
    "total_hours",
    "hours",
    "workedhours",
    "availablehours",
  ]);

  let billableEfficiency: number | null = null;
  if (billableCol && totalHoursCol) {
    const pairs = rows
      .map((r) => ({
        billable: toNumber(r[billableCol]),
        total: toNumber(r[totalHoursCol]),
      }))
      .filter(
        (p): p is { billable: number; total: number } =>
          p.billable != null && p.total != null && p.total > 0
      );
    if (pairs.length > 0) {
      const totalBillable = pairs.reduce((a, p) => a + p.billable, 0);
      const totalAll = pairs.reduce((a, p) => a + p.total, 0);
      billableEfficiency = Math.round((totalBillable / totalAll) * 100);
    }
  }

  // Callback rate
  const jobTypeCol = findColumn(sample, [
    "jobtype",
    "job_type",
    "type",
    "servicetype",
    "service_type",
    "category",
    "description",
    "jobdescription",
    "calltype",
  ]);

  let callbackRate: number | null = null;
  if (jobTypeCol) {
    const callbackKeywords = ["callback", "recall", "return", "warranty", "redo"];
    const totalJobs = rows.length;
    const callbackJobs = rows.filter((r) => {
      const val = String(r[jobTypeCol] ?? "").toLowerCase();
      return callbackKeywords.some((kw) => val.includes(kw));
    }).length;
    if (totalJobs > 0) {
      callbackRate = Math.round((callbackJobs / totalJobs) * 100 * 10) / 10;
    }
  }

  const googleRatingCol = findColumn(sample, [
    "googlerating",
    "google_rating",
    "rating",
    "reviewrating",
    "average_rating",
  ]);

  let googleRating: number | null = null;
  if (googleRatingCol) {
    const values = rows
      .map((r) => toNumber(r[googleRatingCol]))
      .filter((v): v is number => v != null && v > 0 && v <= 5);
    if (values.length > 0) {
      googleRating = Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 10) / 10;
    }
  }

  const overtimeCol = findColumn(sample, [
    "monthlyovertimespend",
    "overtimespend",
    "overtimecost",
    "overtime_pay",
    "overtimepay",
    "otcost",
  ]);

  let monthlyOvertimeSpend: number | null = null;
  if (overtimeCol) {
    const values = rows
      .map((r) => toNumber(r[overtimeCol]))
      .filter((v): v is number => v != null && v >= 0);
    if (values.length > 0) {
      monthlyOvertimeSpend = Math.round(values.reduce((a, b) => a + b, 0) / values.length);
    }
  }

  return {
    avgTicket,
    billableEfficiency,
    callbackRate,
    googleRating,
    monthlyOvertimeSpend,
    totalJobs: rows.length,
    totalRevenue,
  };
}
