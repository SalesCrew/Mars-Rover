import assert from 'node:assert/strict';
import { test } from 'node:test';
import XLSX from 'xlsx-js-style';
import {
  buildMarketFrequencyRows, buildChainFrequencyRows, buildGlFrequencyRows,
  MARKET_FREQUENCY_HEADERS,
} from '../src/utils/marketFrequencyExport.ts';

test('market export keeps all columns, numeric frequencies and private admin note', () => {
  const market = {
    id: 'markt-1', internalId: '0012', name: 'Testmarkt', chain: 'Billa',
    address: 'Hauptstraße 1', postalCode: '0101', city: 'Wien',
    frequency: 12, currentVisits: 0, isActive: true,
    lastVisitDate: '2026-09-16',
  };
  const rows = buildMarketFrequencyRows([market], { 'markt-1': 'Nur Admins' });
  assert.equal(rows[0].length, MARKET_FREQUENCY_HEADERS.length);
  assert.equal(rows[0][12], 0);
  assert.equal(rows[0][13], 12);
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
  assert.equal(result.U2.v, 'Nur Admins');
  assert.ok(result.O2.v instanceof Date);
});

test('chain and GL summaries add actual and target visits independently', () => {
  const markets = [
    { id: '1', chain: 'Billa', gebietsleiter: 'gl-1', gebietsleiterName: 'Anna', currentVisits: 0, frequency: 12 },
    { id: '2', chain: 'Billa', gebietsleiter: 'gl-1', gebietsleiterName: 'Anna', currentVisits: 5, frequency: 8 },
    { id: '3', chain: 'Spar', gebietsleiter: 'gl-2', gebietsleiterName: 'Ben', currentVisits: 2, frequency: 10 },
  ];
  assert.deepEqual(buildChainFrequencyRows(markets).find(row => row[0] === 'Billa'), ['Billa', 2, 5, 20]);
  assert.deepEqual(buildGlFrequencyRows(markets).find(row => row[1] === 'gl-1'), ['Anna', 'gl-1', 2, 5, 20]);
});
