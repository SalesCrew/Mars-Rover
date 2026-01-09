import React, { useState, useEffect } from 'react';
import { X, Plus, Trash, Check, ArrowLeft, Package, MagnifyingGlass } from '@phosphor-icons/react';
import styles from './CreatePaletteModal.module.css';
import type { Product, PaletteProduct } from '../../types/product-types';
import { getAllProducts } from '../../data/productsData';

interface CreatePaletteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (palettes: Product[]) => void;
  department: 'pets' | 'food';
}

interface PaletteItem {
  name: string;
  subname: string;
  products: PaletteProduct[];
  eanCode: string;
  size: string;
}

export const CreatePaletteModal: React.FC<CreatePaletteModalProps> = ({
  isOpen,
  onClose,
  onSave,
  department
}) => {
  const [step, setStep] = useState<'input' | 'summary'>('input');
  const [currentPalette, setCurrentPalette] = useState<PaletteItem>({
    name: '',
    subname: '',
    products: [],
    eanCode: '',
    size: ''
  });
  const [createdPalettes, setCreatedPalettes] = useState<PaletteItem[]>([]);
  const [availableProducts, setAvailableProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isProductSelectorOpen, setIsProductSelectorOpen] = useState(false);

  // Load available products on mount
  useEffect(() => {
    const loadProducts = async () => {
      try {
        const products = await getAllProducts();
        // Filter to only show standard products from the same department
        const filtered = products.filter(
          p => p.productType === 'standard' && p.department === department
        );
        setAvailableProducts(filtered);
      } catch (error) {
        console.error('Error loading products:', error);
      }
    };
    if (isOpen) {
      loadProducts();
    }
  }, [isOpen, department]);

  if (!isOpen) return null;

  const handleAddProduct = (product: Product) => {
    // Check if already added
    const exists = currentPalette.products.find(p => p.productId === product.id);
    if (exists) {
      // Increment quantity
      setCurrentPalette(prev => ({
        ...prev,
        products: prev.products.map(p =>
          p.productId === product.id ? { ...p, quantity: p.quantity + 1 } : p
        )
      }));
    } else {
      // Add new
      const newProduct: PaletteProduct = {
        productId: product.id,
        productName: product.name,
        quantity: 1,
        unitPrice: product.price
      };
      setCurrentPalette(prev => ({
        ...prev,
        products: [...prev.products, newProduct]
      }));
    }
    setIsProductSelectorOpen(false);
    setSearchTerm('');
  };

  const handleRemoveProduct = (productId: string) => {
    setCurrentPalette(prev => ({
      ...prev,
      products: prev.products.filter(p => p.productId !== productId)
    }));
  };

  const handleQuantityChange = (productId: string, quantity: number) => {
    if (quantity < 1) return;
    setCurrentPalette(prev => ({
      ...prev,
      products: prev.products.map(p =>
        p.productId === productId ? { ...p, quantity } : p
      )
    }));
  };

  const handleWeiter = () => {
    if (isFormValid()) {
      setCreatedPalettes(prev => [...prev, currentPalette]);
      resetCurrentPalette();
    }
  };

  const handleFertig = () => {
    if (isFormValid()) {
      const finalPalettes = [...createdPalettes, currentPalette];
      setStep('summary');
      setCreatedPalettes(finalPalettes);
    } else if (createdPalettes.length > 0) {
      setStep('summary');
    }
  };

  const handleSave = () => {
    const products: Product[] = createdPalettes.map((palette, index) => ({
      id: `palette-${department}-${Date.now()}-${index}`,
      name: palette.name,
      department: department,
      productType: 'palette' as const,
      weight: palette.size,
      content: palette.products.map(p => `${p.quantity}x ${p.productName}`).join(', '),
      palletSize: palette.products.reduce((sum, p) => sum + p.quantity, 0),
      price: 0, // Palettes have no price - value comes from products inside
      sku: palette.eanCode,
      paletteProducts: palette.products
    }));

    onSave(products);
    handleReset();
    onClose();
  };

  const resetCurrentPalette = () => {
    setCurrentPalette({
      name: '',
      subname: '',
      products: [],
      eanCode: '',
      size: ''
    });
  };

  const handleReset = () => {
    setStep('input');
    resetCurrentPalette();
    setCreatedPalettes([]);
  };

  const handleRemovePalette = (index: number) => {
    setCreatedPalettes(prev => prev.filter((_, i) => i !== index));
  };

  const handleEditPalette = (index: number) => {
    setCurrentPalette(createdPalettes[index]);
    setCreatedPalettes(prev => prev.filter((_, i) => i !== index));
    setStep('input');
  };

  const isFormValid = () => {
    return (
      currentPalette.name.trim() !== '' &&
      currentPalette.size.trim() !== '' &&
      currentPalette.products.length > 0
    );
  };

  // Calculate total value of palette products
  const getTotalValue = (products: PaletteProduct[]) => {
    return products.reduce((sum, p) => sum + (p.quantity * p.unitPrice), 0);
  };

  const departmentColor = department === 'pets' ? '#10B981' : '#F59E0B';
  const departmentLabel = department === 'pets' ? 'Tiernahrung' : 'Lebensmittel';

  const filteredProducts = availableProducts.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
            <h2 className={styles.modalTitle}>Palette erstellen</h2>
          </div>
          <button className={styles.closeButton} onClick={onClose}>
            <X size={20} weight="bold" />
          </button>
        </div>

        {/* Content */}
        <div className={styles.modalContent}>
          {step === 'input' ? (
            <div className={styles.inputForm}>
              {/* Name */}
              <div className={styles.formGroup}>
                <label className={styles.label}>Palettenname *</label>
                <input
                  type="text"
                  className={styles.input}
                  value={currentPalette.name}
                  onChange={(e) => setCurrentPalette(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="z.B. Whiskas Aktionspalette"
                />
              </div>

              {/* Subname */}
              <div className={styles.formGroup}>
                <label className={styles.label}>Subname</label>
                <input
                  type="text"
                  className={styles.input}
                  value={currentPalette.subname}
                  onChange={(e) => setCurrentPalette(prev => ({ ...prev, subname: e.target.value }))}
                  placeholder="Optional"
                />
              </div>

              {/* Size */}
              <div className={styles.formGroup}>
                <label className={styles.label}>Größe *</label>
                <input
                  type="text"
                  className={styles.input}
                  value={currentPalette.size}
                  onChange={(e) => setCurrentPalette(prev => ({ ...prev, size: e.target.value }))}
                  placeholder="z.B. 120cm x 80cm"
                />
              </div>

              {/* EAN-Code */}
              <div className={styles.formGroup}>
                <label className={styles.label}>EAN-Code</label>
                <input
                  type="text"
                  className={styles.input}
                  value={currentPalette.eanCode}
                  onChange={(e) => setCurrentPalette(prev => ({ ...prev, eanCode: e.target.value }))}
                  placeholder="Optional"
                />
              </div>

              {/* Products */}
              <div className={styles.formGroup}>
                <label className={styles.label}>Produkte *</label>
                <p className={styles.labelHint}>
                  GLs können frei aus diesen Produkten wählen (min. 600€ pro Markt)
                </p>
                
                {/* Added Products */}
                {currentPalette.products.length > 0 && (
                  <div className={styles.productsWrapper}>
                    {currentPalette.products.map((product) => (
                      <div key={product.productId} className={styles.productRow}>
                        <div className={styles.productInfo}>
                          <span className={styles.productName}>{product.productName}</span>
                          <span className={styles.productPrice}>€{product.unitPrice.toFixed(2)}/Stk</span>
                        </div>
                        <div className={styles.productControls}>
                          <input
                            type="number"
                            min="1"
                            className={styles.quantityInput}
                            value={product.quantity}
                            onChange={(e) => handleQuantityChange(product.productId, parseInt(e.target.value) || 1)}
                          />
                          <button
                            className={styles.removeProductButton}
                            onClick={() => handleRemoveProduct(product.productId)}
                            title="Entfernen"
                          >
                            <Trash size={16} weight="bold" />
                          </button>
                        </div>
                      </div>
                    ))}
                    <div className={styles.totalValue}>
                      Gesamtwert: <strong>€{getTotalValue(currentPalette.products).toFixed(2)}</strong>
                    </div>
                  </div>
                )}

                {/* Add Product Button / Selector */}
                <div className={styles.productSelectorWrapper}>
                  {isProductSelectorOpen ? (
                    <div className={styles.productSelector}>
                      <div className={styles.searchWrapper}>
                        <MagnifyingGlass size={18} weight="bold" className={styles.searchIcon} />
                        <input
                          type="text"
                          className={styles.searchInput}
                          placeholder="Produkt suchen..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          autoFocus
                        />
                        <button
                          className={styles.closeSearch}
                          onClick={() => {
                            setIsProductSelectorOpen(false);
                            setSearchTerm('');
                          }}
                        >
                          <X size={16} weight="bold" />
                        </button>
                      </div>
                      <div className={styles.productList}>
                        {filteredProducts.length > 0 ? (
                          filteredProducts.slice(0, 10).map((product) => (
                            <button
                              key={product.id}
                              className={styles.productOption}
                              onClick={() => handleAddProduct(product)}
                            >
                              <span className={styles.productOptionName}>{product.name}</span>
                              <span className={styles.productOptionPrice}>€{product.price.toFixed(2)}</span>
                            </button>
                          ))
                        ) : (
                          <div className={styles.noProducts}>
                            {searchTerm ? 'Keine Produkte gefunden' : 'Keine Produkte verfügbar'}
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <button
                      className={styles.addProductButton}
                      onClick={() => setIsProductSelectorOpen(true)}
                    >
                      <Plus size={16} weight="bold" />
                      <span>Produkt hinzufügen</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Created palettes count */}
              {createdPalettes.length > 0 && (
                <div className={styles.createdCount}>
                  <Package size={18} weight="fill" style={{ color: departmentColor }} />
                  <span>{createdPalettes.length} Palette{createdPalettes.length > 1 ? 'n' : ''} erstellt</span>
                </div>
              )}
            </div>
          ) : (
            <div className={styles.summaryView}>
              <h3 className={styles.summaryTitle}>Zusammenfassung</h3>
              <p className={styles.summarySubtitle}>
                {createdPalettes.length} Palette{createdPalettes.length > 1 ? 'n' : ''} bereit zum Speichern
              </p>
              
              <div className={styles.palettesList}>
                {createdPalettes.map((palette, index) => (
                  <div key={index} className={styles.paletteCard}>
                    <div className={styles.paletteCardHeader}>
                      <div className={styles.paletteCardTitle}>
                        <Package size={20} weight="fill" style={{ color: departmentColor }} />
                        <div>
                          <span className={styles.paletteName}>{palette.name}</span>
                          {palette.subname && (
                            <span className={styles.paletteSubname}>{palette.subname}</span>
                          )}
                        </div>
                      </div>
                      <div className={styles.paletteCardActions}>
                        <button
                          className={styles.editButton}
                          onClick={() => handleEditPalette(index)}
                          title="Bearbeiten"
                        >
                          <ArrowLeft size={16} weight="bold" />
                        </button>
                        <button
                          className={styles.deleteButton}
                          onClick={() => handleRemovePalette(index)}
                          title="Löschen"
                        >
                          <Trash size={16} weight="bold" />
                        </button>
                      </div>
                    </div>
                    
                    <div className={styles.paletteCardDetails}>
                      <div className={styles.detailRow}>
                        <span className={styles.detailLabel}>Größe:</span>
                        <span className={styles.detailValue}>{palette.size}</span>
                      </div>
                      {palette.eanCode && (
                        <div className={styles.detailRow}>
                          <span className={styles.detailLabel}>EAN:</span>
                          <span className={styles.detailValue}>{palette.eanCode}</span>
                        </div>
                      )}
                      <div className={styles.detailRow}>
                        <span className={styles.detailLabel}>Gesamtwert:</span>
                        <span className={styles.detailValue} style={{ color: departmentColor, fontWeight: 700 }}>
                          €{getTotalValue(palette.products).toFixed(2)}
                        </span>
                      </div>
                      <div className={styles.detailRow}>
                        <span className={styles.detailLabel}>Produkte:</span>
                        <div className={styles.contentsList}>
                          {palette.products.map((p, i) => (
                            <span key={i} className={styles.contentItem}>
                              {p.quantity}x {p.productName}
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
                  disabled={!isFormValid() && createdPalettes.length === 0}
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
                disabled={createdPalettes.length === 0}
                style={{ backgroundColor: departmentColor, borderColor: departmentColor }}
              >
                <Check size={18} weight="bold" />
                <span>Speichern ({createdPalettes.length})</span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
