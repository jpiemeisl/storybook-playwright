type Env = Record<string, string | undefined>;
export function inCi(env?: Env): boolean;
export function inContainer(env?: Env): boolean;
export function updateRefusal(env?: Env): string | null;
export function assertCanUpdate(env?: Env): void;
export function isUpdateArgs(args: readonly string[]): boolean;
export function hostWarning(env?: Env): string | null;
