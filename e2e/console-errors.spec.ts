import { test, expect } from '@playwright/test';

/**
 * Console Error Audit – visits every non-dynamic route and fails
 * if any console.error or uncaught exception is detected.
 *
 * Turbopack dev-mode "module factory is not available" errors are
 * filtered out because they are transient HMR artifacts that do not
 * occur in production builds.
 */

const ROUTES = [
  // Coach routes
  '/',
  '/dashboard',
  '/athletes',
  '/programs',
  '/exercises',
  '/schedule',
  '/meets',
  '/analytics',
  '/messages',
  '/settings',
  '/train',
  '/submissions',
  '/offline',

  // Docs / research routes
  '/docs',
  '/docs/api',
  '/docs/architecture',
  '/docs/plan',
  '/docs/survey',
  '/research',
  '/findings',
  '/findings/api',
  '/findings/schema',
  '/findings/athletes',

  // Athlete public routes
  '/athlete/login',
  '/athlete/check-email',
];

/** Patterns to ignore — known Turbopack dev-mode transient issues */
const IGNORE_PATTERNS = [
  /module factory is not available/i,
  /Switched to client rendering because the server rendering errored/i,
];

function isIgnored(msg: string): boolean {
  return IGNORE_PATTERNS.some((re) => re.test(msg));
}

for (const route of ROUTES) {
  test(`no console errors on ${route}`, async ({ page }) => {
    const errors: string[] = [];

    // Capture console.error messages
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        const text = msg.text();
        if (!isIgnored(text)) {
          errors.push(`[console.error] ${text}`);
        }
      }
    });

    // Capture uncaught exceptions
    page.on('pageerror', (err) => {
      if (!isIgnored(err.message)) {
        errors.push(`[uncaught exception] ${err.message}`);
      }
    });

    await page.goto(route, { waitUntil: 'networkidle', timeout: 30_000 });

    // Give hydration and client-side fetches a moment
    await page.waitForTimeout(2_000);

    if (errors.length > 0) {
      const report = errors.map((e, i) => `  ${i + 1}. ${e}`).join('\n');
      expect(errors, `Console errors on ${route}:\n${report}`).toHaveLength(0);
    }
  });
}
