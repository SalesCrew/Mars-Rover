import React, { useState } from 'react';
import { X, Plus, Trash, Check, ArrowLeft, Package } from '@phosphor-icons/react';
import styles from './CreateDisplayModal.module.css';
import type { Product } from '../../types/product-types';

interface CreateStandardProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (products: Product[]) => void;
  department: 'pets' | 'food';
}

interface StandardProduct {
  name: string;
  weight: string;
  content?: string;
  palletSize?: number;
  price: number;
  artikelNr?: string;
}

export const CreateStandardProductModal: React.FC<CreateStandardProductModalProps> = ({
  isOpen,
  onClose,
  onSave,
  department
}) => {
  const [step, setStep] = useState<'input' | 'summary'>('input');
  const [currentProduct, setCurrentProduct] = useState<StandardProduct>({
    name: '',
    weight: '',
    content: '',
    palletSize: undefined,
    price: 0,
    artikelNr: ''
  });
  const [createdProducts, setCreatedProducts] = useState<StandardProduct[]>([]);

  if (!isOpen) return null;

  const handleWeiter = () => {
    if (isFormValid()) {
      setCreatedProducts(prev => [...prev, currentProduct]);
      setCurrentProduct({
        name: '',
        weight: '',
        content: '',
        palletSize: undefined,
        price: 0,
        artikelNr: ''
      });
    }
  };

  const handleFertig = () => {
    if (isFormValid()) {
      const finalProducts = [...createdProducts, currentProduct];
      setStep('summary');
      setCreatedProducts(finalProducts);
    } else if (createdProducts.length > 0) {
      setStep('summary');
    }
  };

  const handleSave = () => {
    const products: Product[] = createdProducts.map((product, index) => ({
      id: `standard-${department}-${Date.now()}-${index}`,
      name: product.name,
      department: department,
      productType: 'standard',
      weight: product.weight,
      content: product.content || undefined,
      palletSize: product.palletSize,
      price: product.price,
      artikelNr: product.artikelNr || undefined,
      sku: generateSKU(product.name, product.weight)
    }));

    onSave(products);
    handleReset();
    onClose();
  };

  const handleReset = () => {
    setStep('input');
    setCurrentProduct({
      name: '',
      weight: '',
      content: '',
      palletSize: undefined,
      price: 0,
      artikelNr: ''
    });
    setCreatedProducts([]);
  };

  const handleRemoveProduct = (index: number) => {
    setCreatedProducts(prev => prev.filter((_, i) => i !== index));
  };

  const handleEditProduct = (index: number) => {
    setCurrentProduct(createdProducts[index]);
    setCreatedProducts(prev => prev.filter((_, i) => i !== index));
    setStep('input');
  };

  const isFormValid = () => {
    return (
      currentProduct.name.trim() !== '' &&
      currentProduct.weight.trim() !== '' &&
      currentProduct.price > 0
    );
  };

  const generateSKU = (name: string, weight: string): string => {
    const namePart = name.split(' ')[0].toUpperCase().substring(0, 4);
    const weightPart = weight.replace(/[^0-9]/g, '');
    return `${namePart}-${weightPart}`;
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
            <h2 className={styles.modalTitle}>Standard Produkt erstellen</h2>
          </div>
          <button className={styles.closeButton} onClick={onClose}>
            <X size={20} weight="bold" />
          </button>
        </div>

        {/* Content */}
        <div className={styles.modalContent}>
          {step === 'input' ? (
            <div className={styles.inputForm}>
              {/* Produktname */}
              <div className={styles.formGroup}>
                <label className={styles.label}>Produktname *</label>
                <input
                  type="text"
                  className={styles.input}
                  value={currentProduct.name}
                  onChange={(e) => setCurrentProduct({ ...currentProduct, name: e.target.value })}
                  placeholder="z.B. Whiskas Trockenfutter"
                />
              </div>

              {/* Gewicht */}
              <div className={styles.formGroup}>
                <label className={styles.label}>Gewicht *</label>
                <input
                  type="text"
                  className={styles.input}
                  value={currentProduct.weight}
                  onChange={(e) => setCurrentProduct({ ...currentProduct, weight: e.target.value })}
                  placeholder={department === 'pets' ? 'z.B. 150g' : 'z.B. 1.5kg'}
                />
              </div>

              {/* Inhalt */}
              <div className={styles.formGroup}>
                <label className={styles.label}>Inhalt</label>
                <input
                  type="text"
                  className={styles.input}
                  value={currentProduct.content || ''}
                  onChange={(e) => setCurrentProduct({ ...currentProduct, content: e.target.value })}
                  placeholder={department === 'pets' ? 'z.B. Huhn & Rind' : 'z.B. Gemüsemischung'}
                />
              </div>

              {/* Palettengröße */}
              <div className={styles.formGroup}>
                <label className={styles.label}>Palettengröße</label>
                <input
                  type="number"
                  className={styles.input}
                  value={currentProduct.palletSize || ''}
                  onChange={(e) => setCurrentProduct({ ...currentProduct, palletSize: parseInt(e.target.value) || undefined })}
                  placeholder="Einheiten pro Palette"
                  min="0"
                />
              </div>

              {/* Preis */}
              <div className={styles.formGroup}>
                <label className={styles.label}>Preis (€) *</label>
                <input
                  type="number"
                  className={styles.input}
                  value={currentProduct.price || ''}
                  onChange={(e) => setCurrentProduct({ ...currentProduct, price: parseFloat(e.target.value) || 0 })}
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                />
              </div>

              {/* Artikel Nr. */}
              <div className={styles.formGroup}>
                <label className={styles.label}>Artikel Nr.</label>
                <input
                  type="text"
                  className={styles.input}
                  value={currentProduct.artikelNr || ''}
                  onChange={(e) => setCurrentProduct({ ...currentProduct, artikelNr: e.target.value })}
                  placeholder="z.B. 12345678"
                />
              </div>

              {createdProducts.length > 0 && (
                <div className={styles.createdCount}>
                  <Check size={16} weight="bold" />
                  <span>{createdProducts.length} Produkt{createdProducts.length > 1 ? 'e' : ''} erstellt</span>
                </div>
              )}
            </div>
          ) : (

            <div className={styles.summaryView}>
              {createdProducts.length > 0 ? (
                <div className={styles.summaryList}>
                  {createdProducts.map((product, index) => (
                    <div key={index} className={styles.summaryItem}>
                      <div className={styles.summaryItemHeader}>
                        <span className={styles.summaryItemName}>{product.name}</span>
                        <div className={styles.summaryItemActions}>
                          <button
                            className={styles.editButton}
                            onClick={() => handleEditProduct(index)}
                          >
                            Bearbeiten
                          </button>
                          <button
                            className={styles.deleteButton}
                            onClick={() => handleRemoveProduct(index)}
                          >
                            <Trash size={18} weight="bold" />
                          </button>
                        </div>
                      </div>
                      <div className={styles.summaryItemDetails}>
                        <span>Gewicht: {product.weight}</span>
                        <span>Preis: €{product.price.toFixed(2)}</span>
                        {product.content && <span>Inhalt: {product.content}</span>}
                        {product.palletSize && <span>Palette: {product.palletSize} Einheiten</span>}
                        {product.artikelNr && <span>Art. Nr.: {product.artikelNr}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className={styles.emptyState}>
                  <Package size={48} weight="thin" />
                  <p>Keine Produkte erstellt</p>
                </div>
              )}
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
              <div className={styles.footerActions}>
                <button 
                  className={styles.addMoreButton}
                  onClick={handleWeiter}
                  disabled={!isFormValid()}
                >
                  <Plus size={18} weight="bold" />
                  <span>Weiter</span>
                </button>
                <button 
                  className={styles.doneButton}
                  onClick={handleFertig}
                  disabled={!isFormValid() && createdProducts.length === 0}
                >
                  <Check size={18} weight="bold" />
                  <span>Fertig</span>
                </button>
              </div>
            </>
          ) : (
            <>
              <button className={styles.backButton} onClick={() => setStep('input')}>
                <ArrowLeft size={18} weight="bold" />
                <span>Zurück</span>
              </button>
              <button 
                className={styles.saveButton}
                onClick={handleSave}
                disabled={createdProducts.length === 0}
                style={{ backgroundColor: departmentColor }}
              >
                <Check size={18} weight="bold" />
                <span>Speichern ({createdProducts.length})</span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
