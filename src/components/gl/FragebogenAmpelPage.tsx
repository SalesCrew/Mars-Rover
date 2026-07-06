import React, { useEffect, useMemo, useState } from 'react';
import { CheckCircle, CircleNotch, ClipboardText, MagnifyingGlass, Storefront, WarningCircle, X } from '@phosphor-icons/react';
import fragebogenService, {
  type GLFragebogenStatusMarket,
  type GLFragebogenMarketStatus,
  type FragebogenStatusOption
} from '../../services/fragebogenService';
import styles from './FragebogenAmpelPage.module.css';

interface FragebogenAmpelPageProps {
  glId: string;
}

const formatDateTime = (value?: string | null): string => {
  if (!value) return '';
  return new Intl.DateTimeFormat('de-AT', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(value));
};

const getMarketLabel = (market: GLFragebogenStatusMarket): string => {
  const internalId = market.internalId ? `${market.internalId} · ` : '';
  return `${internalId}${market.name || market.id}`;
};

const getChainGradient = (chain: string): string => {
  const upperChain = chain.toUpperCase();
  const chainColors: Record<string, string> = {
    'BILLA+': 'linear-gradient(135deg, #FED304 0%, #EAB308 100%)',
    'BILLA PLUS': 'linear-gradient(135deg, #FED304 0%, #EAB308 100%)',
    'BILLA+ PRIVAT': 'linear-gradient(135deg, #FBBF24 0%, #F59E0B 100%)',
    'BILLA PLUS PRIVAT': 'linear-gradient(135deg, #FBBF24 0%, #F59E0B 100%)',
    'BILLA PRIVAT': 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
    'BILLA': 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
    'SPAR': 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
    'EUROSPAR': 'linear-gradient(135deg, #DC2626 0%, #B91C1C 100%)',
    'INTERSPAR': 'linear-gradient(135deg, #B91C1C 0%, #991B1B 100%)',
    'SPAR GOURMET': 'linear-gradient(135deg, #059669 0%, #047857 100%)',
    'HOFER': 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)',
    'MERKUR': 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
    'ADEG': 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)',
    'FUTTERHAUS': 'linear-gradient(135deg, #F97316 0%, #EA580C 100%)',
    'HAGEBAU': 'linear-gradient(135deg, #0EA5E9 0%, #0284C7 100%)',
    'ZOOFACHHANDEL': 'linear-gradient(135deg, #EC4899 0%, #DB2777 100%)',
    'PENNY': 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)',
    'NETTO': 'linear-gradient(135deg, #F97316 0%, #EA580C 100%)',
  };
  return chainColors[upperChain] || 'linear-gradient(135deg, #6B7280 0%, #4B5563 100%)';
};

const getSelectedStatus = (
  market: GLFragebogenStatusMarket,
  selectedFragebogenId: string
): GLFragebogenMarketStatus | undefined =>
  market.statuses.find((status) => status.fragebogenId === selectedFragebogenId);

