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
  for (const candidate of candidates) {
    const found = keys.find(
      (k) => k.toLowerCase().replace(/[_\s-]/g, "") === candidate.toLowerCase().replace(/[_\s-]/g, "")
    );
    if (found) return found;
  }
  return undefined;
}

function extractSummary(rows: CSVRow[]): CSVSummary {
  if (rows.length === 0) {
    return {
      avgTicket: null,
      billableEfficiency: null,
      callbackRate: null,
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
      .map((r) => Number(r[jobTotalCol]))
      .filter((v) => !isNaN(v) && v > 0);
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
  ]);
  const totalHoursCol = findColumn(sample, [
    "totalhours",
    "total_hours",
    "hours",
  ]);

  let billableEfficiency: number | null = null;
  if (billableCol && totalHoursCol) {
    const pairs = rows
      .map((r) => ({
        billable: Number(r[billableCol]),
        total: Number(r[totalHoursCol]),
      }))
      .filter(
        (p) => !isNaN(p.billable) && !isNaN(p.total) && p.total > 0
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

  return {
    avgTicket,
    billableEfficiency,
    callbackRate,
    totalJobs: rows.length,
    totalRevenue,
  };
}
