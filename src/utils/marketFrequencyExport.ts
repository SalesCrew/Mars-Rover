import type { AdminMarket } from '../types/market-types';

type ExportValue = string | number | boolean | Date;

export const MARKET_FREQUENCY_HEADERS = [
  'Markt-ID', 'Interne ID', 'Name', 'Handelskette', 'Banner', 'Kanal',
  'Straße', 'PLZ', 'Ort', 'Gebietsleiter', 'GL-E-Mail', 'GL-ID',
  'Ist-Frequenz', 'Soll-Frequenz', 'Letzter Besuch', 'Aktiv', 'Heute abgeschlossen',
  'Markt-Telefon', 'Markt-E-Mail', 'Mars-Filiale', 'Admin-Kommentar',
  'Filiale', 'Hauptgruppe', 'Untergruppe', 'Besuchstag', 'Besuchsdauer',
  'Kundentyp', 'Telefon (alt)', 'E-Mail (alt)', 'Breitengrad', 'Längengrad',
] as const;

export const CHAIN_FREQUENCY_HEADERS = ['Handelskette', 'Banner', 'Märkte', 'Ist-Frequenz', 'Soll-Frequenz'] as const;
export const GL_FREQUENCY_HEADERS = ['Gebietsleiter', 'GL-ID', 'Banner', 'Märkte', 'Ist-Frequenz', 'Soll-Frequenz'] as const;

const text = (value: string | undefined): string => value ?? '';

const excelDate = (value: string | undefined): Date | string => {
  if (!value) return '';
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (!match) return value;
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]), 12);
  return Number.isNaN(date.getTime()) ? value : date;
};

export function buildMarketFrequencyRows(
  markets: AdminMarket[],
  adminComments: Record<string, string>,
): ExportValue[][] {
  return markets.map((market) => [
    market.id, text(market.internalId), market.name, market.chain, text(market.banner), text(market.channel),
    market.address, market.postalCode, market.city, text(market.gebietsleiterName),
    text(market.gebietsleiterEmail), text(market.gebietsleiter),
    market.currentVisits, market.frequency, excelDate(market.lastVisitDate),
    market.isActive, Boolean(market.isCompleted), text(market.marketTel), text(market.marketEmail),
    text(market.marsFil), adminComments[market.id] ?? '', text(market.branch),
    text(market.maingroup), text(market.subgroup), text(market.visitDay),
    text(market.visitDuration), text(market.customerType), text(market.phone),
    text(market.email), market.coordinates?.lat ?? '', market.coordinates?.lng ?? '',
  ]);
}

export function buildChainFrequencyRows(markets: AdminMarket[]): ExportValue[][] {
  const groups = new Map<string, { chain: string; banner: string; count: number; actual: number; target: number }>();
  for (const market of markets) {
    const chain = market.chain?.trim() || 'Ohne Handelskette';
    const banner = market.banner?.trim() || '';
    const key = JSON.stringify([chain, banner]);
    const group = groups.get(key) ?? { chain, banner, count: 0, actual: 0, target: 0 };
    group.count += 1;
    group.actual += market.currentVisits ?? 0;
    group.target += market.frequency ?? 0;
    groups.set(key, group);
  }
  return Array.from(groups.values(), group => [group.chain, group.banner, group.count, group.actual, group.target])
    .sort((a, b) => String(a[0]).localeCompare(String(b[0]), 'de') || String(a[1]).localeCompare(String(b[1]), 'de'));
}

export function buildGlFrequencyRows(markets: AdminMarket[]): ExportValue[][] {
  const groups = new Map<string, { name: string; id: string; banner: string; count: number; actual: number; target: number }>();
  for (const market of markets) {
    const name = market.gebietsleiterName?.trim() || 'Nicht zugeordnet';
    const id = market.gebietsleiter?.trim() || '';
    const banner = market.banner?.trim() || '';
    const key = JSON.stringify([id || `name:${name}`, banner]);
    const group = groups.get(key) ?? { name, id, banner, count: 0, actual: 0, target: 0 };
    group.count += 1;
    group.actual += market.currentVisits ?? 0;
    group.target += market.frequency ?? 0;
    groups.set(key, group);
  }
  return Array.from(groups.values(), group => [group.name, group.id, group.banner, group.count, group.actual, group.target])
    .sort((a, b) => String(a[0]).localeCompare(String(b[0]), 'de') || String(a[2]).localeCompare(String(b[2]), 'de'));
}
