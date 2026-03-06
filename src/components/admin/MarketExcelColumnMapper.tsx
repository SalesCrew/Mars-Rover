import React, { useState, useEffect } from 'react';
import { X, Check, WarningCircle } from '@phosphor-icons/react';
import { readMarketExcelPreview, parseMarketFileWithMapping } from '../../utils/marketImporter';
import type { MarketColumnMapping } from '../../utils/marketImporter';
import type { AdminMarket } from '../../types/market-types';
import { API_BASE_URL } from '../../config/database';
import styles from './ExcelColumnMapper.module.css';

interface MarketExcelColumnMapperProps {
  file: File;
  onImport: (markets: AdminMarket[]) => void;
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

const DEFAULT_MAPPING: MarketColumnMapping = {
  marketId:   'A',
  name:       'H',
  chain:      'F',
  postalCode: 'I',
  city:       'J',
  address:    'K',
  glName:     'L',
  glEmail:    'M',
  status:     'N',
  frequency:  'P',
  banner:     'E',
  channel:    'D',
  branch:     'G',
  marketTel:  'S',
  marketEmail:'T',
  marsFil:    'U',
  skipHeaderRow: true,
};

const columnLetterToIndex = (letter: string): number => {
  const upper = letter.toUpperCase().trim();
  if (!upper) return -1;
  let index = 0;
  for (let i = 0; i < upper.length; i++) {
    index = index * 26 + (upper.charCodeAt(i) - 64);
  }
  return index - 1;
};

export const MarketExcelColumnMapper: React.FC<MarketExcelColumnMapperProps> = ({
  file,
  onImport,
  onCancel,
}) => {
  const [preview, setPreview] = useState<string[][]>([]);
  const [mapping, setMapping] = useState<MarketColumnMapping>(DEFAULT_MAPPING);
  const [isImporting, setIsImporting] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);
  const [marsFilOnly, setMarsFilOnly] = useState(false);

  useEffect(() => {
    readMarketExcelPreview(file, 6).then(setPreview).catch(() => setPreview([]));
  }, [file]);

  const maxCols = preview.reduce((max, row) => Math.max(max, row.length), 0);

  const isValid = marsFilOnly
    ? mapping.marketId.trim() !== '' && mapping.marsFil.trim() !== ''
    : mapping.marketId.trim() !== '' && mapping.name.trim() !== '';

  const handleMarsFilOnlyImport = async () => {
    setIsImporting(true);
    try {
      const workbook = await import('xlsx');
      const reader = new FileReader();
      const entries = await new Promise<Array<{ id: string; mars_fil: string }>>((resolve, reject) => {
        reader.onload = (e) => {
          try {
            const data = e.target?.result;
            const wb = workbook.read(data, { type: 'binary' });
            const sheet = wb.Sheets[wb.SheetNames[0]];
            const rawData: any[][] = workbook.utils.sheet_to_json(sheet, { header: 1, defval: '' });

            const idIdx = columnLetterToIndex(mapping.marketId);
            const filIdx = columnLetterToIndex(mapping.marsFil);
            const startRow = mapping.skipHeaderRow ? 1 : 0;
            const result: Array<{ id: string; mars_fil: string }> = [];

            for (let i = startRow; i < rawData.length; i++) {
              const row = rawData[i];
              if (!row || row.length === 0) continue;
              const id = idIdx >= 0 && row[idIdx] != null ? String(row[idIdx]).trim() : '';
              const fil = filIdx >= 0 && row[filIdx] != null ? String(row[filIdx]).trim() : '';
              if (id && fil) result.push({ id, mars_fil: fil });
            }
            resolve(result);
          } catch (err) {
            reject(err);
          }
        };
        reader.onerror = () => reject(new Error('Fehler beim Lesen'));
        reader.readAsBinaryString(file);
      });

      if (entries.length === 0) {
        setResult({ success: false, message: 'Keine gültigen Einträge gefunden. Bitte Spalten prüfen.' });
        setIsImporting(false);
        return;
      }

      const response = await fetch(`${API_BASE_URL}/markets/import-mars-fil`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entries),
      });

