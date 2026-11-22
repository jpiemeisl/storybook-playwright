export interface TokenViolation { line: number; message: string; text: string }
export function forbiddenPrimitives(primitivesCss: string): Set<string>;
export function checkCss(css: string, primitives: Set<string>): TokenViolation[];
export function applyAllowlist(file: string, violations: TokenViolation[], allow: { file: string; match: string; reason: string }[]): TokenViolation[];
