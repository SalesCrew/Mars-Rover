import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdir } from 'node:fs/promises';
const { chromium } = createRequire(import.meta.url)('playwright');
const origin = process.env.UI_TEST_ORIGIN || 'http://127.0.0.1:5173';
assert.ok(['127.0.0.1','localhost'].includes(new URL(origin).hostname),'UI tests must use a local fixture server');
const browser = await chromium.launch({ headless:true, channel:'chrome' });
const context = await browser.newContext({ viewport:{width:1280,height:900} });
await context.route('**/*',route => new URL(route.request().url()).origin === origin ? route.continue() : route.abort());
const page = await context.newPage();
const errors = [];
page.on('pageerror',error => errors.push(error.message));
const open = mode => page.goto(`${origin}/tests/welle-price-preview.html?mode=${mode}`);
const calls = () => page.evaluate(() => window.priceTest.calls);
const posts = async () => (await calls()).filter(call => call.method === 'POST');
const preview = () => page.getByRole('button',{name:'Preise übernehmen',exact:true}).waitFor();
try {
  await open('wizard');
  await page.getByRole('button',{name:'Weiter',exact:true}).waitFor();
  for (let step = 0; step < 10; step++) {
    if (await page.getByRole('button',{name:'Welle aktualisieren',exact:true}).count()) break;
    await page.getByRole('button',{name:'Weiter',exact:true}).click();
  }
  await page.getByRole('button',{name:'Welle aktualisieren',exact:true}).click();
  await preview();
  const log = await calls();
  const save = log.find(call => call.method === 'PUT');
  assert.equal(log.filter(call => call.method === 'PUT').length,1);
  assert.ok(save);
  assert.equal(save.body.schutteItems[0].id,'00000000-0000-4000-8000-000000000040');
  assert.equal(save.body.schutteItems[0].products[0].id,'00000000-0000-4000-8000-000000000014');
  assert.equal(save.body.schutteItems[0].products[0].value,'18.75');
  assert.equal(save.body.paletteItems[0].products[0].value,'24.5');
  assert.equal((await posts()).length,0,'saving unchanged edit must not auto-apply prices');
  assert.ok(log.findIndex(call => call.url.includes('/submission-prices')) > log.indexOf(save));
  await mkdir('outputs/welle-price-correction',{recursive:true});
  await page.screenshot({path:'outputs/welle-price-correction/desktop.png',fullPage:true});
  await page.setViewportSize({width:390,height:844});
  await page.screenshot({path:'outputs/welle-price-correction/mobile.png',fullPage:true});
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth),false);
  await page.getByRole('button',{name:'Buchungspreise beibehalten',exact:true}).click();
  await page.getByRole('dialog').waitFor({state:'detached'});
  assert.equal((await posts()).length,0);
  console.log('PASS unchanged dashboard edit preserves nested IDs, previews after save, decline writes no prices, desktop/mobile fit');

  await open('empty');
  await page.getByText('Fertig',{exact:true}).waitFor();
  assert.equal((await posts()).length,0);
  console.log('PASS no mismatches closes without asking or writing');

  await open('preview');
  await preview();
  await page.getByRole('button',{name:'Preise übernehmen',exact:true}).evaluate(button => { button.click(); button.click(); });
  await page.getByText('27 Buchungspreise wurden aktualisiert.',{exact:true}).waitFor();
  assert.equal((await posts()).length,1);
  console.log('PASS explicit confirmation applies once; double click blocked');

  await open('stale');
  await preview();
  await page.getByRole('button',{name:'Preise übernehmen',exact:true}).click();
  await page.getByRole('alert').waitFor();
  assert.match(await page.getByRole('alert').innerText(),/MR-WELLE-PRICE-STALE-001/);
  assert.equal(await page.getByRole('button',{name:'Preise übernehmen',exact:true}).count(),0);
  assert.equal((await posts()).length,1);
  await page.evaluate(() => { window.priceTest.mode='preview'; });
  await page.getByRole('button',{name:'Erneut prüfen',exact:true}).click();
  await preview();
  assert.equal((await posts()).length,1,'refresh does not auto-confirm');
  await page.getByRole('button',{name:'Preise übernehmen',exact:true}).click();
  await page.getByText('27 Buchungspreise wurden aktualisiert.',{exact:true}).waitFor();
  console.log('PASS stale preview requires fresh preview and explicit second confirmation');

  await open('preview-error');
  await page.getByRole('alert').waitFor();
  assert.match(await page.getByRole('alert').innerText(),/Welle ist gespeichert/);
  await page.evaluate(() => { window.priceTest.mode='preview'; });
  await page.getByRole('button',{name:'Erneut prüfen',exact:true}).click();
  await preview();
  assert.equal((await posts()).length,0);
  assert.equal((await calls()).filter(call => call.method==='PUT').length,0);
  console.log('PASS preview error retry does not repeat normal wave save');

  await open('apply-error');
  await preview();
  await page.getByRole('button',{name:'Preise übernehmen',exact:true}).click();
  await page.getByRole('alert').waitFor();
  assert.match(await page.getByRole('alert').innerText(),/MR-WELLE-PRICE-APPLY-001/);
  assert.equal(await page.getByRole('button',{name:'Preise übernehmen',exact:true}).count(),0);
  assert.equal((await posts()).length,1);
  assert.deepEqual(errors,[]);
  console.log('PASS lost apply response reports uncertainty and cannot blindly replay');
} finally { await browser.close(); }
