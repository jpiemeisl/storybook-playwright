import { expect, test } from '@playwright/test';

/*
 * Print stylesheet check for the Legal template: emulates print media and captures the whole page.
 * Expected: no announcement, header, footer or table of contents; link URLs printed after link text.
 */
test('Templates/Legal / print', async ({ page }) => {
  const external: string[] = [];
  page.on('request', (request) => {
    const url = request.url();
    if (!/^(data|blob|about):/.test(url) && !url.startsWith('http://localhost:6007/')) external.push(url);
  });

  await page.setViewportSize({ width: 800, height: 1100 });
  await page.goto('/iframe.html?id=templates-legal--legal&viewMode=story');
  await page.getByRole('heading', { level: 1, name: 'Privacy policy' }).waitFor();
  await page.evaluate(() => document.fonts.ready);
  await page.emulateMedia({ media: 'print' });

  // Page-level header and footer (PageHeader's <header> inside <main> is not a landmark and stays).
  await expect(page.locator('header:not(main header)')).toBeHidden();
  await expect(page.locator('footer:not(main footer)')).toBeHidden();
  await expect(page.getByRole('region', { name: 'Announcement' })).toBeHidden();
  await expect(page.getByRole('navigation', { name: 'On this page' })).toBeHidden();
  const linkSuffix = await page.locator('main a[href^="mailto:"]').first().evaluate((a) => getComputedStyle(a, '::after').content);
  expect(linkSuffix).toContain('mailto:privacy@brightside.example');

  await expect(page).toHaveScreenshot('templates-legal--legal-print.png', { fullPage: true });
  expect(external, 'external network requests').toEqual([]);
});
