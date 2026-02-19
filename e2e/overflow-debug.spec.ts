import { test, expect } from '@playwright/test';

const PAGES = ['/programs', '/athletes', '/meets', '/exercises', '/dashboard', '/schedule'];

for (const pagePath of PAGES) {
  test(`no horizontal overflow on ${pagePath} at 638px`, async ({ page }) => {
    await page.setViewportSize({ width: 638, height: 739 });
    await page.goto(pagePath, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);

    if (scrollWidth > clientWidth) {
      const overflowing = await page.evaluate(() => {
        const results: string[] = [];
        const vw = document.documentElement.clientWidth;
        for (const el of document.querySelectorAll('*')) {
          const rect = el.getBoundingClientRect();
          if (rect.right > vw + 1) {
            const tag = el.tagName.toLowerCase();
            const cls = (el.className?.toString() || '').slice(0, 100);
            results.push(`${tag}.${cls} | right:${Math.round(rect.right)} width:${Math.round(rect.width)}`);
          }
        }
        return results.slice(0, 15);
      });
      console.log(`--- ${pagePath} overflow (${scrollWidth} > ${clientWidth}) ---`);
      for (const line of overflowing) console.log(line);
    }

    expect(scrollWidth, `${pagePath} has horizontal overflow`).toBeLessThanOrEqual(clientWidth);
  });
}
