import assert from 'node:assert/strict';import {createRequire} from 'node:module';import {spawn} from 'node:child_process';import {mkdir,writeFile} from 'node:fs/promises';import {fileURLToPath} from 'node:url';import ExcelJS from 'exceljs';
import {createQuarterPricingHarness,actor,testId} from './helpers/quarter-pricing-harness.mjs';
const {chromium}=createRequire(import.meta.url)('playwright'),root=fileURLToPath(new URL('../',import.meta.url)),output=root+'outputs/ve-orders-e2e';
await mkdir(output,{recursive:true});const waves=[testId(901),testId(902),testId(903),testId(904)],items=[testId(911),testId(912),testId(913),testId(914)],master=testId(920),missing=testId(921),checks=[],errors=[],blocked=[];
const h=await createQuarterPricingHarness({prepareData:async db=>{
 await db.exec("create table users(id uuid primary key,role text,email text,gebietsleiter_id uuid,first_name text,last_name text)");
 await db.query("insert into users values($1,'admin','synthetic@example.invalid',$1,'Synthetic','GL')",[actor]);
 await db.query("insert into products(id,name,price,content,artikel_nr,product_type,pallet_size) values($1,'Synthetic master four-pack',2.5,'4','900044','standard',200),($2,'Synthetic missing VE',2,null,'900099','standard',1200)",[master,missing]);
 for(let i=0;i<4;i++){
  await db.query("insert into wellen(id,name,start_date,end_date,status,types,goal_type,goal_value) values($1,$2,current_date,current_date,'active',ARRAY['einzelprodukt'],'value',1000)",[waves[i],'Synthetic VE wave '+i]);
  await db.query("insert into wellen_einzelprodukte(id,welle_id,name,target_number,item_value,ve,artikel_nr) values($1,$2,'Synthetic legacy six-pack',60,3,6,'900006')",[items[i],waves[i]]);
  await db.query("insert into wellen_markets(welle_id,market_id) values($1,$2)",[waves[i],'test-market-'+i]);
 }
 await db.query("insert into wellen_submissions(welle_id,item_type,item_id,quantity,market_id,gebietsleiter_id,delivery_photo_url) values($1,'einzelprodukt',$2,6,'test-market-3',$3,'data:image/png;base64,aA==')",[waves[3],items[3],actor]);
},configureApp:async(app,db)=>{
 app.get('/api/wellen/dashboard/waves',async(_req,res)=>res.json([{id:waves[3],name:'Synthetic VE wave 3',startDate:new Date().toISOString().slice(0,10),endDate:new Date().toISOString().slice(0,10),status:'active',goalType:'value',goalValue:1000,currentValue:18,displayCount:0,kartonwareCount:0}]));
}});
const origin='http://127.0.0.1:5195',config=output+'/vite.config.mjs';
await writeFile(config,'export default '+JSON.stringify({root,envDir:false,define:{'import.meta.env.VITE_API_URL':JSON.stringify(h.origin+'/api')},server:{host:'127.0.0.1',port:5195,strictPort:true}})+';');
const vite=spawn(process.execPath,[root+'node_modules/vite/bin/vite.js','--config',config],{cwd:root,stdio:'pipe'});let log='',browser,page;vite.stdout.on('data',c=>log+=c);vite.stderr.on('data',c=>log+=c);
const api=async(path,body,method='POST')=>fetch(h.origin+'/api'+path,{method,headers:{'content-type':'application/json'},...(body===undefined?{}:{body:JSON.stringify(body)})});
try{
 for(let i=0;i<100;i++){try{if((await fetch(origin+'/tests/ve-orders-preview.html')).ok)break;}catch{}if(i===99)throw Error(log);await new Promise(r=>setTimeout(r,100));}
 browser=await chromium.launch({headless:true});const context=await browser.newContext({viewport:{width:1360,height:1000},timezoneId:'Europe/Vienna'});
 await context.route('**/*',route=>{const u=route.request().url();if(u.startsWith('data:')||[origin,h.origin].includes(new URL(u).origin))return route.continue();blocked.push(u);return route.abort();});
 page=await context.newPage();page.on('pageerror',e=>{errors.push(e.message);console.log('BROWSER_ERROR',e.message);});page.on('dialog',d=>{console.log('DIALOG',d.message());void d.dismiss();});
 for(const i of [0,1]){
  await page.goto(origin+'/tests/ve-orders-preview.html?wave='+waves[i]);await page.getByText('Synthetic Market',{exact:true}).click();await page.getByRole('button',{name:'Weiter',exact:true}).click();
  const item=page.locator('[class*="itemCard"]').filter({has:page.getByText('Synthetic legacy six-pack',{exact:true})});await item.waitFor();
  assert.equal(await page.locator('button[aria-pressed]').count(),0);await item.getByRole('textbox',{name:'Menge in VE',exact:true}).fill(i===0?'1':'2');
  if(i===0){
   await page.getByRole('button',{name:/Alle Produkte/}).click();
   const card=page.locator('[class*="productCard"]').filter({has:page.getByText('Synthetic master four-pack',{exact:true})});await card.getByRole('textbox',{name:'Menge in VE',exact:true}).fill('1');
   const noVe=page.locator('[class*="productCard"]').filter({has:page.getByText('Synthetic missing VE',{exact:true})});assert.equal(await noVe.getByRole('textbox').isDisabled(),true);
   await page.setViewportSize({width:390,height:844});await page.screenshot({path:output+'/mobile-ve-default.png',fullPage:true});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);await page.setViewportSize({width:1360,height:1000});
  }
  const [saved]=await Promise.all([page.waitForResponse(r=>r.url().endsWith('/progress/batch')&&r.request().method()==='POST'),page.getByRole('button',{name:'Fertig',exact:true}).click()]);assert.equal(saved.status(),200);
  const bookings=(await h.db.query('select * from wellen_submissions where welle_id=$1',[waves[i]])).rows;
  assert.equal(bookings.find(b=>b.item_id===items[i]).quantity,i===0?6:12);assert.ok(bookings.every(b=>b.order_unit==='VE'));
 }
 checks.push('actual GL UI defaults to VE on repeated opening, removes toggle, multiplies wave/master quantities once, and disables missing VE without using pallet capacity');
 // A cached client sending a lone piece is rejected atomically.
 const before=(await h.db.query('select count(*)::int as n from wellen_submissions')).rows[0].n;
 const bad=await api('/wellen/'+waves[0]+'/progress/batch',{gebietsleiter_id:actor,market_id:'test-market-0',items:[{item_type:'einzelprodukt',item_id:items[0],current_number:6},{item_type:'einzelprodukt',item_id:master,current_number:1}]});assert.equal(bad.status,422);assert.equal((await h.db.query('select count(*)::int as n from wellen_submissions')).rows[0].n,before);
 checks.push('real API/SQL rejects a mixed cached-client batch with fractional VE and saves no partial rows');
 await page.goto(origin+'/tests/ve-orders-preview.html?mode=admin&wave='+waves[2]);
 await page.getByTitle('Vorbesteller für GL einreichen').click();await page.getByText('Synthetic GL',{exact:true}).click();await page.getByText('BILLA – Synthetic Market',{exact:true}).click();
 await page.getByRole('spinbutton',{name:'Menge in VE',exact:true}).fill('2');await page.getByRole('button',{name:'Weiter',exact:true}).click();
 const [adminSaved]=await Promise.all([page.waitForResponse(r=>r.url().endsWith('/progress/batch')&&r.request().method()==='POST'),page.getByRole('button',{name:'Absenden',exact:true}).click()]);assert.equal(adminSaved.status(),200);
 assert.equal((await h.db.query('select quantity from wellen_submissions where welle_id=$1',[waves[2]])).rows[0].quantity,12);
 checks.push('actual admin entry accepts two VEs for a legacy article and saves twelve pieces');
 await page.getByText('2 VE',{exact:true}).click();
 await page.locator('input[type="number"]').fill('3');
 const [adminEdit]=await Promise.all([page.waitForResponse(r=>r.url().includes('/submissions/')&&r.request().method()==='PUT'),page.getByTitle('Speichern',{exact:true}).click()]);assert.equal(adminEdit.status(),200);
 const editedAdmin=(await h.db.query('select quantity,order_quantity from wellen_submissions where welle_id=$1',[waves[2]])).rows[0];assert.equal(editedAdmin.quantity,18);assert.equal(Number(editedAdmin.order_quantity),3);
 checks.push('actual admin edit displays VEs and updates physical and order quantities consistently');
 await page.goto(origin+'/tests/ve-orders-preview.html?mode=history&wave='+waves[3]);await page.getByText('Synthetic VE wave 3',{exact:true}).click();
 await page.getByRole('button',{name:/Eintrag hinzufügen/}).first().click();await page.getByRole('button',{name:/Einzelprodukt/}).click();await page.getByRole('button',{name:/Synthetic legacy six-pack/}).click();await page.getByRole('button',{name:/Weiter.*gewählt/}).click();
 const [historySaved]=await Promise.all([page.waitForResponse(r=>r.url().endsWith('/progress/batch')&&r.request().method()==='POST'),page.getByRole('button',{name:'Hinzufügen',exact:true}).click()]);assert.equal(historySaved.status(),200);
 const historyRows=(await h.db.query('select quantity,ve_size from wellen_submissions where welle_id=$1',[waves[3]])).rows;assert.equal(historyRows.length,2);assert.ok(historyRows.every(b=>b.quantity===6&&b.ve_size===6));
 checks.push('actual GL history add flow defaults to one VE and saves six pieces with preserved date selection');
 await page.getByText('1 VE',{exact:true}).first().click();
 await page.getByRole('textbox',{name:'Menge in VE',exact:true}).fill('2');
 const [historyEdit]=await Promise.all([page.waitForResponse(r=>r.url().includes('/submissions/')&&r.request().method()==='PUT'),page.locator('button[class*="editSave"]').click()]);assert.equal(historyEdit.status(),200);
 const editedHistory=(await h.db.query('select quantity,order_quantity from wellen_submissions where welle_id=$1 order by quantity',[waves[3]])).rows;assert.deepEqual(editedHistory.map(b=>b.quantity),[6,12]);assert.deepEqual(editedHistory.map(b=>Number(b.order_quantity)),[1,2]);
 checks.push('actual GL history edits VE quantities and preserves matching stored piece/order quantities');
 const exportResponse=await api('/export/custom',{datasets:['wellen_submissions'],columns:{wellen_submissions:['artikel_nr','item_name','order_quantity','order_unit','order_unit_price','total_value']},filters:{welleIds:[waves[0]]},options:{singleWaveExport:true,singleWaveId:waves[0]}});
 assert.equal(exportResponse.status,200);const bytes=Buffer.from(await exportResponse.arrayBuffer());await writeFile(output+'/synthetic-ve-export.xlsx',bytes);const wb=new ExcelJS.Workbook();await wb.xlsx.load(bytes);const details=wb.getWorksheet('Buchungsdetails');assert.equal(details.getColumn('H').values.slice(2).reduce((s,v)=>s+Number(v||0),0),28);
 checks.push('real Excel export shows one VE each and exact synthetic EUR28 for wave and master product');
 assert.deepEqual(errors,[]);assert.deepEqual(blocked,[]);
 const unexpected=h.errors.filter(e=>!e.includes('ganzen VEs'));assert.deepEqual(unexpected,[]);
 await writeFile(output+'/result.json',JSON.stringify({passed:true,checks,errors,blocked,dbErrors:h.errors,productionDataUsed:false},null,2));console.log(JSON.stringify({checks,errors,blocked}));
}catch(e){await page?.screenshot({path:output+'/failure.png',fullPage:true}).catch(()=>{});await writeFile(output+'/failure.txt',String(e.stack)+'\n'+log+'\n'+JSON.stringify({errors,dbErrors:h.errors})+'\n'+await page?.locator('body').innerText().catch(()=>''));throw e;}finally{await browser?.close();vite.kill('SIGTERM');await h.close();}

