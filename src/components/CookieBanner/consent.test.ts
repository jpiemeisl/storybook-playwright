import { describe, expect, it } from 'vitest';
import { allConsentChoices, defaultConsentChoices, type ConsentCategory } from './consent';

const categories: ConsentCategory[] = [
  { id: 'necessary', label: 'Necessary', required: true, defaultOn: false },
  { id: 'preferences', label: 'Preferences', defaultOn: true },
  { id: 'analytics', label: 'Analytics' },
];

describe('consent choices', () => {
  it('defaults: required always on, others from defaultOn, off when unset', () => {
    expect(defaultConsentChoices(categories)).toEqual({ necessary: true, preferences: true, analytics: false });
  });

  it('accept all and reject all keep required categories on', () => {
    expect(allConsentChoices(categories, true)).toEqual({ necessary: true, preferences: true, analytics: true });
    expect(allConsentChoices(categories, false)).toEqual({ necessary: true, preferences: false, analytics: false });
  });

  it('is plain serializable data, and empty for no categories', () => {
    const choices = defaultConsentChoices(categories);
    expect(JSON.parse(JSON.stringify(choices))).toEqual(choices);
    expect(defaultConsentChoices([])).toEqual({});
  });
});
