import type { ExportInfo } from './api-report.mjs';
export function summaryFor(text: string, name: string): string | null;
export function missingSummaries(
  entries: { entry: string; exports: Map<string, ExportInfo> }[],
  readFile: (path: string) => string | null,
): { entry: string; name: string; kind: string; origin?: string }[];
