import assert from 'node:assert/strict';
import { test } from 'node:test';
import XLSX from 'xlsx-js-style';
import {
  buildMarketFrequencyRows, buildChainFrequencyRows, buildGlFrequencyRows,
  MARKET_FREQUENCY_HEADERS,
} from '../src/utils/marketFrequencyExport.ts';

test('market export keeps all columns, numeric frequencies and private admin note', () => {
  const market = {
    id: 'markt-1', internalId: '0012', name: 'Testmarkt', chain: 'Billa', banner: 'Billa Plus',
    address: 'Hauptstraße 1', postalCode: '0101', city: 'Wien',
    frequency: 12, currentVisits: 0, isActive: true,
    lastVisitDate: '2026-09-16',
  };
  const rows = buildMarketFrequencyRows([market], { 'markt-1': 'Nur Admins' });
  assert.equal(rows[0].length, MARKET_FREQUENCY_HEADERS.length);
  assert.equal(rows[0][12], 0);
  assert.equal(rows[0][13], 12);
  assert.equal(rows[0][4], 'Billa Plus');
  assert.equal(rows[0][20], 'Nur Admins');

  const sheet = XLSX.utils.aoa_to_sheet([Array.from(MARKET_FREQUENCY_HEADERS), ...rows], { cellDates: true });
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, sheet, 'Märkte');
  const written = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  const reopened = XLSX.read(written, { type: 'buffer', cellDates: true });
  const result = reopened.Sheets['Märkte'];
  assert.equal(result.A2.v, 'markt-1');
  assert.equal(result.B2.v, '0012');
  assert.equal(result.M1.v, 'Ist-Frequenz');
  assert.equal(result.N1.v, 'Soll-Frequenz');
  assert.equal(result.M2.t, 'n');
  assert.equal(result.M2.v, 0);
  assert.equal(result.N2.v, 12);
  assert.equal(result.E1.v, 'Banner');
  assert.equal(result.E2.v, 'Billa Plus');
  assert.equal(result.U2.v, 'Nur Admins');
  assert.ok(result.O2.v instanceof Date);
});

test('chain and GL summaries separate banners while preserving visit totals', () => {
  const markets = [
    { id: '1', chain: 'Spar', banner: 'SPAR-Spar SM Fil.', gebietsleiter: 'gl-1', gebietsleiterName: 'Anna', currentVisits: 0, frequency: 12 },
    { id: '2', chain: 'Spar', banner: 'SPAR-Spar SM Fil.', gebietsleiter: 'gl-1', gebietsleiterName: 'Anna', currentVisits: 5, frequency: 8 },
    { id: '3', chain: 'Spar', banner: 'SPAR-Spar SM Privat', gebietsleiter: 'gl-1', gebietsleiterName: 'Anna', currentVisits: 2, frequency: 10 },
  ];
  assert.deepEqual(buildChainFrequencyRows(markets), [
    ['Spar', 'SPAR-Spar SM Fil.', 2, 5, 20],
    ['Spar', 'SPAR-Spar SM Privat', 1, 2, 10],
  ]);
  assert.deepEqual(buildGlFrequencyRows(markets), [
    ['Anna', 'gl-1', 'SPAR-Spar SM Fil.', 2, 5, 20],
    ['Anna', 'gl-1', 'SPAR-Spar SM Privat', 1, 2, 10],
  ]);
});

test('chain summaries merge aliases but retain banner distinctions and totals', () => {
  const markets = [
    { chain: 'BILLA Plus', banner: 'Public', currentVisits: 1, frequency: 12 },
    { chain: 'Billa+', banner: 'Public', currentVisits: 2, frequency: 8 },
    { chain: 'BILLA+ Privat', banner: 'Private', currentVisits: 3, frequency: 10 },
    { chain: 'BILLA Plus Privat', banner: 'Private', currentVisits: 4, frequency: 12 },
    { chain: 'Spar Gourmet', banner: 'Gourmet', currentVisits: 5, frequency: 6 },
    { chain: 'SPAR Privat Popovic', banner: 'Private', currentVisits: 6, frequency: 7 },
    { chain: 'Wau Miau', banner: '', currentVisits: 0, frequency: 12 },
    { chain: 'Lezanimo', banner: '', currentVisits: 1, frequency: 12 },
  ];
  const rows = buildChainFrequencyRows(markets);
  assert.ok(rows.some(row => row[0] === 'Billa+' && row[2] === 2 && row[3] === 3 && row[4] === 20));
  assert.ok(rows.some(row => row[0] === 'BILLA Plus Privat' && row[2] === 2 && row[3] === 7 && row[4] === 22));
  assert.equal(rows.filter(row => row[0] === 'Spar').length, 2);
  assert.ok(rows.some(row => row[0] === 'Wau,Miau'));
  assert.ok(rows.some(row => row[0] === 'Lezanimo'));
  assert.equal(rows.reduce((sum, row) => sum + row[2], 0), markets.length);
  assert.equal(rows.reduce((sum, row) => sum + row[3], 0), 22);
});
