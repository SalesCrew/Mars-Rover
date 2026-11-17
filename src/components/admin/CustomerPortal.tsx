import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Buildings,
  Camera,
  DownloadSimple,
  Eye,
  House,
  MagnifyingGlass,
  SignOut,
  SquaresFour,
} from '@phosphor-icons/react';
import { useAuth } from '../../contexts/AuthContext';
import {
  CUSTOMER_PAGES,
  customerAccessService,
  type CustomerPage,
  type CustomerPermissions,
  type CustomerReport,
  type ReportRow,
} from '../../services/customerAccessService';
import styles from './CustomerAccess.module.css';

const money = new Intl.NumberFormat('de-AT', {
  style: 'currency',
  currency: 'EUR',
});
function format(value: ReportRow[string] | undefined, kind?: string) {
  if (value == null) return '—';
  if (Array.isArray(value)) return value.join(', ');
  if (kind === 'money') return money.format(Number(value));
  if (kind === 'number') return Number(value).toLocaleString('de-AT');
  if (kind === 'date')
    return new Date(String(value)).toLocaleDateString('de-AT', {
      timeZone: 'Europe/Vienna',
    });
  return String(value);
}
function ProtectedPhoto({ id, label }: { id: string; label: string }) {
  const [src, setSrc] = useState('');
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    const abort = new AbortController();
    let objectUrl = '';
    customerAccessService
      .image(id, abort.signal)
      .then((blob) => {
        if (!abort.signal.aborted) {
          objectUrl = URL.createObjectURL(blob);
          setSrc(objectUrl);
        }
      })
      .catch(() => {
        if (!abort.signal.aborted) setFailed(true);
      });
    return () => {
      abort.abort();
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [id]);
  return src ? (
    <img src={src} alt={label} loading="lazy" />
  ) : (
    <div className={styles.photoPlaceholder}>
      {failed ? 'Foto nicht verfügbar' : 'Foto wird geladen …'}
    </div>
  );
}
export function CustomerPortal() {
  const { user, logout } = useAuth();
  const [permissions, setPermissions] = useState<CustomerPermissions | null>(
    null
  );
  const [page, setPage] = useState<CustomerPage>('dashboard');
  const [report, setReport] = useState<CustomerReport | null>(null);
  const [wave, setWave] = useState<string>();
  const [search, setSearch] = useState('');
  const [pageIndex, setPageIndex] = useState(0);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [reload, setReload] = useState(0);
  const refreshPermissions = useCallback(async (signal?: AbortSignal) => {
    const r = await customerAccessService.me(signal);
    setPermissions((previous) =>
      JSON.stringify(previous) === JSON.stringify(r.permissions)
        ? previous
        : r.permissions
    );
    setPage((current) =>
      r.permissions[current]?.view
        ? current
        : (CUSTOMER_PAGES.find((p) => r.permissions[p.key]?.view)?.key ??
          'dashboard')
    );
  }, []);
  useEffect(() => {
    const abort = new AbortController();
    refreshPermissions(abort.signal).catch((e) => {
      if (!abort.signal.aborted) {
        setError(e.message);
        setLoading(false);
      }
    });
    const onFocus = () => {
      setReport(null);
      setWave(undefined);
      setReload((n) => n + 1);
      void refreshPermissions().catch((e) => setError(e.message));
    };
    window.addEventListener('focus', onFocus);
    return () => {
      abort.abort();
      window.removeEventListener('focus', onFocus);
    };
  }, [refreshPermissions]);
  useEffect(() => {
    if (!permissions) return;
    if (!permissions[page]?.view) {
      setReport(null);
      setLoading(false);
      return;
    }
    const abort = new AbortController();
    setLoading(true);
    setError('');
    setReport(null);
    customerAccessService
      .report(page, wave, abort.signal)
      .then((r) => {
        if (!abort.signal.aborted) setReport(r);
      })
      .catch((e) => {
        if (!abort.signal.aborted) {
          setError(e.message);
          void refreshPermissions().catch(() => {});
        }
      })
      .finally(() => {
        if (!abort.signal.aborted) setLoading(false);
      });
    return () => abort.abort();
  }, [page, wave, permissions, reload, refreshPermissions]);
  const visible = CUSTOMER_PAGES.filter((p) => permissions?.[p.key]?.view);
  const rows = useMemo(
    () =>
      report?.rows.filter((r) =>
        Object.values(r).some((v) =>
          String(v ?? '')
            .toLocaleLowerCase('de-AT')
            .includes(search.toLocaleLowerCase('de-AT'))
        )
      ) ?? [],
    [report, search]
  );
  const pageSize = page === 'fotos' ? 24 : 50;
  const lastPage = Math.max(0, Math.ceil(rows.length / pageSize) - 1);
  const currentPage = Math.min(pageIndex, lastPage);
  const visibleRows = rows.slice(
    currentPage * pageSize,
    (currentPage + 1) * pageSize
  );
  const cards = (page === 'dashboard' || page === 'vorbesteller') && !wave;
  const sums = useMemo(
    () =>
      rows.reduce<{ revenue: number; photos: number; unpriced: number }>(
        (a, r) => ({
          revenue: a.revenue + Number(r.revenue || 0),
          photos: a.photos + Number(r.photos || 0),
          unpriced: a.unpriced + Number(r.unpriced || 0),
        }),
        { revenue: 0, photos: 0, unpriced: 0 }
      ),
    [rows]
  );
  const navigate = (next: CustomerPage, id?: string) => {
    if (next === page && id === wave) return;
    setReport(null);
    setLoading(true);
    setError('');
    setPage(next);
    setWave(id);
    setSearch('');
    setPageIndex(0);
  };
  const download = async (photos = false) => {
    setExporting(true);
    setError('');
    try {
      await customerAccessService.export(page, wave, search, photos);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setExporting(false);
    }
  };
  return (
    <div className={styles.portal}>
      <aside className={styles.customerNav}>
        <div className={styles.brand}>Mars Rover</div>
        <small>Kundenzugang</small>
        <nav aria-label="Kundennavigation">
          {visible.map((p) => (
            <button
              key={p.key}
              title={p.label}
              className={`${styles.navItem} ${page === p.key ? styles.navActive : ''}`}
              aria-current={page === p.key ? 'page' : undefined}
              onClick={() => navigate(p.key)}
            >
              {p.key === 'dashboard' ? (
                <House size={19} />
              ) : p.key === 'fotos' ? (
                <Camera size={19} />
              ) : p.key === 'vorbesteller' ? (
                <SquaresFour size={19} />
              ) : (
                <Buildings size={19} />
              )}
              <span>{p.label}</span>
            </button>
          ))}
        </nav>
        <button
          onClick={() => void logout()}
          title="Abmelden"
          aria-label="Abmelden"
        >
          <SignOut size={18} /> <span>Abmelden</span>
        </button>
      </aside>
      <main className={styles.customerMain}>
        <header className={styles.customerHeader}>
          <div>
            <div className={styles.eyebrow}>
              MARS · {user?.firstName} {user?.lastName}
            </div>
            <h1 className={styles.pageTitle}>
              {wave
                ? (report?.title ?? 'Welle')
                : CUSTOMER_PAGES.find((p) => p.key === page)?.label}
            </h1>
            <p>
              {cards || page === 'fotos'
                ? 'Aktive Wellen · Stand ' +
                  new Date().toLocaleDateString('de-AT')
                : 'Freigegebene Daten'}
            </p>
          </div>
          <span className={styles.readBadge}>
            <Eye size={16} /> Nur Ansicht
          </span>
        </header>
        {wave && (
          <button
            style={{ marginTop: 20 }}
            onClick={() => navigate('vorbesteller')}
          >
            <ArrowLeft size={15} /> Alle Umsatzwellen
          </button>
        )}
        {cards && report && (
          <div className={styles.stats}>
            <div className={styles.stat}>
              <span>Aktive Wellen</span>
              <strong>{rows.length}</strong>
            </div>
            <div className={styles.stat}>
              <span>Bewerteter Umsatz</span>
              <strong>{money.format(sums.revenue)}</strong>
              {sums.unpriced > 0 && (
                <small>
                  {sums.unpriced}{' '}
                  {sums.unpriced === 1 ? 'Position' : 'Positionen'} noch ohne
                  Preis
                </small>
              )}
            </div>
            <div className={styles.stat}>
              <span>Hochgeladene Fotos</span>
              <strong>{sums.photos}</strong>
            </div>
          </div>
        )}
        <div className={styles.toolbar}>
          <div className={styles.search}>
            <MagnifyingGlass size={17} />
            <input
              className={styles.searchInput}
              aria-label="Daten durchsuchen"
              placeholder="Suchen …"
              maxLength={200}
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPageIndex(0);
              }}
            />
          </div>
          <span className={styles.count}>
            {report ? `${rows.length} ${cards ? 'Wellen' : 'Einträge'}` : ''}
          </span>
          {permissions?.[page]?.export && (
            <button
              className={styles.primary}
              onClick={() => void download()}
              disabled={loading || exporting}
            >
              {exporting ? (
                'Exportiert …'
              ) : (
                <>
                  <DownloadSimple size={16} /> Excel exportieren
                </>
              )}
            </button>
          )}
          {permissions?.[page]?.export && page === 'fotos' && (
            <button
              onClick={() => void download(true)}
              disabled={loading || exporting}
            >
              <DownloadSimple size={16} /> Fotos herunterladen
            </button>
          )}
        </div>
        {error && (
          <div className={styles.error} role="alert">
            {error}{' '}
            <button onClick={() => setReload((n) => n + 1)}>
              Erneut versuchen
            </button>
          </div>
        )}
        {loading ? (
          <div className={styles.empty} role="status">
            Daten werden geladen …
          </div>
        ) : !visible.length && !error ? (
          <div className={styles.empty}>
            <strong>Noch keine Seiten freigegeben</strong>Die Administration
            kann die gewünschten Ansichten für dich aktivieren.
          </div>
        ) : !rows.length && !error ? (
          <div className={styles.empty}>
            <strong>{search ? 'Keine Treffer' : 'Noch keine Daten'}</strong>
            {search
              ? 'Versuche einen anderen Suchbegriff.'
              : 'In dieser Ansicht sind aktuell keine Einträge verfügbar.'}
          </div>
        ) : cards ? (
          <div className={styles.waveGrid}>
            {visibleRows.map((r) => (
              <article className={styles.waveCard} key={String(r.id)}>
                <div className={styles.waveTop}>
                  <span className={styles.waveType}>
                    {r.foto_only ? (
                      <Camera size={16} />
                    ) : (
                      <SquaresFour size={16} />
                    )}{' '}
                    {r.foto_only ? 'FOTOWELLE' : 'UMSATZWELLE'}
                  </span>
                  <span className={styles.live}>Aktiv</span>
                </div>
                <div>
                  <h2 className={styles.waveTitle}>{r.name}</h2>
                  <p className={styles.waveDate}>
                    {format(r.start_date, 'date')} –{' '}
                    {format(r.end_date, 'date')}
                  </p>
                </div>
                <div className={styles.waveValue}>
                  {r.foto_only ? r.photos : money.format(Number(r.revenue))}
                  {r.foto_only && <small>Fotos</small>}
                </div>
                {Number(r.unpriced) > 0 && (
                  <p className={styles.warning}>
                    {r.unpriced}{' '}
                    {Number(r.unpriced) === 1 ? 'Position' : 'Positionen'} ohne
                    Preis · Umsatz unvollständig
                  </p>
                )}
                <div className={styles.waveMeta}>
                  <span>{r.orders} Positionen</span>
                  <span>{r.photos} Fotos</span>
                </div>
                {r.foto_only
                  ? permissions?.fotos?.view && (
                      <button
                        className={styles.detailButton}
                        onClick={() => navigate('fotos')}
                      >
                        Fotos ansehen <ArrowRight size={14} />
                      </button>
                    )
                  : permissions?.vorbesteller?.view && (
                      <button
                        className={styles.detailButton}
                        onClick={() => navigate('vorbesteller', String(r.id))}
                      >
                        Buchungen ansehen <ArrowRight size={14} />
                      </button>
                    )}
              </article>
            ))}
          </div>
        ) : page === 'fotos' ? (
          <div className={styles.photoGrid}>
            {visibleRows.map((r) => (
              <article key={String(r.id)} className={styles.photoCard}>
                <ProtectedPhoto id={String(r.id)} label={String(r.wave)} />
                <div className={styles.photoCaption}>
                  <h2>{r.wave}</h2>
                  <p>
                    Markt {r.market_id} · {format(r.created_at, 'date')}
                  </p>
                  <p>{format(r.tags)}</p>
                  {r.comment && <p>{r.comment}</p>}
                </div>
              </article>
            ))}
          </div>
        ) : (
          report && (
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    {report.columns.map((c) => (
                      <th key={c.key}>{c.label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {visibleRows.map((r, i) => (
                    <tr key={String(r.id ?? i)}>
                      {report.columns.map((c) => (
                        <td key={c.key}>{format(r[c.key], c.format)}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}
        {!loading && report && lastPage > 0 && (
          <nav className={styles.pagination} aria-label="Datenseiten">
            <button
              disabled={currentPage === 0}
              onClick={() => setPageIndex(currentPage - 1)}
            >
              Zurück
            </button>
            <span>
              Seite {currentPage + 1} von {lastPage + 1}
            </span>
            <button
              disabled={currentPage === lastPage}
              onClick={() => setPageIndex(currentPage + 1)}
            >
              Weiter
            </button>
          </nav>
        )}
      </main>
    </div>
  );
}
