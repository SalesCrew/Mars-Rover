import React from 'react';
import { X, ClockCountdown, Receipt } from '@phosphor-icons/react';
import styles from './ZeiterfassungExportModal.module.css';

interface ZeiterfassungExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExportZeiterfassung: () => void;
  onExportDiaeten: () => void;
}

export const ZeiterfassungExportModal: React.FC<ZeiterfassungExportModalProps> = ({
  isOpen,
  onClose,
  onExportZeiterfassung,
  onExportDiaeten,
}) => {
  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <div className={styles.headerText}>
            <h2 className={styles.title}>Export</h2>
            <p className={styles.subtitle}>Was möchtest du exportieren?</p>
          </div>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Schließen">
            <X size={18} weight="bold" />
          </button>
        </div>

        <div className={styles.options}>
          <button className={styles.optionCard} onClick={onExportZeiterfassung}>
            <div className={styles.optionIcon} data-color="blue">
              <ClockCountdown size={28} weight="duotone" />
            </div>
            <div className={styles.optionText}>
              <div className={styles.optionTitle}>Zeiterfassung</div>
              <div className={styles.optionDesc}>Arbeitszeiten, Marktbesuche & Zusatzeinträge</div>
            </div>
            <div className={styles.optionArrow}>›</div>
          </button>

          <button className={styles.optionCard} onClick={onExportDiaeten} disabled>
            <div className={styles.optionIcon} data-color="amber">
              <Receipt size={28} weight="duotone" />
            </div>
            <div className={styles.optionText}>
              <div className={styles.optionTitleRow}>
                <div className={styles.optionTitle}>Diäten</div>
                <span className={styles.comingSoon}>Coming Soon</span>
              </div>
              <div className={styles.optionDesc}>Reisekostenabrechnung nach Kollektivvertrag Wien</div>
            </div>
            <div className={styles.optionArrow}>›</div>
          </button>
        </div>
      </div>
    </div>
  );
};
