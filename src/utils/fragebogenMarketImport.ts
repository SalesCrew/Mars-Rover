import * as XLSX from 'xlsx';
import type { AdminMarket } from '../types/market-types';

export interface FragebogenMarketImportMapping {
  interneIdColumn: string;
  foodPsStoreFormatColumn: string;
  foodPsStoreFormatValue: string;
  skipHeaderRow: boolean;
}

export interface FragebogenMarketImportResult {
  matchedMarketIds: string[];
  matchedInternalIds: string[];
  unmatchedInternalIds: string[];
  excludedByFormat: number;
  totalDataRows: number;
}

const columnLetterToIndex = (letter: string): number => {
  const upper = letter.toUpperCase().trim();
  if (!upper) return -1;
  let index = 0;
  for (let i = 0; i < upper.length; i++) {
    index = index * 26 + (upper.charCodeAt(i) - 64);
  }
  return index - 1;
};

export const readFragebogenMarketExcelPreview = async (
  file: File,
  maxRows = 6,
): Promise<string[][]> => {
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

export const parseFragebogenMarketMatches = async (
  file: File,
  mapping: FragebogenMarketImportMapping,
  availableMarkets: AdminMarket[],
): Promise<FragebogenMarketImportResult> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rawData: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });

        const idIdx = columnLetterToIndex(mapping.interneIdColumn);
        const formatIdx = columnLetterToIndex(mapping.foodPsStoreFormatColumn);
        const matchValue = mapping.foodPsStoreFormatValue.trim().toLowerCase();

        // ── Pre-parse validation ────────────────────────────────────────────
        if (idIdx < 0) {
          throw new Error(
            `Ungültige Spalte für "Interne ID": "${mapping.interneIdColumn}". ` +
            'Bitte einen gültigen Spaltenbuchstaben eingeben (z.B. A, B, C…).'
          );
        }
        if (formatIdx < 0) {
          throw new Error(
            `Ungültige Spalte für "Food PS Store Format": "${mapping.foodPsStoreFormatColumn}". ` +
            'Bitte einen gültigen Spaltenbuchstaben eingeben.'
          );
        }
        if (!matchValue) {
          throw new Error('Bitte einen Wert für "Food PS Store Format" eingeben.');
        }
        // ───────────────────────────────────────────────────────────────────

        const startRow = mapping.skipHeaderRow ? 1 : 0;

        // Build lookup: normalised internalId → market UUID
        const marketByInternalId = new Map<string, string>();
        for (const market of availableMarkets) {
          if (market.internalId) {
            marketByInternalId.set(String(market.internalId).trim().toLowerCase(), market.id);
          }
        }

        let totalDataRows = 0;
        let excludedByFormat = 0;
        const matchedMarketIds: string[] = [];
        const matchedInternalIds: string[] = [];
        const unmatchedInternalIds: string[] = [];
        const seenMarketIds = new Set<string>();
        // Dedupe unmatched by normalized key, keep first original display value
        const seenUnmatchedNormalized = new Set<string>();

        for (let i = startRow; i < rawData.length; i++) {
          const row = rawData[i];
          if (!row || row.length === 0) continue;

          const rawId = idIdx >= 0 && row[idIdx] != null ? String(row[idIdx]).trim() : '';
          if (!rawId) continue;

          totalDataRows++;

          const rawFormat = formatIdx >= 0 && row[formatIdx] != null
            ? String(row[formatIdx]).trim().toLowerCase()
            : '';

          if (rawFormat !== matchValue) {
            excludedByFormat++;
            continue;
          }

          const normalizedId = rawId.toLowerCase();
          const marketId = marketByInternalId.get(normalizedId);

          if (marketId && !seenMarketIds.has(marketId)) {
            matchedMarketIds.push(marketId);
            matchedInternalIds.push(rawId);
            seenMarketIds.add(marketId);
          } else if (!marketId) {
            if (!seenUnmatchedNormalized.has(normalizedId)) {
              seenUnmatchedNormalized.add(normalizedId);
              unmatchedInternalIds.push(rawId);
            }
          }
        }

        resolve({
          matchedMarketIds,
          matchedInternalIds,
          unmatchedInternalIds,
          excludedByFormat,
          totalDataRows,
        });
      } catch (err) {
        reject(err instanceof Error ? err : new Error(`Fehler beim Verarbeiten der Datei: ${err}`));
      }
    };
    reader.onerror = () => reject(new Error('Fehler beim Lesen der Datei'));
    reader.readAsBinaryString(file);
  });
};
