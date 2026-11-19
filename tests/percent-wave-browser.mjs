import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { spawn } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import ExcelJS from 'exceljs';
import {
  createQuarterPricingHarness,
  actor,
  testId,
} from './helpers/quarter-pricing-harness.mjs';
const { chromium } = createRequire(import.meta.url)(
  '/Users/kiliansternath/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'
);
const root = fileURLToPath(new URL('../', import.meta.url)),
  output = root + 'outputs/percent-waves-e2e';
await mkdir(output, { recursive: true });
const waves = [testId(951), testId(952), testId(953)],
  items = [testId(961), testId(962), testId(963)];
const names = ['Billa+ Durcharbeiten', 'Billa+ Wertaktion', 'Zusatz-Umsatz'];
const h = await createQuarterPricingHarness({
  prepareData: async (db) => {
    await db.exec(
      'CREATE TABLE users(id uuid PRIMARY KEY,role text,email text,gebietsleiter_id uuid,first_name text,last_name text)'
    );
    await db.query(
      "INSERT INTO users VALUES($1,'gl','synthetic@example.invalid',$1,'Synthetic','GL')",
      [actor]
    );
    for (let i = 0; i < 3; i++)
      await db.query('UPDATE markets SET name=$1 WHERE id=$2', [
        'Synthetic Market ' + i,
        'test-market-' + i,
      ]);
    for (let i = 0; i < 3; i++) {
      await db.query(
        "INSERT INTO wellen(id,name,start_date,end_date,status,types,goal_type,goal_percentage,goal_value,no_limit_welle) VALUES($1,$2,current_date,current_date,'active',ARRAY['display'],$3,$4,$5,$6)",
        [
          waves[i],
          names[i],
          i === 1 ? 'value' : 'percentage',
          i === 0 ? 80 : i === 2 ? 0 : null,
          i === 1 ? 10000 : null,
          i === 2,
        ]
      );
      await db.query(
        "INSERT INTO wellen_displays(id,welle_id,name,target_number,item_value,artikel_nr) VALUES($1,$2,'Synthetic priced display',10,120,'SYNTHETIC-120')",
        [items[i], waves[i]]
      );
      await db.query(
        'UPDATE wellen SET catalog_pricing_required=true WHERE id=$1',
        [waves[i]]
      );
      await db.query(
        "UPDATE wellen_displays SET catalog_key='food:display:900001',catalog_ve_size=1,catalog_order_price=120,artikel_nr='900001' WHERE id=$1",
        [items[i]]
      );
      for (let market = 0; market < 3; market++)
        await db.query(
          'INSERT INTO wellen_markets(welle_id,market_id) VALUES($1,$2)',
          [waves[i], 'test-market-' + market]
        );
      await db.query(
        "INSERT INTO wellen_submissions(welle_id,item_id,item_type,market_id,gebietsleiter_id,quantity,value_per_unit) VALUES($1,$2,'display','test-market-0',$3,3,120)",
        [waves[i], items[i], actor]
      );
    }
    await db.query(
      "UPDATE wellen_submissions SET delivery_photo_url='data:image/png;base64,aA=='"
    );
  },
  configureApp: async (app, db) => {
    // History's summary dependency is synthetic; progress, booking and export use
    // the actual backend routers and isolated PostgreSQL functions.
    app.get('/api/wellen/dashboard/waves', async (_req, res) => {
      const rows = (
        await db.query('SELECT * FROM wellen WHERE id=ANY($1)', [waves])
      ).rows;
      res.json(
        rows.map((w) => ({
          id: w.id,
          name: w.name,
          startDate: w.start_date.toISOString().slice(0, 10),
          endDate: w.end_date.toISOString().slice(0, 10),
          status: w.status,
          goalType: w.goal_type,
          goalPercentage: Number(w.goal_percentage),
          goalValue: Number(w.goal_value),
          noLimitWelle: w.no_limit_welle,
          displayCount: 3,
          kartonwareCount: 0,
          currentValue: 360,
        }))
      );
    });
    app.get('/api/vorverkauf', (_req, res) => res.json([]));
    app.get('/api/fragebogen/*', (_req, res) => res.json([]));
  },
});
const origin = 'http://127.0.0.1:5199',
  config = output + '/vite.config.mjs';
await writeFile(
  config,
  'export default ' +
    JSON.stringify({
      root,
      envDir: false,
      define: {
        'import.meta.env.VITE_API_URL': JSON.stringify(h.origin + '/api'),
      },
      server: { host: '127.0.0.1', port: 5199, strictPort: true },
    }) +
    ';'
);
const vite = spawn(
  process.execPath,
  [root + 'node_modules/vite/bin/vite.js', '--config', config],
  { cwd: root, stdio: 'pipe' }
);
let serverLog = '',
  browser,
  page;
