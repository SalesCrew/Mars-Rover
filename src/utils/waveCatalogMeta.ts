export interface WaveCatalogMeta {
  catalogKey?: string | null;
  artikelNr?: string | null;
  catalogVeSize?: number | null;
  catalogOrderPrice?: number | null;
  catalogPriceAvailable?: boolean;
}
export const copyCatalogMeta = (item: WaveCatalogMeta): WaveCatalogMeta => item.catalogKey ? ({
  catalogKey: item.catalogKey, artikelNr: item.artikelNr, catalogVeSize: item.catalogVeSize, catalogOrderPrice: item.catalogOrderPrice,
}) : {};
