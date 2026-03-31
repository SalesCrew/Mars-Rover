import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import ReactDOM from 'react-dom';
import { X, UploadSimple, Trash, Package, WarningCircle, Table, FileCsv, Monitor, ArrowsClockwise } from '@phosphor-icons/react';
import { ExcelColumnMapper } from './ExcelColumnMapper';
import { CreateDisplayModal } from './CreateDisplayModal';
import { readExcelSheetNames } from '../../utils/productImporter';
import { refreshProducts } from '../../data/productsData';
import type { Product } from '../../types/product-types';
import { API_BASE_URL } from '../../config/database';
import styles from './ProduktUpdateModal.module.css';

const PRODUCTS_UPDATE_URL = `${API_BASE_URL}/products-update`;

interface ProduktUpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ProduktUpdateModal: React.FC<ProduktUpdateModalProps> = ({ isOpen, onClose }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Drop zone state
  const [showDropZone, setShowDropZone] = useState(false);
  const [dropZoneDept, setDropZoneDept] = useState<'pets' | 'food'>('pets');
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const dropInputRef = useRef<HTMLInputElement>(null);

  // Display modal state
  const [showDisplayModal, setShowDisplayModal] = useState(false);
  const [displayModalDept, setDisplayModalDept] = useState<'pets' | 'food'>('pets');

  // Column mapper / sheet picker state
  const [mapperFile, setMapperFile] = useState<File | null>(null);
  const [mapperDept, setMapperDept] = useState<'pets' | 'food'>('pets');
  const [sheetNames, setSheetNames] = useState<string[]>([]);
  const [selectedSheet, setSelectedSheet] = useState<string | null>(null);
  const [showSheetPicker, setShowSheetPicker] = useState(false);
  const [showMapper, setShowMapper] = useState(false);
  const [deImportMode, setDeImportMode] = useState(false);

  // Apply (swap) state
  const [showApplyConfirm, setShowApplyConfirm] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [applyResult, setApplyResult] = useState<{ inserted: number; softDeleted: number } | null>(null);

  // Pagination for performance
  const [currentPage, setCurrentPage] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const PRODUCTS_PER_PAGE = 100;

  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) return products;
    const q = searchQuery.toLowerCase();
    return products.filter(p =>
      p.name.toLowerCase().includes(q) ||
      (p.department === 'pets' ? 'tiernahrung' : 'lebensmittel').includes(q) ||
      p.productType.toLowerCase().includes(q) ||
      (p.weight ?? '').toLowerCase().includes(q) ||
      (p.content ?? '').toLowerCase().includes(q)
    );
  }, [products, searchQuery]);

  const visibleProducts = useMemo(() => {
    const start = currentPage * PRODUCTS_PER_PAGE;
    const end = start + PRODUCTS_PER_PAGE;
    return filteredProducts.slice(start, end);
  }, [filteredProducts, currentPage]);

  const totalPages = Math.ceil(filteredProducts.length / PRODUCTS_PER_PAGE);
  const hasMultiplePages = totalPages > 1;

  const loadProducts = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(PRODUCTS_UPDATE_URL);
      if (!res.ok) throw new Error('Fehler beim Laden');
      setProducts(await res.json());
    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      // Debounce the loadProducts call to avoid excessive API calls
      const timer = setTimeout(() => loadProducts(), 100);
      return () => clearTimeout(timer);
    }
  }, [isOpen, loadProducts]);

  const openDropZone = (dept: 'pets' | 'food') => {
    setDropZoneDept(dept);
    setShowDropZone(true);
    setIsDraggingOver(false);
  };

  const closeDropZone = () => {
    setShowDropZone(false);
    setIsDraggingOver(false);
    setDeImportMode(false);
  };

  const handleFileSelect = async (file: File, dept: 'pets' | 'food') => {
    closeDropZone();
    setMapperFile(file);
    setSelectedSheet(null);
    try {
      const names = await readExcelSheetNames(file);
      if (names.length <= 1) {
        setSelectedSheet(names[0] ?? null);
        setMapperDept(dept);   // set in same batch as setShowMapper so it's never stale
        setShowMapper(true);
      } else {
        setSheetNames(names);
        setMapperDept(dept);   // same for sheet picker
        setShowSheetPicker(true);
      }
    } catch {
      setMapperDept(dept);
      setShowMapper(true);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileSelect(file, dropZoneDept);
  };

  const handleSheetSelect = (name: string) => {
    setSelectedSheet(name);
    setShowSheetPicker(false);
    setShowMapper(true);
  };

  const handleSheetPickerCancel = () => {
    setShowSheetPicker(false);
    setMapperFile(null);
  };

  const handleDisplaySave = async (displays: Product[]) => {
    setShowDisplayModal(false);
    setIsSaving(true);
    try {
      const res = await fetch(`${PRODUCTS_UPDATE_URL}/append`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(displays),
      });
      if (!res.ok) throw new Error('Fehler beim Speichern');
      await loadProducts();
      setCurrentPage(0); // Reset to first page after adding displays
    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleMapperImport = async (imported: Product[]) => {
    setShowMapper(false);
    setMapperFile(null);
    if (deImportMode) {
      setIsSaving(true);
      try {
        const names = imported.map(p => p.name).filter(Boolean);
        const res = await fetch(`${PRODUCTS_UPDATE_URL}/remove-by-names`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ names }),
        });
        if (!res.ok) throw new Error('Fehler beim De-Import');
        await loadProducts();
        setCurrentPage(0);
      } catch (e: any) {
        setError(e.message);
      } finally {
        setIsSaving(false);
        setDeImportMode(false);
      }
      return;
    }
    setIsSaving(true);
    try {
      const endpoint = products.length > 0
        ? `${PRODUCTS_UPDATE_URL}/append`
        : PRODUCTS_UPDATE_URL;
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(imported),
      });
      if (!res.ok) throw new Error('Fehler beim Speichern');
      await loadProducts();
      setCurrentPage(0); // Reset to first page after import
    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleClear = async () => {
    if (!window.confirm('Alle vorgemerkten Produkte löschen?')) return;
    setIsClearing(true);
    try {
      const res = await fetch(PRODUCTS_UPDATE_URL, { method: 'DELETE' });
      if (!res.ok) throw new Error('Fehler beim Löschen');
      setProducts([]);
      setCurrentPage(0); // Reset pagination after clearing
    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsClearing(false);
    }
  };

  const handleDeleteProduct = useCallback(async (id: string) => {
    setProducts(prev => prev.filter(p => p.id !== id));
    setCurrentPage(0);
    try {
      await fetch(`${PRODUCTS_UPDATE_URL}/${encodeURIComponent(id)}`, { method: 'DELETE' });
    } catch {
      loadProducts();
    }
  }, [loadProducts]);

  const handleToggleDepartment = useCallback(async (id: string, currentDept: string) => {
    const newDept = currentDept === 'pets' ? 'food' : 'pets';
    // Optimistic update
    setProducts(prev => prev.map(p => p.id === id ? { ...p, department: newDept as 'pets' | 'food' } : p));
    try {
      await fetch(`${PRODUCTS_UPDATE_URL}/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ department: newDept }),
      });
    } catch {
      loadProducts();
    }
  }, [loadProducts]);

  const handleApply = async () => {
    setIsApplying(true);
    try {
      const res = await fetch(`${PRODUCTS_UPDATE_URL}/apply`, { method: 'POST' });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Swap fehlgeschlagen');
      }
      const result = await res.json();
      setApplyResult(result);
      setProducts([]);
      setCurrentPage(0);
      setSearchQuery('');
      // Bust the frontend product cache so all modals get the new list
      await refreshProducts();
      window.dispatchEvent(new CustomEvent('productsUpdated'));
    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsApplying(false);
      setShowApplyConfirm(false);
    }
  };

  const getDeptColor = useCallback((dept: string) => dept === 'pets' ? '#10B981' : '#F59E0B', []);
  const getDeptLabel = useCallback((dept: string) => dept === 'pets' ? 'Tiernahrung' : 'Lebensmittel', []);
  const getTypeLabel = useCallback((t: string) => {
    const map: Record<string, string> = { standard: 'Standard', display: 'Display', palette: 'Palette', schuette: 'Schütte' };
    return map[t] ?? t;
  }, []);

  const deptColor = dropZoneDept === 'pets' ? '#10B981' : '#F59E0B';
  const deptLabel = dropZoneDept === 'pets' ? 'Tiernahrung' : 'Lebensmittel';

  if (!isOpen) return null;

  return ReactDOM.createPortal(
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div className={styles.header}>
          <h2 className={styles.headerTitle}>Produkt-Update</h2>
          <div className={`${styles.headerBadge} ${products.length === 0 ? styles.headerBadgeEmpty : ''}`}>
            <Package size={13} weight="bold" />
            {isLoading ? '…' : searchQuery
              ? `${filteredProducts.length} / ${products.length} Produkte`
              : hasMultiplePages
              ? `${products.length} Produkte (Seite ${currentPage + 1}/${totalPages})`
              : `${products.length} Produkte vorgemerkt`}
          </div>

          <div className={styles.headerSpacer} />

          <div className={styles.headerActions}>
            <button
              className={`${styles.importBtn} ${styles.importBtnPets}`}
              onClick={() => openDropZone('pets')}
              disabled={isSaving}
            >
              <UploadSimple size={15} weight="bold" />
              Tiernahrung importieren
            </button>

            <button
              className={`${styles.importBtn} ${styles.importBtnPets}`}
              style={{ background: 'rgba(16,185,129,0.06)', border: '1px dashed rgba(16,185,129,0.4)' }}
              onClick={() => { setDisplayModalDept('pets'); setShowDisplayModal(true); }}
              disabled={isSaving}
            >
              <Monitor size={15} weight="bold" />
              Tiernahrung Displays
            </button>

            <button
              className={`${styles.importBtn} ${styles.importBtnFood}`}
              onClick={() => openDropZone('food')}
              disabled={isSaving}
            >
              <UploadSimple size={15} weight="bold" />
              Lebensmittel importieren
            </button>

            <button
              className={`${styles.importBtn} ${styles.importBtnFood}`}
              style={{ background: 'rgba(245,158,11,0.06)', border: '1px dashed rgba(245,158,11,0.4)' }}
              onClick={() => { setDisplayModalDept('food'); setShowDisplayModal(true); }}
              disabled={isSaving}
            >
              <Monitor size={15} weight="bold" />
              Lebensmittel Displays
            </button>

            {products.length > 0 && (
              <>
                <button
                  className={styles.applyBtn}
                  onClick={() => setShowApplyConfirm(true)}
                  disabled={isSaving || isApplying}
                  title="Neue Produktliste aktivieren und alte archivieren"
                >
                  <ArrowsClockwise size={14} weight="bold" />
                  Produktliste übernehmen
                </button>
                <button
                  className={styles.deImportBtn}
                  onClick={() => { setDeImportMode(true); openDropZone('pets'); }}
                  disabled={isSaving}
                  title="Importierte Produkte anhand einer Datei wieder entfernen"
                >
                  <Trash size={14} weight="bold" />
                  De-Import
                </button>
                <button
                  className={styles.clearBtn}
                  onClick={handleClear}
                  disabled={isClearing}
                >
                  <Trash size={14} weight="bold" />
                  {isClearing ? 'Löscht…' : 'Liste leeren'}
                </button>
              </>
            )}

          </div>
          <button className={styles.closeBtn} style={{ flexShrink: 0 }} onClick={onClose}>
            <X size={18} weight="bold" />
          </button>
        </div>

        {/* Search bar */}
        {products.length > 0 && (
          <div className={styles.searchBar}>
            <input
              className={styles.searchInput}
              type="text"
              placeholder="Suche nach Name, Abteilung, Typ, Gewicht…"
              value={searchQuery}
              onChange={e => { setSearchQuery(e.target.value); setCurrentPage(0); }}
            />
            {searchQuery && (
              <button className={styles.searchClear} onClick={() => { setSearchQuery(''); setCurrentPage(0); }}>
                <X size={14} weight="bold" />
              </button>
            )}
          </div>
        )}

        {/* Table header */}
        <div className={styles.tableHeader}>
          <span>Produktname</span>
          <span>Abteilung</span>
          <span>Typ</span>
          <span>Gewicht</span>
          <span>Preis</span>
          <span>Inhalt</span>
          <span />
        </div>

        {/* Body */}
        <div className={styles.body}>
          <div className={styles.tableBody}>
            {isLoading ? (
              <div className={styles.emptyState}>
                <Package size={44} weight="regular" />
                <p className={styles.emptyTitle}>Lade…</p>
              </div>
            ) : error ? (
              <div className={styles.emptyState}>
                <WarningCircle size={44} weight="fill" style={{ color: '#EF4444', opacity: 1 }} />
                <p className={styles.emptyTitle}>Fehler</p>
                <p className={styles.emptyHint}>{error}</p>
              </div>
            ) : products.length === 0 ? (
              <div className={styles.emptyState}>
                <Package size={44} weight="regular" />
                <p className={styles.emptyTitle}>Noch keine Produkte vorgemerkt</p>
                <p className={styles.emptyHint}>
                  Importiere eine Excel-Datei über die Schaltflächen oben.
                  Die neuen Produkte werden hier gespeichert und können später übernommen werden.
                </p>
              </div>
            ) : (
              <>
                {visibleProducts.map((p) => {
                  const color = getDeptColor(p.department);
                  return (
                    <div key={p.id} className={styles.tableRow}>
                      <span className={styles.productName}>{p.name}</span>
                      <span>
                        <button
                          className={styles.deptBadge}
                          style={{ background: `${color}15`, color, borderColor: `${color}30` }}
                          onClick={() => handleToggleDepartment(p.id, p.department)}
                          title="Klicken um zwischen Tiernahrung und Lebensmittel zu wechseln"
                        >
                          {getDeptLabel(p.department)}
                        </button>
                      </span>
                      <span className={styles.typeBadge}>{getTypeLabel(p.productType)}</span>
                      <span>{p.weight}</span>
                      <span className={styles.price}>€{p.price.toFixed(2)}</span>
                      <span>{p.content ?? '—'}</span>
                      <span className={styles.deleteCell}>
                        <button
                          className={styles.deleteRowBtn}
                          onClick={() => handleDeleteProduct(p.id)}
                          title="Produkt entfernen"
                        >
                          <X size={12} weight="bold" />
                        </button>
                      </span>
                    </div>
                  );
                })}

                {/* Pagination */}
                {hasMultiplePages && (
                  <div className={styles.pagination}>
                    <button
                      className={styles.pageBtn}
                      disabled={currentPage === 0}
                      onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                    >
                      ← Zurück
                    </button>
                    <span className={styles.pageInfo}>
                      Seite {currentPage + 1} von {totalPages} 
                      <span className={styles.pageDetails}>
                        ({Math.min(currentPage * PRODUCTS_PER_PAGE + 1, products.length)}–{Math.min((currentPage + 1) * PRODUCTS_PER_PAGE, products.length)} von {products.length})
                      </span>
                    </span>
                    <button
                      className={styles.pageBtn}
                      disabled={currentPage >= totalPages - 1}
                      onClick={() => setCurrentPage(Math.min(totalPages - 1, currentPage + 1))}
                    >
                      Weiter →
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Info bar */}
        <div className={styles.infoBar}>
          ⚠️ Diese Produkte ersetzen die aktuelle Liste erst wenn der Wechsel manuell ausgeführt wird. Die aktuelle Produktliste bleibt unverändert.
        </div>
      </div>

      {/* ── Drop Zone dialog ── */}
      {showDropZone && (
        <div className={styles.dropZoneOverlay} onClick={closeDropZone}>
          <div className={styles.dropZoneDialog} onClick={(e) => e.stopPropagation()}>
            <div className={styles.dropZoneDialogHeader}>
              <span
                className={styles.dropZoneDeptBadge}
                style={{ background: `${deptColor}15`, color: deptColor, borderColor: `${deptColor}30` }}
              >
                {deptLabel}
              </span>
              {deImportMode && (
                <span className={styles.deImportBadge}>
                  De-Import
                </span>
              )}
              <button className={styles.sheetPickerClose} onClick={() => { closeDropZone(); setDeImportMode(false); }}>
                <X size={16} weight="bold" />
              </button>
            </div>

            <div
              className={`${styles.dropZone} ${isDraggingOver ? styles.dropZoneActive : ''}`}
              onDragOver={(e) => { e.preventDefault(); setIsDraggingOver(true); }}
              onDragLeave={() => setIsDraggingOver(false)}
              onDrop={handleDrop}
              onClick={() => dropInputRef.current?.click()}
            >
              <FileCsv size={40} weight="duotone" className={styles.dropZoneIcon} style={{ color: deptColor }} />
              <p className={styles.dropZoneText}>
                {isDraggingOver ? 'Datei hier ablegen' : 'Excel-Datei hier ablegen'}
              </p>
              <p className={styles.dropZoneHint}>.xlsx · .xls · .csv</p>
              <span className={styles.dropZoneBrowse} style={{ color: deptColor }}>
                oder klicken zum Durchsuchen
              </span>
              <input
                ref={dropInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                className={styles.hiddenInput}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleFileSelect(f, dropZoneDept);
                  e.target.value = '';
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Sheet Picker overlay */}
      {showSheetPicker && mapperFile && (
        <div className={styles.sheetPickerOverlay} onClick={handleSheetPickerCancel}>
          <div className={styles.sheetPickerDialog} onClick={(e) => e.stopPropagation()}>
            <div className={styles.sheetPickerHeader}>
              <Table size={20} weight="duotone" />
              <span className={styles.sheetPickerTitle}>Tabellenblatt auswählen</span>
              <button className={styles.sheetPickerClose} onClick={handleSheetPickerCancel}>
                <X size={16} weight="bold" />
              </button>
            </div>
            <p className={styles.sheetPickerHint}>
              Die Datei enthält mehrere Blätter. Welches soll importiert werden?
            </p>
            <div className={styles.sheetList}>
              {sheetNames.map((name) => (
                <button key={name} className={styles.sheetItem} onClick={() => handleSheetSelect(name)}>
                  <Table size={15} weight="regular" />
                  {name}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Column Mapper overlay */}
      {showMapper && mapperFile && (
        <ExcelColumnMapper
          file={mapperFile}
          department={mapperDept}
          sheetName={selectedSheet ?? undefined}
          onImport={handleMapperImport}
          onCancel={() => { setShowMapper(false); setMapperFile(null); setSelectedSheet(null); }}
        />
      )}

      {/* Display Creator */}
      <CreateDisplayModal
        isOpen={showDisplayModal}
        onClose={() => setShowDisplayModal(false)}
        onSave={handleDisplaySave}
        department={displayModalDept}
      />

      {/* ── Apply confirm dialog ── */}
      {showApplyConfirm && (
        <div className={styles.applyOverlay} onClick={() => !isApplying && setShowApplyConfirm(false)}>
          <div className={styles.applyDialog} onClick={e => e.stopPropagation()}>
            <div className={styles.applyDialogIcon}>
              <ArrowsClockwise size={32} weight="bold" />
            </div>
            <h3 className={styles.applyDialogTitle}>Produktliste übernehmen?</h3>
            <p className={styles.applyDialogText}>
              <strong>{products.length} neue Produkte</strong> werden in die aktive Produktliste übernommen.
              Die bisherigen Produkte werden <strong>archiviert</strong> — sie bleiben in der Datenbank erhalten
              und alle historischen Einreichungen (Vorverkauf, NaRa Incentive etc.) bleiben unverändert.
              Diese Aktion kann nicht rückgängig gemacht werden.
            </p>
            <div className={styles.applyDialogActions}>
              <button
                className={styles.applyDialogCancel}
                onClick={() => setShowApplyConfirm(false)}
                disabled={isApplying}
              >
                Abbrechen
              </button>
              <button
                className={styles.applyDialogConfirm}
                onClick={handleApply}
                disabled={isApplying}
              >
                {isApplying ? (
                  <>
                    <div className={styles.applySpinner} />
                    Wird übernommen…
                  </>
                ) : (
                  <>
                    <ArrowsClockwise size={15} weight="bold" />
                    Ja, jetzt übernehmen
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Apply success overlay ── */}
      {applyResult && (
        <div className={styles.applyOverlay} onClick={() => setApplyResult(null)}>
          <div className={styles.applyDialog} onClick={e => e.stopPropagation()}>
            <div className={styles.applySuccessIcon}>✓</div>
            <h3 className={styles.applyDialogTitle}>Produktliste übernommen!</h3>
            <p className={styles.applyDialogText}>
              <strong>{applyResult.inserted} neue Produkte</strong> sind jetzt aktiv.
              {applyResult.softDeleted > 0 && (
                <> <strong>{applyResult.softDeleted} alte Produkte</strong> wurden archiviert.</>
              )}
            </p>
            <button className={styles.applyDialogConfirm} onClick={() => setApplyResult(null)}>
              Schließen
            </button>
          </div>
        </div>
      )}
    </div>,
    document.body
  );
};
