/*
 * Story-only helper: lets a play function activate an embed and inspect the iframe URL WITHOUT the
 * browser ever loading it. React sets an iframe's `src` with setAttribute; while this patch is active,
 * that call is redirected to `data-intended-src`, so the iframe stays on about:blank and no request
 * is made. The visual test harness also fails any test that makes an external request.
 */
export async function withIframeSrcCaptured<T>(action: () => Promise<T>): Promise<{ result: T; intended: string[] }> {
  const original = Element.prototype.setAttribute;
  const intended: string[] = [];
  Element.prototype.setAttribute = function (this: Element, name: string, value: string) {
    if (this instanceof HTMLIFrameElement && name === 'src') {
      intended.push(value);
      return original.call(this, 'data-intended-src', value);
    }
    return original.call(this, name, value);
  };
  try {
    const result = await action();
    return { result, intended };
  } finally {
    Element.prototype.setAttribute = original;
  }
}