      if (!response.ok) throw new Error('Server-Fehler');
      const data = await response.json();
      setResult({ success: true, message: `Mars Fil Nr für ${data.success} Märkte aktualisiert` });
      setTimeout(() => onCancel(), 2000);
    } catch (err) {
      setResult({ success: false, message: err instanceof Error ? err.message : 'Import fehlgeschlagen' });
      setIsImporting(false);
    }
  };

  const handleImport = async () => {
    if (!isValid) return;

    if (marsFilOnly) {
      handleMarsFilOnlyImport();
      return;
    }

    setIsImporting(true);
    try {
      const markets = await parseMarketFileWithMapping(file, mapping);
      if (markets.length === 0) {
        setResult({ success: false, message: 'Keine gültigen Märkte gefunden. Bitte Spalten prüfen.' });
        setIsImporting(false);
        return;
      }
      setResult({ success: true, message: `${markets.length} Märkte eingelesen` });
      setTimeout(() => onImport(markets), 1200);
    } catch (err) {
      setResult({ success: false, message: err instanceof Error ? err.message : 'Import fehlgeschlagen' });
      setIsImporting(false);
    }
  };

  const setCol = (key: keyof Omit<MarketColumnMapping, 'skipHeaderRow'>, raw: string) => {
    const val = raw.replace(/[^a-zA-Z]/g, '').toUpperCase().slice(0, 2);
    setMapping(prev => ({ ...prev, [key]: val }));
  };

  const allFields: { key: keyof Omit<MarketColumnMapping, 'skipHeaderRow'>; label: string; required: boolean }[] = [
    { key: 'marketId',    label: 'Markt ID',       required: true  },
    { key: 'name',        label: 'Name',            required: true  },
    { key: 'chain',       label: 'Handelskette',    required: false },
    { key: 'postalCode',  label: 'PLZ',             required: false },
    { key: 'city',        label: 'Stadt',           required: false },
    { key: 'address',     label: 'Straße',          required: false },
    { key: 'glName',      label: 'GL Name',         required: false },
    { key: 'glEmail',     label: 'GL Email',        required: false },
    { key: 'status',      label: 'Status',          required: false },
    { key: 'frequency',   label: 'Frequenz',        required: false },
    { key: 'banner',      label: 'Banner',          required: false },
    { key: 'channel',     label: 'Channel',         required: false },
    { key: 'branch',      label: 'Filiale',         required: false },
    { key: 'marketTel',   label: 'Markt Tel.',      required: false },
    { key: 'marketEmail', label: 'Markt Email',     required: false },
    { key: 'marsFil',     label: 'Mars Fil Nr',     required: false },
  ];

  const marsFilFields: typeof allFields = [
    { key: 'marketId', label: 'Markt ID (zum Abgleich)', required: true },
    { key: 'marsFil',  label: 'Mars Fil Nr',              required: true },
  ];

  const fields = marsFilOnly ? marsFilFields : allFields;

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
              style={{ backgroundColor: marsFilOnly ? '#F59E0B15' : '#3B82F615', color: marsFilOnly ? '#F59E0B' : '#3B82F6', borderColor: marsFilOnly ? '#F59E0B30' : '#3B82F630' }}
            >
              {marsFilOnly ? 'Mars Fil Nr' : 'Märkte'}
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
                          <td key={ci}>{row[ci] ?? ''}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className={styles.previewHint}>
                Trage den Spaltenbuchstaben ein (z.B. A, B, C...). Pflichtfelder sind mit * markiert.
              </div>
            </div>
          )}

          <div className={styles.section}>
            <div className={styles.sectionTitle}>Import Modus</div>
            <label className={styles.skipRow} style={{ marginTop: 0, marginBottom: 12, cursor: 'pointer' }}>
              <input
                type="checkbox"
                className={styles.skipCheckbox}
                checked={marsFilOnly}
                onChange={(e) => setMarsFilOnly(e.target.checked)}
              />
              <span className={styles.skipLabel}>Nur Mars Fil Nr aktualisieren (keine anderen Felder ändern)</span>
            </label>
          </div>

          <div className={styles.section}>
            <div className={styles.sectionTitle}>Spaltenzuordnung</div>
            <div className={styles.mappingGrid}>
              {fields.map((f) => (
                <div className={styles.fieldRow} key={f.key}>
                  <span className={styles.fieldLabel}>
                    {f.label}
                    {f.required && <span className={styles.fieldRequired}>*</span>}
                  </span>
                  <input
                    className={styles.fieldInput}
                    value={(mapping as any)[f.key] || ''}
                    onChange={(e) => setCol(f.key, e.target.value)}
                    placeholder="z.B. A"
                    maxLength={2}
                  />
                </div>
              ))}
            </div>

            <label className={styles.skipRow}>
              <input
                type="checkbox"
                className={styles.skipCheckbox}
                checked={mapping.skipHeaderRow}
                onChange={(e) => setMapping(prev => ({ ...prev, skipHeaderRow: e.target.checked }))}
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
            style={{ backgroundColor: marsFilOnly ? '#F59E0B' : '#3B82F6' }}
            disabled={!isValid || isImporting}
            onClick={handleImport}
          >
            <Check size={18} weight="bold" />
            {marsFilOnly ? 'Mars Fil Nr aktualisieren' : 'Einlesen'}
          </button>
        </div>
      </div>
    </div>
  );
};
