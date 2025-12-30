import React, { useState } from 'react';
import { TrendUp, Clock, XCircle, Stack, PencilSimple, Calendar, Users, CheckCircle as CheckCircleFilled, Question } from '@phosphor-icons/react';
import { FragebogenDetailModal } from './FragebogenDetailModal';
import { ModuleDetailModal } from './ModuleDetailModal';
import { CreateModuleModal } from './CreateModuleModal';
import { CreateFragebogenModal } from './CreateFragebogenModal';
import { adminMarkets } from '../../data/adminMarketsData';
import styles from './FragebogenPage.module.css';

export type QuestionType = 
  | 'single_choice'      // Single Choice
  | 'yesno'              // Dichotomes Ja/Nein
  | 'likert'             // Likert-Skala (Sehr schlecht bis Sehr gut)
  | 'multiple_choice'    // Multiple Choice
  | 'photo_upload'       // Foto hochladen
  | 'matrix'             // Matrix (Fragezeilen mit Antwortspalten)
  | 'open_text'          // Offene Frage
  | 'open_numeric'       // Offene Frage numerisch
  | 'slider'             // Slider für Anteile
  | 'barcode_scanner';   // Barcode/QR-Code Scanner

export interface QuestionInterface {
  id: string;
  moduleId: string;
  type: QuestionType;
  questionText: string;
  instruction?: string;  // For photo_upload
  required: boolean;
  order: number;
  
  // For single/multiple choice, likert
  options?: string[];
  
  // For likert scale
  likertScale?: {
    min: number;
    max: number;
    minLabel: string;
    maxLabel: string;
  };
  
  // For matrix
  matrixRows?: string[];
  matrixColumns?: string[];
  
  // For numeric
  numericConstraints?: {
    min?: number;
    max?: number;
    decimals?: boolean;
  };
  
  // For slider
  sliderConfig?: {
    min: number;
    max: number;
    step: number;
    unit?: string;
  };
  
  // Conditional logic
  conditions?: QuestionCondition[];
}

export interface QuestionCondition {
  id: string;
  triggerQuestionId: string;  // Which question's answer triggers this
  triggerAnswer: string | number;  // What answer triggers this
  operator?: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'between' | 'contains';  // Comparison operator
  triggerAnswerMax?: number;  // For 'between' operator
  action: 'hide' | 'show';  // What to do
  targetQuestionIds: string[];  // Which questions to affect
}

export interface Module {
  id: string;
  name: string;
  description?: string;
  questionCount: number;
  questions: QuestionInterface[];
  createdAt: string;
}

interface Fragebogen {
  id: string;
  name: string;
  description?: string;
  startDate: string;
  endDate: string;
  status: 'active' | 'scheduled' | 'inactive';
  moduleIds: string[];
  marketIds: string[]; // Array of selected market IDs
  assignedGLCount: number;
  responseCount: number;
  createdAt: string;
}

interface FragebogenPageProps {
  isCreateModuleModalOpen: boolean;
  onCloseCreateModuleModal: () => void;
  isCreateFragebogenModalOpen: boolean;
  onCloseCreateFragebogenModal: () => void;
}

