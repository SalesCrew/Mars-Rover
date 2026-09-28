// Only these two chains extend the existing market selection.
const ADDITIONAL_MARKET_CHAINS = ['Lezanimo', 'Wau,Miau'] as const;

const MARKET_CHAIN_ALIASES: Record<string, string> = {
  adeg: 'Adeg',
  billaplus: 'Billa+',
  billaplusprivat: 'BILLA Plus Privat',
  billaprivat: 'BILLA Privat',
  eurospar: 'Eurospar',
  futterhaus: 'Futterhaus',
  hagebau: 'Hagebau',
  interspar: 'Interspar',
  lezanimo: 'Lezanimo',
  spar: 'Spar',
  spargourmet: 'Spar',
  waumiau: 'Wau,Miau',
  waumiauco: 'Wau,Miau',
  zoofachhandel: 'Zoofachhandel',
};

export const normalizeMarketChain = (chain: string): string => {
  const trimmed = chain.trim();
  if (!trimmed) return 'Sonstige';
  const key = trimmed.toLocaleLowerCase('de-DE').replace(/^billa\s*\+/, 'billaplus').replace(/[^a-z0-9]+/g, '');
  if (key.startsWith('sparprivat')) return 'Spar';
  return MARKET_CHAIN_ALIASES[key] || trimmed;
};

export const marketChainFilterOptions = (existingChains: Array<string | null | undefined>): string[] =>
  Array.from(new Set(
    existingChains
      .filter((chain): chain is string => Boolean(chain?.trim()))
      .map(normalizeMarketChain),
  ))
    .sort((a, b) => a.localeCompare(b, 'de'));

export const marketChainOptions = (existingChains: Array<string | null | undefined>): string[] =>
  marketChainFilterOptions([...existingChains, ...ADDITIONAL_MARKET_CHAINS]);

export const matchesMarketChainFilter = (chain: string | null | undefined, selectedChains: readonly string[]): boolean =>
  selectedChains.length === 0 || selectedChains.some(selected => normalizeMarketChain(selected) === normalizeMarketChain(chain || ''));
