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
const cwd = fileURLToPath(new URL('../', import.meta.url));
const output = cwd + 'outputs/customer-access-e2e';
await mkdir(output, { recursive: true });
const h = await createCustomerAccessHarness({actualAdminPages: true});
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
    page.setDefaultTimeout(12000);
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
    'Vorbesteller: Ansehen',
    'Fotos: Ansehen',
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
  const nav = customer.locator('aside nav');
  await customer.getByRole('heading', {name:'Dashboard',exact:true}).waitFor();
  await customer.getByRole('heading', {name:'Aktive Wellen',exact:true}).waitFor();
  await eventually(async()=>!(await customer.locator('[class*=loadingCard]').count()));
  assert.deepEqual(await nav.getByRole('button').allTextContents(),['Dashboard','Vorbesteller','Fotos']);
  assert.equal(await customer.getByRole('button',{name:'Export',exact:true}).count(),0);
  assert.equal(await customer.getByRole('button',{name:/Welle erstellen/}).count(),0);
  await customer.screenshot({path:output+'/customer-dashboard-desktop.png',fullPage:true});
  checks.push('customer uses the actual AdminPanel/AdminDashboard with the same KPI cards, filters and wave cards; only permitted pages appear in production order');
  await customer.getByRole('button',{name:'Profilmenü öffnen'}).click();
  assert.equal(await customer.getByRole('button',{name:'Mitarbeiter verwalten'}).count(),0);
  assert.equal(await customer.getByRole('button',{name:'Kundenzugänge',exact:true}).count(),0);
  await customer.keyboard.press('Escape');
  await nav.getByRole('button',{name:'Vorbesteller',exact:true}).click();
  await customer.getByRole('heading',{name:'Aktive Wellen',exact:true}).waitFor();
  await customer.getByText('Zusatz-Umsatz · Herbst 2026',{exact:true}).click();
  await customer.locator('[class*=modalOverlay]').waitFor();
  assert.equal(await customer.getByRole('button',{name:/archivieren|Welle duplizieren|Welle bearbeiten|Quartalspreise/i}).count(),0);
  await customer.screenshot({path:output+'/customer-wave-details.png',fullPage:true});
  await customer.locator('[class*=closeButton]').last().click();
  await nav.getByRole('button',{name:'Fotos',exact:true}).click();
  await customer.locator('[class*=photoCard] img').first().waitFor();
  await eventually(()=>customer.locator('[class*=photoCard] img').first().evaluate(el=>el.complete&&el.naturalWidth>0));
  await customer.locator('[class*=photoCard]').first().click();
  assert.equal(await customer.getByRole('button',{name:'Foto löschen'}).count(),0);
  assert.equal(await customer.getByRole('button',{name:'Export',exact:true}).count(),0);
  await customer.screenshot({path:output+'/customer-photos.png',fullPage:true});
  await customer.locator('[class*=lightboxClose]').click();
  checks.push('the original Vorbesteller detail modal and Fotos gallery/lightbox keep read interactions and omit all mutation actions');
  const saveRights=async()=>{
    const [r]=await Promise.all([admin.waitForResponse(r=>r.url().endsWith('/customer/accounts/'+account.account.id)&&r.request().method()==='PUT'),admin.getByRole('button',{name:'Änderungen speichern',exact:true}).click()]);
    assert.equal(r.status(),200);
    await customer.evaluate(()=>window.dispatchEvent(new Event('focus')));
  };
  await admin.bringToFront();
  const names=['Dashboard','Märkte','Gebietsleiter','Vorbesteller','Vorverkauf','Produktersatz','NaRa Incentive','Fragebogen','Zeiterfassung','Fotos','Produkte'];
  for(const name of names){const control=admin.getByRole('switch',{name:name+': Ansehen',exact:true});if(await control.getAttribute('aria-checked')!=='true')await control.click();}
  await saveRights();
  await eventually(async()=>(await nav.getByRole('button').count())===11);
  assert.deepEqual(await nav.getByRole('button').allTextContents(),names);
  const failures=[];
  customer.on('response',r=>{if(r.url().startsWith(h.base)&&r.status()>=400)failures.push({url:r.url(),status:r.status()});});
  for(const name of names){
    await nav.getByRole('button',{name,exact:true}).click();
    await customer.locator('main > header').getByRole('heading',{name,exact:true}).waitFor();
    await customer.waitForTimeout(250);
    assert.equal(await customer.getByRole('button',{name:/^(Export|Excel Export|Fotofragen ZIP|Alle Märkte exportieren|Produkt-Update|Welle erstellen|Modul erstellen|Fragebogen erstellen|GL erstellen|Markt erstellen|Import|Speichern|Löschen)$/}).count(),0,name);
    await customer.screenshot({path:output+'/customer-page-'+names.indexOf(name)+'.png',fullPage:true});
  }
  assert.deepEqual(failures,[]);
  checks.push('all 11 real admin pages render via their original routers with synthetic PostgreSQL data, in the exact production order, with no write/export controls for a view-only customer');
  await admin.bringToFront();
  await admin.getByRole('switch',{name:'Dashboard: Exportieren',exact:true}).click();
  await saveRights();
  await nav.getByRole('button',{name:'Dashboard',exact:true}).click();
  await customer.getByRole('button',{name:'Export',exact:true}).waitFor();
  await customer.getByRole('button',{name:'Export',exact:true}).click();
  await customer.getByText('Wellen Vorbestellungen',{exact:false}).first().waitFor();
  assert.equal(await customer.getByText('Markt-Historie',{exact:true}).count(),0);
  await customer.screenshot({path:output+'/customer-export-permitted.png',fullPage:true});
  await customer.getByRole('checkbox',{name:/Wellen Vorbestellungen/}).check();
  const [download] = await Promise.all([customer.waitForEvent('download'),customer.getByRole('button',{name:'Export starten',exact:true}).click()]);
  await download.saveAs(output+'/synthetic-admin-page-export.xlsx');
  await customer.getByRole('heading',{name:'Daten Exportieren',exact:true}).waitFor({state:'hidden'});
  checks.push('granting dashboard export in the admin editor enables the original custom export dialog; datasets without export permission remain excluded');
  await admin.bringToFront();
  await admin.getByRole('switch',{name:'Dashboard: Exportieren',exact:true}).click();
  await admin.getByRole('switch',{name:'Fotos: Ansehen',exact:true}).click();
  await saveRights();
  await eventually(async()=>(await nav.getByRole('button',{name:'Fotos',exact:true}).count())===0);
  await eventually(async()=>(await customer.getByRole('button',{name:'Export',exact:true}).count())===0);
  const denied=await customer.evaluate(async base=>(await fetch(base+'/wellen/photos')).status,h.base);
  assert.equal(denied,403);
  checks.push('revoking view/export rights changes the existing session and immediately blocks direct requests on the server');
  await admin.getByRole('switch',{name:'Zugang aktiv',exact:true}).click();
  await saveRights();
  await customer.evaluate(async base=>{await fetch(base+'/customer/me');},h.base);
  await customer.getByRole('button',{name:'Anmelden',exact:true}).waitFor();
  checks.push('deactivation returns the customer to login and blocks the existing token');
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
