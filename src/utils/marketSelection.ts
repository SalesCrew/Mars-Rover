type SelectableMarket = { id: string; isActive: boolean };

export const getBulkSelectableMarketIds = (markets: SelectableMarket[]): string[] =>
  markets.filter(market => market.isActive).map(market => market.id);

export const toggleBulkActiveMarketSelection = (
  selectedIds: string[],
  visibleMarkets: SelectableMarket[]
): string[] => {
  const activeIds = getBulkSelectableMarketIds(visibleMarkets);
  if (activeIds.length === 0) return selectedIds;

  const activeIdSet = new Set(activeIds);
  if (activeIds.every(id => selectedIds.includes(id))) {
    return selectedIds.filter(id => !activeIdSet.has(id));
  }

  return [...new Set([...selectedIds, ...activeIds])];
};
