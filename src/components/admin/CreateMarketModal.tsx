import React, { useState, useRef, useEffect, useMemo } from 'react';
import ReactDOM from 'react-dom';
import { X, CaretDown, Plus } from '@phosphor-icons/react';
import type { AdminMarket } from '../../types/market-types';
import styles from './CreateMarketModal.module.css';

interface CreateMarketModalProps {
  allMarkets: AdminMarket[];
  availableGLs: Array<{ id: string; name: string; email: string }>;
  onClose: () => void;
  onSave: (market: Partial<AdminMarket>) => Promise<boolean>;
}

type DropdownType = 'banner' | 'chain' | 'gl' | 'status';

export const CreateMarketModal: React.FC<CreateMarketModalProps> = ({
  allMarkets,
  availableGLs,
  onClose,
  onSave
}) => {
  // Generate next available numeric ID
  const nextId = useMemo(() => {
    const existingIds = allMarkets
      .map(m => parseInt(m.internalId, 10))
      .filter(id => !isNaN(id));
    
    if (existingIds.length === 0) return '1';
    
    const maxId = Math.max(...existingIds);
    return String(maxId + 1);
  }, [allMarkets]);

  const [formData, setFormData] = useState<Partial<AdminMarket>>({
    internalId: nextId,
    name: '',
    address: '',
    city: '',
    postalCode: '',
    chain: '',
    banner: '',
    gebietsleiter: '',
    gebietsleiterName: '',
    gebietsleiterEmail: '',
    isActive: true,
    frequency: undefined,
    channel: '',
    marketTel: '',
    marketEmail: '',
    currentVisits: 0,
  });

  const [openDropdown, setOpenDropdown] = useState<DropdownType | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const dropdownRefs = useRef<Record<DropdownType, HTMLDivElement | null>>({
    banner: null,
    chain: null,
    gl: null,
    status: null
  });

  // Get unique values from existing markets
  const uniqueBanners = useMemo(() => 
    Array.from(new Set(allMarkets.map(m => m.banner).filter((b): b is string => Boolean(b)))).sort()
  , [allMarkets]);
  
  const uniqueChains = useMemo(() => 
    Array.from(new Set(allMarkets.map(m => m.chain).filter((c): c is string => Boolean(c)))).sort()
  , [allMarkets]);

  const statusOptions = ['Aktiv', 'Inaktiv'];

  // Click outside handler
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (openDropdown) {
        const ref = dropdownRefs.current[openDropdown];
        if (ref && !ref.contains(event.target as Node)) {
          setOpenDropdown(null);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [openDropdown]);

  const handleDropdownToggle = (dropdown: DropdownType) => {
    setOpenDropdown(openDropdown === dropdown ? null : dropdown);
  };

  const handleSelect = (field: string, value: any) => {
    if (field === 'gl') {
      const selectedGL = availableGLs.find(gl => gl.name === value);
      setFormData(prev => ({
        ...prev,
        gebietsleiterName: value,
        gebietsleiterEmail: selectedGL?.email || '',
        gebietsleiter: selectedGL?.id || ''
      }));
    } else if (field === 'status') {
      setFormData(prev => ({ ...prev, isActive: value === 'Aktiv' }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
    setOpenDropdown(null);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!formData.name?.trim()) {
      alert('Bitte geben Sie einen Namen ein');
      return;
    }
    if (!formData.chain?.trim()) {
      alert('Bitte wählen Sie eine Handelskette aus');
      return;
    }

    setIsSaving(true);
    try {
      const success = await onSave(formData);
      if (success) {
        onClose();
      }
    } catch (error) {
      console.error('Error creating market:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const renderDropdown = (
    type: DropdownType,
    label: string,
    options: string[],
    currentValue: string | undefined,
    field: string
  ) => {
    const isOpen = openDropdown === type;

    return (
      <div className={styles.field} ref={el => { dropdownRefs.current[type] = el; }}>
        <label className={styles.label}>{label}</label>
        <div 
          className={styles.dropdown}
          onClick={() => handleDropdownToggle(type)}
        >
          <span className={currentValue ? styles.dropdownValue : styles.dropdownPlaceholder}>
            {currentValue || `${label} auswählen`}
          </span>
          <CaretDown size={14} weight="bold" className={styles.dropdownIcon} />
        </div>
        {isOpen && (
          <div className={styles.dropdownMenu}>
            {options.length === 0 ? (
              <div className={styles.dropdownEmpty}>Keine Optionen verfügbar</div>
            ) : (
              options.map(option => (
                <div
                  key={option}
                  className={`${styles.dropdownOption} ${currentValue === option ? styles.dropdownOptionActive : ''}`}
                  onClick={() => handleSelect(field, option)}
                >
                  {option}
                </div>
              ))
            )}
          </div>
        )}
      </div>
    );
  };

  return ReactDOM.createPortal(
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerTitle}>
            <Plus size={22} weight="bold" className={styles.headerIcon} />
            <h3 className={styles.title}>Neuen Markt erstellen</h3>
          </div>
          <button className={styles.closeButton} onClick={onClose}>
            <X size={20} weight="bold" />
          </button>
        </div>

        {/* Content */}
        <div className={styles.content}>
          {/* Row 1: ID (auto-generated, readonly) & Banner */}
          <div className={styles.row}>
            <div className={styles.field}>
              <label className={styles.label}>ID (automatisch)</label>
              <input
                type="text"
                className={`${styles.input} ${styles.inputReadonly}`}
                value={formData.internalId || ''}
                readOnly
                disabled
              />
            </div>
            {renderDropdown('banner', 'Banner', uniqueBanners, formData.banner, 'banner')}
          </div>

          {/* Row 2: Handelskette & Channel */}
          <div className={styles.row}>
            {renderDropdown('chain', 'Handelskette', uniqueChains, formData.chain, 'chain')}
            <div className={styles.field}>
              <label className={styles.label}>Channel</label>
              <input
                type="text"
                className={styles.input}
                value={formData.channel || ''}
                onChange={(e) => handleInputChange('channel', e.target.value)}
                placeholder="z.B. LEH"
              />
            </div>
          </div>

          {/* Row 3: Name */}
          <div className={styles.field}>
            <label className={styles.label}>Name *</label>
            <input
              type="text"
              className={styles.input}
              value={formData.name || ''}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="Marktname eingeben"
            />
          </div>

          {/* Row 4: PLZ & Stadt */}
          <div className={styles.row}>
            <div className={styles.field}>
              <label className={styles.label}>PLZ</label>
              <input
                type="text"
                className={styles.input}
                value={formData.postalCode || ''}
                onChange={(e) => handleInputChange('postalCode', e.target.value)}
                placeholder="z.B. 1010"
              />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Stadt</label>
              <input
                type="text"
                className={styles.input}
                value={formData.city || ''}
                onChange={(e) => handleInputChange('city', e.target.value)}
                placeholder="z.B. Wien"
              />
            </div>
          </div>

          {/* Row 5: Straße */}
          <div className={styles.field}>
            <label className={styles.label}>Straße</label>
            <input
              type="text"
              className={styles.input}
              value={formData.address || ''}
              onChange={(e) => handleInputChange('address', e.target.value)}
              placeholder="Straße und Hausnummer"
            />
          </div>

          {/* Row 6: GL & GL Email */}
          <div className={styles.row}>
            {renderDropdown('gl', 'Gebietsleiter', availableGLs.map(gl => gl.name), formData.gebietsleiterName, 'gl')}
            <div className={styles.field}>
              <label className={styles.label}>GL Email</label>
              <input
                type="text"
                className={`${styles.input} ${styles.inputReadonly}`}
                value={formData.gebietsleiterEmail || ''}
                readOnly
                disabled
                placeholder="Wird automatisch ausgefüllt"
              />
            </div>
          </div>

          {/* Row 7: Market Contact */}
          <div className={styles.row}>
            <div className={styles.field}>
              <label className={styles.label}>Markt Telefon</label>
              <input
                type="text"
                className={styles.input}
                value={formData.marketTel || ''}
                onChange={(e) => handleInputChange('marketTel', e.target.value)}
                placeholder="z.B. +43 1 234567"
              />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Markt Email</label>
              <input
                type="email"
                className={styles.input}
                value={formData.marketEmail || ''}
                onChange={(e) => handleInputChange('marketEmail', e.target.value)}
                placeholder="z.B. markt@example.at"
              />
            </div>
          </div>

          {/* Row 8: Status & Frequenz */}
          <div className={styles.row}>
            {renderDropdown('status', 'Status', statusOptions, formData.isActive ? 'Aktiv' : 'Inaktiv', 'status')}
            <div className={styles.field}>
              <label className={styles.label}>Frequenz</label>
              <input
                type="number"
                className={styles.input}
                value={formData.frequency ?? ''}
                onChange={(e) => {
                  const val = e.target.value === '' ? undefined : Math.max(0, Math.min(12, parseInt(e.target.value) || 0));
                  setFormData(prev => ({ ...prev, frequency: val }));
                }}
                min={0}
                max={12}
                placeholder=""
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className={styles.footer}>
          <button className={styles.cancelButton} onClick={onClose} disabled={isSaving}>
            Abbrechen
          </button>
          <button 
            className={`${styles.saveButton} ${isSaving ? styles.saveButtonLoading : ''}`} 
            onClick={handleSave}
            disabled={isSaving || !formData.name?.trim() || !formData.chain?.trim()}
          >
            {isSaving ? 'Erstellen...' : 'Markt erstellen'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
