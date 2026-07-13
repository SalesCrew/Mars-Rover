import React, { useState, useRef, useEffect } from 'react';
import { X, Play, House, Car, Clock, MapPin, Timer, Check, Warning, ArrowRight, Gauge } from '@phosphor-icons/react';
import styles from './DayTrackingModal.module.css';

type ModalMode = 'start' | 'end' | 'force_close' | 'km_pending' | 'close_previous';

interface DayContextInfo {
  date?: string | null;
  startTime?: string | null;
  startKm?: number | string | null;
  lastEntry?: {
    label: string;
    time: string | null;
    date?: string | null;
  } | null;
}

interface DayTrackingModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: ModalMode;
  onStartDay: (skipFahrzeit: boolean, kmStandStart?: string) => void;
  onEndDay: (endTime: string, kmStandEnd?: string, kmStandStart?: string) => void;
  onSubmitKmStand?: (km: string) => void;
  requiresStartKmBeforeEnd?: boolean;
  blockingDate?: string | null;
  dayContext?: DayContextInfo;
  errorMessage?: string | null;
  summary?: {
    totalFahrzeit: string;
    totalBesuchszeit: string;
    marketsVisited: number;
  };
}

// Time Picker Component (reused from ZusatzZeiterfassungModal pattern)
const TimePicker: React.FC<{
  value: string;
  onChange: (time: string) => void;
  onClose: () => void;
}> = ({ value, onChange, onClose }) => {
  const [hours, setHours] = useState(() => {
    if (value) {
      const h = parseInt(value.split(':')[0], 10);
      return Math.max(7, Math.min(21, h));
    }
    const now = new Date();
    return Math.max(7, Math.min(21, now.getHours()));
  });
  const [minutes, setMinutes] = useState(() => {
    if (value) {
      return parseInt(value.split(':')[1], 10) || 0;
    }
    return new Date().getMinutes();
  });
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  const handleNow = () => {
    const now = new Date();
    const h = Math.max(7, Math.min(21, now.getHours()));
    setHours(h);
    setMinutes(now.getMinutes());
  };

  const handleConfirm = () => {
    const timeStr = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    onChange(timeStr);
    onClose();
  };

  return (
    <div ref={pickerRef} className={styles.timePicker}>
      <div className={styles.timePickerDisplay}>
        <span className={styles.timePickerDigit}>{hours.toString().padStart(2, '0')}</span>
        <span className={styles.timePickerColon}>:</span>
        <span className={styles.timePickerDigit}>{minutes.toString().padStart(2, '0')}</span>
      </div>

      <div className={styles.timePickerSlider}>
        <label>Stunden</label>
        <input
          type="range"
          min={7}
          max={21}
          value={hours}
          onChange={(e) => setHours(parseInt(e.target.value, 10))}
          className={styles.timePickerRange}
        />
        <div className={styles.timePickerRangeLabels}>
          <span>7</span>
          <span>21</span>
        </div>
      </div>

      <div className={styles.timePickerSlider}>
        <label>Minuten</label>
        <input
          type="range"
          min={0}
          max={59}
          value={minutes}
          onChange={(e) => setMinutes(parseInt(e.target.value, 10))}
          className={styles.timePickerRange}
        />
        <div className={styles.timePickerRangeLabels}>
          <span>00</span>
          <span>59</span>
        </div>
      </div>

      <div className={styles.timePickerActions}>
        <button type="button" className={styles.timePickerNow} onClick={handleNow}>
          Jetzt
        </button>
        <button type="button" className={styles.timePickerConfirm} onClick={handleConfirm}>
          OK
        </button>
      </div>
    </div>
  );
};

// Format time input with auto-colon
const formatTimeInput = (value: string): string => {
  const digits = value.replace(/\D/g, '');
  if (digits.length <= 2) {
    return digits;
  }
  return `${digits.slice(0, 2)}:${digits.slice(2, 4)}`;
};

const formatDateLabel = (value?: string | null): string => {
  if (!value) return '';
  const [year, month, day] = value.split('-');
  if (!year || !month || !day) return value;
  return `${day}.${month}.${year}`;
};

const formatTimeLabel = (value?: string | null): string => {
  if (!value) return '';
  return String(value).slice(0, 5);
};

