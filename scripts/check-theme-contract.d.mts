export interface ParsedRule { selector: string; decls: Map<string, string> }
export function parseRules(css: string): ParsedRule[];
export function checkTheme(name: string, themeCss: string, semanticCss: string, primitivesCss: string): string[];
