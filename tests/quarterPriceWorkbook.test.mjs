import assert from 'node:assert/strict';
import { test } from 'node:test';
import ExcelJS from 'exceljs';
import { parseQuarterPriceWorkbook } from '../src/utils/quarterPriceWorkbook.ts';
const file=async(workbook)=>new File([await workbook.xlsx.writeBuffer()],'synthetic-price-list.xlsx');
function food(){const w=new ExcelJS.Workbook();const main=w.addWorksheet('Einzelitems ab 01.10.2026');main.getCell('B4').value='Artikelbezeichnung';main.getCell('G4').value='Art. Nr.';main.getCell('D4').value='Inhalt pro VE';main.getCell('J4').value='GH VE';main.getCell('B5').value='Synthetic Rice';main.getCell('G5').value=900001;main.getCell('D5').value=6;main.getCell('J5').value=18;
 const d=w.addWorksheet(' Displays ab 01.10.2026');d.getCell('E4').value='Art. Nr.';d.getCell('H4').value='GH';d.getCell('A1').value='Preisliste Displays Nährmittel';d.getCell('A3').value='Gültig ab 01.10.2026';d.getCell('A5').value='Synthetic Display';d.getCell('B5').value=900001;d.getCell('E5').value=900002;d.getCell('H5').value=120;d.mergeCells('E5:E6');d.mergeCells('H5:H6');return w;}
test('reads VE prices and true display article instead of component; merged display has one entry',async()=>{
 const r=await parseQuarterPriceWorkbook(await file(food()),2026,4);
 assert.equal(r.rows.length,3);assert.equal(r.sha256.length,64);
 assert.deepEqual(r.rows.filter(x=>x.item_type==='display').map(x=>[x.artikel_nr,x.price_per_order]),[['900002',120]]);
 const single=r.rows.find(x=>x.item_type==='einzelprodukt');assert.equal(single.units_per_ve,6);assert.equal(single.price_per_order,18);
});
test('rejects the wrong quarter and contradictory duplicates before any API write',async()=>{
 await assert.rejects(parseQuarterPriceWorkbook(await file(food()),2026,3),/belegt nicht/);
 const w=food();w.worksheets[0].getCell('B6').value='Synthetic Rice Other';w.worksheets[0].getCell('G6').value=900001;w.worksheets[0].getCell('D6').value=6;w.worksheets[0].getCell('J6').value=19;
 await assert.rejects(parseQuarterPriceWorkbook(await file(w),2026,4),/Widersprüchliche/);
});
test('skips hidden legacy sheets and delists; pet display and copack use distinct parent SKU columns',async()=>{
 const w=new ExcelJS.Workbook();const d=w.addWorksheet('Displays ab Q4 2026');d.getCell('H4').value='Art. Nr. Display';d.getCell('K4').value='Preis';d.getCell('A3').value='Gültig ab Q4 2026';d.getCell('A5').value='Synthetic Pet Display';d.getCell('A6').value='1/4 Display';d.getCell('C5').value=900101;d.getCell('H5').value=900102;d.getCell('K5').value=240;
 const c=w.addWorksheet('PC Copacks Sonderartikel Q4 26');c.getCell('J3').value='Artnr.';c.getCell('O3').value='GH*';c.getCell('A2').value='Gültig ab Q4 2026';c.getCell('A4').value='Synthetic Megapack';c.getCell('C4').value='1 Stück';c.getCell('D4').value=900103;c.getCell('J4').value=900104;c.getCell('O4').value=80;c.getCell('M4').value='Synthetic customer';
 w.addWorksheet('Tiernahrungsdisplays Q4',{state:'hidden'}).getCell('A3').value='Gültig ab Q4 2000';w.addWorksheet('DELISTS Q4 2026');
 const r=await parseQuarterPriceWorkbook(await file(w),2026,4);assert.equal(r.rows.length,2);assert.equal(r.rows[0].artikel_nr,'900102');assert.equal(r.rows[1].artikel_nr,'900104');assert.equal(r.rows[1].scope_note,'Synthetic customer');
});
test('older pet layouts resolve article and VE price from headers, never mistake EAN for article',async()=>{
 const w=new ExcelJS.Workbook(),s=w.addWorksheet('Preisliste ab Q1 2026');s.getCell('A3').value='Gültig ab Q1 2026';
 s.getCell('A4').value='Artikelbezeichnung';s.getCell('D4').value='Inhalt pro VE';s.getCell('G4').value='Art. Nr.';s.getCell('J4').value='GH VE';s.getCell('K4').value='GH Packung';
 s.getCell('A5').value='Synthetic Old Layout';s.getCell('B5').value='Variant';s.getCell('D5').value=8;s.getCell('G5').value=900123;s.getCell('H5').value=9999999999999;s.getCell('J5').value=24;s.getCell('K5').value=3;
 const result=await parseQuarterPriceWorkbook(await file(w),2026,1);assert.equal(result.rows[0].artikel_nr,'900123');assert.equal(result.rows[0].units_per_ve,8);assert.equal(result.rows[0].price_per_order,24);
});
test('food special display uses row-four parent article and full display price',async()=>{
 const w=food(),s=w.addWorksheet(' Sonderpreisliste ab 01.10.2026');
 s.getCell('A1').value='Sonderpreisliste Nährmittel';s.getCell('E4').value='Artnr.';s.getCell('K4').value='Preis VE';
 s.getCell('A5').value='Synthetic Special Display';s.getCell('B5').value=900001;s.getCell('E5').value=900009;s.getCell('K5').value=132;s.getCell('H5').value='Synthetic customer';
 const result=await parseQuarterPriceWorkbook(await file(w),2026,4),special=result.rows.find(r=>r.artikel_nr==='900009');
 assert.equal(special.item_type,'display');assert.equal(special.department,'food');assert.equal(special.price_per_order,132);assert.equal(special.units_per_ve,1);assert.equal(special.scope_note,'Synthetic customer');
});
