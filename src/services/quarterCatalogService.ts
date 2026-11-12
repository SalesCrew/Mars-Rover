import { API_BASE_URL } from '../config/database';
import type { Welle, WaveCatalogMeta } from './wellenService';
export type CatalogItemType = 'display' | 'kartonware' | 'einzelprodukt';
export interface CatalogEntry {
  id?: string; year?: number; quarter?: number; catalog_key?: string;
  department: 'food' | 'pets'; item_type: CatalogItemType; artikel_nr: string;
  name: string; units_per_ve: number; price_per_order: number; source_cell: string;
  scope_note?: string;
}
export interface QuarterReconciliation {
  token: string; count: number; updated: number;
  changes: Array<{ id: string; article: string; name: string; waveName: string; year: number; quarter: number; oldPrice: number | null; newPrice: number; quantity: number }>;
  unresolved: Array<{ id: string; article: string | null; name: string; waveName: string; year: number; quarter: number; reason: string }>;
}
async function request<T>(path: string, body?: unknown): Promise<T> {
  const response = await fetch(`${API_BASE_URL}/wellen/catalog${path}`, body === undefined ? undefined : { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Quartalskatalog konnte nicht geladen werden.');
  return data;
}
export const quarterCatalogService = {
  list: (year?: number, quarter?: number) => request<{ year: number; quarter: number; items: CatalogEntry[] }>(year && quarter ? `?year=${year}&quarter=${quarter}` : ''),
  import: (payload: { year: number; quarter: number; filename: string; sha256: string; rows: CatalogEntry[] }) => request<{ inserted: number; unchanged: number }>('/import', payload),
  preview: () => request<QuarterReconciliation>('/reconciliation'),
  apply: (token: string) => request<QuarterReconciliation>('/reconciliation', { token }),
};

export function hydrateWaveCatalog(wave: Welle, entries: CatalogEntry[]): Welle {
  const prices = new Map(entries.map(e => [e.catalog_key, e]));
  const quote = <T extends WaveCatalogMeta>(item: T): T => {
    if (!item.catalogKey) return item;
    const price = prices.get(item.catalogKey);
    return { ...item, catalogPriceAvailable: !!price,
      itemValue: price ? Number(price.price_per_order) / (price.item_type === 'einzelprodukt' ? price.units_per_ve : 1) : null,
      catalogOrderPrice: price ? Number(price.price_per_order) : null,
      catalogVeSize: price?.units_per_ve || item.catalogVeSize,
    };
  };
  return { ...wave, displays: wave.displays?.map(quote), kartonwareItems: wave.kartonwareItems?.map(quote), einzelproduktItems: wave.einzelproduktItems?.map(quote) };
}
