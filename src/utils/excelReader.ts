import ExcelJS from 'exceljs';

const stringifyCellValue = (value: ExcelJS.CellValue): string => {
  if (value == null) return '';
  if (value instanceof Date) return value.toISOString();

  if (typeof value === 'object') {
    if ('result' in value && value.result != null) {
      return stringifyCellValue(value.result as ExcelJS.CellValue);
    }
    if ('text' in value && value.text != null) {
      return String(value.text);
    }
    if ('richText' in value && Array.isArray(value.richText)) {
      return value.richText.map(part => part.text || '').join('');
    }
    if ('hyperlink' in value && 'text' in value && value.text != null) {
      return String(value.text);
    }
  }

  return String(value);
};

const loadWorkbook = async (file: File): Promise<ExcelJS.Workbook> => {
  const workbook = new ExcelJS.Workbook();
  const buffer = await file.arrayBuffer();
  await workbook.xlsx.load(buffer);
  return workbook;
};

export const readExcelRows = async (file: File, sheetName?: string): Promise<string[][]> => {
  const workbook = await loadWorkbook(file);
  const worksheet = sheetName ? workbook.getWorksheet(sheetName) : workbook.worksheets[0];

  if (!worksheet) {
    throw new Error('Die Excel-Datei enthalt kein Tabellenblatt.');
  }

  const maxColumn = worksheet.columnCount;
  const rows: string[][] = [];

  for (let rowNumber = 1; rowNumber <= worksheet.rowCount; rowNumber++) {
    const row = worksheet.getRow(rowNumber);
    const values: string[] = [];
    for (let columnNumber = 1; columnNumber <= maxColumn; columnNumber++) {
      values.push(stringifyCellValue(row.getCell(columnNumber).value));
    }
    rows.push(values);
  }

  return rows;
};

export const readExcelSheetNames = async (file: File): Promise<string[]> => {
  const workbook = await loadWorkbook(file);
  return workbook.worksheets.map(sheet => sheet.name);
};