export const FragebogenPage: React.FC<FragebogenPageProps> = ({
  isCreateModuleModalOpen,
  onCloseCreateModuleModal,
  isCreateFragebogenModalOpen,
  onCloseCreateFragebogenModal
}) => {
  // Mock modules data
  const [modules, setModules] = useState<Module[]>([
    {
      id: 'm1',
      name: 'Kundenzufriedenheit',
      description: 'Fragen zur allgemeinen Kundenzufriedenheit',
      questionCount: 5,
      questions: [
        { id: 'q1', moduleId: 'm1', type: 'likert', questionText: 'Wie zufrieden sind Sie mit unserem Service?', required: true, order: 1, likertScale: { min: 1, max: 5, minLabel: 'Sehr unzufrieden', maxLabel: 'Sehr zufrieden' } },
        { id: 'q2', moduleId: 'm1', type: 'open_text', questionText: 'Was können wir verbessern?', required: false, order: 2 },
        { id: 'q3', moduleId: 'm1', type: 'yesno', questionText: 'Würden Sie uns weiterempfehlen?', required: true, order: 3 },
        { id: 'q4', moduleId: 'm1', type: 'single_choice', questionText: 'Wie haben Sie von uns erfahren?', required: true, order: 4, options: ['Internet', 'Empfehlung', 'Werbung', 'Sonstiges'] },
        { id: 'q5', moduleId: 'm1', type: 'open_text', questionText: 'Ihr wichtigster Verbesserungsvorschlag?', required: false, order: 5 }
      ],
      createdAt: '2025-01-10T10:00:00Z'
    },
    {
      id: 'm2',
      name: 'Produktqualität',
      description: 'Bewertung der Produktqualität',
      questionCount: 4,
      questions: [
        { id: 'q6', moduleId: 'm2', type: 'likert', questionText: 'Qualität der Produkte (1-5 Sterne)', required: true, order: 1, likertScale: { min: 1, max: 5, minLabel: 'Sehr schlecht', maxLabel: 'Sehr gut' } },
        { id: 'q7', moduleId: 'm2', type: 'multiple_choice', questionText: 'Welche Produktkategorien haben Sie gekauft?', required: true, order: 2, options: ['Schokolade', 'Snacks', 'Getränke', 'Süßwaren'] },
        { id: 'q8', moduleId: 'm2', type: 'yesno', questionText: 'Entsprach die Qualität Ihren Erwartungen?', required: true, order: 3 },
        { id: 'q9', moduleId: 'm2', type: 'open_text', questionText: 'Weitere Anmerkungen zur Produktqualität', required: false, order: 4 }
      ],
      createdAt: '2025-01-12T14:30:00Z'
    },
    {
      id: 'm3',
      name: 'Verkaufserlebnis',
      description: 'Fragen zum Einkaufserlebnis im Markt',
      questionCount: 6,
      questions: [
        { id: 'q10', moduleId: 'm3', type: 'likert', questionText: 'Wie bewerten Sie die Präsentation im Markt?', required: true, order: 1, likertScale: { min: 1, max: 5, minLabel: 'Sehr schlecht', maxLabel: 'Sehr gut' } },
        { id: 'q11', moduleId: 'm3', type: 'yesno', questionText: 'War das Personal freundlich und hilfsbereit?', required: true, order: 2 },
        { id: 'q12', moduleId: 'm3', type: 'open_text', questionText: 'Name des Verkäufers (optional)', required: false, order: 3 },
        { id: 'q13', moduleId: 'm3', type: 'single_choice', questionText: 'Wie lange haben Sie gewartet?', required: true, order: 4, options: ['< 2 Min', '2-5 Min', '5-10 Min', '> 10 Min'] },
        { id: 'q14', moduleId: 'm3', type: 'multiple_choice', questionText: 'Was hat Ihnen gefallen?', required: false, order: 5, options: ['Sauberkeit', 'Freundlichkeit', 'Produktauswahl', 'Preise'] },
        { id: 'q15', moduleId: 'm3', type: 'open_text', questionText: 'Sonstige Anmerkungen', required: false, order: 6 }
      ],
      createdAt: '2025-01-15T09:00:00Z'
    },
    {
      id: 'm4',
      name: 'Display-Bewertung',
      description: 'Feedback zu Display-Materialien',
      questionCount: 3,
      questions: [
        { id: 'q16', moduleId: 'm4', type: 'likert', questionText: 'Wie auffällig war das Display?', required: true, order: 1, likertScale: { min: 1, max: 5, minLabel: 'Kaum sichtbar', maxLabel: 'Sehr auffällig' } },
        { id: 'q17', moduleId: 'm4', type: 'yesno', questionText: 'Hat das Display Ihre Kaufentscheidung beeinflusst?', required: true, order: 2 },
        { id: 'q18', moduleId: 'm4', type: 'open_text', questionText: 'Verbesserungsvorschläge für das Display', required: false, order: 3 }
      ],
      createdAt: '2025-01-18T11:15:00Z'
    },
    {
      id: 'm5',
      name: 'Kontaktdaten',
      description: 'Optionale Kontaktinformationen',
      questionCount: 3,
      questions: [
        { id: 'q19', moduleId: 'm5', type: 'open_text', questionText: 'Ihr Name (optional)', required: false, order: 1 },
        { id: 'q20', moduleId: 'm5', type: 'open_text', questionText: 'Ihre E-Mail (optional)', required: false, order: 2 },
        { id: 'q21', moduleId: 'm5', type: 'yesno', questionText: 'Dürfen wir Sie kontaktieren?', required: false, order: 3 }
      ],
      createdAt: '2025-01-20T16:45:00Z'
    }
  ]);

  // Mock fragebogen data
  const [fragebogenList, setFragebogenList] = useState<Fragebogen[]>([
    {
      id: 'f1',
      name: 'KW 50 Weihnachts-Feedback',
      description: 'Kundenfeedback zur Weihnachtsaktion',
      startDate: '2025-12-15',
      endDate: '2025-12-28',
      status: 'active',
      moduleIds: ['m1', 'm2', 'm3'],
      marketIds: adminMarkets.slice(0, 25).map(m => m.id), // First 25 markets
      assignedGLCount: 38,
      responseCount: 142,
      createdAt: '2025-12-01T10:00:00Z'
    },
    {
      id: 'f2',
      name: 'Display Qualitätskontrolle Q4',
      description: 'Bewertung der Display-Materialien',
      startDate: '2025-10-01',
      endDate: '2025-12-31',
      status: 'active',
      moduleIds: ['m4', 'm1'],
      marketIds: adminMarkets.slice(10, 40).map(m => m.id), // Markets 10-40
      assignedGLCount: 45,
      responseCount: 89,
      createdAt: '2025-09-25T14:30:00Z'
    },
    {
      id: 'f3',
      name: 'Allgemeine Kundenzufriedenheit',
      description: 'Fortlaufendes Feedback zur Kundenzufriedenheit',
      startDate: '2025-01-01',
      endDate: '2025-12-31',
      status: 'active',
      moduleIds: ['m1', 'm5'],
      marketIds: adminMarkets.slice(20, 60).map(m => m.id), // Markets 20-60
      assignedGLCount: 45,
      responseCount: 567,
      createdAt: '2024-12-20T09:00:00Z'
    },
    {
      id: 'f4',
      name: 'KW 02-04 Neujahrs-Aktion',
      description: 'Feedback zur Neujahrs-Kampagne',
      startDate: '2026-01-05',
      endDate: '2026-01-25',
      status: 'scheduled',
      moduleIds: ['m1', 'm2', 'm4'],
      marketIds: adminMarkets.slice(0, 45).map(m => m.id), // First 45 markets
      assignedGLCount: 45,
      responseCount: 0,
      createdAt: '2025-12-15T11:00:00Z'
    },
    {
      id: 'f5',
      name: 'Valentinstag Sonderaktion',
      description: 'Kundenfeedback zur Valentinstag-Aktion',
      startDate: '2026-02-10',
      endDate: '2026-02-16',
      status: 'scheduled',
      moduleIds: ['m1', 'm3', 'm5'],
      marketIds: adminMarkets.slice(15, 55).map(m => m.id), // Markets 15-55
      assignedGLCount: 40,
      responseCount: 0,
      createdAt: '2025-12-28T15:20:00Z'
    },
    {
      id: 'f6',
      name: 'Herbst-Kampagne Archiv',
      description: 'Abgeschlossene Herbst-Kampagne',
      startDate: '2025-09-01',
      endDate: '2025-10-31',
      status: 'inactive',
      moduleIds: ['m1', 'm2'],
      marketIds: adminMarkets.slice(5, 47).map(m => m.id), // Markets 5-47
      assignedGLCount: 42,
      responseCount: 234,
      createdAt: '2025-08-15T10:00:00Z'
    },
    {
      id: 'f7',
      name: 'Sommer Special 2025',
      description: 'Sommer-Feedback archiviert',
      startDate: '2025-06-01',
      endDate: '2025-08-31',
      status: 'inactive',
      moduleIds: ['m1', 'm3', 'm4'],
      marketIds: adminMarkets.slice(8, 46).map(m => m.id), // Markets 8-46
      assignedGLCount: 38,
      responseCount: 456,
      createdAt: '2025-05-10T12:30:00Z'
    }
  ]);

  const [selectedFragebogen, setSelectedFragebogen] = useState<Fragebogen | null>(null);
  const [selectedModule, setSelectedModule] = useState<Module | null>(null);
  const [editingFragebogen, setEditingFragebogen] = useState<Fragebogen | null>(null);
  const [editingModule, setEditingModule] = useState<Module | null>(null);
  const [duplicatingModule, setDuplicatingModule] = useState<Module | null>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; module: Module } | null>(null);

  const activeFragebogen = fragebogenList.filter(f => f.status === 'active');
  const scheduledFragebogen = fragebogenList.filter(f => f.status === 'scheduled');
  const inactiveFragebogen = fragebogenList.filter(f => f.status === 'inactive');

  // Handle market updates for a fragebogen
  const handleUpdateFragebogenMarkets = (fragebogenId: string, marketIds: string[]) => {
    setFragebogenList(prev => 
      prev.map(f => 
        f.id === fragebogenId 
          ? { ...f, marketIds }
          : f
      )
    );
    // Also update selected fragebogen if it's the one being edited
    if (selectedFragebogen && selectedFragebogen.id === fragebogenId) {
      setSelectedFragebogen(prev => prev ? { ...prev, marketIds } : null);
    }
  };

  // Handle archiving/activating a fragebogen
  const handleToggleArchiveFragebogen = (fragebogenId: string) => {
    setFragebogenList(prev => 
      prev.map(f => {
        if (f.id === fragebogenId) {
          // If currently inactive (archived), make it active
          // If currently active or scheduled, make it inactive (archived)
          const newStatus = f.status === 'inactive' ? 'active' : 'inactive';
          return { ...f, status: newStatus };
        }
        return f;
      })
    );
  };

  const handleEditFragebogen = (fragebogen: Fragebogen) => {
    setEditingFragebogen(fragebogen);
    onCloseCreateFragebogenModal(); // Close if creation modal was open
  };

  const handleUpdateFragebogen = (updatedFragebogen: Fragebogen) => {
    setFragebogenList(prev => 
      prev.map(f => f.id === updatedFragebogen.id ? updatedFragebogen : f)
    );
    setEditingFragebogen(null);
  };

  const handleEditModule = (module: Module) => {
    setEditingModule(module);
    onCloseCreateModuleModal(); // Close if creation modal was open
  };

  const handleUpdateModule = (updatedModule: Module) => {
    setModules(prev => 
      prev.map(m => m.id === updatedModule.id ? updatedModule : m)
    );
    setEditingModule(null);
  };

  const handleDuplicateModule = (module: Module) => {
    const duplicatedModule: Module = {
      ...module,
      id: '', // Will be set when saved
      name: `Kopie von ${module.name}`,
      createdAt: '', // Will be set when saved
    };
    setDuplicatingModule(duplicatedModule);
    setContextMenu(null);
  };

  const [originalModuleName, setOriginalModuleName] = useState<string>('');

  const handleContextMenu = (e: React.MouseEvent, module: Module) => {
    e.preventDefault();
    e.stopPropagation();
    setOriginalModuleName(module.name); // Store original name for validation
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      module
    });
  };

  // Close context menu on click outside
  React.useEffect(() => {
    const handleClickOutside = () => {
      if (contextMenu) {
        setContextMenu(null);
      }
    };
    
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [contextMenu]);

  const formatDateRange = (start: string, end: string) => {
    const startDate = new Date(start + 'T00:00:00');
    const endDate = new Date(end + 'T00:00:00');
    const options: Intl.DateTimeFormatOptions = { day: '2-digit', month: 'short' };
    return `${startDate.toLocaleDateString('de-DE', options)} - ${endDate.toLocaleDateString('de-DE', options)}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const getTotalQuestions = (moduleIds: string[]) => {
    return moduleIds.reduce((total, moduleId) => {
      const module = modules.find(m => m.id === moduleId);
      return total + (module?.questionCount || 0);
    }, 0);
  };

  const getStatusConfig = (status: Fragebogen['status'], startDate?: string) => {
    switch (status) {
      case 'active':
        return {
          label: 'Aktiv',
          color: '#10B981',
          bgColor: 'rgba(16, 185, 129, 0.1)',
          icon: <TrendUp size={16} weight="bold" />
        };
      case 'scheduled':
        return {
          label: `Aktiv ab: ${startDate ? formatDate(startDate) : ''}`,
          color: '#3B82F6',
          bgColor: 'rgba(59, 130, 246, 0.1)',
          icon: <Clock size={16} weight="bold" />
        };
      case 'inactive':
        return {
          label: 'Inaktiv',
          color: '#6B7280',
          bgColor: 'rgba(107, 114, 128, 0.1)',
          icon: <XCircle size={16} weight="bold" />
        };
    }
  };

  const getFragebogenUsingModule = (moduleId: string) => {
    return fragebogenList.filter(f => f.moduleIds.includes(moduleId)).length;
  };

  const handleSaveModule = (newModule: Module) => {
    setModules(prev => [newModule, ...prev]);
    // TODO: Show success toast/notification
    console.log('Module saved:', newModule);
  };

  const handleSaveFragebogen = (newFragebogen: any) => {
    setFragebogenList(prev => [newFragebogen, ...prev]);
    // TODO: Show success toast/notification
    console.log('Fragebogen saved:', newFragebogen);
  };

  return (
    <div className={styles.fragebogenPage}>
      {/* Active Fragebogen */}
      {activeFragebogen.length > 0 && (
        <div className={styles.fragebogenSection}>
          <h2 className={styles.sectionTitle}>Aktive Fragebögen</h2>
          <div className={styles.fragebogenGrid}>
            {activeFragebogen.map(fragebogen => {
              const statusConfig = getStatusConfig(fragebogen.status);
              return (
                <div 
                  key={fragebogen.id}
                  className={`${styles.fragebogenCard} ${styles.fragebogenCardActive}`}
                  onClick={() => setSelectedFragebogen(fragebogen)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className={styles.fragebogenHeader}>
                    <div className={styles.fragebogenStatus} style={{ 
                      backgroundColor: statusConfig.bgColor,
                      color: statusConfig.color 
                    }}>
                      {statusConfig.icon}
                      <span>{statusConfig.label}</span>
                    </div>
                    <button 
                      className={styles.fragebogenEditButton}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditFragebogen(fragebogen);
                      }}
                    >
                      <PencilSimple size={18} weight="bold" />
                    </button>
                  </div>

                  <div className={styles.fragebogenContent}>
                    <h3 className={styles.fragebogenName}>{fragebogen.name}</h3>
                    
                    <div className={styles.fragebogenDateRange}>
                      <Calendar size={16} weight="regular" />
                      <span>{formatDateRange(fragebogen.startDate, fragebogen.endDate)}</span>
                    </div>

                    <div className={styles.infoGrid}>
                      <div className={styles.infoItem}>
                        <Stack size={14} weight="fill" />
                        <span>{fragebogen.moduleIds.length} Module</span>
                      </div>
                      <div className={styles.infoItem}>
                        <Users size={14} weight="fill" />
                        <span>{fragebogen.marketIds?.length || 0} Märkte</span>
                      </div>
                      <div className={styles.infoItem}>
                        <Question size={14} weight="fill" />
                        <span>{getTotalQuestions(fragebogen.moduleIds)} Fragen</span>
                      </div>
                      <div className={styles.infoItem}>
                        <CheckCircleFilled size={14} weight="fill" />
                        <span>{fragebogen.responseCount} Antworten</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Scheduled Fragebogen */}
      {scheduledFragebogen.length > 0 && (
        <div className={styles.fragebogenSection}>
          <h2 className={styles.sectionTitle}>Geplante Fragebögen</h2>
          <div className={styles.fragebogenGrid}>
            {scheduledFragebogen.map(fragebogen => {
              const statusConfig = getStatusConfig(fragebogen.status, fragebogen.startDate);
              return (
                <div 
                  key={fragebogen.id}
                  className={`${styles.fragebogenCard} ${styles.fragebogenCardScheduled}`}
                  onClick={() => setSelectedFragebogen(fragebogen)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className={styles.fragebogenHeader}>
                    <div className={styles.fragebogenStatus} style={{ 
                      backgroundColor: statusConfig.bgColor,
                      color: statusConfig.color 
                    }}>
                      {statusConfig.icon}
                      <span>{statusConfig.label}</span>
                    </div>
                    <button 
                      className={styles.fragebogenEditButton}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditFragebogen(fragebogen);
                      }}
                    >
                      <PencilSimple size={18} weight="bold" />
                    </button>
                  </div>

                  <div className={styles.fragebogenContent}>
                    <h3 className={styles.fragebogenName}>{fragebogen.name}</h3>
                    
                    <div className={styles.fragebogenDateRange}>
                      <Calendar size={16} weight="regular" />
                      <span>{formatDateRange(fragebogen.startDate, fragebogen.endDate)}</span>
                    </div>

                    <div className={styles.infoGrid}>
                      <div className={styles.infoItem}>
                        <Stack size={14} weight="fill" />
                        <span>{fragebogen.moduleIds.length} Module</span>
                      </div>
                      <div className={styles.infoItem}>
                        <Users size={14} weight="fill" />
                        <span>{fragebogen.marketIds?.length || 0} Märkte</span>
                      </div>
                      <div className={styles.infoItem}>
                        <Question size={14} weight="fill" />
                        <span>{getTotalQuestions(fragebogen.moduleIds)} Fragen</span>
                      </div>
                      <div className={styles.infoItem}>
                        <CheckCircleFilled size={14} weight="fill" />
                        <span>{fragebogen.responseCount} Antworten</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Inactive Fragebogen */}
      {inactiveFragebogen.length > 0 && (
        <div className={styles.fragebogenSection}>
          <h2 className={styles.sectionTitle}>Archivierte Fragebögen</h2>
          <div className={styles.fragebogenGrid}>
            {inactiveFragebogen.map(fragebogen => {
              const statusConfig = getStatusConfig(fragebogen.status);
              return (
                <div 
                  key={fragebogen.id}
                  className={`${styles.fragebogenCard} ${styles.fragebogenCardInactive}`}
                  onClick={() => setSelectedFragebogen(fragebogen)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className={styles.fragebogenHeader}>
                    <div className={styles.fragebogenStatus} style={{ 
                      backgroundColor: statusConfig.bgColor,
                      color: statusConfig.color 
                    }}>
                      {statusConfig.icon}
                      <span>{statusConfig.label}</span>
                    </div>
                    <button 
                      className={styles.fragebogenEditButton}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditFragebogen(fragebogen);
                      }}
                    >
                      <PencilSimple size={18} weight="bold" />
                    </button>
                  </div>

                  <div className={styles.fragebogenContent}>
                    <h3 className={styles.fragebogenName}>{fragebogen.name}</h3>
                    
                    <div className={styles.fragebogenDateRange}>
                      <Calendar size={16} weight="regular" />
                      <span>{formatDateRange(fragebogen.startDate, fragebogen.endDate)}</span>
                    </div>

                    <div className={styles.infoGrid}>
                      <div className={styles.infoItem}>
                        <Stack size={14} weight="fill" />
                        <span>{fragebogen.moduleIds.length} Module</span>
                      </div>
                      <div className={styles.infoItem}>
                        <Users size={14} weight="fill" />
                        <span>{fragebogen.marketIds?.length || 0} Märkte</span>
                      </div>
                      <div className={styles.infoItem}>
                        <Question size={14} weight="fill" />
                        <span>{getTotalQuestions(fragebogen.moduleIds)} Fragen</span>
                      </div>
                      <div className={styles.infoItem}>
                        <CheckCircleFilled size={14} weight="fill" />
                        <span>{fragebogen.responseCount} Antworten</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Module Library */}
      <div className={styles.moduleSection}>
        <h2 className={styles.sectionTitle}>Modul-Bibliothek</h2>
        <div className={styles.moduleGrid}>
          {modules.map(module => (
            <div 
              key={module.id}
              className={styles.moduleCard}
              onClick={() => setSelectedModule(module)}
              onContextMenu={(e) => handleContextMenu(e, module)}
              style={{ cursor: 'pointer' }}
            >
              <button 
                className={styles.moduleEditButton}
                onClick={(e) => {
                  e.stopPropagation();
                  handleEditModule(module);
                }}
              >
                <PencilSimple size={16} weight="bold" />
              </button>
              
              <div className={styles.moduleIcon}>
                <Stack size={40} weight="regular" />
              </div>
              
              <div className={styles.moduleContent}>
                <h3 className={styles.moduleName}>{module.name}</h3>
                <div className={styles.moduleQuestionCount}>
                  <Question size={14} weight="fill" />
                  <span>{module.questionCount} Fragen</span>
                </div>
              </div>

              <div className={styles.moduleFooter}>
                <span className={styles.moduleUsage}>
                  Verwendet in {getFragebogenUsingModule(module.id)} Fragebögen
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Fragebogen Detail Modal */}
      {selectedFragebogen && (
        <FragebogenDetailModal 
          fragebogen={selectedFragebogen}
          modules={modules.filter(m => selectedFragebogen.moduleIds.includes(m.id))}
          onClose={() => setSelectedFragebogen(null)}
          onUpdateMarkets={(marketIds) => handleUpdateFragebogenMarkets(selectedFragebogen.id, marketIds)}
          onArchive={(fragebogenId) => handleToggleArchiveFragebogen(fragebogenId)}
        />
      )}

      {/* Module Detail Modal */}
      {selectedModule && (
        <ModuleDetailModal 
          module={selectedModule}
          usageCount={getFragebogenUsingModule(selectedModule.id)}
          onClose={() => setSelectedModule(null)}
        />
      )}

      {/* Create Module Modal */}
      {isCreateModuleModalOpen && (
        <CreateModuleModal
          isOpen={isCreateModuleModalOpen}
          onClose={onCloseCreateModuleModal}
          onSave={handleSaveModule}
          allModules={modules}
        />
      )}

      {/* Edit Module Modal */}
      {editingModule && (
        <CreateModuleModal
          isOpen={true}
          onClose={() => setEditingModule(null)}
          onSave={handleUpdateModule}
          editingModule={editingModule}
          allModules={modules}
        />
      )}

      {/* Create Fragebogen Modal */}
      {isCreateFragebogenModalOpen && (
        <CreateFragebogenModal
          isOpen={isCreateFragebogenModalOpen}
          onClose={onCloseCreateFragebogenModal}
          onSave={handleSaveFragebogen}
          availableModules={modules}
          existingFragebogen={fragebogenList}
        />
      )}

      {/* Edit Fragebogen Modal */}
      {editingFragebogen && (
        <CreateFragebogenModal
          isOpen={true}
          onClose={() => setEditingFragebogen(null)}
          onSave={handleUpdateFragebogen}
          availableModules={modules}
          existingFragebogen={fragebogenList}
          editingFragebogen={editingFragebogen}
        />
      )}

      {/* Duplicate Module Modal */}
      {duplicatingModule && (
        <CreateModuleModal
          isOpen={true}
          onClose={() => {
            setDuplicatingModule(null);
            setOriginalModuleName('');
          }}
          onSave={handleSaveModule}
          editingModule={duplicatingModule}
          originalModuleName={originalModuleName}
          allModules={modules}
        />
      )}

      {/* Context Menu for Modules */}
      {contextMenu && (
        <div 
          className={styles.contextMenu}
          style={{
            position: 'fixed',
            top: `${contextMenu.y}px`,
            left: `${contextMenu.x}px`,
            zIndex: 100002
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <button 
            className={styles.contextMenuItem}
            onClick={() => handleDuplicateModule(contextMenu.module)}
          >
            <Stack size={16} weight="bold" />
            <span>Modul duplizieren</span>
          </button>
        </div>
      )}
    </div>
  );
};

