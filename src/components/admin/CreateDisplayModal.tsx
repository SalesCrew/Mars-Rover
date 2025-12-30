import React, { useState } from 'react';
import { X, Plus, Trash, Check, ArrowLeft, Package } from '@phosphor-icons/react';
import styles from './CreateDisplayModal.module.css';
import type { Product } from '../../types/product-types';

interface CreateDisplayModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (displays: Product[]) => void;
  department: 'pets' | 'food';
}

interface DisplayProduct {
  name: string;
  subname: string;
  contents: { quantity: number; articleName: string }[];
  eanCode: string;
  size: string;
  price: number;
}

export const CreateDisplayModal: React.FC<CreateDisplayModalProps> = ({
  isOpen,
  onClose,
  onSave,
  department
}) => {
  const [step, setStep] = useState<'input' | 'summary'>('input');
  const [currentDisplay, setCurrentDisplay] = useState<DisplayProduct>({
    name: '',
    subname: '',
    contents: [{ quantity: 0, articleName: '' }],
    eanCode: '',
    size: '',
    price: 0
  });
  const [createdDisplays, setCreatedDisplays] = useState<DisplayProduct[]>([]);

  if (!isOpen) return null;

  const handleAddContent = () => {
    setCurrentDisplay(prev => ({
      ...prev,
      contents: [...prev.contents, { quantity: 0, articleName: '' }]
    }));
  };

  const handleRemoveContent = (index: number) => {
    if (currentDisplay.contents.length > 1) {
      setCurrentDisplay(prev => ({
        ...prev,
        contents: prev.contents.filter((_, i) => i !== index)
      }));
    }
  };

  const handleContentChange = (index: number, field: 'quantity' | 'articleName', value: string | number) => {
    setCurrentDisplay(prev => ({
      ...prev,
      contents: prev.contents.map((content, i) => 
        i === index ? { ...content, [field]: value } : content
      )
    }));
  };

  const handleWeiter = () => {
    if (isFormValid()) {
      setCreatedDisplays(prev => [...prev, currentDisplay]);
      setCurrentDisplay({
        name: '',
        subname: '',
        contents: [{ quantity: 0, articleName: '' }],
        eanCode: '',
        size: '',
        price: 0
      });
    }
  };

  const handleFertig = () => {
    if (isFormValid()) {
      const finalDisplays = [...createdDisplays, currentDisplay];
      setStep('summary');
      setCreatedDisplays(finalDisplays);
    } else if (createdDisplays.length > 0) {
      setStep('summary');
    }
  };

  const handleSave = () => {
    const products: Product[] = createdDisplays.map((display, index) => ({
      id: `display-${department}-${Date.now()}-${index}`,
      name: display.name,
      department: department,
      productType: 'display',
      weight: display.size,
      content: display.contents.map(c => `${c.quantity}x ${c.articleName}`).join(', '),
      palletSize: display.contents.reduce((sum, c) => sum + c.quantity, 0), // Sum of all quantities
      price: display.price,
      sku: display.eanCode
    }));

    onSave(products);
    handleReset();
    onClose();
  };

  const handleReset = () => {
    setStep('input');
    setCurrentDisplay({
      name: '',
      subname: '',
      contents: [{ quantity: 0, articleName: '' }],
      eanCode: '',
      size: '',
      price: 0
    });
    setCreatedDisplays([]);
  };

  const handleRemoveDisplay = (index: number) => {
    setCreatedDisplays(prev => prev.filter((_, i) => i !== index));
  };

  const handleEditDisplay = (index: number) => {
    setCurrentDisplay(createdDisplays[index]);
    setCreatedDisplays(prev => prev.filter((_, i) => i !== index));
    setStep('input');
  };

  const isFormValid = () => {
    return (
      currentDisplay.name.trim() !== '' &&
      currentDisplay.size.trim() !== '' &&
      currentDisplay.price > 0 &&
      currentDisplay.contents.every(c => c.quantity > 0 && c.articleName.trim() !== '')
    );
  };

  const departmentColor = department === 'pets' ? '#10B981' : '#F59E0B';
  const departmentLabel = department === 'pets' ? 'Tiernahrung' : 'Lebensmittel';

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.modalHeader}>
          <div className={styles.headerLeft}>
            <div className={styles.departmentBadge} style={{ 
              backgroundColor: `${departmentColor}15`,
              color: departmentColor,
              borderColor: `${departmentColor}30`
            }}>
              {departmentLabel}
            </div>
            <h2 className={styles.modalTitle}>Display erstellen</h2>
          </div>
          <button className={styles.closeButton} onClick={onClose}>
            <X size={20} weight="bold" />
          </button>
        </div>

        {/* Content */}
        <div className={styles.modalContent}>
          {step === 'input' ? (
            <div className={styles.inputForm}>
              {/* Artikelbezeichnung */}
              <div className={styles.formGroup}>
                <label className={styles.label}>Artikelbezeichnung *</label>
                <input
                  type="text"
                  className={styles.input}
                  value={currentDisplay.name}
                  onChange={(e) => setCurrentDisplay(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="z.B. Whiskas Display Groß"
                />
              </div>

              {/* Subname */}
              <div className={styles.formGroup}>
                <label className={styles.label}>Subname</label>
                <input
                  type="text"
                  className={styles.input}
                  value={currentDisplay.subname}
                  onChange={(e) => setCurrentDisplay(prev => ({ ...prev, subname: e.target.value }))}
                  placeholder="Optional"
                />
              </div>

              {/* Inhalt */}
              <div className={styles.formGroup}>
                <label className={styles.label}>Inhalt *</label>
                <div className={styles.contentsWrapper}>
                  {currentDisplay.contents.map((content, index) => (
                    <div key={index} className={styles.contentRow}>
                      <input
                        type="number"
                        className={styles.inputSmall}
                        value={content.quantity || ''}
                        onChange={(e) => handleContentChange(index, 'quantity', parseInt(e.target.value) || 0)}
                        placeholder="Anzahl"
                        min="1"
                      />
                      <input
                        type="text"
                        className={styles.inputLarge}
                        value={content.articleName}
                        onChange={(e) => handleContentChange(index, 'articleName', e.target.value)}
                        placeholder="Artikelname"
                      />
                      {currentDisplay.contents.length > 1 && (
                        <button
                          className={styles.removeContentButton}
                          onClick={() => handleRemoveContent(index)}
                          title="Entfernen"
                        >
                          <Trash size={16} weight="bold" />
                        </button>
                      )}
                    </div>
                  ))}
                  <button className={styles.addContentButton} onClick={handleAddContent}>
                    <Plus size={16} weight="bold" />
                    <span>Weitere hinzufügen</span>
                  </button>
                </div>
              </div>

              {/* EAN-Code */}
              <div className={styles.formGroup}>
                <label className={styles.label}>EAN-Code</label>
                <input
                  type="text"
                  className={styles.input}
                  value={currentDisplay.eanCode}
                  onChange={(e) => setCurrentDisplay(prev => ({ ...prev, eanCode: e.target.value }))}
                  placeholder="Optional"
                />
              </div>

              {/* Size */}
              <div className={styles.formGroup}>
                <label className={styles.label}>Größe *</label>
                <input
                  type="text"
                  className={styles.input}
                  value={currentDisplay.size}
                  onChange={(e) => setCurrentDisplay(prev => ({ ...prev, size: e.target.value }))}
                  placeholder="z.B. 120cm x 80cm"
                />
              </div>

              {/* Price */}
              <div className={styles.formGroup}>
                <label className={styles.label}>Preis (€) *</label>
                <input
                  type="number"
                  step="0.01"
                  className={styles.input}
                  value={currentDisplay.price || ''}
                  onChange={(e) => setCurrentDisplay(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                  placeholder="0.00"
                  min="0"
                />
              </div>

              {/* Created displays count */}
              {createdDisplays.length > 0 && (
                <div className={styles.createdCount}>
                  <Package size={18} weight="fill" style={{ color: departmentColor }} />
                  <span>{createdDisplays.length} Display{createdDisplays.length > 1 ? 's' : ''} erstellt</span>
                </div>
              )}
            </div>
          ) : (
            <div className={styles.summaryView}>
              <h3 className={styles.summaryTitle}>Zusammenfassung</h3>
              <p className={styles.summarySubtitle}>
                {createdDisplays.length} Display{createdDisplays.length > 1 ? 's' : ''} bereit zum Speichern
              </p>
              
              <div className={styles.displaysList}>
                {createdDisplays.map((display, index) => (
                  <div key={index} className={styles.displayCard}>
                    <div className={styles.displayCardHeader}>
                      <div className={styles.displayCardTitle}>
                        <Package size={20} weight="fill" style={{ color: departmentColor }} />
                        <div>
                          <span className={styles.displayName}>{display.name}</span>
                          {display.subname && (
                            <span className={styles.displaySubname}>{display.subname}</span>
                          )}
                        </div>
                      </div>
                      <div className={styles.displayCardActions}>
                        <button
                          className={styles.editButton}
                          onClick={() => handleEditDisplay(index)}
                          title="Bearbeiten"
                        >
                          <ArrowLeft size={16} weight="bold" />
                        </button>
                        <button
                          className={styles.deleteButton}
                          onClick={() => handleRemoveDisplay(index)}
                          title="Löschen"
                        >
                          <Trash size={16} weight="bold" />
                        </button>
                      </div>
                    </div>
                    
                    <div className={styles.displayCardDetails}>
                      <div className={styles.detailRow}>
                        <span className={styles.detailLabel}>Größe:</span>
                        <span className={styles.detailValue}>{display.size}</span>
                      </div>
                      <div className={styles.detailRow}>
                        <span className={styles.detailLabel}>Preis:</span>
                        <span className={styles.detailValue}>€{display.price.toFixed(2)}</span>
                      </div>
                      {display.eanCode && (
                        <div className={styles.detailRow}>
                          <span className={styles.detailLabel}>EAN:</span>
                          <span className={styles.detailValue}>{display.eanCode}</span>
                        </div>
                      )}
                      <div className={styles.detailRow}>
                        <span className={styles.detailLabel}>Inhalt:</span>
                        <div className={styles.contentsList}>
                          {display.contents.map((c, i) => (
                            <span key={i} className={styles.contentItem}>
                              {c.quantity}x {c.articleName}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={styles.modalFooter}>
          {step === 'input' ? (
            <>
              <button className={styles.cancelButton} onClick={onClose}>
                Abbrechen
              </button>
              <div className={styles.footerRight}>
                <button
                  className={styles.secondaryButton}
                  onClick={handleWeiter}
                  disabled={!isFormValid()}
                >
                  <Plus size={18} weight="bold" />
                  <span>Weiter</span>
                </button>
                <button
                  className={styles.primaryButton}
                  onClick={handleFertig}
                  disabled={!isFormValid() && createdDisplays.length === 0}
                  style={{ backgroundColor: departmentColor, borderColor: departmentColor }}
                >
                  <Check size={18} weight="bold" />
                  <span>Fertig</span>
                </button>
              </div>
            </>
          ) : (
            <>
              <button className={styles.secondaryButton} onClick={() => setStep('input')}>
                <ArrowLeft size={18} weight="bold" />
                <span>Zurück</span>
              </button>
              <button
                className={styles.primaryButton}
                onClick={handleSave}
                disabled={createdDisplays.length === 0}
                style={{ backgroundColor: departmentColor, borderColor: departmentColor }}
              >
                <Check size={18} weight="bold" />
                <span>Speichern ({createdDisplays.length})</span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
