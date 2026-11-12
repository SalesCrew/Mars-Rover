import ExcelJS from 'exceljs';
import type { CatalogEntry } from '../services/quarterCatalogService';

const value = (cell: ExcelJS.Cell): string => {
  const v = cell.value;
  if (v == null) return '';
  if (typeof v === 'object' && 'result' in v) return String(v.result ?? '');
  if (typeof v === 'object' && 'richText' in v) return v.richText.map(p => p.text).join('');
  return String(v).trim();
};
const number = (s: string) => Number(s.replace(',', '.'));
const article = (s: string) => /^\d{4,14}$/.test(s) ? s : '';

// Explicit supplier layouts: the display article is NOT the component article.
// Hidden sheets, delists and unlabelled historical sheets are never imported.
export async function parseQuarterPriceWorkbook(file: File, year: number, quarter: number): Promise<{ rows: CatalogEntry[]; sha256: string; warnings: string[] }> {
  const bytes = await file.arrayBuffer();
  if (bytes.byteLength > 32 * 1024 * 1024) throw new Error('Die Preisliste darf höchstens 32 MB groß sein.');
  const workbook = new ExcelJS.Workbook(); await workbook.xlsx.load(bytes);
  const entries = new Map<string, CatalogEntry>();
  const warnings: string[] = [];
  for (const sheet of workbook.worksheets) {
    if (sheet.state !== 'visible' || /delist|overfill/i.test(sheet.name)) continue;
    const food = /Einzelitems|Nährmittel|\bFood\b/i.test(sheet.name + value(sheet.getCell('A1')));
    const isDisplay = /display/i.test(sheet.name);
    const special = /Sonderpreis|PC Sonderartikel|PC Copacks/i.test(sheet.name);
    const copack = /PC Copacks/i.test(sheet.name);
    const isMain = /^Einzelitems|^Preisliste ab|^PC Sonderartikel|^PC Copacks/i.test(sheet.name.trim());
    if (!isDisplay && !isMain && !special) continue;
    const heading = [sheet.name, ...[1,2,3].map(r => value(sheet.getCell(r,1)))].join(' ');
    const q = heading.match(/Q\s*([1-4])\s*(20\d{2})/i);
    const date = heading.match(/(\d{2})\.(\d{2})\.(20\d{2})/);
    const sheetYear = q ? Number(q[2]) : date ? Number(date[3]) : null;
    const sheetQuarter = q ? Number(q[1]) : date ? Math.ceil(Number(date[2]) / 3) : null;
    if (sheetYear !== year || sheetQuarter !== quarter) throw new Error(`Das Blatt „${sheet.name}“ belegt nicht Q${quarter} ${year}. Bitte das passende Quartal auswählen.`);
    const sourceDate = date ? `${date[3]}-${date[2]}-${date[1]}` : `${year}-${String((quarter-1)*3+1).padStart(2,'0')}-01`;
    if(date && (Number(date[3])!==year || Math.ceil(Number(date[2])/3)!==quarter)) throw new Error(`Widersprüchliche Gültigkeit in „${sheet.name}“.`);
    const department = food || /Einzelitems/i.test(sheet.name) ? 'food' : 'pets';
    const displayFood = isDisplay && /Nährmittel|Ben.?s|Lebensmittel/i.test(heading + value(sheet.getCell('A5')));
    const headerRow = special && department === 'pets' ? 3 : 4;
    const headers = Array.from({ length: Math.min(sheet.columnCount, 30) }, (_, i) => ({ col: i + 1, label: value(sheet.getCell(headerRow, i + 1)).replace(/\s+/g, ' ').trim() }));
    const letter = (column: number) => sheet.getColumn(column).letter;
    const articleHeaders = headers.filter(h => /art(?:ikel)?\.?\s*-?\s*nr/i.test(h.label));
    const parentArticle = articleHeaders.find(h => /display/i.test(h.label)) || articleHeaders.at(-1);
    const fullPrice = headers.filter(h => /gh|preis/i.test(h.label) && !/unit|stk|stück|packung\s*\/|einzel/i.test(h.label)).at(-1);
    const customer = headers.find(h => /kunde/i.test(h.label));
    const mainArticle = articleHeaders.find(h => !/bestückung|inhalt|display/i.test(h.label));
    const mainVe = headers.find(h => /(?:inhalt|stück|stk).*\bve\b/i.test(h.label));
    const mainPrice = headers.find(h => /(?:gh|preis).*\bve\b/i.test(h.label));
    const mainName = headers.find(h => /artikelbezeichnung/i.test(h.label));
    if (!isDisplay && !special && (!mainArticle || !mainVe || !mainPrice || !mainName)) throw new Error(`Die Spalten in „${sheet.name}“ sind nicht eindeutig zugeordnet (Artikelnummer, Inhalt pro VE, GH VE). Es wurde nichts übernommen.`);
    if (isDisplay && (!articleHeaders.length || !headers.some(h => /gh|preis/i.test(h.label)))) throw new Error(`Display-Spalten in „${sheet.name}“ sind nicht eindeutig zugeordnet.`);
    for (let r=copack?4:5;r<=sheet.rowCount;r++) {
      const get = (col: string) => value(sheet.getCell(`${col}${r}`));
      if ((special || isDisplay) && (!parentArticle || !fullPrice)) throw new Error(`Die Artikel- und Vollpreisspalten in „${sheet.name}“ fehlen.`);
      const skuCol = special || isDisplay ? letter(parentArticle!.col) : letter(mainArticle!.col);
      const priceCol = special || isDisplay ? letter(fullPrice!.col) : letter(mainPrice!.col);
      if (!/art(?:ikel)?\.?\s*-?\s*nr/i.test(value(sheet.getCell(`${skuCol}${headerRow}`))) || !/gh|preis/i.test(value(sheet.getCell(`${priceCol}${headerRow}`)))) throw new Error(`Artikel- oder Preisspalte in „${sheet.name}“ ist nicht eindeutig. Bitte die Preislistenstruktur prüfen.`);
      const skuCell = sheet.getCell(`${skuCol}${r}`);
      if (skuCell.isMerged && skuCell.master.address !== skuCell.address) continue;
      const sku = article(get(skuCol)); if (!sku) continue;
      const rawPrice = get(priceCol), price = number(rawPrice);
      if (!rawPrice) { warnings.push(`Artikel ${sku}: Preis fehlt in ${sheet.name}!${priceCol}${r}; nicht übernommen.`); continue; }
      if (!Number.isFinite(price) || price<0) throw new Error(`Ungültiger Preis in ${sheet.name}!${priceCol}${r}.`);
      let name = isDisplay || special ? get('A') : department === 'food' ? get(letter(mainName!.col)) : [get(letter(mainName!.col)),mainName!.col===1&&mainVe!.col>2?get('B'):''].filter(Boolean).join(' ');
      if (isDisplay && !displayFood) {
        const next = value(sheet.getCell(`A${r+1}`));
        if (/Display|Dolly|Palette/i.test(next)) name += ` ${next}`;
      }
      if (!name.trim()) throw new Error(`Artikelbezeichnung fehlt in ${sheet.name}, Zeile ${r}.`);
      const isFinishedDisplay = isDisplay || (special && /Display|FSDU|Dolly/i.test(name));
      const specialVe = special && department==='pets' ? Number(get('C').match(/^\s*(\d+)\s*(?:Stück|Packungen|Stk)/i)?.[1]) : 1;
      const ve = isFinishedDisplay ? 1 : special ? specialVe : number(get(letter(mainVe!.col)));
      if (!Number.isInteger(ve) || ve<1) throw new Error(`VE fehlt in ${sheet.name}, Zeile ${r}.`);
      const types = isFinishedDisplay ? ['display'] as const : special ? ['kartonware'] as const : ['einzelprodukt','kartonware'] as const;
      for (const type of types) {
        const item: CatalogEntry = { department: displayFood ? 'food' : department, item_type:type, artikel_nr:sku, name:name.trim(), units_per_ve:ve,
          price_per_order:Math.round((price+Number.EPSILON)*10000)/10000, source_cell:`${sheet.name}!${skuCol}${r}:${priceCol}${r}`,
          scope_note:special&&customer?get(letter(customer.col)):'', source_valid_from:sourceDate };
        const key = `${item.department}:${type}:${sku}`;
        const previous = entries.get(key);
        if (previous && (previous.price_per_order!==item.price_per_order || previous.units_per_ve!==item.units_per_ve)) throw new Error(`Widersprüchliche Preise oder VEs für Artikel ${sku}. Bitte die Quelldatei prüfen.`);
        if (!previous) entries.set(key,item);
      }
    }
  }
  if (!entries.size) throw new Error('Keine freigegebenen Artikel im unterstützten Preislistenformat gefunden.');
  const hash = await crypto.subtle.digest('SHA-256',bytes);
  return { rows:[...entries.values()], sha256:[...new Uint8Array(hash)].map(b=>b.toString(16).padStart(2,'0')).join(''), warnings };
}
