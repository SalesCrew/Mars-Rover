import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { X, Check, WarningCircle, Upload, FileText } from '@phosphor-icons/react';
import {
  readFragebogenMarketExcelPreview,
  parseFragebogenMarketMatches,
  type FragebogenMarketImportMapping,
  type FragebogenMarketImportResult,
} from '../../utils/fragebogenMarketImport';
import type { AdminMarket } from '../../types/market-types';
import styles from './FragebogenMarketImportMapperModal.module.css';

interface FragebogenMarketImportMapperModalProps {
  availableMarkets: AdminMarket[];
  onConfirm: (result: FragebogenMarketImportResult) => void;
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

export const FragebogenMarketImportMapperModal: React.FC<FragebogenMarketImportMapperModalProps> = ({
  availableMarkets,
  onConfirm,
  onCancel,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string[][]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [mapping, setMapping] = useState<FragebogenMarketImportMapping>({
    interneIdColumn: '',
    foodPsStoreFormatColumn: '',
    foodPsStoreFormatValue: '',
    skipHeaderRow: true,
  });
  const [isParsing, setIsParsing] = useState(false);
  const [result, setResult] = useState<FragebogenMarketImportResult | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const maxCols = preview.reduce((max, row) => Math.max(max, row.length), 0);

  useEffect(() => {
    if (!file) return;
    setPreview([]);
    setResult(null);
    setParseError(null);
    readFragebogenMarketExcelPreview(file, 6).then(setPreview).catch(() => setPreview([]));
  }, [file]);

  const isValid =
    mapping.interneIdColumn.trim() !== '' &&
    mapping.foodPsStoreFormatColumn.trim() !== '' &&
    mapping.foodPsStoreFormatValue.trim() !== '';

  const handleFile = (f: File) => {
    setFile(f);
    setResult(null);
    setParseError(null);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  const handleApply = async () => {
    if (!file || !isValid) return;
    setIsParsing(true);
    setParseError(null);
    setResult(null);
    try {
      const res = await parseFragebogenMarketMatches(file, mapping, availableMarkets);
      setResult(res);
    } catch (err) {
      setParseError(err instanceof Error ? err.message : 'Fehler beim Verarbeiten');
    } finally {
      setIsParsing(false);
    }
  };

  const handleConfirm = () => {
    if (!result) return;
    onConfirm(result);
  };

  const setColLetter = (key: 'interneIdColumn' | 'foodPsStoreFormatColumn', raw: string) => {
    const val = raw.replace(/[^a-zA-Z]/g, '').toUpperCase().slice(0, 2);
    setMapping(prev => ({ ...prev, [key]: val }));
    setResult(null);
  };

  const resetFile = () => {
    setFile(null);
    setPreview([]);
    setResult(null);
    setParseError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return ReactDOM.createPortal(
    <div className={styles.overlay} onClick={onCancel}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <div className={styles.badge}>Märkte</div>
            <h2 className={styles.title}>Märkte aus Excel importieren</h2>
          </div>
          <button className={styles.closeBtn} onClick={onCancel}>
            <X size={20} weight="bold" />
          </button>
        </div>

        {/* Body */}
        <div className={styles.body}>

          {/* ── No file: dropzone ── */}
          {!file && (
            <div
              className={`${styles.dropzone} ${isDragging ? styles.dropzoneDragging : ''}`}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload size={40} weight="regular" className={styles.dropzoneIcon} />
              <p className={styles.dropzoneText}>Datei hierher ziehen</p>
              <p className={styles.dropzoneHint}>oder klicken zum Auswählen</p>
              <p className={styles.dropzoneFormats}>.xlsx · .xls · .csv</p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                style={{ display: 'none' }}
                onChange={e => {
                  const f = e.target.files?.[0];
                  if (f) handleFile(f);
                }}
              />
            </div>
          )}

          {/* ── File loaded ── */}
          {file && (
            <>
              {/* File pill */}
              <div className={styles.fileRow}>
                <FileText size={20} weight="fill" className={styles.fileIcon} />
                <span className={styles.fileName}>{file.name}</span>
                <button className={styles.fileRemove} onClick={resetFile} title="Datei entfernen">
                  <X size={16} weight="bold" />
                </button>
              </div>

              {/* Preview */}
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
                            <td className={styles.rowNum}>{ri + 1}</td>
                            {Array.from({ length: maxCols }, (_, ci) => (
                              <td key={ci}>{row[ci] ?? ''}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <p className={styles.previewHint}>
                    Trage den Spaltenbuchstaben ein (z.B. A, B, C…). Alle Felder sind Pflichtfelder.
                  </p>
                </div>
              )}

              {/* Column + value mapping */}
              <div className={styles.section}>
                <div className={styles.sectionTitle}>Spaltenzuordnung &amp; Filter</div>
                <div className={styles.mappingGrid}>
                  {/* Interne ID column */}
                  <div className={styles.fieldRow}>
                    <span className={styles.fieldLabel}>
                      Interne ID Spalte <span className={styles.required}>*</span>
                    </span>
                    <input
                      className={styles.fieldInput}
                      value={mapping.interneIdColumn}
                      onChange={e => setColLetter('interneIdColumn', e.target.value)}
                      placeholder="A"
                      maxLength={2}
                    />
                  </div>

                  {/* Food PS Store Format column */}
                  <div className={styles.fieldRow}>
                    <span className={styles.fieldLabel}>
                      Food PS Store Format Spalte <span className={styles.required}>*</span>
                    </span>
                    <input
                      className={styles.fieldInput}
                      value={mapping.foodPsStoreFormatColumn}
                      onChange={e => setColLetter('foodPsStoreFormatColumn', e.target.value)}
                      placeholder="B"
                      maxLength={2}
                    />
                  </div>

                  {/* Food PS Store Format value — full-width row */}
                  <div className={styles.fieldRowFull}>
                    <span className={styles.fieldLabel}>
                      Food PS Store Format Wert <span className={styles.required}>*</span>
                    </span>
                    <input
                      className={`${styles.fieldInput} ${styles.fieldInputWide}`}
                      value={mapping.foodPsStoreFormatValue}
                      onChange={e => {
                        setMapping(prev => ({ ...prev, foodPsStoreFormatValue: e.target.value }));
                        setResult(null);
                      }}
                      placeholder="z.B. Supermarket"
                    />
                  </div>
                </div>

                {/* Skip header row */}
                <label className={styles.skipRow}>
                  <input
                    type="checkbox"
                    checked={mapping.skipHeaderRow}
                    onChange={e => {
                      setMapping(prev => ({ ...prev, skipHeaderRow: e.target.checked }));
                      setResult(null);
                    }}
                  />
                  <span>Erste Zeile ist Header (überspringen)</span>
                </label>
              </div>

              {/* Error */}
              {parseError && (
                <div className={styles.errorBanner}>
                  <WarningCircle size={18} weight="fill" />
                  <span>{parseError}</span>
                </div>
              )}

              {/* Result summary */}
              {result && (
                <div className={styles.resultSection}>
                  <div className={styles.resultRow}>
                    <span className={styles.resultMatchedCount}>{result.matchedMarketIds.length}</span>
                    <span className={styles.resultLabel}>
                      {result.matchedMarketIds.length === 1 ? 'Markt gefunden' : 'Märkte gefunden'}
                    </span>
                  </div>
                  {result.excludedByFormat > 0 && (
                    <div className={styles.resultInfo}>
                      {result.excludedByFormat} {result.excludedByFormat === 1 ? 'Zeile' : 'Zeilen'} gefiltert
                      {' '}(Food PS Store Format ≠ „{mapping.foodPsStoreFormatValue}")
                    </div>
                  )}
                  {result.unmatchedInternalIds.length > 0 && (
                    <div className={styles.resultWarning}>
                      <WarningCircle size={16} weight="fill" />
                      <span>
                        {result.unmatchedInternalIds.length}{' '}
                        {result.unmatchedInternalIds.length === 1 ? 'ID' : 'IDs'} nicht in der Datenbank gefunden:{' '}
                        {result.unmatchedInternalIds.slice(0, 5).join(', ')}
                        {result.unmatchedInternalIds.length > 5 && ` +${result.unmatchedInternalIds.length - 5} weitere`}
                      </span>
                    </div>
                  )}
                  {/* Contextual zero-match hints */}
                  {result.totalDataRows > 0 && result.matchedMarketIds.length === 0 && (
                    <>
                      {result.excludedByFormat === result.totalDataRows && (
                        <div className={styles.zeroMatchHint}>
                          <WarningCircle size={16} weight="fill" />
                          <span>
                            Alle Zeilen wurden durch den Store-Format-Filter ausgeschlossen.
                            Bitte den Wert für „Food PS Store Format" prüfen.
                          </span>
                        </div>
                      )}
                      {result.excludedByFormat === 0 && result.unmatchedInternalIds.length > 0 && (
                        <div className={styles.zeroMatchHint}>
                          <WarningCircle size={16} weight="fill" />
                          <span>
                            Keine IDs gefunden — die IDs aus der Datei stimmen nicht mit der Datenbank überein.
                            Bitte die Interne-ID-Spalte prüfen.
                          </span>
                        </div>
                      )}
                      {result.excludedByFormat > 0 && result.excludedByFormat < result.totalDataRows && result.unmatchedInternalIds.length > 0 && (
                        <div className={styles.zeroMatchHint}>
                          <WarningCircle size={16} weight="fill" />
                          <span>
                            Keine Übereinstimmungen gefunden. Bitte Store-Format-Wert und Interne-ID-Spalte prüfen.
                          </span>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className={styles.footer}>
          <button className={styles.cancelBtn} onClick={onCancel}>
            Abbrechen
          </button>
          {!result ? (
            <button
              className={styles.applyBtn}
              disabled={!file || !isValid || isParsing}
              onClick={handleApply}
            >
              {isParsing ? (
                <span>Verarbeite…</span>
              ) : (
                <>
                  <Check size={18} weight="bold" />
                  <span>Auswertung starten</span>
                </>
              )}
            </button>
          ) : (
            <div className={styles.confirmGroup}>
              <span className={styles.overwriteNote}>
                Ersetzt die aktuelle Marktauswahl vollständig.
              </span>
              <button
                className={styles.confirmBtn}
                disabled={result.matchedMarketIds.length === 0}
                onClick={handleConfirm}
              >
                <Check size={18} weight="bold" />
                <span>{result.matchedMarketIds.length} {result.matchedMarketIds.length === 1 ? 'Markt' : 'Märkte'} übernehmen</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
};
