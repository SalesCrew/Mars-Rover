import React from 'react';
import { Warning, Calendar, Check, X } from '@phosphor-icons/react';
import styles from './MarketVisitConfirmModal.module.css';

interface MarketVisitConfirmModalProps {
  isOpen: boolean;
  lastVisitDate: string;
  marketName: string;
  onConfirmNewVisit: () => void;
  onSkipVisit: () => void;
  onCancel: () => void;
}

export const MarketVisitConfirmModal: React.FC<MarketVisitConfirmModalProps> = ({
  isOpen,
  lastVisitDate,
  marketName,
  onConfirmNewVisit,
  onSkipVisit,
  onCancel
}) => {
  if (!isOpen) return null;

  // Format the date nicely
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('de-DE', {
      weekday: 'long',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  // Calculate days ago
  const getDaysAgo = (dateString: string): number => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
  };

  const daysAgo = getDaysAgo(lastVisitDate);
  const formattedDate = formatDate(lastVisitDate);

  return (
    <div className={styles.modalOverlay} onClick={onCancel}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <Warning size={32} weight="fill" className={styles.warningIcon} />
          <h2>Marktbesuch prüfen</h2>
        </div>
        
        <p className={styles.description}>
          Der Markt <strong>{marketName}</strong> wurde kürzlich besucht.
        </p>
        
        <div className={styles.visitInfo}>
          <Calendar size={20} weight="fill" className={styles.calendarIcon} />
          <div className={styles.visitDetails}>
            <span className={styles.visitLabel}>Letzter Besuch</span>
            <span className={styles.visitDate}>{formattedDate}</span>
            <span className={styles.visitDaysAgo}>vor {daysAgo} {daysAgo === 1 ? 'Tag' : 'Tagen'}</span>
          </div>
        </div>
        
        <p className={styles.question}>
          Zählt diese Eingabe noch zu dem letzten Besuch oder ist es ein neuer Marktbesuch?
        </p>
        
        <div className={styles.actions}>
          <button 
            className={styles.skipButton}
            onClick={onSkipVisit}
          >
            <X size={18} weight="bold" />
            Keinen Marktbesuch eintragen
          </button>
          <button 
            className={styles.confirmButton}
            onClick={onConfirmNewVisit}
          >
            <Check size={18} weight="bold" />
            Marktbesuch eintragen
          </button>
        </div>
      </div>
    </div>
  );
};

export default MarketVisitConfirmModal;
