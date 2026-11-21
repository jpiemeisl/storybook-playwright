export interface BoundaryViolation {
  file: string;
  specifier: string;
  rule: 'a' | 'b' | 'c';
  message: string;
}
export function findSpecifiers(source: string): { specifier: string; reexport: boolean }[];
export function resolveSpecifier(fromFile: string, specifier: string): string | null;
export function checkFile(file: string, source: string): BoundaryViolation[];
export function listSourceFiles(root: string, dir?: string): string[];
