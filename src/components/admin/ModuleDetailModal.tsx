import React from 'react';
import { X, PencilSimple, Stack, Question, CheckCircle } from '@phosphor-icons/react';
import styles from './ModuleDetailModal.module.css';

interface Question {
  id: string;
  moduleId: string;
  type: 'text' | 'textarea' | 'multiple_choice' | 'checkbox' | 'rating' | 'yesno' | 'slider' | 'image' | 'open_numeric' | 'dropdown' | 'single_choice' | 'likert' | 'photo_upload' | 'matrix' | 'open_text' | 'barcode_scanner';
  questionText: string;
  required: boolean;
  order: number;
  options?: string[];
}

interface Module {
  id: string;
  name: string;
  description?: string;
  questionCount: number;
  questions: Question[];
  createdAt: string;
}

interface ModuleDetailModalProps {
  module: Module;
  usageCount: number;
  onClose: () => void;
}

export const ModuleDetailModal: React.FC<ModuleDetailModalProps> = ({ 
  module, 
  usageCount,
  onClose 
}) => {
  const getQuestionTypeLabel = (type: Question['type']) => {
    switch (type) {
      case 'text': return 'Kurztext';
      case 'textarea': return 'Langtext';
      case 'multiple_choice': return 'Einfachauswahl';
      case 'checkbox': return 'Mehrfachauswahl';
      case 'rating': return 'Bewertung';
      case 'yesno': return 'Ja/Nein';
      default: return type;
    }
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.modalHeader}>
          <div className={styles.headerLeft}>
            <div className={styles.moduleIcon}>
              <Stack size={24} weight="fill" />
            </div>
            <div className={styles.headerInfo}>
              <h2 className={styles.modalTitle}>{module.name}</h2>
              <span className={styles.questionCount}>
                <Question size={14} weight="fill" />
                {module.questions.length} {module.questions.length === 1 ? 'Frage' : 'Fragen'}
              </span>
            </div>
          </div>
          <button className={styles.closeButton} onClick={onClose}>
            <X size={24} weight="bold" />
          </button>
        </div>

        {/* Content */}
        <div className={styles.modalContent}>
          {module.description && (
            <div className={styles.moduleDescription}>
              {module.description}
            </div>
          )}

          <div className={styles.questionsList}>
            {module.questions.map((question, index) => (
              <div key={question.id} className={styles.questionCard}>
                <div className={styles.questionHeader}>
                  <div className={styles.questionNumber}>
                    {index + 1}
                  </div>
                  <div className={styles.questionMeta}>
                    <span className={styles.questionType}>
                      {getQuestionTypeLabel(question.type)}
                    </span>
                    {question.required && (
                      <span className={styles.requiredBadge}>Pflichtfrage</span>
                    )}
                  </div>
                </div>

                <div className={styles.questionBody}>
                  <p className={styles.questionText}>
                    <Question size={16} weight="fill" />
                    {question.questionText}
                  </p>

                  {question.options && question.options.length > 0 && (
                    <div className={styles.questionOptions}>
                      <span className={styles.optionsLabel}>Antwortmöglichkeiten:</span>
                      <div className={styles.optionsList}>
                        {question.options.map((option, idx) => (
                          <span key={idx} className={styles.optionPill}>
                            {option}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className={styles.modalFooter}>
          <div className={styles.usageInfo}>
            <CheckCircle size={16} weight="fill" />
            <span>Verwendet in {usageCount} {usageCount === 1 ? 'Fragebogen' : 'Fragebögen'}</span>
          </div>
          <div className={styles.footerButtons}>
            <button className={styles.editButton}>
              <PencilSimple size={18} weight="bold" />
              Modul bearbeiten
            </button>
            <button className={styles.secondaryButton} onClick={onClose}>
              Schließen
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

