export const SUPPORTED_MARKET_CHAINS = [
  'Adeg', 'Billa+', 'BILLA Plus', 'BILLA+ Privat', 'BILLA Privat',
  'Eurospar', 'Futterhaus', 'Hagebau', 'Hofer', 'Interspar',
  'Lezanimo', 'Merkur', 'Spar', 'SPAR Privat Popovic', 'Spar Gourmet',
  'Wau,Miau', 'Zoofachhandel',
] as const;

const MARKET_CHAIN_ALIASES: Record<string, string> = {
  adeg: 'Adeg',
  'billa+': 'Billa+',
  'billa plus': 'Billa+',
  'billa+ privat': 'BILLA+ Privat',
  'billa privat': 'BILLA Privat',
  eurospar: 'Eurospar',
  futterhaus: 'Futterhaus',
  hagebau: 'Hagebau',
  hofer: 'Hofer',
  interspar: 'Interspar',
  lezanimo: 'Lezanimo',
  merkur: 'Merkur',
  spar: 'Spar',
  'spar gourmet': 'Spar Gourmet',
  'wau,miau': 'Wau,Miau',
  'wau miau': 'Wau,Miau',
  'wau-miau': 'Wau,Miau',
  waumiau: 'Wau,Miau',
  zoofachhandel: 'Zoofachhandel',
};

export const normalizeMarketChain = (chain: string): string => {
  const trimmed = chain.trim();
  if (!trimmed) return 'Sonstige';
  const key = trimmed.toLocaleLowerCase('de-DE').replace(/[^a-z0-9]+/g, '');
  if (key === 'waumiau' || key === 'waumiauco') return 'Wau,Miau';
  if (key === 'lezanimo') return 'Lezanimo';
  return MARKET_CHAIN_ALIASES[trimmed.toLocaleLowerCase('de-DE')] || trimmed;
};

export const marketChainOptions = (existingChains: Array<string | undefined>): string[] =>
  Array.from(new Set([
    ...SUPPORTED_MARKET_CHAINS,
    ...existingChains
      .filter((chain): chain is string => Boolean(chain?.trim()))
      .map(normalizeMarketChain),
  ]))
    .sort((a, b) => a.localeCompare(b, 'de'));
