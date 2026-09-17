import assert from 'node:assert/strict';
import test from 'node:test';
import {
  getBulkSelectableMarketIds,
  toggleBulkActiveMarketSelection,
} from '../src/utils/marketSelection.ts';

const visibleMarkets = [
  { id: 'active-a', isActive: true },
  { id: 'inactive-b', isActive: false },
  { id: 'active-c', isActive: true },
];

test('bulk selection includes only active markets', () => {
  assert.deepEqual(getBulkSelectableMarketIds(visibleMarkets), ['active-a', 'active-c']);
  assert.deepEqual(
    toggleBulkActiveMarketSelection([], visibleMarkets),
    ['active-a', 'active-c']
  );
});

test('bulk selection preserves previously assigned inactive markets', () => {
  const initial = ['inactive-b'];
  const selected = toggleBulkActiveMarketSelection(initial, visibleMarkets);
  assert.deepEqual(selected, ['inactive-b', 'active-a', 'active-c']);
  assert.deepEqual(toggleBulkActiveMarketSelection(selected, visibleMarkets), initial);
});

test('bulk selection does nothing when only inactive markets are visible', () => {
  const initial = ['inactive-b'];
  assert.equal(toggleBulkActiveMarketSelection(initial, [visibleMarkets[1]]), initial);
});
