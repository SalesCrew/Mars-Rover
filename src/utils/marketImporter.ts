import * as XLSX from 'xlsx';
import type { AdminMarket } from '../types/market-types';

export const parseMarketFile = async (file: File): Promise<AdminMarket[]> => {
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

        // Process the data
        const markets = processImportData(rawData);
        resolve(markets);
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

const processImportData = (rawData: any[][]): AdminMarket[] => {
  if (rawData.length < 2) {
    throw new Error('Die Datei enthält keine Daten');
  }

  const markets: AdminMarket[] = [];

  // Skip header row, start from row 1
  for (let i = 1; i < rawData.length; i++) {
    const row = rawData[i];
    
    // Skip empty rows
    if (!row || row.length === 0 || !row[0]) {
      continue;
    }

    try {
      const market = parseMarketRow(row, i);
      if (market) {
        markets.push(market);
      }
    } catch (error) {
      console.warn(`Fehler in Zeile ${i + 1}:`, error);
      // Continue processing other rows
    }
  }

  return markets;
};

const parseMarketRow = (row: any[], rowIndex: number): AdminMarket | null => {
  // Map columns according to the specification:
  // A=0: ID, C=2: Channel, D=3: Banner, E=4: Handelskette, 
  // F=5: Name, G=6: PLZ, H=7: Stadt, I=8: Straße,
  // J=9: Status, K=10: Filiale, L=11: Frequenz,
  // O=14: Kundentyp, P=15: Tel, Q=16: Email,
  // R=17: Maingroup, S=18: Subgroup

  const id = row[0] ? String(row[0]).trim() : '';
  const channel = row[2] ? String(row[2]).trim() : '';
  const banner = row[3] ? String(row[3]).trim() : '';
  const handelskette = row[4] ? String(row[4]).trim() : '';
  const name = row[5] ? String(row[5]).trim() : '';
  const plz = row[6] ? String(row[6]).trim() : '';
  const stadt = row[7] ? String(row[7]).trim() : '';
  const strasse = row[8] ? String(row[8]).trim() : '';
  const status = row[9] ? String(row[9]).trim() : '';
  const filiale = row[10] ? String(row[10]).trim() : '';
  const frequenz = row[11] ? parseFloat(String(row[11])) : 12;
  const kundentyp = row[14] ? String(row[14]).trim() : '';
  const tel = row[15] ? String(row[15]).trim() : '';
  const email = row[16] ? String(row[16]).trim() : '';
  const maingroup = row[17] ? String(row[17]).trim() : '';
  const subgroup = row[18] ? String(row[18]).trim() : '';

  // Validate required fields
  if (!id || !name) {
    console.warn(`Zeile ${rowIndex + 1}: ID oder Name fehlt`);
    return null;
  }

  // Determine if market is active
  const isActive = status.toLowerCase() === 'aktiv';

  // Create the market object
  const market: AdminMarket = {
    id: generateMarketId(id, rowIndex),
    internalId: id,
    name: name,
    address: strasse || '',
    city: stadt || '',
    postalCode: plz || '',
    chain: normalizeChainName(handelskette),
    frequency: isNaN(frequenz) ? 12 : Math.max(1, Math.round(frequenz)),
    currentVisits: 0,
    isActive: isActive,
    channel: channel || undefined,
    banner: banner || undefined,
    branch: filiale || undefined,
    customerType: kundentyp || undefined,
    phone: tel || undefined,
    email: email || undefined,
    maingroup: maingroup || undefined,
    subgroup: subgroup || undefined,
  };

  return market;
};

const generateMarketId = (internalId: string, rowIndex: number): string => {
  // Use internal ID if available, otherwise generate one
  return internalId || `IMPORT-${String(rowIndex).padStart(4, '0')}`;
};

const normalizeChainName = (chain: string): string => {
  if (!chain) return 'Sonstige';
  
  const chainLower = chain.toLowerCase().trim();
  
  // Map common variations to standard names
  const chainMap: Record<string, string> = {
    'adeg': 'Adeg',
    'billa+': 'Billa+',
    'billa plus': 'Billa+',
    'billa+ privat': 'BILLA+ Privat',
    'billa privat': 'BILLA Privat',
    'eurospar': 'Eurospar',
    'futterhaus': 'Futterhaus',
    'hagebau': 'Hagebau',
    'interspar': 'Interspar',
    'spar': 'Spar',
    'spar gourmet': 'Spar Gourmet',
    'zoofachhandel': 'Zoofachhandel',
    'hofer': 'Hofer',
    'merkur': 'Merkur',
  };

  return chainMap[chainLower] || chain;
};

export const validateImportFile = (file: File): { valid: boolean; error?: string } => {
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

