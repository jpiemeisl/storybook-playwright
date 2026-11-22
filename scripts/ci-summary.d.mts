export interface SummaryRow { title: string; file: string; status: string; duration: number; attempts: number }
export function collectTests(report: unknown): SummaryRow[];
export function summarize(report: unknown, runUrl?: string): string;
