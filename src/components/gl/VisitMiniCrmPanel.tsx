import React, { useMemo, useState } from 'react';
import {
  X,
  Clock,
  CaretDown,
  CaretRight,
  ChatText,
  ArrowsClockwise,
  ClipboardText,
  Package,
  ShoppingCart,
  ArrowsLeftRight,
  Gift
} from '@phosphor-icons/react';
import type { Market } from '../../types/market-types';
import type { VisitCrmContext, VisitCrmItem } from '../../services/marketService';
import styles from './VisitMiniCrmPanel.module.css';

interface VisitMiniCrmPanelProps {
  market: Market;
  context: VisitCrmContext | null;
  loading: boolean;
  error: string | null;
  onClose: () => void;
  onRetry: () => void;
}

const SECTION_ORDER = ['fragebogen', 'vorbesteller', 'vorverkauf', 'produkttausch', 'nara'] as const;
type SectionKey = (typeof SECTION_ORDER)[number];

const SECTION_LABELS: Record<SectionKey, string> = {
  fragebogen: 'Fragebogen',
  vorbesteller: 'Vorbesteller',
  vorverkauf: 'Vorverkauf',
  produkttausch: 'Produkttausch',
  nara: 'NARA'
};

const SECTION_ICONS: Record<SectionKey, React.ReactNode> = {
  fragebogen: <ClipboardText size={14} weight="fill" />,
  vorbesteller: <Package size={14} weight="fill" />,
  vorverkauf: <ShoppingCart size={14} weight="fill" />,
  produkttausch: <ArrowsLeftRight size={14} weight="fill" />,
  nara: <Gift size={14} weight="fill" />
};

const formatDateTime = (value?: string | null): string => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const formatDateOnly = (value?: string | null): string => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

const ActivityRow: React.FC<{ item: VisitCrmItem }> = ({ item }) => (
  <div className={styles.itemRow}>
    <div className={styles.itemHeader}>
      <span className={styles.itemTitle}>{item.title}</span>
      <span className={styles.itemTime}>{formatDateTime(item.timestamp)}</span>
    </div>
    {item.subtitle && <div className={styles.itemSubtitle}>{item.subtitle}</div>}
    {item.meta?.length > 0 && <div className={styles.itemMeta}>{item.meta.join(' · ')}</div>}
    {item.comment && (
      <div className={styles.itemComment}>
        <ChatText size={12} weight="fill" />
        <span>{item.comment}</span>
      </div>
    )}
  </div>
);

export const VisitMiniCrmPanel: React.FC<VisitMiniCrmPanelProps> = ({
  market,
  context,
  loading,
  error,
  onClose,
  onRetry
}) => {
  const [expandedSections, setExpandedSections] = useState<Record<SectionKey, boolean>>({
    fragebogen: false,
    vorbesteller: false,
    vorverkauf: false,
    produkttausch: false,
    nara: false
  });

  const sectionSummary = useMemo(() => {
    if (!context) return [];
    return SECTION_ORDER.map((key) => ({
      key,
      ...context.sections[key]
    }));
  }, [context]);

  const toggleSection = (section: SectionKey) => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  return (
    <div className={styles.panelLayer} aria-live="polite">
      <aside className={styles.panel}>
        <div className={styles.header}>
          <div className={styles.headerText}>
            <div className={styles.title}>Mini CRM</div>
            <div className={styles.marketLine}>
              {market.name} {market.chain ? `· ${market.chain}` : ''}
            </div>
          </div>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Mini CRM schließen">
            <X size={16} weight="bold" />
          </button>
        </div>

        {loading && (
          <div className={styles.stateBox}>
            <Clock size={16} weight="fill" />
            <span>Lade Besuchskontext…</span>
          </div>
        )}

        {!loading && error && (
          <div className={styles.stateBoxError}>
            <span>{error}</span>
            <button className={styles.retryBtn} onClick={onRetry}>
              <ArrowsClockwise size={14} weight="bold" />
              Erneut laden
            </button>
          </div>
        )}

        {!loading && !error && context && (
          <>
            <div className={styles.lastVisitCard}>
              <div className={styles.lastVisitTitle}>Letzter Besuch</div>
              <div className={styles.lastVisitDate}>{formatDateOnly(context.lastVisit.date)}</div>
              {context.lastVisit.visitWindow && (
                <div className={styles.lastVisitMeta}>
                  {context.lastVisit.visitWindow.from || '—'} - {context.lastVisit.visitWindow.to || '—'}
                </div>
              )}
              {context.lastVisit.visitComment && (
                <div className={styles.lastVisitComment}>
                  <ChatText size={12} weight="fill" />
                  <span>{context.lastVisit.visitComment}</span>
                </div>
              )}
              {context.lastVisit.actionsOnLastVisit.length > 0 && (
                <div className={styles.lastVisitActions}>
                  {context.lastVisit.actionsOnLastVisit.slice(0, 4).map((item) => (
                    <span key={`${item.section || item.type}-${item.id}`} className={styles.actionBadge}>
                      {SECTION_LABELS[(item.section as SectionKey) || item.type as SectionKey] || item.type}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className={styles.sectionList}>
              {sectionSummary.map((section) => (
                <div key={section.key} className={styles.sectionCard}>
                  <button className={styles.sectionHeader} onClick={() => toggleSection(section.key)}>
                    <div className={styles.sectionTitleWrap}>
                      <span className={styles.sectionIcon}>{SECTION_ICONS[section.key]}</span>
                      <span className={styles.sectionTitle}>{SECTION_LABELS[section.key]}</span>
                      <span className={styles.sectionCount}>{section.count}</span>
                    </div>
                    {expandedSections[section.key] ? (
                      <CaretDown size={14} weight="bold" />
                    ) : (
                      <CaretRight size={14} weight="bold" />
                    )}
                  </button>

                  {!expandedSections[section.key] && section.latest && (
                    <div className={styles.sectionPreview}>
                      <span>{section.latest.title}</span>
                      <span>{formatDateTime(section.latest.timestamp)}</span>
                    </div>
                  )}

                  {expandedSections[section.key] && (
                    <div className={styles.sectionBody}>
                      {section.items.length === 0 ? (
                        <div className={styles.emptySection}>Keine Einträge</div>
                      ) : (
                        section.items.map((item) => <ActivityRow key={`${section.key}-${item.id}`} item={item} />)
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </aside>
    </div>
  );
};

