import * as XLSX from 'xlsx';
import type { Product } from '../types/product-types';

export type ProductImportType = 'pets-standard' | 'pets-display' | 'food-standard' | 'food-display';

export const parseProductFile = async (
  file: File,
  importType: ProductImportType
): Promise<Product[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        
        // Get the first sheet
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        // Convert to array of arrays (rows with columns)
        const rawData: any[][] = XLSX.utils.sheet_to_json(worksheet, {
          header: 1,
          defval: ''
        });

        // Process the data based on import type
        const products = processProductImportData(rawData, importType);
        resolve(products);
      } catch (error) {
        reject(new Error(`Fehler beim Verarbeiten der Datei: ${error}`));
      }
    };

    reader.onerror = () => {
      reject(new Error('Fehler beim Lesen der Datei'));
    };

    reader.readAsBinaryString(file);
  });
};

const processProductImportData = (
  rawData: any[][],
  importType: ProductImportType
): Product[] => {
  if (rawData.length < 5) {
    throw new Error('Die Datei enthält nicht genügend Daten');
  }

  const [department, productType] = parseImportType(importType);
  
  if (importType === 'pets-standard') {
    return processPetsStandardProducts(rawData, department, productType);
  }
  
  if (importType === 'food-standard') {
    return processFoodStandardProducts(rawData, department, productType);
  }

  // TODO: Implement other import types
  throw new Error(`Import-Typ "${importType}" ist noch nicht implementiert`);
};

const processPetsStandardProducts = (
  rawData: any[][],
  department: 'pets' | 'food',
  productType: 'standard' | 'display'
): Product[] => {
  const products: Product[] = [];
  const seenNames = new Set<string>(); // Track unique product names

  // Start from row 1 (index 0)
  for (let i = 0; i < rawData.length; i++) {
    const row = rawData[i];
    
    // Skip empty rows
    if (!row || row.length === 0 || !row[0]) {
      continue;
    }

    try {
      const product = parsePetsStandardRow(row, i, department, productType, seenNames);
      if (product) {
        products.push(product);
      }
    } catch (error) {
      console.warn(`Fehler in Zeile ${i + 1}:`, error);
      // Continue processing other rows
    }
  }

  return products;
};

const parsePetsStandardRow = (
  row: any[],
  rowIndex: number,
  department: 'pets' | 'food',
  productType: 'standard' | 'display',
  seenNames: Set<string>
): Product | null => {
  // Mars Pets Standard Products Excel Column Mapping (0-indexed):
  // A=0: Artikelbezeichnung (Product Name)
  // B=1: IGNORE
  // C=2: Weight (e.g., "150g")
  // D=3: Inhalt (Content - for detailed view only)
  // E=4: IGNORE
  // F=5: Einheiten Pro Palette (Pallet Size)
  // G=6: IGNORE
  // H=7: IGNORE
  // I=8: IGNORE
  // J=9: IGNORE
  // K=10: Price

  const name = row[0] ? String(row[0]).trim() : '';
  const weight = row[2] ? String(row[2]).trim() : '';
  const content = row[3] ? String(row[3]).trim() : '';
  const palletSize = row[5] ? parseFloat(String(row[5])) : undefined;
  const price = row[10] ? parseFloat(String(row[10])) : 0;

  // Validate required fields
  if (!name || !weight || price === 0) {
    console.warn(`Zeile ${rowIndex + 1}: Name, Gewicht oder Preis fehlt`);
    return null;
  }

  // Check for duplicate names - if we've seen this name before, skip it
  if (seenNames.has(name)) {
    console.log(`Zeile ${rowIndex + 1}: Duplikat "${name}" übersprungen`);
    return null;
  }

  // Add name to seen set
  seenNames.add(name);

  // Create the product object
  const product: Product = {
    id: generateProductId(name, rowIndex),
    name: name,
    department: department,
    productType: productType,
    weight: weight,
    content: content || undefined,
    palletSize: palletSize && !isNaN(palletSize) ? Math.round(palletSize) : undefined,
    price: price,
    sku: generateSKU(name, weight),
  };

  return product;
};

