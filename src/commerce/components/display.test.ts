import { describe, expect, it } from 'vitest';
import { ratingLabel, starIcons } from './Rating';
import { stockLabel } from './StockBadge';

describe('stockLabel', () => {
  it('gives every status a text, not only a tone', () => {
    expect(stockLabel({ status: 'in-stock' }).text).toBe('In stock');
    expect(stockLabel({ status: 'low-stock', quantity: 3 }).text).toBe('Only 3 left');
    expect(stockLabel({ status: 'low-stock' }).text).toBe('Low stock');
    expect(stockLabel({ status: 'out-of-stock' }).text).toBe('Sold out');
    expect(stockLabel({ status: 'backorder', availableOn: '2026-04-02' }).text).toBe('Back in stock on Apr 2, 2026');
    expect(stockLabel({ status: 'preorder', availableOn: '2026-06-01' }).text).toBe('Pre-order: ships Jun 1, 2026');
    expect(stockLabel({ status: 'preorder' }).text).toBe('Pre-order');
  });
});

describe('Rating helpers', () => {
  it('rounds to half stars', () => {
    expect(starIcons(4.5)).toEqual(['star', 'star', 'star', 'star', 'star-half']);
    expect(starIcons(4.24)).toEqual(['star', 'star', 'star', 'star', 'star-empty']);
    expect(starIcons(4.25)).toEqual(['star', 'star', 'star', 'star', 'star-half']);
    expect(starIcons(0)).toEqual(Array(5).fill('star-empty'));
    expect(starIcons(9)).toEqual(Array(5).fill('star'));
  });

  it('builds the accessible name', () => {
    expect(ratingLabel(4.5, 128)).toBe('Rated 4.5 out of 5 from 128 reviews');
    expect(ratingLabel(5, 4000)).toBe('Rated 5 out of 5 from 4,000 reviews');
    expect(ratingLabel(4, 1)).toBe('Rated 4 out of 5 from 1 review');
    expect(ratingLabel(3.5)).toBe('Rated 3.5 out of 5');
    expect(ratingLabel(0, 0)).toBe('No reviews yet');
  });
});
