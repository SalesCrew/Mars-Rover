import type { Welle } from '../services/wellenService';
import { copyCatalogMeta } from './waveCatalogMeta';

// Copy configuration only. Database IDs and recorded results belong to the source.
export const createWelleCopy = (source: Welle): Welle => {
  const temporaryId = (type: string) => `${type}-${crypto.randomUUID()}`;
  const copyProducts = (products: NonNullable<Welle['paletteItems']>[number]['products']) =>
    products.map(product => ({
      id: temporaryId('product'), name: product.name, valuePerVE: product.valuePerVE,
      ve: product.ve, ean: product.ean,
    }));
  return {
    id: '', name: `${source.name} (Kopie)`, image: source.image,
    startDate: source.startDate, endDate: source.endDate, status: 'upcoming',
    types: [...source.types], goalType: source.goalType,
    goalPercentage: source.goalPercentage, goalValue: source.goalValue,
    displayCount: source.displays?.length || 0,
    kartonwareCount: source.kartonwareItems?.length || 0,
    displays: (source.displays || []).map(item => ({
      ...copyCatalogMeta(item), id: temporaryId('display'), name: item.name, targetNumber: item.targetNumber,
      picture: item.picture, itemValue: item.itemValue, ve: item.ve,
    })),
    kartonwareItems: (source.kartonwareItems || []).map(item => ({
      ...copyCatalogMeta(item), id: temporaryId('kartonware'), name: item.name, targetNumber: item.targetNumber,
      picture: item.picture, itemValue: item.itemValue, ve: item.ve,
    })),
    einzelproduktItems: (source.einzelproduktItems || []).map(item => ({
      ...copyCatalogMeta(item), id: temporaryId('einzelprodukt'), name: item.name, targetNumber: item.targetNumber,
      picture: item.picture, itemValue: item.itemValue, artikelNr: item.artikelNr, ve: item.ve,
    })),
    paletteItems: (source.paletteItems || []).map(item => ({
      id: temporaryId('palette'), name: item.name, size: item.size,
      picture: item.picture, products: copyProducts(item.products),
    })),
    schutteItems: (source.schutteItems || []).map(item => ({
      id: temporaryId('schutte'), name: item.name, size: item.size,
      picture: item.picture, products: copyProducts(item.products),
    })),
    kwDays: (source.kwDays || []).map(item => ({ kw: item.kw, days: [...item.days] })),
    assignedMarketIds: [...(source.assignedMarketIds || [])],
    assignedMarketCount: source.assignedMarketCount,
    fotoEnabled: source.fotoEnabled, fotoOnly: source.fotoOnly,
    fotoHeader: source.fotoHeader, fotoDescription: source.fotoDescription,
    fotoTags: (source.fotoTags || []).map(tag => ({ name: tag.name, type: tag.type })),
    noLimitWelle: source.noLimitWelle,
  };
};
