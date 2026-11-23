/** origin: the declaration file that declares it; name: its name there (before any `as` rename). */
export type ExportInfo = { kind: 'component' | 'function' | 'class' | 'constant' | 'namespace' | 'type'; typeOnly: boolean; origin?: string; name?: string };
export function statements(text: string): string[];
export function classifyFunction(name: string, text: string): 'component' | 'function';
export function classifyConst(name: string, text: string): 'component' | 'function' | 'constant';
export function moduleExports(path: string, readFile: (path: string) => string | null, cache?: Map<string, Map<string, ExportInfo>>): Map<string, ExportInfo>;
export function kindLabel(info: ExportInfo): string;
export function customProperties(css: string): string[];
export function layerNames(css: string): string[];
export function renderReport(input: {
  packageName: string;
  entries: { name: string; specifier: string; exports: Map<string, ExportInfo> }[];
  subpaths: string[];
  css: { layers: string[]; themes: string[]; semantic: string[] };
}): string;
export function lineDiff(expected: string, actual: string): string[];
