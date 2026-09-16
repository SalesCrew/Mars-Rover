import React, { useState, useEffect, useMemo, useCallback, useRef, memo } from 'react';
import { Camera, CircleNotch, CaretLeft, CaretRight, Trash, X, Image as ImageIcon, DownloadSimple, CheckCircle, CaretDown, MagnifyingGlass, Funnel } from '@phosphor-icons/react';
import { wellenService, type WellePhoto, type PhotoFacets } from '../../services/wellenService';
import { CustomDatePicker } from './CustomDatePicker';
import styles from './FotosPage.module.css';

type PhotoSourceFilter = 'all' | 'fotowelle' | 'fotofragen';
const PHOTO_PAGE_SIZE = 30;

const getPhotoSource = (photo: WellePhoto): 'fotowelle' | 'fotofragen' => (
  photo.source === 'fotofragen' ? 'fotofragen' : 'fotowelle'
);

const getSourceLabel = (source: 'fotowelle' | 'fotofragen'): string => (
  source === 'fotofragen' ? 'Fotofragen' : 'Fotowelle'
);

const LazyImage: React.FC<{ src: string; className: string; fallbackPhotoId?: string }> = memo(({ src, className, fallbackPhotoId }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [fallback, setFallback] = useState<{ source: string; url: string } | null>(null);
  const isResolvingFallback = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setIsVisible(true); observer.disconnect(); } },
      { rootMargin: '300px 0px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className={className}>
      {isVisible && <img
        src={fallback?.source === src ? fallback.url : src}
        alt=""
        decoding="async"
        loading="lazy"
        onError={() => {
          if (!fallbackPhotoId || isResolvingFallback.current || fallback?.source === src) return;
          isResolvingFallback.current = true;
          wellenService.getOriginalPhotoUrl(fallbackPhotoId)
            .then(url => setFallback({ source: src, url }))
            .catch(error => console.error('Failed to load photo preview fallback:', error))
            .finally(() => { isResolvingFallback.current = false; });
        }}
        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
      />}
    </div>
  );
});

interface PhotoCardProps {
  photo: WellePhoto;
  onClick: () => void;
  formatDate: (d: string) => string;
}

const PhotoCard = memo<PhotoCardProps>(({ photo, onClick, formatDate }) => {
  const source = getPhotoSource(photo);
  return (
    <div className={styles.photoCard} onClick={onClick}>
      <LazyImage src={photo.photoUrl} className={styles.photoThumb} fallbackPhotoId={source === 'fotowelle' ? photo.id : undefined} />
      <div className={styles.photoInfo}>
        <div className={`${styles.sourceBadge} ${source === 'fotofragen' ? styles.sourceBadgeFotofragen : styles.sourceBadgeFotowelle}`}>
          {getSourceLabel(source)}
        </div>
        <p className={styles.photoGl}>{photo.glName}</p>
        <p className={styles.photoMarket}>{photo.marketName} {photo.marketChain && `(${photo.marketChain})`}</p>
        <span className={styles.photoDate}>{formatDate(photo.createdAt)}</span>
        <div className={styles.photoTags}>
          {photo.tags?.slice(0, 3).map(t => <span key={t} className={styles.photoTag}>{t}</span>)}
          {(photo.tags?.length || 0) > 3 && <span className={styles.photoTagMore}>+{photo.tags!.length - 3}</span>}
        </div>
      </div>
    </div>
  );
});

