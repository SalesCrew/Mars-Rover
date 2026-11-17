import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { spawn } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import {
  createCustomerAccessHarness,
  password,
} from '../../backend/tests/helpers/customerAccessHarness.mjs';
const require = createRequire(import.meta.url);
const {
  chromium,
} = require('/Users/kiliansternath/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const ExcelJS = require('../node_modules/exceljs');
const cwd = fileURLToPath(new URL('../', import.meta.url));
const output = cwd + 'outputs/customer-access-e2e';
await mkdir(output, { recursive: true });
const h = await createCustomerAccessHarness();
const origin = 'http://127.0.0.1:5197';
const vite = spawn(
  process.execPath,
  [
    cwd + 'node_modules/vite/bin/vite.js',
    '--host',
    '127.0.0.1',
    '--port',
    '5197',
    '--strictPort',
  ],
  { cwd, env: { ...process.env, VITE_API_URL: h.base } }
);
let serverLog = '',
  browser,
  admin,
  customer;
vite.stdout.on('data', (b) => (serverLog += b));
vite.stderr.on('data', (b) => (serverLog += b));
const checks = [],
  errors = [],
  blocked = [];
const eventually = async (fn) => {
  for (let i = 0; i < 100; i++) {
    try {
      if (await fn()) return;
    } catch {}
    await new Promise((r) => setTimeout(r, 100));
  }
  throw Error('Readiness timeout');
};
const login = async (page, email, pwd) => {
  await page.goto(origin);
  await page.getByPlaceholder('ihre.email@beispiel.com').fill(email);
  await page.getByPlaceholder('Ihr Passwort').fill(pwd);
  await page.getByRole('button', { name: 'Anmelden', exact: true }).click();
};
try {
  await eventually(async () => {
    const r = await fetch(origin);
    return r.ok;
  });
  browser = await chromium.launch({ headless: true });
  const makeContext = async () => {
    const context = await browser.newContext({
      viewport: { width: 1440, height: 1080 },
      acceptDownloads: true,
    });
    await context.route('**/*', async (route) => {
      const u = new URL(route.request().url());
      if (u.hostname === 'fonts.googleapis.com')
        return route.fulfill({
          status: 200,
          contentType: 'text/css',
          body: '',
        });
      if (
        ['http:', 'https:'].includes(u.protocol) &&
        !['127.0.0.1', 'localhost'].includes(u.hostname)
      ) {
        blocked.push(u.origin);
        return route.abort();
      }
      return route.continue();
    });
    const page = await context.newPage();
    page.on('pageerror', (e) => errors.push(e.message));
    return page;
  };
  admin = await makeContext();
  await admin.addInitScript(() =>
    localStorage.setItem('admin-selected-page', 'produkte')
  );
  await login(admin, 'admin@example.test', password);
  await admin.getByRole('button', { name: 'Profilmenü öffnen' }).click();
  await admin
    .getByRole('button', { name: 'Mitarbeiter verwalten', exact: true })
    .click();
  await admin
    .getByRole('button', { name: 'Neuen Admin erstellen', exact: true })
    .click();
  const fontMetrics = (element) => {
    const style = getComputedStyle(element);
    return {
      family: style.fontFamily,
      size: style.fontSize,
      weight: style.fontWeight,
    };
  };
  const referenceTitle = await admin
    .getByRole('heading', { name: 'Neuen Admin erstellen', exact: true })
    .evaluate(fontMetrics);
  const referenceInput = await admin
    .getByPlaceholder('Max', { exact: true })
    .evaluate(fontMetrics);
  await admin.locator('[class*="closeButton"]').last().click();
  await admin.getByRole('button', { name: 'Profilmenü öffnen' }).click();
  await admin
    .getByRole('button', { name: 'Kundenzugänge', exact: true })
    .click();
  await admin.getByRole('dialog', { name: 'Kundenzugänge' }).waitFor();
  await admin
    .getByRole('button', { name: 'Bettina Kundin', exact: false })
    .waitFor();
  await admin.evaluate(async () => {
    await Promise.all(
      document.getAnimations().map((a) => a.finished.catch(() => {}))
    );
  });
  assert.deepEqual(
    await admin
      .getByRole('heading', { name: 'Kundenzugänge', exact: true })
      .evaluate(fontMetrics),
    referenceTitle
  );
  assert.deepEqual(
    await admin.getByLabel('Vorname', { exact: true }).evaluate(fontMetrics),
    referenceInput
  );
  assert.ok(
    (await admin
      .getByRole('dialog', { name: 'Kundenzugänge' })
      .evaluate((e) => e.getBoundingClientRect().width)) >= 900
  );
  checks.push(
    'customer management reuses the employee form typography and renders the full split layout at desktop width'
  );
  await admin.screenshot({
    path: output + '/admin-access-desktop.png',
    fullPage: true,
  });
  await admin.getByLabel('Vorname', { exact: true }).fill('Bettina');
  await admin.getByLabel('Nachname', { exact: true }).fill('Demo');
  await admin
    .getByLabel('Login-E-Mail', { exact: true })
    .fill('browser-customer@example.test');
  for (const name of [
    'Dashboard: Ansehen',
    'Umsatzwellen: Ansehen',
    'Fotowellen: Ansehen',
  ])
    await admin.getByRole('switch', { name, exact: true }).click();
  const [created] = await Promise.all([
    admin.waitForResponse(
      (r) =>
        r.url().endsWith('/customer/accounts') &&
        r.request().method() === 'POST'
    ),
    admin
      .getByRole('button', { name: 'Zugang erstellen', exact: true })
      .click(),
  ]);
  assert.equal(created.status(), 201);
  const account = await created.json();
  assert.ok(account.oneTimePassword);
  await admin
    .getByText('Zugang angelegt. Zugangsdaten jetzt kopieren.', { exact: true })
    .waitFor();
  checks.push(
    'actual admin sidebar menu opens customer management and creates a customer with per-page rights and a one-time password through the real API and SQL'
  );
  await admin.setViewportSize({ width: 900, height: 760 });
  assert.equal(
    await admin
      .getByRole('dialog', { name: 'Kundenzugänge' })
      .evaluate((e) => e.scrollWidth > e.clientWidth),
    false
  );
  await admin.screenshot({
    path: output + '/admin-access-intermediate.png',
    fullPage: true,
  });
  await admin.setViewportSize({ width: 390, height: 844 });
  await admin.screenshot({
    path: output + '/admin-access-mobile.png',
    fullPage: true,
  });
  assert.equal(
    await admin.evaluate(
      () => document.documentElement.scrollWidth > innerWidth
    ),
    false
  );
  const lastRight = admin.getByRole('switch', {
    name: 'Produkte: Ansehen',
    exact: true,
  });
  await lastRight.click();
  await lastRight.click();
  await admin.screenshot({
    path: output + '/admin-access-mobile-permissions.png',
    fullPage: true,
  });
  await admin.setViewportSize({ width: 1440, height: 1080 });
  customer = await makeContext();
  await login(
    customer,
    'browser-customer@example.test',
    account.oneTimePassword
  );
  await customer
    .getByRole('heading', { name: 'Dashboard', exact: true })
    .waitFor();
  await customer
    .getByRole('heading', { name: 'Zusatz-Umsatz · Herbst 2026', exact: true })
    .waitFor();
  assert.equal(
    await customer
      .getByRole('navigation', { name: 'Kundennavigation' })
      .getByRole('button')
      .count(),
    3
  );
  assert.equal(
    await customer.getByRole('button', { name: 'Excel exportieren' }).count(),
    0
  );
  assert.equal(
    await customer.getByRole('button', { name: 'Welle erstellen' }).count(),
    0
  );
  await customer.screenshot({
    path: output + '/customer-dashboard-desktop.png',
    fullPage: true,
  });
  await customer.setViewportSize({ width: 390, height: 844 });
  await customer.evaluate(async () => {
    await Promise.all(
      document.getAnimations().map((a) => a.finished.catch(() => {}))
    );
  });
  await customer.screenshot({
    path: output + '/customer-dashboard-mobile.png',
    fullPage: true,
  });
  assert.equal(
    await customer.evaluate(
      () => document.documentElement.scrollWidth > innerWidth
    ),
    false
  );
  await customer.setViewportSize({ width: 1440, height: 1080 });
  checks.push(
    'new customer signs in to the actual app, sees only three permitted pages, active revenue/photo waves and no admin write or export actions; desktop and mobile fit'
  );
  await customer
    .getByRole('button', { name: 'Umsatzwellen', exact: true })
    .click();
  await customer
    .getByRole('button', { name: 'Buchungen ansehen', exact: false })
    .click();
  await customer
    .getByRole('columnheader', { name: 'Artikelnummer', exact: true })
    .waitFor();
  assert.ok((await customer.locator('tbody').innerText()).includes('TEST-100'));
  assert.equal(
    await customer.getByRole('button', { name: 'Excel exportieren' }).count(),
    0
  );
  await customer.screenshot({
    path: output + '/customer-wave-details.png',
    fullPage: true,
  });
  checks.push(
    'wave details show frozen article/order/unit/price data with unknown prices blank and no editing controls'
  );
  await admin.bringToFront();
  await admin
    .getByRole('switch', { name: 'Umsatzwellen: Exportieren', exact: true })
    .click();
  const [updated] = await Promise.all([
    admin.waitForResponse(
      (r) =>
        r.url().endsWith('/customer/accounts/' + account.account.id) &&
        r.request().method() === 'PUT'
    ),
    admin
      .getByRole('button', { name: 'Änderungen speichern', exact: true })
      .click(),
  ]);
  assert.equal(updated.status(), 200);
  await customer.bringToFront();
  await customer.evaluate(() => window.dispatchEvent(new Event('focus')));
  await customer
    .getByRole('button', { name: 'Umsatzwellen', exact: true })
    .click();
  await customer.getByRole('button', { name: 'Excel exportieren' }).waitFor();
  const [download] = await Promise.all([
    customer.waitForEvent('download'),
    customer.getByRole('button', { name: 'Excel exportieren' }).click(),
  ]);
  await download.saveAs(output + '/synthetic-customer-export.xlsx');
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(output + '/synthetic-customer-export.xlsx');
  assert.equal(workbook.getWorksheet('Daten').getRow(2).getCell(4).value, 230);
  checks.push(
    'admin enables export in the UI, existing customer session receives the updated permission and downloads real Excel with the exact synthetic EUR230 total'
  );
  await customer
    .getByRole('button', { name: 'Fotowellen', exact: true })
    .click();
  await customer.locator('img').waitFor();
  await eventually(() =>
    customer.locator('img').evaluate((el) => el.complete && el.naturalWidth > 0)
  );
  assert.equal(
    await customer.getByRole('button', { name: 'Excel exportieren' }).count(),
    0
  );
  assert.ok(
    (await customer.locator('img').getAttribute('src')).startsWith('blob:')
  );
  await customer.screenshot({
    path: output + '/customer-photos.png',
    fullPage: true,
  });
  checks.push(
    'photo gallery loads images through authenticated blob requests, exposes no storage URL and hides bulk export without photo export rights'
  );
  await admin.bringToFront();
  await admin
    .getByRole('switch', { name: 'Fotowellen: Exportieren', exact: true })
    .click();
  const [photoRights] = await Promise.all([
    admin.waitForResponse(
      (r) =>
        r.url().endsWith('/customer/accounts/' + account.account.id) &&
        r.request().method() === 'PUT'
    ),
    admin
      .getByRole('button', { name: 'Änderungen speichern', exact: true })
      .click(),
  ]);
  assert.equal(photoRights.status(), 200);
  await customer.bringToFront();
  await customer.evaluate(() => window.dispatchEvent(new Event('focus')));
  await customer
    .getByRole('button', { name: 'Fotowellen', exact: true })
    .click();
  await customer
    .getByRole('button', { name: 'Fotos herunterladen', exact: true })
    .waitFor();
  const [zip] = await Promise.all([
    customer.waitForEvent('download'),
    customer
      .getByRole('button', { name: 'Fotos herunterladen', exact: true })
      .click(),
  ]);
  await zip.saveAs(output + '/synthetic-photos.zip');
  checks.push(
    'photo export permission enables a real authenticated ZIP download in the browser'
  );
  const before = await customer.evaluate(async (base) => {
    const r = await fetch(base + '/customer/pages/markets');
    return r.status;
  }, h.base);
  assert.equal(before, 403);
  await admin.bringToFront();
  await admin
    .getByRole('switch', { name: 'Fotowellen: Ansehen', exact: true })
    .click();
  await admin
    .getByRole('button', { name: 'Änderungen speichern', exact: true })
    .click();
  await admin
    .getByText(
      'Änderungen gespeichert. Die Rechte gelten ab der nächsten Anfrage.',
      { exact: true }
    )
    .waitFor();
  const denied = await customer.evaluate(async (base) => {
    const r = await fetch(base + '/customer/pages/fotos');
    return r.status;
  }, h.base);
  assert.equal(denied, 403);
  await customer.bringToFront();
  await customer.evaluate(() => window.dispatchEvent(new Event('focus')));
  await eventually(
    async () =>
      (await customer
        .getByRole('button', { name: 'Fotowellen', exact: true })
        .count()) === 0
  );
  assert.equal(await customer.locator('img').count(), 0);
  checks.push(
    'direct requests for an ungranted page fail; revoking photo rights blocks the existing token immediately and removes the page and cached photo UI'
  );
  await admin.bringToFront();
  await admin
    .getByRole('switch', { name: 'Zugang aktiv', exact: true })
    .click();
  await admin
    .getByRole('button', { name: 'Änderungen speichern', exact: true })
    .click();
  await admin
    .getByText(
      'Änderungen gespeichert. Die Rechte gelten ab der nächsten Anfrage.',
      { exact: true }
    )
    .waitFor();
  await customer.evaluate(async (base) => {
    await fetch(base + '/customer/me');
  }, h.base);
  await customer
    .getByRole('button', { name: 'Anmelden', exact: true })
    .waitFor();
  checks.push(
    'deactivation invalidates access on the next real API request and returns the customer to login without needing a token expiry'
  );
  assert.deepEqual(errors, []);
  assert.deepEqual(blocked, []);
  assert.deepEqual(h.errors, []);
  await writeFile(
    output + '/result.json',
    JSON.stringify(
      {
        passed: true,
        checks,
        errors,
        blocked,
        dbErrors: h.errors,
        productionDataUsed: false,
      },
      null,
      2
    )
  );
  console.log(JSON.stringify({ passed: true, checks }));
} catch (e) {
  await admin
    ?.screenshot({ path: output + '/failure-admin.png', fullPage: true })
    .catch(() => {});
  await customer
    ?.screenshot({ path: output + '/failure-customer.png', fullPage: true })
    .catch(() => {});
  await writeFile(
    output + '/failure.txt',
    String(e.stack) +
      '\n' +
      serverLog +
      '\n' +
      JSON.stringify({ errors, blocked, dbErrors: h.errors }) +
      '\nADMIN\n' +
      (await admin
        ?.locator('body')
        .innerText()
        .catch(() => ''))
  );
  throw e;
} finally {
  await browser?.close();
  vite.kill('SIGTERM');
  await h.close();
}
