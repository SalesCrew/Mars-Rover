import React, { useState } from 'react';
import { X, ClockCountdown, Receipt, CaretDown, ArrowLeft, DownloadSimple } from '@phosphor-icons/react';
import styles from './ZeiterfassungExportModal.module.css';

interface ZeiterfassungExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExportZeiterfassung: () => void;
  onExportDiaeten: (month: number, year: number) => void;
}

const MONTHS = [
  'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
  'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'
];

export const ZeiterfassungExportModal: React.FC<ZeiterfassungExportModalProps> = ({
  isOpen,
  onClose,
  onExportZeiterfassung,
  onExportDiaeten,
}) => {
  const now = new Date();
  const [step, setStep] = useState<'choose' | 'diaeten'>('choose');
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth());
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [showMonthDropdown, setShowMonthDropdown] = useState(false);
  const [showYearDropdown, setShowYearDropdown] = useState(false);

  if (!isOpen) return null;

  const handleClose = () => {
    setStep('choose');
    setShowMonthDropdown(false);
    setShowYearDropdown(false);
    onClose();
  };

  const handleDiaetenExport = () => {
    onExportDiaeten(selectedMonth, selectedYear);
    setStep('choose');
  };

  const years = [now.getFullYear() - 1, now.getFullYear()];

  return (
    <div className={styles.overlay} onClick={handleClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <div className={styles.headerText}>
            {step === 'choose' ? (
              <>
                <h2 className={styles.title}>Export</h2>
                <p className={styles.subtitle}>Was möchtest du exportieren?</p>
              </>
            ) : (
              <>
                <h2 className={styles.title}>Diäten Export</h2>
                <p className={styles.subtitle}>Abrechnungszeitraum auswählen</p>
              </>
            )}
          </div>
          <button className={styles.closeBtn} onClick={handleClose} aria-label="Schließen">
            <X size={18} weight="bold" />
          </button>
        </div>

        {step === 'choose' ? (
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

            <button className={styles.optionCard} onClick={() => setStep('diaeten')}>
              <div className={styles.optionIcon} data-color="amber">
                <Receipt size={28} weight="duotone" />
              </div>
              <div className={styles.optionText}>
                <div className={styles.optionTitle}>Diäten</div>
                <div className={styles.optionDesc}>Reisekostenabrechnung nach Kollektivvertrag Wien</div>
              </div>
              <div className={styles.optionArrow}>›</div>
            </button>
          </div>
        ) : (
          <div className={styles.diaetenStep}>
            <button className={styles.backBtn} onClick={() => { setStep('choose'); setShowMonthDropdown(false); setShowYearDropdown(false); }}>
              <ArrowLeft size={16} weight="bold" />
              <span>Zurück</span>
            </button>

            <div className={styles.pickerRow}>
              {/* Month picker */}
              <div className={styles.pickerField}>
                <label className={styles.pickerLabel}>Monat</label>
                <button
                  className={styles.pickerSelect}
                  onClick={() => { setShowMonthDropdown(!showMonthDropdown); setShowYearDropdown(false); }}
                >
                  <span>{MONTHS[selectedMonth]}</span>
                  <CaretDown size={14} weight="bold" />
                </button>
                {showMonthDropdown && (
                  <div className={styles.pickerDropdown}>
                    {MONTHS.map((m, i) => (
                      <button
                        key={i}
                        className={`${styles.pickerOption} ${i === selectedMonth ? styles.pickerOptionActive : ''}`}
                        onClick={() => { setSelectedMonth(i); setShowMonthDropdown(false); }}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Year picker */}
              <div className={styles.pickerField}>
                <label className={styles.pickerLabel}>Jahr</label>
                <button
                  className={styles.pickerSelect}
                  onClick={() => { setShowYearDropdown(!showYearDropdown); setShowMonthDropdown(false); }}
                >
                  <span>{selectedYear}</span>
                  <CaretDown size={14} weight="bold" />
                </button>
                {showYearDropdown && (
                  <div className={styles.pickerDropdown}>
                    {years.map(y => (
                      <button
                        key={y}
                        className={`${styles.pickerOption} ${y === selectedYear ? styles.pickerOptionActive : ''}`}
                        onClick={() => { setSelectedYear(y); setShowYearDropdown(false); }}
                      >
                        {y}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className={styles.pickerPreview}>
              {MONTHS[selectedMonth]} {selectedYear}
            </div>

            <button className={styles.exportBtn} onClick={handleDiaetenExport}>
              <DownloadSimple size={18} weight="bold" />
              <span>Exportieren</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