const processFoodStandardProducts = (
  rawData: any[][],
  department: 'pets' | 'food',
  productType: 'standard' | 'display'
): Product[] => {
  const products: Product[] = [];
  const seenProducts = new Map<string, number>(); // Track unique product name + price combinations

  // Start from row 1 (index 0)
  for (let i = 0; i < rawData.length; i++) {
    const row = rawData[i];
    
    // Skip empty rows
    if (!row || row.length === 0 || !row[0]) {
      continue;
    }

    try {
      const product = parseFoodStandardRow(row, i, department, productType, seenProducts);
      if (product) {
        products.push(product);
      }
    } catch (error) {
      console.warn(`Fehler in Zeile ${i + 1}:`, error);
      // Continue processing other rows
    }
  }

  return products;
};

const parseFoodStandardRow = (
  row: any[],
  rowIndex: number,
  department: 'pets' | 'food',
  productType: 'standard' | 'display',
  seenProducts: Map<string, number>
): Product | null => {
  // Mars Food Standard Products Excel Column Mapping (0-indexed):
  // A=0: Product Name
  // B=1: Weight (kg/g - take text 1:1)
  // C=2: IGNORE
  // D=3: IGNORE
  // E=4: Palettengröße (Pallet Size)
  // F-I=5-8: IGNORE
  // J=9: Price

  const name = row[0] ? String(row[0]).trim() : '';
  const weight = row[1] ? String(row[1]).trim() : '';
  const palletSize = row[4] ? parseFloat(String(row[4])) : undefined;
  const price = row[9] ? parseFloat(String(row[9])) : 0;

  // Validate required fields
  if (!name || !weight || price === 0) {
    console.warn(`Zeile ${rowIndex + 1}: Name, Gewicht oder Preis fehlt`);
    return null;
  }

  // Check for duplicate name + price combination
  const productKey = `${name}-${price}`;
  if (seenProducts.has(productKey)) {
    console.log(`Zeile ${rowIndex + 1}: Duplikat "${name}" mit Preis ${price} übersprungen`);
    return null;
  }

  // Add to seen products
  seenProducts.set(productKey, rowIndex);

  // Create the product object
  const product: Product = {
    id: generateProductId(name, rowIndex),
    name: name,
    department: department,
    productType: productType,
    weight: weight,
    palletSize: palletSize && !isNaN(palletSize) ? Math.round(palletSize) : undefined,
    price: price,
    sku: generateSKU(name, weight),
  };

  return product;
};

const generateProductId = (name: string, rowIndex: number): string => {
  // Generate a unique ID based on name and row
  const cleanName = name.toLowerCase().replace(/[^a-z0-9]/g, '-');
  return `${cleanName}-${rowIndex}`;
};

const generateSKU = (name: string, weight: string): string => {
  // Generate a simple SKU from name and weight
  const namePart = name
    .split(' ')[0]
    .toUpperCase()
    .substring(0, 4);
  const weightPart = weight.replace(/[^0-9]/g, '');
  return `${namePart}-${weightPart}`;
};

const parseImportType = (importType: ProductImportType): ['pets' | 'food', 'standard' | 'display'] => {
  const [dept, type] = importType.split('-') as ['pets' | 'food', 'standard' | 'display'];
  return [dept, type];
};

export const validateProductImportFile = (file: File): { valid: boolean; error?: string } => {
  const validExtensions = ['.csv', '.xlsx', '.xls'];
  const fileName = file.name.toLowerCase();
  const hasValidExtension = validExtensions.some(ext => fileName.endsWith(ext));

  if (!hasValidExtension) {
    return {
      valid: false,
      error: 'Ungültiges Dateiformat. Bitte eine CSV- oder Excel-Datei (.csv, .xlsx, .xls) hochladen.',
    };
  }

  const maxSize = 10 * 1024 * 1024; // 10MB
  if (file.size > maxSize) {
    return {
      valid: false,
      error: 'Die Datei ist zu groß. Maximum: 10MB',
    };
  }

  return { valid: true };
};
