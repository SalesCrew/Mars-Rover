import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createWelleCopy } from '../src/utils/welleCopy.ts';

test('configuration copies have independent IDs and arrays, without results or source metadata', () => {
  const source = {
    id:'source',name:'Hagebau',image:'wave.png',startDate:'2026-10-01',endDate:'2026-12-11',
    status:'active',types:['display','palette','schuette'],goalType:'value',goalValue:25000,
    displayCount:1,kartonwareCount:0,assignedMarketCount:2,assignedMarketIds:['a','b'],
    displays:[{id:'display',name:'Display',targetNumber:12,picture:'display.png',itemValue:18,currentNumber:7}],
    paletteItems:[{id:'palette',name:'Palette',size:'1/4',picture:'palette.png',products:[{id:'product',name:'Snack',valuePerVE:24.5,ve:8,ean:'123'}]}],
    schutteItems:[],kwDays:[{kw:'44',days:['MO','DI']}],fotoEnabled:true,
    fotoTags:[{id:'tag',name:'Aufbau',type:'fixed'}],noLimitWelle:false,
    submissions:[{quantity:7}],orphanedValueCurrent:100,participatingGLs:9,is_deleted:true,
  };
  const before=JSON.stringify(source), copy=createWelleCopy(source), another=createWelleCopy(source);
  assert.equal(copy.id,'');assert.equal(copy.name,'Hagebau (Kopie)');
  for(const key of ['submissions','orphanedValueCurrent','participatingGLs','is_deleted'])assert.equal(key in copy,false);
  assert.equal('currentNumber' in copy.displays[0],false);
  for(const item of [copy.displays[0],copy.paletteItems[0],copy.paletteItems[0].products[0]])assert.ok(!['display','palette','product'].includes(item.id));
  assert.notEqual(copy.paletteItems[0].products[0].id,another.paletteItems[0].products[0].id);
  assert.deepEqual(copy.assignedMarketIds,['a','b']);assert.equal(copy.assignedMarketCount,2);
  assert.deepEqual(copy.fotoTags,[{name:'Aufbau',type:'fixed'}]);
  copy.kwDays[0].days.push('FR');copy.assignedMarketIds.pop();copy.paletteItems[0].products[0].name='Changed';
  assert.equal(JSON.stringify(source),before);
});

test('photo-only and unlimited wave configuration survives without requiring product arrays', () => {
  for(const mode of [{fotoOnly:true,noLimitWelle:false},{fotoOnly:false,noLimitWelle:true}]) {
    const source={id:'source',name:'Fotos',image:null,startDate:'2026-01-01',endDate:'2026-12-31',
      status:'active',types:[],goalType:'percentage',displayCount:0,kartonwareCount:0,
      fotoEnabled:true,fotoHeader:'Header',fotoDescription:'Description',fotoTags:[{name:'Tag',type:'optional'}],...mode};
    const copy=createWelleCopy(source);
    for(const key of ['fotoOnly','noLimitWelle','fotoEnabled','fotoHeader','fotoDescription'])assert.equal(copy[key],source[key]);
    assert.deepEqual(copy.displays,[]);assert.deepEqual(copy.assignedMarketIds,[]);
  }
});
