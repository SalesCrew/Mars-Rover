import type { Product } from '../types/product-types';

export const getProductArticleNumber = (product: Pick<Product, 'artikelNr'> | null | undefined): string => {
  return String(product?.artikelNr ?? '').trim();
};

export const getProductArticleLabel = (product: Pick<Product, 'artikelNr'> | null | undefined): string => {
  const articleNumber = getProductArticleNumber(product);
  return articleNumber ? `Art.-Nr. ${articleNumber}` : '';
};

export const productMatchesSearch = (
  product: Product,
  query: string,
  extraValues: Array<string | number | null | undefined> = []
): boolean => {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) return true;

  return [
    product.name,
    product.artikelNr,
    ...extraValues,
  ].some(value => String(value ?? '').toLowerCase().includes(normalizedQuery));
};
