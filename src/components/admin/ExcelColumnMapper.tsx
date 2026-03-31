import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { X, Check, WarningCircle } from '@phosphor-icons/react';
import { readExcelPreview, parseProductFileWithMapping } from '../../utils/productImporter';
import type { ColumnMapping } from '../../utils/productImporter';
import type { Product } from '../../types/product-types';
import styles from './ExcelColumnMapper.module.css';

interface ExcelColumnMapperProps {
  file: File;
  department: 'pets' | 'food';
  sheetName?: string;
  onImport: (products: Product[]) => void;
  onCancel: () => void;
}

const colLetterLabel = (idx: number): string => {
  let label = '';
  let n = idx + 1;
  while (n > 0) {
    n--;
    label = String.fromCharCode(65 + (n % 26)) + label;
    n = Math.floor(n / 26);
  }
  return label;
};

export const ExcelColumnMapper: React.FC<ExcelColumnMapperProps> = ({
  file,
  department,
  sheetName,
  onImport,
  onCancel,
}) => {
  const [preview, setPreview] = useState<string[][]>([]);
  const [mapping, setMapping] = useState<ColumnMapping>({
    name: '',
    weight: '',
    price: '',
    content: '',
    artikelNr: '',
    startRow: 2,
    endRow: undefined,
  });
  const [rowSelectMode, setRowSelectMode] = useState<'start' | 'end'>('start');
  const [isImporting, setIsImporting] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  useEffect(() => {
    readExcelPreview(file, 25, sheetName).then(setPreview).catch(() => setPreview([]));
  }, [file, sheetName]);

  const maxCols = useMemo(() => preview.reduce((max, row) => Math.max(max, row.length), 0), [preview]);

  const isValid = useMemo(
    () => mapping.name.trim() !== '' && mapping.weight.trim() !== '' && mapping.price.trim() !== '',
    [mapping.name, mapping.weight, mapping.price]
  );

  const handleRowClick = useCallback((rowNum: number) => {
    if (rowSelectMode === 'start') {
      setMapping((prev) => ({ ...prev, startRow: rowNum }));
    } else {
      setMapping((prev) => ({ ...prev, endRow: rowNum }));
    }
  }, [rowSelectMode]);

  const handleModeToggle = useCallback((mode: 'start' | 'end') => {
    setRowSelectMode(mode);
  }, []);

  const handleImport = useCallback(async () => {
    if (!isValid) return;
    setIsImporting(true);
    try {
      const products = await parseProductFileWithMapping(file, department, mapping, sheetName);
      if (products.length === 0) {
        setResult({ success: false, message: 'Keine gültigen Produkte gefunden. Bitte Spalten und Startzeile prüfen.' });
        setIsImporting(false);
        return;
      }
      setResult({ success: true, message: `${products.length} Produkte importiert` });
      setTimeout(() => onImport(products), 1200);
    } catch (err) {
      setResult({ success: false, message: err instanceof Error ? err.message : 'Import fehlgeschlagen' });
      setIsImporting(false);
    }
  }, [isValid, file, department, mapping, sheetName, onImport]);

  const departmentColor = department === 'pets' ? '#10B981' : '#F59E0B';
  const departmentLabel = department === 'pets' ? 'Tiernahrung' : 'Lebensmittel';

  const fields: { key: keyof Omit<ColumnMapping, 'startRow'>; label: string; required: boolean }[] = [
    { key: 'name', label: 'Produktname', required: true },
    { key: 'weight', label: 'Gewicht / Größe', required: true },
    { key: 'price', label: 'Preis', required: true },
    { key: 'content', label: 'Inhalt (VE)', required: false },
    { key: 'artikelNr', label: 'Artikel Nr.', required: false },
  ];

  const startRowZeroBased = useMemo(() => Math.max(0, mapping.startRow - 1), [mapping.startRow]);
  const hasEndRow = useMemo(() => mapping.endRow != null && mapping.endRow >= mapping.startRow, [mapping.endRow, mapping.startRow]);

  const previewRows = useMemo(() => {
    if (preview.length === 0) return null;
    
    const colHeaders = Array.from({ length: maxCols }, (_, i) => (
      <th key={i}>{colLetterLabel(i)}</th>
    ));

    const tableRows = preview.map((row, ri) => {
      const rowNum = ri + 1;
      const isStartRow = rowNum === mapping.startRow;
      const isEndRow = hasEndRow && rowNum === mapping.endRow;
      const isSkipped = rowNum < mapping.startRow;
      const isAfterEnd = hasEndRow && rowNum > mapping.endRow!;
      
      return (
        <tr
          key={ri}
          className={
            isStartRow
              ? styles.previewRowStart
              : isEndRow
              ? styles.previewRowEnd
              : isSkipped || isAfterEnd
              ? styles.previewRowSkipped
              : undefined
          }
          onClick={() => handleRowClick(rowNum)}
          title={rowSelectMode === 'start'
            ? `Klicken um Startzeile auf ${rowNum} zu setzen`
            : `Klicken um Endzeile auf ${rowNum} zu setzen`}
        >
          <td className={styles.previewRowNum}>
            {isStartRow && <span className={styles.startMarker}>▶</span>}
            {isEndRow && <span className={styles.endMarker}>■</span>}
            {rowNum}
          </td>
          {Array.from({ length: maxCols }, (_, ci) => (
            <td key={ci}>
              {row[ci] != null && !isNaN(Number(row[ci])) && String(row[ci]).trim() !== ''
                ? parseFloat(Number(row[ci]).toFixed(2))
                : (row[ci] ?? '')}
            </td>
          ))}
        </tr>
      );
    });

    return { colHeaders, tableRows };
  }, [preview, maxCols, mapping.startRow, mapping.endRow, hasEndRow, handleRowClick, rowSelectMode]);

  return (
    <div className={styles.overlay} onClick={onCancel}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()} style={{ position: 'relative' }}>
        {(isImporting || result) && (
          <div className={styles.resultOverlay}>
            {isImporting && !result && <div className={styles.spinner} />}
            {result && (
              <>
                {result.success ? (
                  <Check size={48} weight="bold" className={styles.resultSuccess} />
                ) : (
                  <WarningCircle size={48} weight="fill" className={styles.resultError} />
                )}
                <span className={styles.resultText}>{result.message}</span>
                {!result.success && (
                  <button className={styles.cancelBtn} onClick={() => setResult(null)} style={{ marginTop: 8 }}>
                    Erneut versuchen
                  </button>
                )}
              </>
            )}
          </div>
        )}

        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <div
              className={styles.badge}
              style={{ backgroundColor: `${departmentColor}15`, color: departmentColor, borderColor: `${departmentColor}30` }}
            >
              {departmentLabel}
            </div>
            <h2 className={styles.title}>Spalten zuordnen</h2>
          </div>
          <button className={styles.closeBtn} onClick={onCancel}>
            <X size={20} weight="bold" />
          </button>
        </div>

        <div className={styles.body}>
          {/* ── Preview ── */}
          {previewRows && (
            <div className={styles.section}>
              <div className={styles.sectionTitle}>Excel Vorschau</div>
              <div className={styles.previewWrapper}>
                <table className={styles.previewTable}>
                  <thead>
                    <tr>
                      <th className={styles.previewRowNumTh}>#</th>
                      {previewRows.colHeaders}
                    </tr>
                  </thead>
                  <tbody>
                    {previewRows.tableRows}
                  </tbody>
                </table>
              </div>
              <div className={styles.previewHint}>
                Trage unten den Spaltenbuchstaben ein. Für Produktname kannst du mehrere Spalten kombinieren (z.B. AB = Spalte A + Spalte B).
              </div>
              <div className={styles.rowModeToggle}>
                <span className={styles.rowModeLabel}>Zeile auswählen:</span>
                <button
                  className={`${styles.rowModeBtn} ${rowSelectMode === 'start' ? styles.rowModeBtnActive : ''}`}
                  onClick={() => handleModeToggle('start')}
                  type="button"
                >
                  ▶ Startzeile
                </button>
                <button
                  className={`${styles.rowModeBtn} ${rowSelectMode === 'end' ? styles.rowModeBtnActiveEnd : ''}`}
                  onClick={() => handleModeToggle('end')}
                  type="button"
                >
                  ■ Endzeile
                </button>
              </div>
            </div>
          )}

          {/* ── Mapping ── */}
          <div className={styles.section}>
            <div className={styles.sectionTitle}>Spaltenzuordnung</div>
            <div className={styles.mappingGrid}>
              {fields.map((f) => {
                const isNameField = f.key === 'name';
                return (
                  <div className={styles.fieldRow} key={f.key}>
                    <span className={styles.fieldLabel}>
                      {f.label}
                      {f.required && <span className={styles.fieldRequired}>*</span>}
                    </span>
                    <input
                      className={styles.fieldInput}
                      style={isNameField ? { width: 80 } : undefined}
                      value={(mapping as any)[f.key] || ''}
                      onChange={(e) => {
                        const max = isNameField ? 5 : 2;
                        const val = e.target.value.replace(/[^a-zA-Z]/g, '').toUpperCase().slice(0, max);
                        setMapping((prev) => ({ ...prev, [f.key]: val }));
                      }}
                      placeholder={isNameField ? 'z.B. AB' : 'z.B. A'}
                      maxLength={isNameField ? 5 : 2}
                    />
                  </div>
                );
              })}
            </div>

            {/* ── Start / End row controls ── */}
            <div className={styles.startRowRow}>
              <div className={styles.startRowLeft}>
                <span className={styles.startRowLabel}>Daten beginnen ab Zeile</span>
                <input
                  type="number"
                  min={1}
                  max={preview.length || 9999}
                  className={styles.startRowInput}
                  value={mapping.startRow}
                  onChange={(e) => {
                    const v = Math.max(1, parseInt(e.target.value) || 1);
                    setMapping((prev) => ({ ...prev, startRow: v }));
                  }}
                />
                <span className={styles.startRowLabel} style={{ marginLeft: 16 }}>Enden bei Zeile</span>
                <input
                  type="number"
                  min={mapping.startRow}
                  max={preview.length || 9999}
                  className={styles.startRowInput}
                  placeholder="–"
                  value={mapping.endRow ?? ''}
                  onChange={(e) => {
                    const raw = e.target.value;
                    if (raw === '') {
                      setMapping((prev) => ({ ...prev, endRow: undefined }));
                    } else {
                      const v = Math.max(1, parseInt(raw) || 1);
                      setMapping((prev) => ({ ...prev, endRow: v }));
                    }
                  }}
                />
                {mapping.endRow != null && (
                  <button
                    type="button"
                    className={styles.clearEndRowBtn}
                    onClick={() => setMapping((prev) => ({ ...prev, endRow: undefined }))}
                    title="Endzeile entfernen"
                  >
                    ×
                  </button>
                )}
              </div>
              <span className={styles.startRowHint}>
                {useMemo(() => {
                  const skip = startRowZeroBased;
                  const end = hasEndRow ? `, endet bei Zeile ${mapping.endRow}` : '';
                  if (skip === 0) return `Alle Zeilen werden importiert${end}.`;
                  if (skip === 1) return `Zeile 1 wird übersprungen (z.B. Kopfzeile)${end}.`;
                  return `Zeilen 1–${startRowZeroBased} werden übersprungen, Import startet ab Zeile ${mapping.startRow}${end}.`;
                }, [startRowZeroBased, hasEndRow, mapping.endRow, mapping.startRow])}
              </span>
            </div>
          </div>
        </div>

        <div className={styles.footer}>
          <button className={styles.cancelBtn} onClick={onCancel}>
            Abbrechen
          </button>
          <button
            className={styles.importBtn}
            style={{ backgroundColor: departmentColor }}
            disabled={!isValid || isImporting}
            onClick={handleImport}
          >
            <Check size={18} weight="bold" />
            Importieren
          </button>
        </div>
      </div>
    </div>
  );
};
