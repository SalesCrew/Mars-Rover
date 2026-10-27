import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { spawn } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { createWelleDuplicationHarness, sourceId, image } from './helpers/welle-duplication-harness.mjs';
const {chromium}=createRequire(import.meta.url)('playwright');
const root=fileURLToPath(new URL('../',import.meta.url));
const output=`${root}outputs/welle-duplication-2026-10-28`;
const h=await createWelleDuplicationHarness();
const before=await h.snapshot();
const vite=spawn(process.execPath,[`${root}node_modules/vite/bin/vite.js`,'--host','127.0.0.1','--port','5183','--strictPort'],{
  cwd:root,env:{...process.env,VITE_API_URL:`${h.origin}/api`},stdio:'pipe'});
let viteLog='',browser;
vite.stdout.on('data',chunk=>viteLog+=chunk);vite.stderr.on('data',chunk=>viteLog+=chunk);
const origin='http://127.0.0.1:5183',checks=[];
const passed=message=>{checks.push(message);console.log(`PASS ${message}`);};
try {
  for(let i=0;i<60;i++) {
    try{if((await fetch(origin)).ok)break;}catch{}
    if(i===59)throw new Error(viteLog);await new Promise(r=>setTimeout(r,100));
  }
  for(const role of ['gl','none'])assert.equal((await fetch(`${h.origin}/api/wellen`,{
    method:'POST',headers:{'Content-Type':'application/json','test-role':role},body:'{}'})).status,role==='gl'?403:401);
  assert.equal(h.writes.length,0);
  passed('real create route denies GLs and anonymous callers without writes');
  browser=await chromium.launch({headless:true});
  const context=await browser.newContext({viewport:{width:1280,height:1000},timezoneId:'Europe/Vienna'});
  const blocked=[];
  await context.route('**/*',route=>{
    const url=new URL(route.request().url());
    if([origin,h.origin].includes(url.origin))return route.continue();
    blocked.push(url.origin);return route.abort();
  });
  const page=await context.newPage(),errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  page.on('dialog',dialog=>dialog.accept());
  await page.clock.install({time:new Date('2026-10-28T09:00:00Z')});
  await page.goto(`${origin}/tests/welle-duplication-preview.html`);
  const open=()=>page.getByRole('button',{name:'Hagebau Testwelle duplizieren',exact:true}).click();
  const name=()=>page.getByPlaceholder('z.B. KW 48-49 oder Q4 2024');
  const finish=()=>page.getByRole('button',{name:'Welle erstellen',exact:true});
  const next=async(changePrice=false)=>{
    for(let i=0;i<10;i++) {
      if(await finish().count())return;
      if(changePrice&&await page.getByPlaceholder('z.B. Whiskas Aktionspalette').count()) {
        await page.getByPlaceholder('€/VE',{exact:true}).first().fill('19.99');
      }
      await page.getByRole('button',{name:'Weiter',exact:true}).click();
    }
    throw new Error('Create wizard did not reach its final step');
  };
  await open();assert.equal(await name().inputValue(),'Hagebau Testwelle (Kopie)');
  await page.getByRole('button',{name:'Abbrechen',exact:true}).click();
  assert.deepEqual(await h.snapshot(),before);assert.equal(h.writes.length,0);
  passed('opening and cancelling a duplicate is read only');

  await open();await name().fill('Hagebau zweite Testwelle');
  assert.equal(await page.getByPlaceholder('Start-Datum auswählen').inputValue(),'01.10.2026');
  assert.equal(await page.getByPlaceholder('End-Datum auswählen').inputValue(),'11.12.2026');
  await page.getByPlaceholder('Start-Datum auswählen').click();
  await page.getByRole('button',{name:'29',exact:true}).click();
  await mkdir(output,{recursive:true});
  await page.locator('[class*="modalContent"]').evaluate(element=>{element.scrollTop=0;});
  await page.screenshot({path:`${output}/desktop.png`,fullPage:true,animations:'disabled'});
  await page.setViewportSize({width:390,height:844});
  await page.locator('[class*="modalContent"]').evaluate(element=>{element.scrollTop=0;});
  await page.screenshot({path:`${output}/mobile.png`,fullPage:true,animations:'disabled'});
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  const modal=await page.getByRole('dialog').boundingBox();
  for(const label of ['Zurück','Abbrechen','Weiter']) {
    const button=await page.getByRole('button',{name:label,exact:true}).boundingBox();
    assert.ok(button.x>=modal.x&&button.x+button.width<=modal.x+modal.width,`${label} is clipped on mobile`);
  }
  await page.setViewportSize({width:1280,height:1000});
  await next(true);
  const postsBefore=h.calls.filter(c=>c.method==='POST').length;
  await finish().evaluate(button=>{button.click();button.click();});
  await page.getByRole('button',{name:'Hagebau zweite Testwelle duplizieren',exact:true}).waitFor();
  assert.equal(h.calls.filter(c=>c.method==='POST').length,postsBefore+1);
  const copy=(await h.db.query("select * from wellen where name='Hagebau zweite Testwelle'")).rows[0];
  assert.ok(copy);assert.notEqual(copy.id,sourceId);assert.equal(new Date(copy.start_date).toISOString().slice(0,10),'2026-10-29');
  assert.equal(new Date(copy.end_date).toISOString().slice(0,10),'2026-12-11');assert.equal(Number(copy.goal_value),25000);
  assert.equal(copy.image_url,image);assert.equal(copy.foto_header,'Aufbau-Fotos');
  const source=(await (await fetch(`${h.origin}/api/wellen`)).json()).find(w=>w.id===sourceId);
  const copied=(await (await fetch(`${h.origin}/api/wellen`)).json()).find(w=>w.id===copy.id);
  for(const key of ['displays','kartonwareItems','einzelproduktItems','paletteItems','schutteItems']) {
    assert.equal(copied[key].length,source[key].length);
    const ids=new Set(source[key].map(item=>item.id));
    for(const [index,item] of copied[key].entries()) {
      assert.ok(!ids.has(item.id));assert.equal(item.picture,image);assert.equal(item.name,source[key][index].name);
      if(item.products) {
        assert.deepEqual(item.products.map(p=>p.ve),source[key][index].products.map(p=>p.ve));
        assert.deepEqual(item.products.map(p=>p.ean),source[key][index].products.map(p=>p.ean));
        assert.ok(item.products.every(p=>!source[key][index].products.some(old=>old.id===p.id)));
      }
    }
  }
  assert.equal(Number(copied.paletteItems[0].products[0].valuePerVE),19.99);
  assert.equal(Number(source.paletteItems[0].products[0].valuePerVE),24.5);
  assert.deepEqual(copied.assignedMarketIds,source.assignedMarketIds);assert.equal(copied.assignedMarketCount,42);
  assert.deepEqual(copied.kwDays,source.kwDays);
  assert.deepEqual(copied.fotoTags.map(({name,type})=>({name,type})),source.fotoTags.map(({name,type})=>({name,type})));
  assert.ok(copied.displays.every(item=>item.currentNumber===0));
  assert.equal((await h.db.query('select count(*)::int as n from wellen_submissions where welle_id=$1',[copy.id])).rows[0].n,0);
  assert.equal((await h.db.query('select count(*)::int as n from wellen_photos where welle_id=$1',[copy.id])).rows[0].n,0);
  passed('browser → actual API → PostgreSQL → reload preserves five item types, pictures, tags, KW days and all 42 markets, with fresh IDs and zero results');
  passed('name, dates and nested prices can be changed independently; double click creates exactly one copy; desktop and mobile fit');

  await open();await next();h.controls.failNextCreate=true;
  const failed=page.waitForResponse(r=>r.url()===`${h.origin}/api/wellen`&&r.request().method()==='POST'&&r.status()===503);
  await finish().click();await failed;
  assert.equal(await name().count(),0); // Wizard remains on its final step.
  await finish().waitFor({state:'visible'});
  assert.equal((await h.db.query('select count(*)::int as n from wellen')).rows[0].n,2);
  await finish().click();
  await page.getByRole('button',{name:'Hagebau Testwelle (Kopie) duplizieren',exact:true}).waitFor();
  assert.equal((await h.db.query('select count(*)::int as n from wellen')).rows[0].n,3);
  passed('failed create keeps the populated wizard; explicit retry creates one copy');

  await open();await next();h.controls.failList=true;
  const alert=page.waitForEvent('dialog');
  await finish().click();await alert;
  assert.equal(await finish().count(),0);
  assert.equal((await h.db.query('select count(*)::int as n from wellen')).rows[0].n,4);
  h.controls.failList=false;
  passed('successful create followed by failed list refresh closes the wizard and cannot resubmit it');

  const after=await h.snapshot();
  for(const [table,rows] of Object.entries(before))for(const row of rows) {
    assert.ok(after[table].some(candidate=>JSON.stringify(candidate)===JSON.stringify(row)),`Source row changed in ${table}`);
  }
  assert.ok(h.writes.every(write=>write.method==='POST'));
  assert.deepEqual(after.wellen_submissions,before.wellen_submissions);
  assert.deepEqual(after.wellen_photos,before.wellen_photos);
  assert.deepEqual(h.errors,[]);assert.deepEqual(errors,[]);assert.deepEqual(blocked,[]);
  passed('every source row, historical booking and submitted photo is unchanged; no external network requests');
  await writeFile(`${output}/verification.json`,JSON.stringify({success:true,checks,sourceId,copyId:copy.id,
    copiedMarkets:42,sourceUnchanged:true,externalRequests:blocked,pageErrors:errors},null,2));
} finally {
  if(browser)await browser.close();vite.kill('SIGTERM');await h.close();
}
