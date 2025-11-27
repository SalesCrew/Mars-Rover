import React, { useEffect, useState } from 'react';
import { MapPin, Calendar, TrendUp, Clock, ArrowRight, Storefront } from '@phosphor-icons/react';
import type { Market } from '../../types/market-types';
import styles from './MarketDetailModal.module.css';

interface MarketDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartVisit: (marketId: string) => void;
  market: Market;
}

export const MarketDetailModal: React.FC<MarketDetailModalProps> = ({
  isOpen,
  onClose,
  onStartVisit,
  market,
}) => {
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsAnimating(true);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Noch nie besucht';
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Heute';
    if (diffDays === 1) return 'Gestern';
    if (diffDays < 7) return `Vor ${diffDays} Tagen`;
    if (diffDays < 30) return `Vor ${Math.floor(diffDays / 7)} Wochen`;
    return `Vor ${Math.floor(diffDays / 30)} Monaten`;
  };

  const getVisitProgress = () => {
    return Math.round((market.currentVisits / market.frequency) * 100);
  };

  const visitProgress = getVisitProgress();
  const visitsRemaining = market.frequency - market.currentVisits;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div 
        className={`${styles.modal} ${isAnimating ? styles.modalAnimated : ''}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with Chain Badge */}
        <div className={styles.header}>
          <div className={styles.chainBadge}>
            <Storefront size={24} weight="fill" />
          </div>
          <div className={styles.headerContent}>
            <h2 className={styles.title}>{market.name}</h2>
            <p className={styles.address}>
              <MapPin size={14} weight="fill" />
              {market.address}, {market.postalCode} {market.city}
            </p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <div className={styles.statIcon}>
              <Calendar size={20} weight="fill" />
            </div>
            <div className={styles.statContent}>
              <div className={styles.statLabel}>Letzter Besuch</div>
              <div className={styles.statValue}>{formatDate(market.lastVisitDate)}</div>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statIcon}>
              <TrendUp size={20} weight="fill" />
            </div>
            <div className={styles.statContent}>
              <div className={styles.statLabel}>Fortschritt</div>
              <div className={styles.statValue}>
                {market.currentVisits} / {market.frequency}
              </div>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statIcon}>
              <Clock size={20} weight="fill" />
            </div>
            <div className={styles.statContent}>
              <div className={styles.statLabel}>Verbleibend</div>
              <div className={styles.statValue}>{visitsRemaining} Besuche</div>
            </div>
          </div>
        </div>

        {/* Progress Section */}
        <div className={styles.progressSection}>
          <div className={styles.progressHeader}>
            <span className={styles.progressLabel}>Jahresfortschritt</span>
            <span className={styles.progressPercentage}>
              {visitProgress}%
            </span>
          </div>
          <div className={styles.progressBar}>
            <div 
              className={styles.progressFill} 
              style={{ width: `${visitProgress}%` }}
            />
          </div>
          <div className={styles.progressFooter}>
            <span className={styles.progressText}>
              {visitsRemaining > 0 
                ? `Noch ${visitsRemaining} ${visitsRemaining === 1 ? 'Besuch' : 'Besuche'} bis zum Ziel`
                : 'Jahresziel erreicht'}
            </span>
          </div>
        </div>

        {/* Info Cards */}
        <div className={styles.infoCards}>
          <div className={styles.infoCard}>
            <div className={styles.infoCardIcon}>
              <Storefront size={18} weight="fill" />
            </div>
            <div className={styles.infoCardContent}>
              <div className={styles.infoCardLabel}>Kette</div>
              <div className={styles.infoCardValue}>{market.chain}</div>
            </div>
          </div>

          <div className={styles.infoCard}>
            <div className={styles.infoCardIcon}>
              <Calendar size={18} weight="fill" />
            </div>
            <div className={styles.infoCardContent}>
              <div className={styles.infoCardLabel}>Frequenz</div>
              <div className={styles.infoCardValue}>{market.frequency}x / Jahr</div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className={styles.actions}>
          <button className={styles.cancelButton} onClick={onClose}>
            Abbrechen
          </button>
          <button 
            className={styles.startButton}
            onClick={() => onStartVisit(market.id)}
          >
            <span>Einsatz starten</span>
            <ArrowRight size={20} weight="bold" />
          </button>
        </div>
      </div>
    </div>
  );
};

