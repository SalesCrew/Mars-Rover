import * as XLSX from 'xlsx';
import type { AdminMarket } from '../types/market-types';

export interface MarketColumnMapping {
  marketId: string;       // required
  name: string;           // required
  chain: string;          // required
  postalCode: string;
  city: string;
  address: string;
  glName: string;
  glEmail: string;
  status: string;
  frequency: string;
  banner: string;
  channel: string;
  branch: string;
  marketTel: string;
  marketEmail: string;
  marsFil: string;
  skipHeaderRow: boolean;
}

const columnLetterToIndex = (letter: string): number => {
  const upper = letter.toUpperCase().trim();
  let index = 0;
  for (let i = 0; i < upper.length; i++) {
    index = index * 26 + (upper.charCodeAt(i) - 64);
  }
  return index - 1;
};

export const readMarketExcelPreview = async (file: File, maxRows = 6): Promise<string[][]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const raw: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
        const preview = raw.slice(0, maxRows).map(row =>
          row.map((cell: any) => (cell == null ? '' : String(cell)))
        );
        resolve(preview);
      } catch (err) {
        reject(new Error(`Fehler beim Lesen der Vorschau: ${err}`));
      }
    };
    reader.onerror = () => reject(new Error('Fehler beim Lesen der Datei'));
    reader.readAsBinaryString(file);
  });
};

export const parseMarketFileWithMapping = async (
  file: File,
  mapping: MarketColumnMapping
): Promise<AdminMarket[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rawData: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });

        const idx = (col: string) => col.trim() ? columnLetterToIndex(col) : -1;
        const idIdx       = idx(mapping.marketId);
        const nameIdx     = idx(mapping.name);
        const chainIdx    = idx(mapping.chain);
        const plzIdx      = idx(mapping.postalCode);
        const cityIdx     = idx(mapping.city);
        const streetIdx   = idx(mapping.address);
        const glNameIdx   = idx(mapping.glName);
        const glEmailIdx  = idx(mapping.glEmail);
        const statusIdx   = idx(mapping.status);
        const freqIdx     = idx(mapping.frequency);
        const bannerIdx   = idx(mapping.banner);
        const channelIdx  = idx(mapping.channel);
        const branchIdx   = idx(mapping.branch);
        const telIdx      = idx(mapping.marketTel);
        const emailIdx    = idx(mapping.marketEmail);
        const marsFilIdx  = idx(mapping.marsFil);

        const get = (row: any[], i: number) => (i >= 0 && row[i] != null ? String(row[i]).trim() : '');

        const startRow = mapping.skipHeaderRow ? 1 : 0;
        const markets: AdminMarket[] = [];

        for (let i = startRow; i < rawData.length; i++) {
          const row = rawData[i];
          if (!row || row.length === 0) continue;

          const id   = get(row, idIdx);
          const name = get(row, nameIdx);
          if (!id || !name) continue;

          const status   = get(row, statusIdx);
          const freqRaw  = freqIdx >= 0 && row[freqIdx] ? parseFloat(String(row[freqIdx])) : 12;
          const frequenz = isNaN(freqRaw) ? 12 : Math.max(1, Math.round(freqRaw));

          markets.push({
            id: id,
            internalId: id,
            name,
            address:          get(row, streetIdx),
            city:             get(row, cityIdx),
            postalCode:       get(row, plzIdx),
            chain:            normalizeChainName(get(row, chainIdx)),
            frequency:        frequenz,
            currentVisits:    0,
            isActive:         status.toLowerCase() === 'aktiv',
            channel:          get(row, channelIdx) || undefined,
            banner:           get(row, bannerIdx) || undefined,
            branch:           get(row, branchIdx) || undefined,
            gebietsleiterName:  get(row, glNameIdx) || undefined,
            gebietsleiterEmail: get(row, glEmailIdx) || undefined,
            marketTel:        get(row, telIdx) || undefined,
            marketEmail:      get(row, emailIdx) || undefined,
            marsFil:          get(row, marsFilIdx) || undefined,
          });
        }

        resolve(markets);
      } catch (error) {
        reject(new Error(`Fehler beim Verarbeiten der Datei: ${error}`));
      }
    };
    reader.onerror = () => reject(new Error('Fehler beim Lesen der Datei'));
    reader.readAsBinaryString(file);
  });
};

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
  // Excel Column Mapping (0-indexed) - Updated January 2026:
  // A=0: Market ID
  // B=1: IGNORE
  // C=2: IGNORE
  // D=3: Channel
  // E=4: Banner
  // F=5: Handelskette (Chain)
  // G=6: Fil (Filiale number)
  // H=7: Market Name
  // I=8: PLZ (Postal Code)
  // J=9: Stadt (City)
  // K=10: Straße (Street)
  // L=11: GL Name
  // M=12: GL Email
  // N=13: Status (Aktiv/Inaktiv)
  // O=14: IGNORE
  // P=15: Frequenz
  // Q=16: IGNORE
  // R=17: IGNORE
  // S=18: Market Tel
  // T=19: Market Email
  // U=20: Mars Fil Nr

  const id = row[0] ? String(row[0]).trim() : '';                    // A=0: Market ID
  const channel = row[3] ? String(row[3]).trim() : '';               // D=3: Channel
  const banner = row[4] ? String(row[4]).trim() : '';                // E=4: Banner
  const handelskette = row[5] ? String(row[5]).trim() : '';          // F=5: Handelskette
  // G=6: Fil (available in row[6] but not stored)
  const name = row[7] ? String(row[7]).trim() : '';                  // H=7: Market Name
  const plz = row[8] ? String(row[8]).trim() : '';                   // I=8: PLZ
  const stadt = row[9] ? String(row[9]).trim() : '';                 // J=9: Stadt (City)
  const strasse = row[10] ? String(row[10]).trim() : '';             // K=10: Straße (Street)
  const gebietsleiterName = row[11] ? String(row[11]).trim() : '';   // L=11: GL Name
  const gebietsleiterEmail = row[12] ? String(row[12]).trim() : '';  // M=12: GL Email
  const status = row[13] ? String(row[13]).trim() : '';              // N=13: Status
  const frequenz = row[15] ? parseFloat(String(row[15])) : 12;       // P=15: Frequenz
  const marketTel = row[18] ? String(row[18]).trim() : '';           // S=18: Market Tel
  const marketEmail = row[19] ? String(row[19]).trim() : '';         // T=19: Market Email
  const marsFil = row[20] ? String(row[20]).trim() : '';             // U=20: Mars Fil Nr

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
    gebietsleiterName: gebietsleiterName || undefined,   // M=12: GL Name
    gebietsleiterEmail: gebietsleiterEmail || undefined, // N=13: GL Email (for ID matching)
    marketTel: marketTel || undefined,                   // S=18: Market Tel
    marketEmail: marketEmail || undefined,               // T=19: Market Email
    marsFil: marsFil || undefined,                       // U=20: Mars Fil Nr
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

