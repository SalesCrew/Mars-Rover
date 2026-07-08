import React, { useMemo, useState } from 'react';
import { X, CheckSquare, Square, DownloadSimple } from '@phosphor-icons/react';
import styles from './FragebogenDistributionExportModal.module.css';

export interface DistributionQuestionOption {
  id: string;
  label: string;
  distributionsziel?: boolean;
  qualitaetsziel?: boolean;
}

export interface DistributionFragebogenOption {
  id: string;
  name: string;
  yesnoQuestions: DistributionQuestionOption[];
  availableChains: string[];
}

interface DistributionExportSelection {
  fragebogenIds: string[];
  questionIds: string[];
  chains: string[];
  targetFilter: 'all' | 'distribution' | 'quality';
  quarterCompression?: {
    enabled: boolean;
    year: number;
    quarter: 1 | 2 | 3 | 4;
  };
}

interface FragebogenDistributionExportModalProps {
  isOpen: boolean;
  isExporting: boolean;
  isLoadingItems?: boolean;
  fragebogenOptions: DistributionFragebogenOption[];
  onClose: () => void;
  onExport: (selection: DistributionExportSelection) => Promise<void>;
}

export const FragebogenDistributionExportModal: React.FC<FragebogenDistributionExportModalProps> = ({
  isOpen,
  isExporting,
  isLoadingItems = false,
  fragebogenOptions,
  onClose,
  onExport
}) => {
  const getDefaultTargetQuarter = (): { year: number; quarter: 1 | 2 | 3 | 4 } => {
    const now = new Date();
    const currentQuarter = Math.floor(now.getMonth() / 3) + 1;
    if (currentQuarter === 1) {
      return { year: now.getFullYear() - 1, quarter: 4 };
    }
    return { year: now.getFullYear(), quarter: (currentQuarter - 1) as 1 | 2 | 3 | 4 };
  };

  const defaultTargetQuarter = useMemo(() => getDefaultTargetQuarter(), []);
  const availableQuarterYears = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return [currentYear - 1, currentYear, currentYear + 1];
  }, []);

  const [selectedFragebogenIds, setSelectedFragebogenIds] = useState<string[]>([]);
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<string[]>([]);
  const [selectedChains, setSelectedChains] = useState<string[]>([]);
  const [targetFilter, setTargetFilter] = useState<'all' | 'distribution' | 'quality'>('all');
  const [compressToQuarter, setCompressToQuarter] = useState(false);
  const [targetQuarterYear, setTargetQuarterYear] = useState(defaultTargetQuarter.year);
  const [targetQuarter, setTargetQuarter] = useState<1 | 2 | 3 | 4>(defaultTargetQuarter.quarter);
  const [error, setError] = useState<string | null>(null);

  const selectedFragebogen = useMemo(
    () => fragebogenOptions.filter(f => selectedFragebogenIds.includes(f.id)),
    [fragebogenOptions, selectedFragebogenIds]
  );

  const availableQuestions = useMemo(() => {
    const map = new Map<string, DistributionQuestionOption>();
    selectedFragebogen.forEach(f => {
      f.yesnoQuestions.forEach(q => {
        if (!map.has(q.id)) map.set(q.id, q);
      });
    });
    const questions = Array.from(map.values());
    if (targetFilter === 'distribution') {
      return questions.filter(q => q.distributionsziel === true);
    }
    if (targetFilter === 'quality') {
      return questions.filter(q => q.qualitaetsziel === true);
    }
    return questions;
  }, [selectedFragebogen, targetFilter]);

  const availableChains = useMemo(() => {
    const set = new Set<string>();
    selectedFragebogen.forEach(f => f.availableChains.forEach(c => set.add(c)));
    return Array.from(set.values()).sort((a, b) => a.localeCompare(b, 'de'));
  }, [selectedFragebogen]);

  const allQuestionsSelected = availableQuestions.length > 0
    && availableQuestions.every(q => selectedQuestionIds.includes(q.id));
  const allChainsSelected = availableChains.length > 0
    && availableChains.every(chain => selectedChains.includes(chain));

  const toggleFragebogen = (id: string) => {
    setError(null);
    setSelectedFragebogenIds(prev => {
      const next = prev.includes(id) ? prev.filter(v => v !== id) : [...prev, id];
      return next;
    });
  };

  const toggleQuestion = (id: string) => {
    setError(null);
    setSelectedQuestionIds(prev => (prev.includes(id) ? prev.filter(v => v !== id) : [...prev, id]));
  };

  const toggleChain = (chain: string) => {
    setError(null);
    setSelectedChains(prev => (prev.includes(chain) ? prev.filter(v => v !== chain) : [...prev, chain]));
  };

  const handleSelectAllQuestions = () => {
    setError(null);
    if (allQuestionsSelected) {
      setSelectedQuestionIds(prev => prev.filter(id => !availableQuestions.some(q => q.id === id)));
      return;
    }
    setSelectedQuestionIds(prev => {
      const merged = new Set(prev);
      availableQuestions.forEach(q => merged.add(q.id));
      return Array.from(merged.values());
    });
  };

  const handleSelectAllChains = () => {
    setError(null);
    if (allChainsSelected) {
      setSelectedChains(prev => prev.filter(c => !availableChains.includes(c)));
      return;
    }
    setSelectedChains(prev => {
      const merged = new Set(prev);
      availableChains.forEach(c => merged.add(c));
      return Array.from(merged.values());
    });
  };

  const handleExport = async () => {
    if (selectedFragebogenIds.length === 0) {
      setError('Bitte mindestens einen Fragebogen auswählen.');
      return;
    }

    const validQuestionIds = selectedQuestionIds.filter(id => availableQuestions.some(q => q.id === id));
    if (validQuestionIds.length === 0) {
      setError('Bitte mindestens ein Ja/Nein-Item auswählen.');
      return;
    }

    const validChains = selectedChains.filter(chain => availableChains.includes(chain));

    setError(null);
    await onExport({
      fragebogenIds: selectedFragebogenIds,
      questionIds: validQuestionIds,
      chains: validChains,
      targetFilter,
      quarterCompression: {
        enabled: compressToQuarter,
        year: targetQuarterYear,
        quarter: targetQuarter
      }
    });
  };

  React.useEffect(() => {
    const availableQuestionSet = new Set(availableQuestions.map(q => q.id));
    setSelectedQuestionIds(prev => prev.filter(id => availableQuestionSet.has(id)));

    const availableChainSet = new Set(availableChains);
    setSelectedChains(prev => prev.filter(c => availableChainSet.has(c)));
  }, [availableQuestions, availableChains]);

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={styles.title}>Fragebogen Distribution Export</h2>
          <button type="button" className={styles.closeButton} onClick={onClose} disabled={isExporting}>
            <X size={20} weight="bold" />
          </button>
        </div>

        <div className={styles.body}>
          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <h3>Fragebögen</h3>
            </div>
            <div className={styles.checkList}>
              {fragebogenOptions.length === 0 ? (
                <div className={styles.emptyState}>Keine Fragebögen verfügbar.</div>
              ) : fragebogenOptions.map(option => (
                <label key={option.id} className={styles.checkItem}>
                  <input
                    type="checkbox"
                    checked={selectedFragebogenIds.includes(option.id)}
                    onChange={() => toggleFragebogen(option.id)}
                    disabled={isExporting}
                  />
                  <span>{option.name}</span>
                </label>
              ))}
            </div>
          </section>

          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <h3>Ja/Nein Items</h3>
              <button
                type="button"
                className={styles.toggleAllButton}
                onClick={handleSelectAllQuestions}
                disabled={isExporting || availableQuestions.length === 0}
              >
                {allQuestionsSelected ? <CheckSquare size={16} weight="fill" /> : <Square size={16} weight="regular" />}
                {allQuestionsSelected ? 'Alle abwählen' : 'Alle auswählen'}
              </button>
            </div>
            <div className={styles.targetFilter}>
              <button
                type="button"
                className={`${styles.targetFilterButton} ${targetFilter === 'all' ? styles.targetFilterButtonActive : ''}`}
                onClick={() => setTargetFilter('all')}
                disabled={isExporting}
              >
                Alle
              </button>
              <button
                type="button"
                className={`${styles.targetFilterButton} ${targetFilter === 'distribution' ? styles.targetFilterButtonActive : ''}`}
                onClick={() => setTargetFilter('distribution')}
                disabled={isExporting}
              >
                Distributionsziel
              </button>
              <button
                type="button"
                className={`${styles.targetFilterButton} ${targetFilter === 'quality' ? styles.targetFilterButtonActive : ''}`}
                onClick={() => setTargetFilter('quality')}
                disabled={isExporting}
              >
                Qualitätsziel
              </button>
            </div>
            <div className={styles.checkList}>
              {availableQuestions.length === 0 ? (
                <div className={styles.emptyState}>
                  {selectedFragebogenIds.length === 0
                    ? 'Bitte zuerst Fragebogen auswählen.'
                    : isLoadingItems
                      ? 'Lade Ja/Nein-Items…'
                      : 'Keine Ja/Nein-Items in der Auswahl gefunden.'}
                </div>
              ) : availableQuestions.map(question => (
                <label key={question.id} className={styles.checkItem}>
                  <input
                    type="checkbox"
                    checked={selectedQuestionIds.includes(question.id)}
                    onChange={() => toggleQuestion(question.id)}
                    disabled={isExporting}
                  />
                  <span>{question.label}</span>
                </label>
              ))}
            </div>
          </section>

          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <h3>Handelsketten (optional)</h3>
              <button
                type="button"
                className={styles.toggleAllButton}
                onClick={handleSelectAllChains}
                disabled={isExporting || availableChains.length === 0}
              >
                {allChainsSelected ? <CheckSquare size={16} weight="fill" /> : <Square size={16} weight="regular" />}
                {allChainsSelected ? 'Alle abwählen' : 'Alle auswählen'}
              </button>
            </div>
            <div className={styles.checkList}>
              {availableChains.length === 0 ? (
                <div className={styles.emptyState}>Keine Ketten für die Auswahl gefunden.</div>
              ) : availableChains.map(chain => (
                <label key={chain} className={styles.checkItem}>
                  <input
                    type="checkbox"
                    checked={selectedChains.includes(chain)}
                    onChange={() => toggleChain(chain)}
                    disabled={isExporting}
                  />
                  <span>{chain}</span>
                </label>
              ))}
            </div>
          </section>

          <section className={`${styles.section} ${styles.optionsSection}`}>
            <div className={styles.sectionHeader}>
              <h3>Zeitraum</h3>
            </div>
            <div className={styles.optionBody}>
              <label className={styles.optionToggle}>
                <input
                  type="checkbox"
                  checked={compressToQuarter}
                  onChange={(event) => setCompressToQuarter(event.target.checked)}
                  disabled={isExporting}
                />
                <span>Alles in ein Quartal komprimieren</span>
              </label>

              {compressToQuarter && (
                <div className={styles.quarterControls}>
                  <label className={styles.selectField}>
                    <span>Quartal</span>
                    <select
                      value={targetQuarter}
                      onChange={(event) => setTargetQuarter(Number(event.target.value) as 1 | 2 | 3 | 4)}
                      disabled={isExporting}
                    >
                      <option value={1}>Q1</option>
                      <option value={2}>Q2</option>
                      <option value={3}>Q3</option>
                      <option value={4}>Q4</option>
                    </select>
                  </label>
                  <label className={styles.selectField}>
                    <span>Jahr</span>
                    <select
                      value={targetQuarterYear}
                      onChange={(event) => setTargetQuarterYear(Number(event.target.value))}
                      disabled={isExporting}
                    >
                      {availableQuarterYears.map(year => (
                        <option key={year} value={year}>{year}</option>
                      ))}
                    </select>
                  </label>
                </div>
              )}
            </div>
          </section>
        </div>

        {error && <div className={styles.errorBanner}>{error}</div>}

        <div className={styles.footer}>
          <button type="button" className={styles.cancelButton} onClick={onClose} disabled={isExporting}>
            Abbrechen
          </button>
          <button type="button" className={styles.exportButton} onClick={handleExport} disabled={isExporting}>
            <DownloadSimple size={16} weight="bold" />
            {isExporting ? 'Exportiere…' : 'Exportieren'}
          </button>
        </div>
      </div>
    </div>
  );
};

