"use client";

import { useState } from "react";

import { cn } from "@/lib/utils/cn";

type CsvValue = string | number | boolean | null | undefined;

type CsvRow = Record<string, CsvValue>;

type ExportCsvButtonProps = {
  filename: string;
  rows: CsvRow[];
  label?: string;
  className?: string;
};

function escapeCsvCell(value: CsvValue) {
  const normalized = String(value ?? "");

  if (/["\n,]/.test(normalized)) {
    return `"${normalized.replace(/"/g, '""')}"`;
  }

  return normalized;
}

function toCsv(rows: CsvRow[]) {
  if (rows.length === 0) {
    return "";
  }

  const headers = Array.from(new Set(rows.flatMap((row) => Object.keys(row))));
  const headerLine = headers.map(escapeCsvCell).join(",");
  const lines = rows.map((row) =>
    headers.map((header) => escapeCsvCell(row[header])).join(",")
  );

  return [headerLine, ...lines].join("\n");
}

function normalizeFilename(filename: string) {
  return filename.toLowerCase().endsWith(".csv") ? filename : `${filename}.csv`;
}

export function ExportCsvButton({
  filename,
  rows,
  label = "تصدير CSV",
  className
}: ExportCsvButtonProps) {
  const [isExporting, setIsExporting] = useState(false);

  function handleExport() {
    if (rows.length === 0) {
      return;
    }

    setIsExporting(true);

    try {
      const csvContent = `\uFEFF${toCsv(rows)}`;
      const blob = new Blob([csvContent], {
        type: "text/csv;charset=utf-8;"
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = url;
      link.download = normalizeFilename(filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleExport}
      disabled={rows.length === 0 || isExporting}
      className={cn(
        "rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-800 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-500",
        className
      )}
    >
      {isExporting ? "جارٍ التصدير..." : label}
    </button>
  );
}