const formatKmLabel = (value?: number | string | null): string => {
  if (value === undefined || value === null || value === '') return '';
  const parsed = Number(value);
  return Number.isFinite(parsed) ? `${Math.round(parsed).toLocaleString('de-AT')} km` : `${value} km`;
};

export const DayTrackingModal: React.FC<DayTrackingModalProps> = ({
  isOpen,
  onClose,
  mode,
  onStartDay,
  onEndDay,
  onSubmitKmStand,
  requiresStartKmBeforeEnd = false,
  blockingDate,
  dayContext,
  errorMessage,
  summary,
}) => {
  const [endTime, setEndTime] = useState('');
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [currentTime, setCurrentTime] = useState('');
  const [endStep, setEndStep] = useState<'confirm' | 'manual'>('confirm');
  const [startStep, setStartStep] = useState<'options' | 'km'>('options');
  const [endStartKmStep, setEndStartKmStep] = useState(false);
  const [endKmStep, setEndKmStep] = useState(false);
  const [pendingSkipFahrzeit, setPendingSkipFahrzeit] = useState(false);
  const [pendingEndTime, setPendingEndTime] = useState('');
  const [pendingStartKm, setPendingStartKm] = useState('');
  const [kmStand, setKmStand] = useState('');
  const kmInputRef = useRef<HTMLInputElement>(null);

  // Update current time every second
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setKmStand('');
      setStartStep('options');
      setEndStartKmStep(false);
      setEndKmStep(false);
      setPendingSkipFahrzeit(false);
      setPendingEndTime('');
      setPendingStartKm('');
      if (mode === 'end' || mode === 'force_close' || mode === 'close_previous') {
        const now = new Date();
        setEndTime(
          `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`
        );
        if (mode === 'end') {
          setEndStep('confirm');
        }
      }
    }
  }, [isOpen, mode]);

  useEffect(() => {
    if ((startStep === 'km' || endStartKmStep || endKmStep) && kmInputRef.current) {
      kmInputRef.current.focus();
    }
  }, [startStep, endStartKmStep, endKmStep]);

  if (!isOpen) return null;

  const handleStartOptionClick = (skipFahrzeit: boolean) => {
    setPendingSkipFahrzeit(skipFahrzeit);
    setKmStand('');
    setStartStep('km');
  };

  const handleStartConfirmKm = () => {
    onStartDay(pendingSkipFahrzeit, kmStand || undefined);
  };

  const handleEndTimeConfirmed = (time: string) => {
    setPendingEndTime(time);
    setKmStand('');
    if (requiresStartKmBeforeEnd) {
      setEndStartKmStep(true);
    } else {
      setEndKmStep(true);
    }
  };

  const handleEndConfirmStartKm = () => {
    setPendingStartKm(kmStand);
    setKmStand('');
    setEndStartKmStep(false);
    setEndKmStep(true);
  };

  const handleEndConfirmKm = () => {
    onEndDay(pendingEndTime, kmStand || undefined, pendingStartKm || undefined);
  };

  const handleEndDay = () => {
    if (endTime) {
      handleEndTimeConfirmed(endTime);
    }
  };

  const handleKmInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setKmStand(e.target.value.replace(/[^0-9.,]/g, ''));
  };

  const handleTimeInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEndTime(formatTimeInput(e.target.value));
  };

  const canClose = mode !== 'force_close' && mode !== 'close_previous';
  const isEndTimeValid = endTime.match(/^\d{2}:\d{2}$/);
  const dayDateLabel = formatDateLabel(dayContext?.date || blockingDate || null);
  const dayStartTimeLabel = formatTimeLabel(dayContext?.startTime);
  const dayStartKmLabel = formatKmLabel(dayContext?.startKm);
  const lastEntryLabel = dayContext?.lastEntry?.label;
  const lastEntryTimeLabel = formatTimeLabel(dayContext?.lastEntry?.time);

  const renderDayInfoCard = () => {
    if (!dayContext && !blockingDate) return null;

    return (
      <div className={styles.dayInfoCard}>
        <div className={styles.dayInfoHeader}>
          <span>Offener Tag</span>
          {dayDateLabel && <strong>{dayDateLabel}</strong>}
        </div>
        <div className={styles.dayInfoGrid}>
          {dayStartTimeLabel && (
            <div className={styles.dayInfoItem}>
              <span>Gestartet</span>
              <strong>{dayStartTimeLabel}</strong>
            </div>
          )}
          {dayStartKmLabel && (
            <div className={styles.dayInfoItem}>
              <span>Start-KM</span>
              <strong>{dayStartKmLabel}</strong>
            </div>
          )}
          {(lastEntryLabel || lastEntryTimeLabel || dayStartTimeLabel) && (
            <div className={`${styles.dayInfoItem} ${styles.dayInfoItemWide}`}>
              <span>Letzter Eintrag</span>
              <strong>
                {lastEntryLabel || 'Tag gestartet'}
                {(lastEntryTimeLabel || dayStartTimeLabel) && ` um ${lastEntryTimeLabel || dayStartTimeLabel}`}
              </strong>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderStartKmBeforeEndStep = () => (
    <div className={styles.kmStandSection}>
      <div className={styles.kmStandIcon}>
        <Gauge size={40} weight="duotone" />
      </div>
      <span className={styles.kmStandTitle}>Start-KM nachtragen</span>
      <span className={styles.kmStandDesc}>
        {blockingDate
          ? `Der Tag vom ${blockingDate} kann erst mit Start-KM abgeschlossen werden.`
          : 'Der Tag kann erst mit Start-KM abgeschlossen werden.'}
      </span>
      <input
        ref={kmInputRef}
        type="text"
        inputMode="decimal"
        className={styles.kmStandInput}
        value={kmStand}
        onChange={handleKmInputChange}
        placeholder="z.B. 45320"
      />
      <button className={styles.kmStandConfirm} onClick={handleEndConfirmStartKm} disabled={!kmStand}>
        <Check size={18} weight="bold" />
        Weiter
      </button>
    </div>
  );

  const renderEndKmStep = (description: string, buttonText: string) => (
    <div className={styles.kmStandSection}>
      <div className={styles.kmStandIconEnd}>
        <Gauge size={40} weight="duotone" />
      </div>
      <span className={styles.kmStandTitle}>End-KM eingeben</span>
      <span className={styles.kmStandDesc}>{description}</span>
      {renderDayInfoCard()}
      <input
        ref={kmInputRef}
        type="text"
        inputMode="decimal"
        className={styles.kmStandInput}
        value={kmStand}
        onChange={handleKmInputChange}
        placeholder="z.B. 45480"
      />
      <button className={styles.kmStandConfirmEnd} onClick={handleEndConfirmKm} disabled={!kmStand}>
        <Check size={18} weight="bold" />
        {buttonText}
      </button>
    </div>
  );

  return (
    <div className={styles.overlay}>
      <div className={`${styles.modal} ${mode === 'force_close' || mode === 'close_previous' ? styles.forceClose : ''}`}>
        {/* Header */}
        <div className={styles.header}>
          <h2 className={styles.title}>
            {mode === 'start' && 'Tag starten'}
            {mode === 'end' && 'Tag beenden'}
            {mode === 'force_close' && 'Zeiterfassung beenden'}
            {mode === 'km_pending' && 'KM-Stand nachtragen'}
            {mode === 'close_previous' && 'Offenen Tag abschliessen'}
          </h2>
          {canClose && (
            <button className={styles.closeButton} onClick={onClose} aria-label="Schließen">
              <X size={24} weight="bold" />
            </button>
          )}
        </div>

        {/* Content */}
        <div className={styles.content}>
          {errorMessage && (
            <div className={styles.errorMessage}>
              {errorMessage}
            </div>
          )}

          {/* Start Mode */}
          {mode === 'start' && (
            <>
              {startStep === 'options' && (
                <>
                  <div className={styles.currentTimeDisplay}>
                    <Clock size={32} weight="regular" />
                    <span className={styles.currentTimeValue}>{currentTime}</span>
                    <span className={styles.currentTimeLabel}>Aktuelle Uhrzeit</span>
                  </div>

                  <div className={styles.startOptions}>
                    <button className={styles.startOptionCard} onClick={() => handleStartOptionClick(false)}>
                      <div className={styles.startOptionIcon}>
                        <Car size={32} weight="fill" />
                      </div>
                      <div className={styles.startOptionText}>
                        <span className={styles.startOptionTitle}>Fahrt beginnen</span>
                        <span className={styles.startOptionDesc}>Ich fahre jetzt zum ersten Markt</span>
                      </div>
                      <Play size={24} weight="fill" className={styles.startOptionArrow} />
                    </button>

                    <button className={styles.startOptionCard} onClick={() => handleStartOptionClick(true)}>
                      <div className={styles.startOptionIcon}>
                        <MapPin size={32} weight="fill" />
                      </div>
                      <div className={styles.startOptionText}>
                        <span className={styles.startOptionTitle}>Ich bin schon beim Markt</span>
                        <span className={styles.startOptionDesc}>Keine Fahrzeit für den ersten Markt</span>
                      </div>
                      <ArrowRight size={24} weight="bold" className={styles.startOptionArrow} />
                    </button>
                  </div>
                </>
              )}

              {startStep === 'km' && (
                <div className={styles.kmStandSection}>
                  <div className={styles.kmStandIcon}>
                    <Gauge size={40} weight="duotone" />
                  </div>
                  <span className={styles.kmStandTitle}>KM-Stand eingeben</span>
                  <span className={styles.kmStandDesc}>Aktueller Kilometerstand deines Fahrzeugs</span>
                  <input
                    ref={kmInputRef}
                    type="text"
                    inputMode="decimal"
                    className={styles.kmStandInput}
                    value={kmStand}
                    onChange={handleKmInputChange}
                    placeholder="z.B. 45320"
                  />
                  <button className={styles.kmStandConfirm} onClick={handleStartConfirmKm} disabled={!kmStand}>
                    <Check size={18} weight="bold" />
                    Bestätigen
                  </button>
                  <button
                    className={styles.kmStandSkip}
                    onClick={() => onStartDay(pendingSkipFahrzeit, undefined)}
                  >
                    Noch nicht beim Auto
                  </button>
                </div>
              )}
            </>
          )}

          {/* End Mode */}
          {mode === 'end' && (
            <>
              {endStartKmStep ? renderStartKmBeforeEndStep() : endKmStep ? (
                renderEndKmStep('Aktueller Kilometerstand nach der Heimfahrt', 'Tag beenden')
              ) : (
                <>
                  {renderDayInfoCard()}

                  {/* Step 1: Confirm current time */}
                  {endStep === 'confirm' && (
                    <>
                      <div className={styles.currentTimeDisplay}>
                        <Clock size={32} weight="regular" />
                        <span className={styles.currentTimeValue}>{currentTime}</span>
                        <span className={styles.currentTimeLabel}>Ist das die richtige Uhrzeit?</span>
                      </div>

                      <div className={styles.confirmButtons}>
                        <button 
                          className={styles.confirmYesButton}
                          onClick={() => handleEndTimeConfirmed(currentTime)}
                        >
                          <Check size={20} weight="bold" />
                          Ja, Tag beenden
                        </button>
                        <button 
                          className={styles.confirmNoButton}
                          onClick={() => setEndStep('manual')}
                        >
                          Nein, Zeit anpassen
                        </button>
                      </div>
                    </>
                  )}

                  {/* Step 2: Manual time entry */}
                  {endStep === 'manual' && (
                    <>
                      {summary && (
                        <div className={styles.summaryCards}>
                          <div className={styles.summaryCard}>
                            <Car size={24} weight="fill" />
                            <span className={styles.summaryValue}>{summary.totalFahrzeit || '0:00'}</span>
                            <span className={styles.summaryLabel}>Fahrzeit</span>
                          </div>
                          <div className={styles.summaryCard}>
                            <Timer size={24} weight="fill" />
                            <span className={styles.summaryValue}>{summary.totalBesuchszeit || '0:00'}</span>
                            <span className={styles.summaryLabel}>Besuchszeit</span>
                          </div>
                          <div className={styles.summaryCard}>
                            <MapPin size={24} weight="fill" />
                            <span className={styles.summaryValue}>{summary.marketsVisited || 0}</span>
                            <span className={styles.summaryLabel}>Märkte</span>
                          </div>
                        </div>
                      )}

                      <div className={styles.endTimeSection}>
                        <div className={styles.endTimeHeader}>
                          <House size={24} weight="fill" />
                          <span>Ankunftszeit Zuhause</span>
                        </div>

                        <div className={styles.timeInputWrapper}>
                          <input
                            type="text"
                            className={styles.timeInput}
                            value={endTime}
                            onChange={handleTimeInputChange}
                            placeholder="HH:MM"
                            maxLength={5}
                          />
                          <button
                            type="button"
                            className={styles.clockButton}
                            onClick={() => setShowTimePicker(!showTimePicker)}
                            aria-label="Zeit auswählen"
                          >
                            <Clock size={20} weight="regular" />
                          </button>
                          {showTimePicker && (
                            <TimePicker
                              value={endTime}
                              onChange={setEndTime}
                              onClose={() => setShowTimePicker(false)}
                            />
                          )}
                        </div>
                      </div>

                      <button
                        className={styles.endButton}
                        onClick={handleEndDay}
                        disabled={!isEndTimeValid}
                      >
                        <House size={20} weight="fill" />
                        Zuhause angekommen
                      </button>
                    </>
                  )}
                </>
              )}
            </>
          )}

          {/* Force Close Mode */}
          {(mode === 'force_close' || mode === 'close_previous') && (
            <>
              {endStartKmStep ? renderStartKmBeforeEndStep() : endKmStep ? (
                <div className={styles.kmStandSection}>
                  <div className={styles.kmStandIconEnd}>
                    <Gauge size={40} weight="duotone" />
                  </div>
                  <span className={styles.kmStandTitle}>KM-Stand eingeben</span>
                  <span className={styles.kmStandDesc}>Kilometerstand bei Ankunft zuhause</span>
                  <input
                    ref={kmInputRef}
                    type="text"
                    inputMode="decimal"
                    className={styles.kmStandInput}
                    value={kmStand}
                    onChange={handleKmInputChange}
                    placeholder="z.B. 45480"
                  />
                  <button className={styles.kmStandConfirmEnd} onClick={handleEndConfirmKm} disabled={!kmStand}>
                    <Check size={18} weight="bold" />
                    Bestätigen
                  </button>
                </div>
              ) : (
                <>
                  <div className={styles.forceCloseWarning}>
                    <Warning size={48} weight="fill" />
                    <p>
                      Es schaut so aus als hättest du vergessen deine Zeit zu beenden.
                      Bitte gib hier deine korrekte Ankunftszeit zuhause an.
                    </p>
                  </div>

                  {renderDayInfoCard()}

                  <div className={styles.endTimeSection}>
                    <div className={styles.endTimeHeader}>
                      <House size={24} weight="fill" />
                      <span>Ankunftszeit Zuhause</span>
                    </div>

                    <div className={styles.timeInputWrapper}>
                      <input
                        type="text"
                        className={styles.timeInput}
                        value={endTime}
                        onChange={handleTimeInputChange}
                        placeholder="HH:MM"
                        maxLength={5}
                      />
                      <button
                        type="button"
                        className={styles.clockButton}
                        onClick={() => setShowTimePicker(!showTimePicker)}
                        aria-label="Zeit auswählen"
                      >
                        <Clock size={20} weight="regular" />
                      </button>
                      {showTimePicker && (
                        <TimePicker
                          value={endTime}
                          onChange={setEndTime}
                          onClose={() => setShowTimePicker(false)}
                        />
                      )}
                    </div>
                  </div>

                  <button
                    className={styles.confirmButton}
                    onClick={handleEndDay}
                    disabled={!isEndTimeValid}
                  >
                    <Check size={20} weight="bold" />
                    Bestätigen
                  </button>
                </>
              )}
            </>
          )}
          {/* KM Pending Mode - reminder to enter missed KM stand */}
          {mode === 'km_pending' && (
            <div className={styles.kmStandSection}>
              <div className={styles.kmStandIcon}>
                <Gauge size={40} weight="duotone" />
              </div>
              <span className={styles.kmStandTitle}>KM-Stand nachtragen</span>
              <span className={styles.kmStandDesc}>Du hast den KM-Stand heute noch nicht eingetragen. Bitte hole das jetzt nach.</span>
              <input
                ref={kmInputRef}
                type="text"
                inputMode="decimal"
                className={styles.kmStandInput}
                value={kmStand}
                onChange={handleKmInputChange}
                placeholder="z.B. 45320"
              />
              <button
                className={styles.kmStandConfirm}
                onClick={() => onSubmitKmStand && onSubmitKmStand(kmStand)}
                disabled={!kmStand}
              >
                <Check size={18} weight="bold" />
                Bestätigen
              </button>
              <button className={styles.kmStandSkip} onClick={onClose}>
                Noch nicht beim Auto
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
