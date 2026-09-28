import assert from 'node:assert/strict';
import { test } from 'node:test';
import { marketChainOptions, marketChainFilterOptions, matchesMarketChainFilter, normalizeMarketChain } from '../src/utils/marketChains.ts';
import { normalizeChainName } from '../src/utils/marketImporter.ts';
import backendNormalization from '../backend/src/utils/marketChainNormalization.ts';

test('supports Lezanimo and Wau,Miau in manual market selection', () => {
  const options = marketChainOptions([]);
  assert.deepEqual(options, ['Lezanimo', 'Wau,Miau']);
});

test('restores existing chains without inventing Hofer, Merkur or Penny options', () => {
  const existing = ['Adeg', 'BILLA Plus Privat', 'BILLA Privat', 'Billa+', 'Eurospar', 'Futterhaus', 'Hagebau', 'Interspar', 'Spar', 'Zoofachhandel'];
  const options = marketChainOptions(existing);
  assert.deepEqual(new Set(options), new Set([...existing, 'Lezanimo', 'Wau,Miau']));
  assert.equal(options.length, 12);
  assert.deepEqual(marketChainFilterOptions([]), []);
  assert.deepEqual(marketChainFilterOptions(['Spar']), ['Spar']);
});

test('merges BILLA Plus aliases without merging private and public markets', () => {
  const chains = ['BILLA Plus', 'BILLA+', 'Billa+', 'BILLA+ Privat', 'BILLA Plus Privat', 'BILLA Privat'];
  assert.deepEqual(new Set(marketChainFilterOptions(chains)), new Set(['Billa+', 'BILLA Plus Privat', 'BILLA Privat']));
  assert.ok(matchesMarketChainFilter('BILLA Plus', ['Billa+']));
  assert.ok(matchesMarketChainFilter('BILLA+ Privat', ['BILLA Plus Privat']));
  assert.ok(!matchesMarketChainFilter('BILLA Plus Privat', ['Billa+']));
  assert.ok(!matchesMarketChainFilter('BILLA Privat', ['BILLA Plus Privat']));
});

test('groups Gourmet and private Spar into Spar without changing banners or other Spar chains', () => {
  const chains = ['SPAR', 'Spar Gourmet', 'SPAR Privat Popovic', 'Spar Privat', 'Eurospar', 'Interspar'];
  assert.deepEqual(marketChainFilterOptions(chains), ['Eurospar', 'Interspar', 'Spar']);
  for (const chain of chains.slice(0, 4)) assert.ok(matchesMarketChainFilter(chain, ['Spar']));
  assert.ok(!matchesMarketChainFilter('Interspar', ['Spar']));
  assert.ok(!matchesMarketChainFilter('Eurospar', ['Spar']));
});

test('filters new chain aliases, supports multi-select and retains actual unknown chains', () => {
  assert.ok(matchesMarketChainFilter('Wau Miau & Co', ['Wau,Miau']));
  assert.ok(matchesMarketChainFilter(' LEZANIMO ', ['Lezanimo', 'Spar']));
  assert.ok(!matchesMarketChainFilter('Zoofachhandel', ['Lezanimo', 'Wau,Miau']));
  assert.ok(matchesMarketChainFilter('Spar', []));
  assert.deepEqual(marketChainFilterOptions([undefined, null, '', '  ', 'Other existing chain']), ['Other existing chain']);
});

test('normalizes common Wau,Miau import spellings', () => {
  assert.equal(normalizeChainName('Lezanimo'), 'Lezanimo');
  assert.equal(normalizeChainName('Wau Miau'), 'Wau,Miau');
  assert.equal(normalizeChainName('WAUMIAU'), 'Wau,Miau');
  assert.equal(normalizeChainName('Wau & Miau'), 'Wau,Miau');
  assert.equal(normalizeChainName('Wau+Miau'), 'Wau,Miau');
  assert.equal(normalizeChainName('Wau Miau & Co'), 'Wau,Miau');
});

test('frontend and backend agree on all canonical and legacy chain labels', () => {
  const chains = ['Adeg', 'Billa+', 'BILLA+', 'BILLA Plus', 'BILLA + Privat', 'BILLA Plus Privat', 'BILLA Privat', 'Eurospar', 'Futterhaus', 'Hagebau', 'Interspar', 'Spar', 'Spar Gourmet', 'SPAR Privat Popovic', 'Lezanimo', 'Wau,Miau', 'Wau & Miau', 'Wau+Miau', 'Wau Miau & Co', 'Zoofachhandel', 'Other existing chain'];
  for (const chain of chains) assert.equal(normalizeMarketChain(chain), backendNormalization.normalizeMarketChain(chain), chain);
});

test('merges chain aliases into one filter value', () => {
  const options = marketChainOptions(['Wau Miau', 'WAU-MIAU', 'Lezanimo']);
  assert.equal(options.filter(chain => chain === 'Wau,Miau').length, 1);
  assert.ok(!options.includes('Wau Miau'));
  assert.ok(!options.includes('WAU-MIAU'));
  assert.equal(normalizeMarketChain('  LEZANIMO  '), 'Lezanimo');
});
