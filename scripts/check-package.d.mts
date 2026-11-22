export const ALLOWED: RegExp[];
export const FORBIDDEN: [RegExp, string][];
export const REQUIRED: string[];
export function checkFiles(paths: readonly string[]): string[];
export function checkExports(exportsMap: Record<string, string | Record<string, string>> | undefined, paths: readonly string[]): string[];
export function summaryMarkdown(pack: { name: string; version: string; entryCount: number; size: number; unpackedSize: number; files: { path: string; size: number }[] }): string;
