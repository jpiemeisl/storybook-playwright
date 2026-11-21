import type { Review } from '../types/product';

const names = ['Avery K.', 'Sam P.', 'Jordan L.', 'Priya N.', 'Marcus W.', 'Lee O.', 'Dana R.', 'Chris T.'];
const bodies = ['Exactly as described and well packed.', 'Good quality for the price.', 'Took a little longer to arrive than expected, but worth it.', 'Bought a second one as a gift.', 'Solid and nicely finished.'];

export const reviewsNone: Review[] = [];

export const reviewsThree: Review[] = [
  { id: 'r1', author: 'Avery K.', rating: 5, title: 'Lovely weight', body: 'Feels great in the hand and the glaze is even better in person.', createdAt: '2026-02-14T10:12:00Z', verified: true },
  { id: 'r2', author: 'Sam P.', rating: 4, body: 'Slightly smaller than I expected, still use it every day.', createdAt: '2026-01-30T18:40:00Z', verified: true },
  { id: 'r3', author: 'Guest', rating: 3, title: 'Fine', body: 'It is a mug. It holds coffee.', createdAt: '2026-01-02T08:05:00Z', verified: false },
];

const long = 'I have been using this every day for about four months now, and I wanted to write a proper review because the short ones did not tell me what I wanted to know before buying. '.repeat(6).trim();

/** 40 reviews including one very long one and an unverified one. */
export const reviewsForty: Review[] = Array.from({ length: 40 }, (_, i) => ({
  id: `r40-${i + 1}`,
  author: names[i % names.length]!,
  rating: [5, 4, 5, 3, 5, 4, 2, 5][i % 8]!,
  ...(i % 3 === 0 ? { title: ['Great', 'Would buy again', 'Does the job'][i % 3 === 0 ? (i / 3) % 3 : 0] } : {}),
  body: i === 7 ? long : bodies[i % bodies.length]!,
  createdAt: `2026-0${1 + (i % 3)}-${String(1 + (i % 27)).padStart(2, '0')}T12:00:00Z`,
  verified: i !== 11,
}));