export const FotosPage: React.FC = () => {
  const [photos, setPhotos] = useState<WellePhoto[]>([]);
  const [facets, setFacets] = useState<PhotoFacets | null>(null);
  const [facetError, setFacetError] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [photoError, setPhotoError] = useState(false);
  const [total, setTotal] = useState(0);
  const photoRequestVersion = useRef(0);

  // Filters
  const [filterSource, setFilterSource] = useState<PhotoSourceFilter>('all');
  const [filterWelle, setFilterWelle] = useState('');
  const [filterGL, setFilterGL] = useState('');
  const [filterMarket, setFilterMarket] = useState('');
  const [filterTags, setFilterTags] = useState<string[]>([]);
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');

  // Custom dropdown states
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [marketSearch, setMarketSearch] = useState('');

  // Lightbox
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [originalPhoto, setOriginalPhoto] = useState<{ id: string; url: string } | null>(null);

  const loadFacets = useCallback(async () => {
    try {
      const options = await wellenService.getPhotoFacets();
      setFacets(options);
      setFacetError(false);
    } catch (error) {
      console.error('Failed to load photo filters:', error);
      setFacetError(true);
    }
  }, []);

  useEffect(() => { loadFacets(); }, [loadFacets]);

  // Fetch photos
  const fetchPhotos = useCallback(async (offset = 0, append = false) => {
    const version = ++photoRequestVersion.current;
    if (append) setLoadingMore(true);
    else setLoading(true);
    setPhotoError(false);
    try {
      const params: Parameters<typeof wellenService.getPhotos>[0] = { limit: PHOTO_PAGE_SIZE, offset };
      params.source = filterSource;
      if (filterWelle) params.welle_id = filterWelle;
      if (filterGL) params.gl_id = filterGL;
      if (filterMarket) params.market_id = filterMarket;
      if (filterTags.length > 0) params.tags = filterTags.join(',');
      if (filterStartDate) params.start_date = filterStartDate;
      if (filterEndDate) params.end_date = filterEndDate;

      const result = await wellenService.getPhotos(params);
      if (version !== photoRequestVersion.current) return;
      setPhotos(previous => append ? [...previous, ...result.photos] : result.photos);
      setTotal(result.total);
    } catch (e) {
      console.error(e);
      if (version !== photoRequestVersion.current) return;
      if (!append) { setPhotos([]); setTotal(0); }
      setPhotoError(true);
    }
    finally {
      if (version === photoRequestVersion.current) {
        setLoading(false);
        setLoadingMore(false);
      }
    }
  }, [filterSource, filterWelle, filterGL, filterMarket, filterTags, filterStartDate, filterEndDate]);

  useEffect(() => {
    fetchPhotos();
    return () => { photoRequestVersion.current += 1; };
  }, [fetchPhotos]);

  const allTags = facets?.tags ?? [];
  const gls = facets?.gls ?? [];
  const allMarkets = facets?.markets ?? [];
  const waves = facets?.waves ?? [];

  const toggleTag = (tag: string) => {
    setFilterTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
  };

  const clearFilters = () => {
    setFilterSource('all');
    setFilterWelle(''); setFilterGL(''); setFilterMarket('');
    setFilterTags([]); setFilterStartDate(''); setFilterEndDate('');
  };

  const hasFilters = filterSource !== 'all' || filterWelle || filterGL || filterMarket || filterTags.length > 0 || filterStartDate || filterEndDate;

  // Close dropdown on outside click
  useEffect(() => {
    if (!openDropdown) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest(`.${styles.customDropdown}`)) {
        setOpenDropdown(null);
        setMarketSearch('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [openDropdown]);

  // Delete photo
  const handleDelete = async (photo: WellePhoto) => {
    if (getPhotoSource(photo) === 'fotofragen') {
      alert('Fotofragen-Fotos können hier nicht gelöscht werden.');
      return;
    }
    if (!confirm('Foto wirklich löschen?')) return;
    try {
      await wellenService.deletePhoto(photo.id);
      setPhotos(prev => prev.filter(p => p.id !== photo.id));
      setTotal(prev => prev - 1);
      setLightboxIndex(null);
    } catch (e) { console.error(e); alert('Fehler beim Löschen'); }
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  // Export state
  const [showExportModal, setShowExportModal] = useState(false);
  const [zipName, setZipName] = useState('');
  const [exportSource, setExportSource] = useState<PhotoSourceFilter>('all');
  const [exportWelleId, setExportWelleId] = useState('');
  const [exportFragebogenId, setExportFragebogenId] = useState('');
  const [exportGLId, setExportGLId] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportDone, setExportDone] = useState(false);
  const [openExportDropdown, setOpenExportDropdown] = useState<string | null>(null);

  const parseDateValue = (value?: string | null): number => {
    if (!value) return 0;
    const ts = new Date(value).getTime();
    return Number.isNaN(ts) ? 0 : ts;
  };

  const wavesNewestFirst = [...waves].sort((a, b) => {
      const aDate = parseDateValue(a.startDate || a.endDate);
      const bDate = parseDateValue(b.startDate || b.endDate);
      return bDate - aDate;
    });

  const openExportModal = useCallback(() => {
    const today = new Date().toISOString().split('T')[0];
    setZipName(`Fotos_${today}`);
    setExportSource(filterWelle ? 'fotowelle' : filterSource);
    setExportWelleId(filterWelle);
    setExportFragebogenId('');
    setExportGLId(filterGL);
    setOpenExportDropdown(null);
    setExportDone(false);
    setExportProgress(0);
    setShowExportModal(true);
  }, [filterSource, filterWelle, filterGL]);

  useEffect(() => {
    if (exportSource !== 'fotowelle') setExportWelleId('');
    if (exportSource !== 'fotofragen') setExportFragebogenId('');
  }, [exportSource]);

  const exportGLOptions = useMemo(() => {
    if (exportSource === 'fotowelle') return facets?.glsBySource.fotowelle ?? [];
    if (exportSource === 'fotofragen') return facets?.glsBySource.fotofragen ?? [];
    return facets?.gls ?? [];
  }, [exportSource, facets]);

  useEffect(() => {
    if (!openExportDropdown) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest(`.${styles.exportCustomDropdown}`)) {
        setOpenExportDropdown(null);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [openExportDropdown]);

  const handleExportZip = async () => {
    if (!zipName.trim()) return;
    setIsExporting(true);
    setExportProgress(15);

    try {
      setExportProgress(45);
      await wellenService.downloadPhotosZip({
        source: exportSource,
        welle_id: exportSource === 'fotowelle' ? (exportWelleId || undefined) : undefined,
        fragebogen_id: exportSource === 'fotofragen' ? (exportFragebogenId || undefined) : undefined,
        gl_id: exportGLId || undefined,
        market_id: filterMarket || undefined,
        tags: filterTags.length > 0 ? filterTags.join(',') : undefined,
        start_date: filterStartDate || undefined,
        end_date: filterEndDate || undefined
      }, zipName.trim());
      setExportProgress(100);

      setExportDone(true);
      setTimeout(() => {
        setShowExportModal(false);
        setIsExporting(false);
        setExportDone(false);
      }, 1500);
    } catch (err) {
      console.error('Export failed:', err);
      alert('Export fehlgeschlagen');
      setIsExporting(false);
    }
  };

  // Listen for export event from AdminPanel header
  useEffect(() => {
    const handleExportEvent = () => {
      openExportModal();
    };
    window.addEventListener('fotos:export', handleExportEvent);
    return () => window.removeEventListener('fotos:export', handleExportEvent);
  }, [openExportModal]);

  const lightboxPhoto = lightboxIndex !== null ? photos[lightboxIndex] : null;
  const lightboxSource = lightboxPhoto ? getPhotoSource(lightboxPhoto) : null;
  const lightboxPhotoId = lightboxPhoto?.id;
  const lightboxPreviewUrl = lightboxPhoto?.photoUrl;
  useEffect(() => {
    if (!lightboxPhotoId || !lightboxPreviewUrl || lightboxSource !== 'fotowelle') return;
    let cancelled = false;
    wellenService.getOriginalPhotoUrl(lightboxPhotoId)
      .then(url => { if (!cancelled) setOriginalPhoto({ id: lightboxPhotoId, url }); })
      .catch(error => {
        console.error('Failed to load original photo:', error);
        if (!cancelled) setOriginalPhoto({ id: lightboxPhotoId, url: lightboxPreviewUrl });
      });
    return () => { cancelled = true; };
  }, [lightboxPhotoId, lightboxPreviewUrl, lightboxSource]);
  const lightboxUrl = lightboxSource === 'fotowelle'
    ? (originalPhoto && originalPhoto.id === lightboxPhoto?.id ? originalPhoto.url : null)
    : lightboxPhoto?.photoUrl;

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.headerIcon}><Camera size={20} weight="duotone" /></div>
          <div>
            <h2 className={styles.title}>Fotos</h2>
            <p className={styles.subtitle}>Fotowelle & Fotofragen</p>
          </div>
        </div>
        <span className={styles.photoCount}>{total} Fotos</span>
      </div>

      {facetError && (
        <div className={styles.loadNotice} role="alert">
          Filteroptionen konnten nicht geladen werden.
          <button onClick={loadFacets}>Erneut versuchen</button>
        </div>
      )}

      {/* Filters */}
      <div className={styles.filters}>
        <div className={styles.sourceToggle}>
          <button
            className={`${styles.sourceToggleBtn} ${filterSource === 'all' ? styles.sourceToggleBtnActive : ''}`}
            onClick={() => setFilterSource('all')}
          >
            Alle
          </button>
          <button
            className={`${styles.sourceToggleBtn} ${filterSource === 'fotowelle' ? styles.sourceToggleBtnActive : ''}`}
            onClick={() => setFilterSource('fotowelle')}
          >
            Fotowelle
          </button>
          <button
            className={`${styles.sourceToggleBtn} ${filterSource === 'fotofragen' ? styles.sourceToggleBtnActive : ''}`}
            onClick={() => { setFilterWelle(''); setFilterSource('fotofragen'); }}
          >
            Fotofragen
          </button>
        </div>

        {/* Wave Dropdown */}
        <div className={styles.customDropdown}>
          <button
            className={`${styles.dropdownButton} ${filterWelle ? styles.dropdownActive : ''}`}
            disabled={filterSource === 'fotofragen'}
            onClick={() => setOpenDropdown(openDropdown === 'welle' ? null : 'welle')}
          >
            <Camera size={14} weight="bold" />
            <span>{filterSource === 'fotofragen' ? 'Wellen (nicht aktiv)' : (filterWelle ? waves.find(w => w.id === filterWelle)?.name || 'Welle' : 'Alle Wellen')}</span>
            <CaretDown size={12} weight="bold" className={`${styles.dropdownCaret} ${openDropdown === 'welle' ? styles.caretOpen : ''}`} />
          </button>
          {openDropdown === 'welle' && filterSource !== 'fotofragen' && (
            <div className={styles.dropdownMenu}>
              <button className={`${styles.dropdownItem} ${!filterWelle ? styles.dropdownItemActive : ''}`} onClick={() => { setFilterWelle(''); setOpenDropdown(null); }}>
                Alle Wellen
              </button>
              {waves.map(w => (
                <button key={w.id} className={`${styles.dropdownItem} ${filterWelle === w.id ? styles.dropdownItemActive : ''}`} onClick={() => { setFilterWelle(w.id); setOpenDropdown(null); }}>
                  {w.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* GL Dropdown */}
        <div className={styles.customDropdown}>
          <button
            className={`${styles.dropdownButton} ${filterGL ? styles.dropdownActive : ''}`}
            onClick={() => setOpenDropdown(openDropdown === 'gl' ? null : 'gl')}
          >
            <span>{filterGL ? gls.find(g => g.id === filterGL)?.name || 'GL' : 'Alle GLs'}</span>
            <CaretDown size={12} weight="bold" className={`${styles.dropdownCaret} ${openDropdown === 'gl' ? styles.caretOpen : ''}`} />
          </button>
          {openDropdown === 'gl' && (
            <div className={styles.dropdownMenu}>
              <button className={`${styles.dropdownItem} ${!filterGL ? styles.dropdownItemActive : ''}`} onClick={() => { setFilterGL(''); setOpenDropdown(null); }}>
                Alle GLs
              </button>
              {gls.map(g => (
                <button key={g.id} className={`${styles.dropdownItem} ${filterGL === g.id ? styles.dropdownItemActive : ''}`} onClick={() => { setFilterGL(g.id); setOpenDropdown(null); }}>
                  {g.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Market Dropdown with Search */}
        <div className={styles.customDropdown}>
          <button
            className={`${styles.dropdownButton} ${filterMarket ? styles.dropdownActive : ''}`}
            onClick={() => setOpenDropdown(openDropdown === 'market' ? null : 'market')}
          >
            <MagnifyingGlass size={14} weight="bold" />
            <span>{filterMarket ? allMarkets.find(m => m.id === filterMarket)?.name || 'Markt' : 'Markt suchen'}</span>
            <CaretDown size={12} weight="bold" className={`${styles.dropdownCaret} ${openDropdown === 'market' ? styles.caretOpen : ''}`} />
          </button>
          {openDropdown === 'market' && (
            <div className={styles.dropdownMenu}>
              <div className={styles.dropdownSearch}>
                <MagnifyingGlass size={14} weight="bold" className={styles.searchIcon} />
                <input
                  type="text"
                  className={styles.searchInput}
                  placeholder="Markt suchen..."
                  value={marketSearch}
                  onChange={e => setMarketSearch(e.target.value)}
                  autoFocus
                />
              </div>
              <div className={styles.dropdownScroll}>
                <button className={`${styles.dropdownItem} ${!filterMarket ? styles.dropdownItemActive : ''}`} onClick={() => { setFilterMarket(''); setMarketSearch(''); setOpenDropdown(null); }}>
                  Alle Märkte
                </button>
                {allMarkets.filter(m => `${m.name} ${m.fullAddress}`.toLowerCase().includes(marketSearch.toLowerCase())).map(m => (
                  <button key={m.id} className={`${styles.dropdownItem} ${styles.marketDropdownItem} ${filterMarket === m.id ? styles.dropdownItemActive : ''}`} onClick={() => { setFilterMarket(m.id); setMarketSearch(''); setOpenDropdown(null); }}>
                    <span className={styles.dropdownItemTitle}>{m.name}</span>
                    <span className={styles.dropdownItemMeta}>{m.fullAddress || 'Keine Adresse hinterlegt'}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className={styles.filterDivider} />

        {/* Date From */}
        <div className={styles.datePickerWrap}>
          <CustomDatePicker value={filterStartDate} onChange={setFilterStartDate} placeholder="Von" />
        </div>

        <span className={styles.dateSeparator}>–</span>

        {/* Date To */}
        <div className={styles.datePickerWrap}>
          <CustomDatePicker value={filterEndDate} onChange={setFilterEndDate} placeholder="Bis" />
        </div>

        {hasFilters && (
          <button className={styles.clearBtn} onClick={clearFilters}>
            <Funnel size={13} weight="bold" />
            Zurücksetzen
          </button>
        )}
      </div>

      {/* Tag filter pills (multi-select) */}
      {allTags.length > 0 && (
        <div className={styles.tagFilters} style={{ marginBottom: '16px' }}>
          {allTags.map(tag => (
            <button
              key={tag}
              className={`${styles.tagPill} ${filterTags.includes(tag) ? styles.tagPillActive : ''}`}
              onClick={() => toggleTag(tag)}
            >
              {tag}
            </button>
          ))}
        </div>
      )}

      {/* Grid */}
      {loading ? (
        <div className={styles.loadingContainer}>
          <CircleNotch size={32} weight="bold" className={styles.spinner} />
          <span>Lade Fotos...</span>
        </div>
      ) : photoError && photos.length === 0 ? (
        <div className={styles.emptyState} role="alert">
          <span>Fotos konnten nicht geladen werden.</span>
          <button onClick={() => fetchPhotos()}>Erneut versuchen</button>
        </div>
      ) : photos.length === 0 ? (
        <div className={styles.emptyState}>
          <ImageIcon size={48} weight="regular" />
          <span>Keine Fotos gefunden</span>
        </div>
      ) : (
        <>
          <div className={styles.grid}>
            {photos.map((photo, idx) => (
              <PhotoCard key={`${photo.source}-${photo.id}`} photo={photo} onClick={() => setLightboxIndex(idx)} formatDate={formatDate} />
            ))}
          </div>
          {photos.length < total && (
            <div className={styles.loadMoreWrap}>
              {photoError && <span role="alert">Weitere Fotos konnten nicht geladen werden.</span>}
              <button onClick={() => fetchPhotos(photos.length, true)} disabled={loadingMore}>
                {loadingMore ? 'Lade weitere Fotos…' : `Weitere Fotos laden (${photos.length} von ${total})`}
              </button>
            </div>
          )}
        </>
      )}

      {/* Lightbox */}
      {lightboxPhoto && lightboxIndex !== null && (
        <div className={styles.lightboxOverlay} onClick={() => setLightboxIndex(null)}>
          <div className={styles.lightboxContent} onClick={e => e.stopPropagation()}>
            <div className={styles.lightboxImage}>
              {lightboxUrl ? <img src={lightboxUrl} alt="" /> : <CircleNotch size={32} className={styles.spinner} />}
              {lightboxIndex > 0 && (
                <button className={`${styles.lightboxNav} ${styles.lightboxPrev}`} onClick={() => setLightboxIndex(lightboxIndex - 1)}>
                  <CaretLeft size={18} weight="bold" />
                </button>
              )}
              {lightboxIndex < photos.length - 1 && (
                <button className={`${styles.lightboxNav} ${styles.lightboxNext}`} onClick={() => setLightboxIndex(lightboxIndex + 1)}>
                  <CaretRight size={18} weight="bold" />
                </button>
              )}
            </div>
            <div className={styles.lightboxSidebar}>
              <button className={styles.lightboxClose} onClick={() => setLightboxIndex(null)}>
                <X size={16} weight="bold" />
              </button>
              <div className={styles.lightboxMeta}>
                {lightboxSource && (
                  <div>
                    <p className={styles.lightboxLabel}>Quelle</p>
                    <div className={`${styles.sourceBadge} ${lightboxSource === 'fotofragen' ? styles.sourceBadgeFotofragen : styles.sourceBadgeFotowelle}`}>
                      {getSourceLabel(lightboxSource)}
                    </div>
                  </div>
                )}
                <div>
                  <p className={styles.lightboxLabel}>Gebietsleiter</p>
                  <p className={styles.lightboxValue}>{lightboxPhoto.glName}</p>
                </div>
                <div>
                  <p className={styles.lightboxLabel}>Markt</p>
                  <p className={styles.lightboxValue}>{lightboxPhoto.marketName} {lightboxPhoto.marketChain && `(${lightboxPhoto.marketChain})`}</p>
                  {lightboxPhoto.marketAddress && <p className={styles.lightboxSubvalue}>{lightboxPhoto.marketAddress}</p>}
                </div>
                {lightboxSource === 'fotofragen' ? (
                  <div>
                    <p className={styles.lightboxLabel}>Fragebogen</p>
                    <p className={styles.lightboxValue}>{lightboxPhoto.fragebogenName || '—'}</p>
                  </div>
                ) : (
                  <div>
                    <p className={styles.lightboxLabel}>Welle</p>
                    <p className={styles.lightboxValue}>{lightboxPhoto.welleName || '—'}</p>
                  </div>
                )}
                <div>
                  <p className={styles.lightboxLabel}>Datum</p>
                  <p className={styles.lightboxValue}>{formatDate(lightboxPhoto.createdAt)}</p>
                </div>
                {lightboxPhoto.tags && lightboxPhoto.tags.length > 0 && (
                  <div>
                    <p className={styles.lightboxLabel}>Tags</p>
                    <div className={styles.lightboxTags}>
                      {lightboxPhoto.tags.map(t => <span key={t} className={styles.lightboxTag}>{t}</span>)}
                    </div>
                  </div>
                )}
                {lightboxPhoto.comment && (
                  <div>
                    <p className={styles.lightboxLabel}>Kommentar</p>
                    <p className={styles.lightboxComment}>{lightboxPhoto.comment}</p>
                  </div>
                )}
              </div>
              {lightboxSource !== 'fotofragen' && (
                <button className={styles.lightboxDelete} onClick={() => handleDelete(lightboxPhoto)}>
                  <Trash size={14} weight="regular" style={{ marginRight: '6px' }} />
                  Foto löschen
                </button>
              )}
            </div>
          </div>
        </div>
      )}
      {/* Export Modal */}
      {showExportModal && (
        <div className={styles.exportOverlay} onClick={() => !isExporting && setShowExportModal(false)}>
          <div className={styles.exportModal} onClick={e => e.stopPropagation()}>
            <div className={styles.exportHeader}>
              <div className={styles.exportIconWrapper}>
                <DownloadSimple size={20} weight="bold" />
              </div>
              <div>
                <h3 className={styles.exportTitle}>Fotos exportieren</h3>
                <p className={styles.exportSubtitle}>{photos.length} {photos.length === 1 ? 'Foto' : 'Fotos'} als ZIP herunterladen</p>
              </div>
              {!isExporting && (
                <button className={styles.exportCloseBtn} onClick={() => setShowExportModal(false)}>
                  <X size={16} weight="bold" />
                </button>
              )}
            </div>

            <div className={styles.exportBody}>
              <label className={styles.exportLabel}>Export-Typ</label>
              <div className={styles.exportSourceWrap}>
                <button
                  className={`${styles.sourceToggleBtn} ${exportSource === 'all' ? styles.sourceToggleBtnActive : ''}`}
                  onClick={() => setExportSource('all')}
                  disabled={isExporting}
                >
                  Beide
                </button>
                <button
                  className={`${styles.sourceToggleBtn} ${exportSource === 'fotowelle' ? styles.sourceToggleBtnActive : ''}`}
                  onClick={() => setExportSource('fotowelle')}
                  disabled={isExporting}
                >
                  Fotowelle
                </button>
                <button
                  className={`${styles.sourceToggleBtn} ${exportSource === 'fotofragen' ? styles.sourceToggleBtnActive : ''}`}
                  onClick={() => setExportSource('fotofragen')}
                  disabled={isExporting}
                >
                  Fotofragen
                </button>
              </div>

              <div className={styles.exportFiltersGrid}>
                {exportSource === 'fotowelle' && (
                  <div className={`${styles.customDropdown} ${styles.exportCustomDropdown}`}>
                    <label className={styles.exportLabel}>Welle</label>
                    <button
                      className={`${styles.dropdownButton} ${exportWelleId ? styles.dropdownActive : ''}`}
                      onClick={() => setOpenExportDropdown(openExportDropdown === 'export-welle' ? null : 'export-welle')}
                      disabled={isExporting}
                    >
                      <span>{exportWelleId ? wavesNewestFirst.find(w => w.id === exportWelleId)?.name || 'Welle' : 'Alle Wellen'}</span>
                      <CaretDown size={12} weight="bold" className={`${styles.dropdownCaret} ${openExportDropdown === 'export-welle' ? styles.caretOpen : ''}`} />
                    </button>
                    {openExportDropdown === 'export-welle' && (
                      <div className={styles.dropdownMenu}>
                        <div className={styles.dropdownScroll}>
                          <button
                            className={`${styles.dropdownItem} ${!exportWelleId ? styles.dropdownItemActive : ''}`}
                            onClick={() => { setExportWelleId(''); setOpenExportDropdown(null); }}
                          >
                            Alle Wellen
                          </button>
                          {wavesNewestFirst.map(w => (
                            <button
                              key={w.id}
                              className={`${styles.dropdownItem} ${exportWelleId === w.id ? styles.dropdownItemActive : ''}`}
                              onClick={() => { setExportWelleId(w.id); setOpenExportDropdown(null); }}
                            >
                              {w.name}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {exportSource === 'fotofragen' && (
                  <div className={`${styles.customDropdown} ${styles.exportCustomDropdown}`}>
                    <label className={styles.exportLabel}>Fragebogen</label>
                    <button
                      className={`${styles.dropdownButton} ${exportFragebogenId ? styles.dropdownActive : ''}`}
                      onClick={() => setOpenExportDropdown(openExportDropdown === 'export-fragebogen' ? null : 'export-fragebogen')}
                      disabled={isExporting}
                    >
                      <span>{exportFragebogenId ? facets?.frageboegen.find(f => f.id === exportFragebogenId)?.name || 'Fragebogen' : 'Alle Fragebogen'}</span>
                      <CaretDown size={12} weight="bold" className={`${styles.dropdownCaret} ${openExportDropdown === 'export-fragebogen' ? styles.caretOpen : ''}`} />
                    </button>
                    {openExportDropdown === 'export-fragebogen' && (
                      <div className={styles.dropdownMenu}>
                        <div className={styles.dropdownScroll}>
                          <button
                            className={`${styles.dropdownItem} ${!exportFragebogenId ? styles.dropdownItemActive : ''}`}
                            onClick={() => { setExportFragebogenId(''); setOpenExportDropdown(null); }}
                          >
                            Alle Fragebogen
                          </button>
                          {facets?.frageboegen.map(f => (
                            <button
                              key={f.id}
                              className={`${styles.dropdownItem} ${exportFragebogenId === f.id ? styles.dropdownItemActive : ''}`}
                              onClick={() => { setExportFragebogenId(f.id); setOpenExportDropdown(null); }}
                            >
                              {f.name}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div className={`${styles.customDropdown} ${styles.exportCustomDropdown}`}>
                  <label className={styles.exportLabel}>GL</label>
                  <button
                    className={`${styles.dropdownButton} ${exportGLId ? styles.dropdownActive : ''}`}
                    onClick={() => setOpenExportDropdown(openExportDropdown === 'export-gl' ? null : 'export-gl')}
                    disabled={isExporting}
                  >
                    <span>{exportGLId ? exportGLOptions.find(g => g.id === exportGLId)?.name || 'GL' : 'Alle GLs'}</span>
                    <CaretDown size={12} weight="bold" className={`${styles.dropdownCaret} ${openExportDropdown === 'export-gl' ? styles.caretOpen : ''}`} />
                  </button>
                  {openExportDropdown === 'export-gl' && (
                    <div className={styles.dropdownMenu}>
                      <div className={styles.dropdownScroll}>
                        <button
                          className={`${styles.dropdownItem} ${!exportGLId ? styles.dropdownItemActive : ''}`}
                          onClick={() => { setExportGLId(''); setOpenExportDropdown(null); }}
                        >
                          Alle GLs
                        </button>
                        {exportGLOptions.map(g => (
                          <button
                            key={g.id}
                            className={`${styles.dropdownItem} ${exportGLId === g.id ? styles.dropdownItemActive : ''}`}
                            onClick={() => { setExportGLId(g.id); setOpenExportDropdown(null); }}
                          >
                            {g.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <label className={styles.exportLabel}>ZIP-Ordnername</label>
              <input
                type="text"
                className={styles.exportInput}
                value={zipName}
                onChange={e => setZipName(e.target.value)}
                placeholder="z.B. Fotos_KW7"
                disabled={isExporting}
              />
              <p className={styles.exportHint}>
                Export erfolgt serverseitig als echte Bilddateien inkl. aktueller Filter.
              </p>

              {isExporting && (
                <div className={styles.exportProgressContainer}>
                  <div className={styles.exportProgressBar}>
                    <div className={styles.exportProgressFill} style={{ width: `${exportProgress}%` }} />
                  </div>
                  <span className={styles.exportProgressText}>{exportProgress}%</span>
                </div>
              )}
            </div>

            <div className={styles.exportFooter}>
              <button
                className={styles.exportCancelBtn}
                onClick={() => setShowExportModal(false)}
                disabled={isExporting}
              >
                Abbrechen
              </button>
              <button
                className={`${styles.exportStartBtn} ${exportDone ? styles.exportStartBtnDone : ''}`}
                onClick={handleExportZip}
                disabled={isExporting || exportDone || !zipName.trim()}
              >
                {isExporting ? (
                  <>
                    <CircleNotch size={16} weight="bold" className={styles.spinner} />
                    <span>Exportiere...</span>
                  </>
                ) : exportDone ? (
                  <>
                    <CheckCircle size={16} weight="fill" />
                    <span>Fertig!</span>
                  </>
                ) : (
                  <>
                    <DownloadSimple size={16} weight="bold" />
                    <span>ZIP herunterladen</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FotosPage;
