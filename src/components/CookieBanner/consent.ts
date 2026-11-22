/** A consent category the host defines, e.g. "Necessary", "Analytics", "Marketing". */
export interface ConsentCategory {
  /** Key in ConsentChoices. */
  id: string;
  label: string;
  /** What the category is used for, in plain language. */
  description?: string;
  /** Always on (e.g. strictly necessary cookies): shown as such and cannot be switched off. */
  required?: boolean;
  /** Initial state in the settings dialog when the visitor has not chosen yet. Ignored when required. */
  defaultOn?: boolean;
}

/** The visitor's choice per category id. Plain JSON: store it however your consent rules require. */
export type ConsentChoices = Record<string, boolean>;

/** The starting choices: required categories on, others from defaultOn (off unless set). */
export function defaultConsentChoices(categories: readonly ConsentCategory[]): ConsentChoices {
  return Object.fromEntries(categories.map((c) => [c.id, c.required ? true : c.defaultOn === true]));
}

/** Every category on (Accept all) or only the required ones (Reject all). */
export function allConsentChoices(categories: readonly ConsentCategory[], on: boolean): ConsentChoices {
  return Object.fromEntries(categories.map((c) => [c.id, c.required ? true : on]));
}
