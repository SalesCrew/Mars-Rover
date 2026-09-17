import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdir } from 'node:fs/promises';

const { chromium } = createRequire(import.meta.url)('playwright');
const origin = 'http://127.0.0.1:5174';
const browser = await chromium.launch({ headless: true, channel: 'chrome' });
const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
const externalRequests = [];
await context.route('**/*', route => {
  const url = new URL(route.request().url());
  if (url.origin === origin) return route.continue();
  externalRequests.push(route.request().url());
  return route.abort();
});

const page = await context.newPage();
const errors = [];
page.on('pageerror', error => errors.push(error.message));

try {
  await page.goto(`${origin}/tests/photo-wave-history-preview.html`);
  await page.getByText('BILLA Plus Fotowelle Herbst').waitFor();
  await page.getByText('BILLA Plus Fotowelle Herbst').click();
  await page.getByText('Fotos nach Markt').first().waitFor();
  await page.getByText('Lindengasse 12').waitFor();
  await page.getByText('4 Fotos').waitFor();
  await page.getByText('ADEG Platzierungen September').click();
  await page.getByText('Kirchenplatz 1').first().waitFor();
  assert.equal(await page.getByText('Noch keine Fotos').count(), 0);
  assert.equal(await page.getByText('BILLA Plus', { exact: true }).count() > 0, true);

  await mkdir('outputs/photo-wave-history', { recursive: true });
  const history = page.locator('[class*="sectionCard"]').first();
  await page.waitForTimeout(500);
  await history.screenshot({ path: 'outputs/photo-wave-history/desktop.png' });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(500);
  await history.screenshot({ path: 'outputs/photo-wave-history/mobile.png' });
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
  assert.deepEqual(externalRequests, []);
  assert.deepEqual(errors, []);
  console.log('PASS photo-only and mixed-wave market history renders on desktop and mobile without external requests');
} finally {
  await browser.close();
}
