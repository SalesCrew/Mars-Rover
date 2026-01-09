export interface Product {
  id: string;
  name: string; // Row A: Artikelbezeichnung
  department: 'pets' | 'food'; // Mars Pets (Tiernahrung) or Mars Food
  productType: 'standard' | 'display' | 'palette' | 'schuette'; // Standard, Display, Palette, or Schütte
  weight: string; // Row C: Weight (e.g., "150g", "1kg") or Size for displays/palettes
  content?: string; // Row D: Inhalt (only in detailed view, not in list)
  palletSize?: number; // Row F: Einheiten Pro Palette
  price: number; // Row K: Price in EUR (0 for palettes - value comes from products inside)
  sku?: string; // Generated or imported SKU
  paletteProducts?: PaletteProduct[]; // Products contained in a palette (only for palette type)
}

// Product contained within a palette
export interface PaletteProduct {
  productId: string; // Reference to a standard product
  productName: string; // Name for display
  quantity: number; // How many of this product in the palette
  unitPrice: number; // Price per unit
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

