"use client";

import { useState, useCallback, type DragEvent, type ChangeEvent } from "react";
import { Button } from "@/components/ui/button";
import { parseCSV } from "@/lib/csv-parser";
import { CSVRow, CSVSummary } from "@/types";

interface CSVUploadProps {
  onParsed: (data: { rows: CSVRow[]; summary: CSVSummary }) => void;
}

export function CSVUpload({ onParsed }: CSVUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<CSVSummary | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  const handleFile = useCallback(
    async (file: File) => {
      if (!file.name.endsWith(".csv")) {
        setError("Please upload a CSV file.");
        return;
      }

      const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
      if (file.size > MAX_FILE_SIZE) {
        setError("File is too large. Maximum size is 10MB.");
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const result = await parseCSV(file);
        if (result.rows.length === 0) {
          setError("The CSV file appears to be empty.");
          setIsLoading(false);
          return;
        }
        setSummary(result.summary);
        setFileName(file.name);
        onParsed(result);
      } catch {
        setError("Failed to parse the CSV file. Please check the format.");
      } finally {
        setIsLoading(false);
      }
    },
    [onParsed]
  );

  const handleDrop = useCallback(
    (e: DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  if (summary && fileName) {
    return (
      <div className="space-y-4">
        <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
          <div className="mb-3 flex items-center gap-2">
            <span className="text-primary">&#10003;</span>
            <p className="text-sm font-medium">{fileName} parsed successfully</p>
          </div>
          <div className="space-y-2 text-sm">
            <SummaryRow label="Jobs analyzed" value={summary.totalJobs.toString()} />
            {summary.avgTicket != null && (
              <SummaryRow label="Average ticket" value={`$${summary.avgTicket.toLocaleString()}`} />
            )}
            {summary.totalRevenue != null && (
              <SummaryRow
                label="Total revenue"
                value={`$${summary.totalRevenue.toLocaleString()}`}
              />
            )}
            {summary.billableEfficiency != null && (
              <SummaryRow
                label="Billable efficiency"
                value={`${summary.billableEfficiency}%`}
              />
            )}
            {summary.callbackRate != null && (
              <SummaryRow label="Callback rate" value={`${summary.callbackRate}%`} />
            )}
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setSummary(null);
            setFileName(null);
          }}
        >
          Upload a different file
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div
        className={`flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 transition-colors ${
          isDragging
            ? "border-primary bg-primary/5"
            : "border-muted-foreground/25 hover:border-primary/50"
        }`}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
      >
        {isLoading ? (
          <div className="flex flex-col items-center gap-2">
            <div className="size-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            <p className="text-sm text-muted-foreground">Parsing CSV...</p>
          </div>
        ) : (
          <>
            <svg
              className="mb-3 size-8 text-muted-foreground/50"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
            <p className="text-sm text-muted-foreground">
              Drag and drop your CSV file here, or
            </p>
            <label className="mt-2 cursor-pointer">
              <span className="text-sm font-medium text-primary hover:underline">
                browse files
              </span>
              <input
                type="file"
                accept=".csv"
                className="hidden"
                onChange={handleChange}
              />
            </label>
          </>
        )}
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <p className="text-xs text-muted-foreground">
        We look for columns like job_total, billable_hours, total_hours, and
        job_type. Your data is only used in your browser and for the API call.
      </p>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
