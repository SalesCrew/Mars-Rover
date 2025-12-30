export interface Product {
  id: string;
  name: string; // Row A: Artikelbezeichnung
  department: 'pets' | 'food'; // Mars Pets (Tiernahrung) or Mars Food
  productType: 'standard' | 'display'; // Standard Products or Displays
  weight: string; // Row C: Weight (e.g., "150g", "1kg")
  content?: string; // Row D: Inhalt (only in detailed view, not in list)
  palletSize?: number; // Row F: Einheiten Pro Palette
  price: number; // Row K: Price in EUR
  sku?: string; // Generated or imported SKU
}

export interface ProductCalculation {
  removedProducts: ProductWithQuantity[];
  availableProducts: ProductWithQuantity[];
  suggestions: ReplacementSuggestion[];
  totalRemovedValue: number;
}

export interface ProductWithQuantity {
  product: Product;
  quantity: number;
}

export interface ReplacementSuggestion {
  id: string;
  products: ProductWithQuantity[];
  totalValue: number;
  valueDifference: number; // difference from removed value
  matchScore: number; // 0-100, how well it matches (category, brand, etc.)
  categoryMatch: boolean;
  brandMatch: boolean;
}

