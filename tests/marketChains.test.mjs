import assert from 'node:assert/strict';
import { test } from 'node:test';
import { marketChainOptions, normalizeMarketChain } from '../src/utils/marketChains.ts';
import { normalizeChainName } from '../src/utils/marketImporter.ts';

test('supports Lezanimo and Wau,Miau in manual market selection', () => {
  const options = marketChainOptions([]);
  assert.ok(options.includes('Lezanimo'));
  assert.ok(options.includes('Wau,Miau'));
});

test('normalizes common Wau,Miau import spellings', () => {
  assert.equal(normalizeChainName('Lezanimo'), 'Lezanimo');
  assert.equal(normalizeChainName('Wau Miau'), 'Wau,Miau');
  assert.equal(normalizeChainName('WAUMIAU'), 'Wau,Miau');
  assert.equal(normalizeChainName('Wau & Miau'), 'Wau,Miau');
  assert.equal(normalizeChainName('Wau Miau & Co'), 'Wau,Miau');
});

test('merges chain aliases into one filter value', () => {
  const options = marketChainOptions(['Wau Miau', 'WAU-MIAU', 'Lezanimo']);
  assert.equal(options.filter(chain => chain === 'Wau,Miau').length, 1);
  assert.ok(!options.includes('Wau Miau'));
  assert.ok(!options.includes('WAU-MIAU'));
  assert.equal(normalizeMarketChain('  LEZANIMO  '), 'Lezanimo');
});
