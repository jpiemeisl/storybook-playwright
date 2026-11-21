import { describe, expect, it } from 'vitest';
import { addHeadingIds, decodeEntities, extractHeadings, slugify } from './headings';

describe('extractHeadings', () => {
  it('returns h2 and h3 in order and ignores other levels', () => {
    const html = '<h1>Title</h1><h2>One</h2><p>x</p><h3>One a</h3><h4>Deep</h4><h2>Two</h2>';
    expect(extractHeadings(html)).toEqual([
      { level: 2, text: 'One' },
      { level: 3, text: 'One a' },
      { level: 2, text: 'Two' },
    ]);
  });

  it('tolerates attributes and returns an existing id', () => {
    const html = `<h2 class="x" id="intro" data-a='1'>Intro</h2><H3 ID='upper'>Upper</H3><h2 id=bare>Bare</h2>`;
    expect(extractHeadings(html)).toEqual([
      { level: 2, text: 'Intro', id: 'intro' },
      { level: 3, text: 'Upper', id: 'upper' },
      { level: 2, text: 'Bare', id: 'bare' },
    ]);
  });

  it('turns <br> into a space', () => {
    expect(extractHeadings('<h2>Line one<br/>line two</h2>')[0]?.text).toBe('Line one line two');
  });

  it('strips nested inline tags to text', () => {
    expect(extractHeadings('<h2>Day <strong>1</strong>: <a href="/x"><em>reconcile</em></a></h2>')).toEqual([{ level: 2, text: 'Day 1: reconcile' }]);
  });

  it('decodes entities for the label', () => {
    expect(extractHeadings('<h2>Tax &amp; payroll &#8211; &quot;basics&quot; &#x2019;26 &unknown;</h2>')[0]?.text).toBe('Tax & payroll – "basics" ’26 &unknown;');
  });

  it('copes with malformed HTML without throwing', () => {
    const cases = ['<h2>Unclosed', '<h2 id="a">Mismatched</h3>', '<<h2>>x</h2>', '<h2></h2>', '<h2>   </h2>', '', '<h2', 'plain text', '<h2>Ok</h2><h3>Never closed'];
    for (const html of cases) expect(() => extractHeadings(html)).not.toThrow();
    expect(extractHeadings('<h2>Ok</h2><h3>Never closed')).toEqual([{ level: 2, text: 'Ok' }]);
    expect(extractHeadings('<h2></h2><h2>   </h2>')).toEqual([]);
    expect(extractHeadings(undefined)).toEqual([]);
    expect(extractHeadings(42)).toEqual([]);
  });
});

describe('addHeadingIds', () => {
  it('adds slug ids to headings that lack one', () => {
    expect(addHeadingIds('<h2>Day 1: Reconcile bank &amp; cards</h2>')).toBe('<h2 id="day-1-reconcile-bank-cards">Day 1: Reconcile bank &amp; cards</h2>');
  });

  it('keeps existing ids and never reuses them', () => {
    const html = '<h2>Overview</h2><h2 id="overview">Existing</h2>';
    expect(addHeadingIds(html)).toBe('<h2 id="overview-2">Overview</h2><h2 id="overview">Existing</h2>');
  });

  it('de-duplicates repeated headings', () => {
    expect(addHeadingIds('<h2>Notes</h2><h3>Notes</h3><h2>Notes</h2>')).toBe('<h2 id="notes">Notes</h2><h3 id="notes-2">Notes</h3><h2 id="notes-3">Notes</h2>');
  });

  it('shares ids across documents through the used set', () => {
    const used = new Set<string>();
    expect(addHeadingIds('<h2>Summary</h2>', used)).toBe('<h2 id="summary">Summary</h2>');
    expect(addHeadingIds('<h2>Summary</h2>', used)).toBe('<h2 id="summary-2">Summary</h2>');
  });

  it('keeps attributes and never alters other markup', () => {
    const html = '<p class="lead">Intro <a href="/x">link</a></p>\n<h2 class="big" data-x="1">Big <em>idea</em></h2><ul><li>a</li></ul><h1>Top</h1>';
    const out = addHeadingIds(html);
    expect(out).toBe('<p class="lead">Intro <a href="/x">link</a></p>\n<h2 id="big-idea" class="big" data-x="1">Big <em>idea</em></h2><ul><li>a</li></ul><h1>Top</h1>');
    expect(out.replace(' id="big-idea"', '')).toBe(html);
  });

  it('produces ids that start with a letter', () => {
    expect(addHeadingIds('<h2>2026 changes</h2><h2>!!!</h2>')).toBe('<h2 id="section-2026-changes">2026 changes</h2><h2 id="section">!!!</h2>');
  });

  it('copes with malformed HTML without throwing or changing it', () => {
    const cases = ['<h2>Unclosed', '<h2 id="a">Mismatched</h3>', '<h2', 'text', ''];
    for (const html of cases) expect(addHeadingIds(html)).toBe(html);
    expect(addHeadingIds(null)).toBe('');
  });

  it('round-trips with extractHeadings', () => {
    const headings = extractHeadings(addHeadingIds('<h2>A</h2><h3>B</h3><h2>A</h2>'));
    expect(headings.map((h) => h.id)).toEqual(['a', 'b', 'a-2']);
  });
});

describe('slugify and decodeEntities', () => {
  it('slugifies accents and punctuation', () => {
    expect(slugify('Café – crème brûlée!')).toBe('cafe-creme-brulee');
  });

  it('leaves invalid numeric entities alone', () => {
    expect(decodeEntities('&#0; &#x110000; &amp;')).toBe('&#0; &#x110000; &');
  });
});