vite.stdout.on('data', (x) => (serverLog += x));
vite.stderr.on('data', (x) => (serverLog += x));
const checks = [],
  errors = [],
  blocked = [];
const api = async (path, body, method = 'GET') =>
  fetch(h.origin + '/api' + path, {
    method,
    headers: { 'Content-Type': 'application/json', 'test-role': 'admin' },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
const snapshot = async () => ({
  waves: (
    await h.db.query(
      'SELECT id,goal_type,no_limit_welle FROM wellen ORDER BY id'
    )
  ).rows,
  items: (
    await h.db.query('SELECT id,item_value FROM wellen_displays ORDER BY id')
  ).rows,
  bookings: (await h.db.query('SELECT * FROM wellen_submissions ORDER BY id'))
    .rows,
});
try {
  for (let i = 0; i < 100; i++) {
    try {
      if ((await fetch(origin + '/tests/percent-wave-preview.html')).ok) break;
    } catch {}
    if (i === 99) throw Error(serverLog);
    await new Promise((r) => setTimeout(r, 100));
  }
  browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1360, height: 1000 },
    timezoneId: 'Europe/Vienna',
  });
  await context.route('**/*', (r) => {
    const u = new URL(r.request().url());
    if (u.hostname === 'fonts.googleapis.com')
      return r.fulfill({ status: 200, contentType: 'text/css', body: '' });
    if (
      ['http:', 'https:'].includes(u.protocol) &&
      !['127.0.0.1', 'localhost'].includes(u.hostname)
    ) {
      blocked.push(u.origin);
      return r.abort();
    }
    return r.continue();
  });
  page = await context.newPage();
  page.setDefaultTimeout(12000);
  page.on('pageerror', (e) => {
    errors.push(e.message);
    console.log('BROWSER_ERROR', e.message);
  });
  page.on('dialog', (d) => d.dismiss());
  const before = await snapshot();
  for (let i = 0; i < 3; i++) {
    await page.goto(
      `${origin}/tests/percent-wave-preview.html?mode=admin&wave=${waves[i]}`
    );
    await page.getByText('Synthetic GL', { exact: true }).waitFor();
    const money = await page.locator('body').innerText();
    assert.equal(money.includes('€'), i !== 0, `${names[i]} monetary display`);
    if (i === 0) {
      assert.ok(money.includes('80%'));
      assert.ok(money.includes('3 Stk'));
      assert.ok(!money.includes('Gesamtwert'));
      await page.screenshot({
        path: output + '/percentage-admin.png',
        fullPage: true,
        animations: 'disabled',
      });
      await page.getByTitle('Nach Tagen', { exact: true }).click();
      const day = page.locator('[class*=dayHeader]').first();
      await day.waitFor();
      assert.ok(!(await page.locator('body').innerText()).includes('€'));
      await day.click();
      await page.screenshot({
        path: output + '/percentage-days.png',
        fullPage: true,
        animations: 'disabled',
      });
    }
    await page
      .getByTitle('Vorbesteller für GL einreichen', { exact: true })
      .click();
    await page.getByText('Synthetic GL', { exact: true }).click();
    await page
      .getByText('BILLA – Synthetic Market 0', { exact: true })
      .first()
      .click();
    await page.locator('input[type=number]').first().fill('1');
    assert.equal(
      (await page.locator('body').innerText()).includes('€'),
      i !== 0
    );
    await page.getByRole('button', { name: 'Weiter', exact: true }).click();
    assert.equal(
      (await page.locator('body').innerText()).includes('€'),
      i !== 0
    );
  }
  checks.push(
    'admin GL totals, per-item values, day groups, footer and manual-entry steps follow the wave goal; priced percentage waves show pieces/%; value and unlimited revenue waves retain prices'
  );
  for (let i = 0; i < 3; i++) {
    await page.goto(
      `${origin}/tests/percent-wave-preview.html?mode=detail&wave=${waves[i]}`
    );
    await page.getByRole('heading', { name: names[i], exact: true }).waitFor();
    assert.equal(
      (await page.locator('body').innerText()).includes('€'),
      i === 1
    );
  }
  await page.goto(
    `${origin}/tests/percent-wave-preview.html?mode=card&wave=${waves[0]}`
  );
  await page.getByText('80%', { exact: false }).first().waitFor();
  assert.ok(!(await page.locator('body').innerText()).includes('€'));
  checks.push(
    'wave definition and progress cards preserve percentage goals with stored export prices'
  );
  for (let i = 0; i < 3; i++) {
    await page.goto(
      `${origin}/tests/percent-wave-preview.html?mode=gl&wave=${waves[i]}`
    );
    await page.getByText('Synthetic Market ' + i, { exact: true }).click();
    await page.getByRole('button', { name: 'Weiter', exact: true }).click();
    const item = page
      .locator('[class*=itemCard]')
      .filter({
        has: page.getByText('Synthetic priced display', { exact: true }),
      });
    await item.waitFor();
    assert.equal(
      (await page.locator('body').innerText()).includes('€'),
      i !== 0
    );
    await item.getByRole('textbox').fill('1');
    if (i === 0) {
      await page.screenshot({
        path: output + '/percentage-gl-entry.png',
        fullPage: true,
        animations: 'disabled',
      });
      await page.setViewportSize({ width: 390, height: 844 });
      assert.equal(
        await page.evaluate(
          () => document.documentElement.scrollWidth > innerWidth
        ),
        false
      );
      await page.screenshot({
        path: output + '/percentage-gl-mobile.png',
        fullPage: true,
        animations: 'disabled',
      });
      await page.setViewportSize({ width: 1360, height: 1000 });
    }
    if (i === 0) {
      const [response] = await Promise.all([
        page.waitForResponse(
          (r) =>
            r.url().endsWith('/progress/batch') &&
            r.request().method() === 'POST'
        ),
        page.getByRole('button', { name: 'Fertig', exact: true }).click(),
      ]);
      assert.equal(response.status(), 200);
      await page
        .getByText('Hervorragende Leistung!', { exact: true })
        .waitFor();
      assert.ok(!(await page.locator('body').innerText()).includes('€'));
      await page.screenshot({
        path: output + '/percentage-gl-success.png',
        fullPage: true,
        animations: 'disabled',
      });
    }
  }
  checks.push(
    'GL article selection and success confirmation hide euro amounts for percentage waves while value/unlimited waves show them; whole display booking still succeeds in isolated PostgreSQL'
  );
  await page.goto(`${origin}/tests/percent-wave-preview.html?mode=history`);
  for (let i = 0; i < 3; i++) {
    const card = page
      .locator('[class*=waveCard]')
      .filter({
        has: page.getByRole('heading', { name: names[i], exact: true }),
      });
    await card.waitFor();
    await card.locator('[class*=waveHeader]').click();
    await card
      .getByText('Synthetic priced display', { exact: true })
      .first()
      .waitFor();
    assert.equal((await card.innerText()).includes('€'), i !== 0);
  }
  await page.screenshot({ path: output + '/gl-history.png', fullPage: true });
  checks.push(
    'GL history follows wave goals on totals, days and individual entries rather than switching to euros when prices exist'
  );
  const after = await snapshot();
  assert.deepEqual(after.waves, before.waves);
  assert.deepEqual(after.items, before.items);
  assert.equal(after.bookings.length, before.bookings.length + 1);
  for (const row of before.bookings)
    assert.deepEqual(
      after.bookings.find((r) => r.id === row.id),
      row
    );
  const rows = (
    await h.db.query(
      'SELECT quantity,value_per_unit FROM wellen_submissions WHERE welle_id=$1',
      [waves[0]]
    )
  ).rows;
  assert.equal(
    rows.reduce((n, r) => n + Number(r.quantity) * Number(r.value_per_unit), 0),
    480
  );
  const result = await api(
    '/export/custom',
    {
      datasets: ['wellen_submissions'],
      columns: {
        wellen_submissions: [
          'artikel_nr',
          'quantity',
          'value_per_unit',
          'total_value',
        ],
      },
      filters: { welleIds: [waves[0]] },
      options: { singleWaveExport: true, singleWaveId: waves[0] },
    },
    'POST'
  );
  assert.equal(result.status, 200);
  const bytes = Buffer.from(await result.arrayBuffer());
  await writeFile(output + '/synthetic-percentage-export.xlsx', bytes);
  const book = new ExcelJS.Workbook();
  await book.xlsx.load(bytes);
  const details = book.getWorksheet('Buchungsdetails');
  assert.ok(details);
  const sum = details
    .getColumn('H')
    .values.slice(2)
    .reduce((n, v) => n + Number(v || 0), 0);
  assert.equal(sum, 480);
  checks.push(
    'all pre-existing booking prices/quantities and wave goals are unchanged; actual Excel export retains EUR 480 for the percentage wave including the synthetic GL order'
  );
  assert.deepEqual(errors, []);
  assert.deepEqual(blocked, []);
  assert.deepEqual(h.errors, []);
  const proof = {
    passed: true,
    checks,
    errors,
    blocked,
    dbErrors: h.errors,
    productionDataUsed: false,
    productionConnections: false,
    exportValue: sum,
  };
  await writeFile(output + '/result.json', JSON.stringify(proof, null, 2));
  console.log(JSON.stringify(proof));
} catch (e) {
  await page
    ?.screenshot({ path: output + '/failure.png', fullPage: true })
    .catch(() => {});
  await writeFile(
    output + '/failure.txt',
    String(e.stack) +
      '\n' +
      JSON.stringify({ errors, blocked, dbErrors: h.errors }) +
      '\n' +
      serverLog
  );
  throw e;
} finally {
  await browser?.close();
  vite.kill('SIGTERM');
  await h.close();
}