export const FragebogenAmpelPage: React.FC<FragebogenAmpelPageProps> = ({ glId }) => {
  const [selectedFragebogenId, setSelectedFragebogenId] = useState<'all' | string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMarket, setSelectedMarket] = useState<GLFragebogenStatusMarket | null>(null);
  const [fragebogen, setFragebogen] = useState<FragebogenStatusOption[]>([]);
  const [markets, setMarkets] = useState<GLFragebogenStatusMarket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!glId) {
      setIsLoading(false);
      setError('GL konnte nicht geladen werden.');
      return;
    }

    let isCancelled = false;

    const loadStatus = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const overview = await fragebogenService.fragebogen.getGlStatus(glId);
        if (isCancelled) return;
        setFragebogen(overview.fragebogen || []);
        setMarkets(overview.markets || []);
      } catch (err) {
        console.error('Failed to load fragebogen ampel overview:', err);
        if (isCancelled) return;
        setError('Fragebogen-Status konnte nicht geladen werden.');
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    };

    loadStatus();

    return () => {
      isCancelled = true;
    };
  }, [glId]);

  const assignedFragebogen = useMemo(() => {
    const assignedIds = new Set(
      markets.flatMap((market) => market.statuses.map((status) => status.fragebogenId))
    );
    return fragebogen.filter((item) => assignedIds.has(item.id));
  }, [fragebogen, markets]);

  useEffect(() => {
    if (selectedFragebogenId === 'all') return;
    if (!assignedFragebogen.some((item) => item.id === selectedFragebogenId)) {
      setSelectedFragebogenId('all');
    }
  }, [assignedFragebogen, selectedFragebogenId]);

  const filteredMarkets = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    const base = selectedFragebogenId === 'all'
      ? markets
      : markets.filter((market) => Boolean(getSelectedStatus(market, selectedFragebogenId)));

    return base
      .filter((market) => {
        if (!term) return true;
        return [
          market.id,
          market.internalId,
          market.name,
          market.chain,
          market.address,
          market.postalCode,
          market.city
        ].some((value) => String(value || '').toLowerCase().includes(term));
      })
      .sort((a, b) => {
        const aHasActiveFragebogen = a.statuses.length > 0;
        const bHasActiveFragebogen = b.statuses.length > 0;
        const aOpen = a.statuses.some((status) => !status.completed);
        const bOpen = b.statuses.some((status) => !status.completed);
        if (selectedFragebogenId !== 'all') {
          const selectedA = getSelectedStatus(a, selectedFragebogenId);
          const selectedB = getSelectedStatus(b, selectedFragebogenId);
          if (Boolean(selectedA?.completed) !== Boolean(selectedB?.completed)) {
            return selectedA?.completed ? 1 : -1;
          }
        } else if (aHasActiveFragebogen !== bHasActiveFragebogen) {
          return aHasActiveFragebogen ? -1 : 1;
        } else if (aOpen !== bOpen) {
          return aOpen ? -1 : 1;
        }

        return String(a.chain || '').localeCompare(String(b.chain || ''))
          || String(a.name || '').localeCompare(String(b.name || ''))
          || String(a.internalId || '').localeCompare(String(b.internalId || ''));
      });
  }, [markets, searchTerm, selectedFragebogenId]);

  const currentStats = useMemo(() => {
    if (selectedFragebogenId === 'all') {
      const total = markets.reduce((sum, market) => sum + market.statuses.length, 0);
      const completed = markets.reduce(
        (sum, market) => sum + market.statuses.filter((status) => status.completed).length,
        0
      );
      return { total, completed, open: Math.max(total - completed, 0), markets: markets.length };
    }

    const assigned = markets
      .map((market) => getSelectedStatus(market, selectedFragebogenId))
      .filter(Boolean) as GLFragebogenMarketStatus[];
    const completed = assigned.filter((status) => status.completed).length;
    return { total: assigned.length, completed, open: Math.max(assigned.length - completed, 0), markets: assigned.length };
  }, [markets, selectedFragebogenId]);

  const selectedMarketStats = useMemo(() => {
    if (!selectedMarket) return { completed: 0, open: 0 };
    const completed = selectedMarket.statuses.filter((status) => status.completed).length;
    return { completed, open: Math.max(selectedMarket.statuses.length - completed, 0) };
  }, [selectedMarket]);

  if (isLoading) {
    return (
      <div className={styles.stateCard}>
        <CircleNotch size={28} weight="bold" className={styles.spinner} />
        <span>Lade Fragebogen-Status...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.stateCard}>
        <WarningCircle size={28} weight="duotone" className={styles.errorIcon} />
        <span>{error}</span>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <section className={styles.headerSection}>
        <div className={styles.titleGroup}>
          <div className={styles.titleIcon}>
            <ClipboardText size={22} weight="duotone" />
          </div>
          <div>
            <h1 className={styles.title}>Fragebögen</h1>
            <p className={styles.subtitle}>Aktive Rückmeldungen je Markt</p>
          </div>
        </div>

        <div className={styles.summaryGrid}>
          <div className={styles.summaryItem}>
            <span>{currentStats.completed}</span>
            <small>Erledigt</small>
          </div>
          <div className={styles.summaryItem}>
            <span>{currentStats.open}</span>
            <small>Offen</small>
          </div>
          <div className={styles.summaryItem}>
            <span>{currentStats.markets}</span>
            <small>Märkte</small>
          </div>
        </div>
      </section>

      <section className={styles.controls}>
        <div className={styles.tabs} role="tablist" aria-label="Fragebogen Filter">
          <button
            className={`${styles.tabButton} ${selectedFragebogenId === 'all' ? styles.tabButtonActive : ''}`}
            onClick={() => setSelectedFragebogenId('all')}
            type="button"
          >
            Alle
          </button>
          {assignedFragebogen.map((item) => (
            <button
              key={item.id}
              className={`${styles.tabButton} ${selectedFragebogenId === item.id ? styles.tabButtonActive : ''}`}
              onClick={() => setSelectedFragebogenId(item.id)}
              type="button"
              title={item.name}
            >
              {item.name}
            </button>
          ))}
        </div>

        <div className={styles.searchBox}>
          <MagnifyingGlass size={16} weight="bold" />
          <input
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Markt suchen"
          />
        </div>
      </section>

      <section className={styles.marketList}>
        {filteredMarkets.length === 0 ? (
          <div className={styles.emptyState}>
            <Storefront size={36} weight="duotone" />
            <span>Keine Märkte gefunden</span>
          </div>
        ) : (
          filteredMarkets.map((market) => {
            const selectedStatus = selectedFragebogenId === 'all'
              ? null
              : getSelectedStatus(market, selectedFragebogenId);

            return (
              <article
                key={market.id}
                className={styles.marketRow}
                role="button"
                tabIndex={0}
                onClick={() => setSelectedMarket(market)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    setSelectedMarket(market);
                  }
                }}
              >
                <div className={styles.marketMain}>
                  <span className={styles.chainPill} style={{ background: getChainGradient(market.chain || '') }}>
                    {market.chain || 'Markt'}
                  </span>
                  <div className={styles.marketText}>
                    <h2>{getMarketLabel(market)}</h2>
                    <p>{[market.address, market.postalCode, market.city].filter(Boolean).join(', ')}</p>
                  </div>
                </div>

                <div className={styles.statusGroup}>
                  {selectedFragebogenId === 'all' ? (
                    market.statuses.length > 0 ? (
                      market.statuses.map((status) => (
                        <span
                          key={status.fragebogenId}
                          className={`${styles.statusDot} ${status.completed ? styles.statusDone : styles.statusOpen}`}
                          title={`${status.fragebogenName}: ${status.completed ? 'erledigt' : 'offen'}`}
                          aria-label={`${status.fragebogenName}: ${status.completed ? 'erledigt' : 'offen'}`}
                        />
                      ))
                    ) : (
                      <span className={styles.noStatus}>-</span>
                    )
                  ) : selectedStatus ? (
                    <div className={styles.singleStatus}>
                      <span
                        className={`${styles.statusDot} ${selectedStatus.completed ? styles.statusDone : styles.statusOpen}`}
                        aria-hidden="true"
                      />
                      <span>{selectedStatus.completed ? 'Erledigt' : 'Offen'}</span>
                      {selectedStatus.completedAt && (
                        <small>{formatDateTime(selectedStatus.completedAt)}</small>
                      )}
                    </div>
                  ) : (
                    <span className={styles.noStatus}>-</span>
                  )}
                </div>
              </article>
            );
          })
        )}
      </section>

      {selectedMarket && (
        <div className={styles.modalBackdrop} onClick={() => setSelectedMarket(null)}>
          <div
            className={styles.detailModal}
            role="dialog"
            aria-modal="true"
            aria-labelledby="fragebogen-market-status-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className={styles.detailHeader}>
              <div className={styles.detailTitleGroup}>
                <span className={styles.chainPill} style={{ background: getChainGradient(selectedMarket.chain || '') }}>
                  {selectedMarket.chain || 'Markt'}
                </span>
                <div>
                  <h2 id="fragebogen-market-status-title">{getMarketLabel(selectedMarket)}</h2>
                  <p>{[selectedMarket.address, selectedMarket.postalCode, selectedMarket.city].filter(Boolean).join(', ')}</p>
                </div>
              </div>
              <button className={styles.closeButton} type="button" onClick={() => setSelectedMarket(null)} aria-label="Schliessen">
                <X size={18} weight="bold" />
              </button>
            </div>

            <div className={styles.detailSummary}>
              <span>{selectedMarket.statuses.length} Fragebogen</span>
              <span>{selectedMarketStats.completed} erledigt</span>
              <span>{selectedMarketStats.open} offen</span>
            </div>

            <div className={styles.detailStatusList}>
              {selectedMarket.statuses.length > 0 ? (
                selectedMarket.statuses.map((status) => (
                  <div key={status.fragebogenId} className={styles.detailStatusRow}>
                    <span
                      className={`${styles.statusDot} ${status.completed ? styles.statusDone : styles.statusOpen}`}
                      aria-hidden="true"
                    />
                    <div>
                      <strong>{status.fragebogenName}</strong>
                      <small>{status.completed && status.completedAt ? `Abgeschlossen ${formatDateTime(status.completedAt)}` : 'Noch offen'}</small>
                    </div>
                    <span className={`${styles.detailStatusBadge} ${status.completed ? styles.detailStatusDone : styles.detailStatusOpen}`}>
                      {status.completed ? 'Erledigt' : 'Offen'}
                    </span>
                  </div>
                ))
              ) : (
                <div className={styles.detailEmpty}>Keine aktiven Fragebogen fuer diesen Markt.</div>
              )}
            </div>
          </div>
        </div>
      )}

      {currentStats.total > 0 && currentStats.open === 0 && (
        <div className={styles.completeHint}>
          <CheckCircle size={18} weight="fill" />
          <span>Alles erledigt</span>
        </div>
      )}
    </div>
  );
};

export default FragebogenAmpelPage;
