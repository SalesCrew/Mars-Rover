import assert from 'node:assert/strict';import {test} from 'node:test';import {parseOrderVe,waveOrderVe,orderPieces} from '../src/utils/orderUnits.ts';
test('VE parsing and conversions preserve catalog precedence, reject missing/fractional sizes and prevent overflow',()=>{
 for(const [v,n]of [['VE: 6 Stück',6],['6,0',6],[12,12],['0',null],['1.5',null],[null,null],['100001',null]])assert.equal(parseOrderVe(v),n);
 assert.equal(waveOrderVe({catalogVeSize:12,ve:6}),12);assert.equal(orderPieces(2,6),12);assert.equal(orderPieces(1,1),1);
 for(const args of [[1,null],[1.5,6],[-1,6],[2147483647,6]])assert.throws(()=>orderPieces(...args),/ganze VEs/);
});
