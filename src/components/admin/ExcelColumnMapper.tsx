import React, { useState, useEffect } from 'react';
import { X, Check, WarningCircle } from '@phosphor-icons/react';
import { readExcelPreview, parseProductFileWithMapping } from '../../utils/productImporter';
import type { ColumnMapping } from '../../utils/productImporter';
import type { Product } from '../../types/product-types';
import styles from './ExcelColumnMapper.module.css';

interface ExcelColumnMapperProps {
  file: File;
  department: 'pets' | 'food';
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
  onImport,
  onCancel,
}) => {
  const [preview, setPreview] = useState<string[][]>([]);
  const [mapping, setMapping] = useState<ColumnMapping>({
    name: '',
    weight: '',
    price: '',
    palletSize: '',
    artikelNr: '',
    skipHeaderRow: true,
  });
  const [isImporting, setIsImporting] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  useEffect(() => {
    readExcelPreview(file, 6).then(setPreview).catch(() => setPreview([]));
  }, [file]);

  const maxCols = preview.reduce((max, row) => Math.max(max, row.length), 0);

  const isValid = mapping.name.trim() !== '' && mapping.weight.trim() !== '' && mapping.price.trim() !== '';

  const handleImport = async () => {
    if (!isValid) return;
    setIsImporting(true);
    try {
      const products = await parseProductFileWithMapping(file, department, mapping);
      if (products.length === 0) {
        setResult({ success: false, message: 'Keine gültigen Produkte gefunden. Bitte Spalten prüfen.' });
        setIsImporting(false);
        return;
      }
      setResult({ success: true, message: `${products.length} Produkte importiert` });
      setTimeout(() => onImport(products), 1200);
    } catch (err) {
      setResult({ success: false, message: err instanceof Error ? err.message : 'Import fehlgeschlagen' });
      setIsImporting(false);
    }
  };

  const departmentColor = department === 'pets' ? '#10B981' : '#F59E0B';
  const departmentLabel = department === 'pets' ? 'Tiernahrung' : 'Lebensmittel';

  const fields: { key: keyof Omit<ColumnMapping, 'skipHeaderRow'>; label: string; required: boolean }[] = [
    { key: 'name', label: 'Produktname', required: true },
    { key: 'weight', label: 'Gewicht / Größe', required: true },
    { key: 'price', label: 'Preis', required: true },
    { key: 'palletSize', label: 'Palette', required: false },
    { key: 'artikelNr', label: 'Artikel Nr.', required: false },
  ];

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
          {preview.length > 0 && (
            <div className={styles.section}>
              <div className={styles.sectionTitle}>Excel Vorschau</div>
              <div className={styles.previewWrapper}>
                <table className={styles.previewTable}>
                  <thead>
                    <tr>
                      <th>#</th>
                      {Array.from({ length: maxCols }, (_, i) => (
                        <th key={i}>{colLetterLabel(i)}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {preview.map((row, ri) => (
                      <tr key={ri}>
                        <td style={{ color: '#94A3B8', fontWeight: 600 }}>{ri + 1}</td>
                        {Array.from({ length: maxCols }, (_, ci) => (
                          <td key={ci}>{row[ci] != null && !isNaN(Number(row[ci])) && String(row[ci]).trim() !== '' ? parseFloat(Number(row[ci]).toFixed(2)) : (row[ci] ?? '')}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className={styles.previewHint}>
                Trage unten den Spaltenbuchstaben ein. Für Produktname kannst du mehrere Spalten kombinieren (z.B. AB = Spalte A + Spalte B).
              </div>
            </div>
          )}

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

            <label className={styles.skipRow}>
              <input
                type="checkbox"
                className={styles.skipCheckbox}
                checked={mapping.skipHeaderRow}
                onChange={(e) => setMapping((prev) => ({ ...prev, skipHeaderRow: e.target.checked }))}
              />
              <span className={styles.skipLabel}>Erste Zeile ist Header (überspringen)</span>
            </label>
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
