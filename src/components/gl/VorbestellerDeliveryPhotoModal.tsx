import React, { useState, useRef } from 'react';
import { Camera, Storefront, Package, Clock, X, Check, Plus } from '@phosphor-icons/react';
import { ClipLoader } from 'react-spinners';
import type { PendingDeliverySubmission } from '../../services/wellenService';
import styles from './VorbestellerDeliveryPhotoModal.module.css';

interface VorbestellerDeliveryPhotoModalProps {
  isOpen: boolean;
  marketName: string;
  lastVisitDate: string;
  pendingSubmissions: PendingDeliverySubmission[];
  onUploadPhotos: (photos: { submissionId: string; photoBase64: string }[]) => Promise<void>;
  onSkip: () => void;
  onClose: () => void;
}

// Format date from ISO to German format (e.g., "15. Januar 2026")
const formatDateGerman = (dateStr: string): string => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const options: Intl.DateTimeFormatOptions = { 
    day: 'numeric', 
    month: 'long', 
    year: 'numeric' 
  };
  return date.toLocaleDateString('de-DE', options);
};

// Get item type label in German
const getItemTypeLabel = (itemType: string): string => {
  switch (itemType) {
    case 'display': return 'Display';
    case 'kartonware': return 'Kartonware';
    case 'palette': return 'Palette';
    case 'schuette': return 'Schütte';
    case 'einzelprodukt': return 'Einzelprodukt';
    default: return itemType;
  }
};

export const VorbestellerDeliveryPhotoModal: React.FC<VorbestellerDeliveryPhotoModalProps> = ({
  isOpen,
  marketName,
  lastVisitDate,
  pendingSubmissions,
  onUploadPhotos,
  onSkip,
  onClose
}) => {
  // Track photos per submission ID
  const [photosBySubmission, setPhotosBySubmission] = useState<Record<string, string>>({});
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [activeSubmissionId, setActiveSubmissionId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const formattedDate = formatDateGerman(lastVisitDate);
  const photosCount = Object.keys(photosBySubmission).length;

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && activeSubmissionId) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotosBySubmission(prev => ({
          ...prev,
          [activeSubmissionId]: reader.result as string
        }));
        setActiveSubmissionId(null);
      };
      reader.readAsDataURL(file);
    }
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleAddPhoto = (submissionId: string) => {
    setActiveSubmissionId(submissionId);
    fileInputRef.current?.click();
  };

  const handleRemovePhoto = (submissionId: string) => {
    setPhotosBySubmission(prev => {
      const newPhotos = { ...prev };
      delete newPhotos[submissionId];
      return newPhotos;
    });
  };

  const handleUpload = async () => {
    if (photosCount === 0) return;
    
    setIsUploading(true);
    try {
      const photosArray = Object.entries(photosBySubmission).map(([submissionId, photoBase64]) => ({
        submissionId,
        photoBase64
      }));
      await onUploadPhotos(photosArray);
      setUploadSuccess(true);
      
      // Close after brief success animation
      setTimeout(() => {
        setUploadSuccess(false);
        setPhotosBySubmission({});
        onSkip(); // Proceed to next step
      }, 1500);
    } catch (error) {
      console.error('Error uploading photos:', error);
      alert('Fehler beim Hochladen. Bitte versuche es erneut.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSkip = () => {
    setPhotosBySubmission({});
    onSkip();
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.modalHeader}>
          <div className={styles.iconWrapper}>
            <Camera size={28} weight="duotone" />
          </div>
          <div className={styles.headerInfo}>
            <h2 className={styles.modalTitle}>Vorbesteller Lieferung</h2>
            <span className={styles.marketName}>
              <Storefront size={14} weight="fill" />
              {marketName}
            </span>
          </div>
          <button className={styles.closeButton} onClick={onClose}>
            <X size={20} weight="bold" />
          </button>
        </div>

        {/* Content */}
        <div className={styles.modalContent}>
          {uploadSuccess ? (
            <div className={styles.successState}>
              <div className={styles.successIcon}>
                <Check size={48} weight="bold" />
              </div>
              <h3 className={styles.successTitle}>Foto erfolgreich hochgeladen!</h3>
            </div>
          ) : isUploading ? (
            <div className={styles.loadingState}>
              <ClipLoader color="#8B5CF6" size={50} />
              <p className={styles.loadingText}>Fotos werden hochgeladen...</p>
            </div>
          ) : (
            <>
              {/* Last Visit Info */}
              <div className={styles.lastVisitInfo}>
                <Clock size={18} weight="fill" />
                <span>
                  Beim letzten Besuch am <strong>{formattedDate}</strong> hast du folgendes vorbestellt:
                </span>
              </div>

              {/* Ordered Items List - Admin style with photo upload per item */}
              <div className={styles.itemsList}>
                {pendingSubmissions.map((submission) => {
                  const hasNestedProducts = submission.products && submission.products.length > 0;
                  const hasPhoto = !!photosBySubmission[submission.id];
                  
                  return (
                    <div key={submission.id} className={styles.activityItemWrapper}>
                      {/* Parent Item */}
                      <div className={`${styles.activityItem} ${hasNestedProducts ? styles.activityItemParent : ''}`}>
                        <Package size={14} weight="fill" />
                        <span className={styles.itemQty}>{submission.quantity}x</span>
                        <span className={styles.itemName}>{submission.itemName}</span>
                        <span className={`${styles.itemType} ${submission.itemType === 'palette' ? styles.itemTypePalette : submission.itemType === 'schuette' ? styles.itemTypeSchuette : submission.itemType === 'einzelprodukt' ? styles.itemTypeEinzelprodukt : ''}`}>
                          {getItemTypeLabel(submission.itemType)}
                        </span>
                        {/* Photo add button */}
                        <button
                          className={`${styles.itemPhotoBtn} ${hasPhoto ? styles.itemPhotoBtnActive : ''}`}
                          onClick={() => handleAddPhoto(submission.id)}
                          title={hasPhoto ? 'Foto ändern' : 'Foto hinzufügen'}
                        >
                          {hasPhoto ? <Check size={12} weight="bold" /> : <Plus size={12} weight="bold" />}
                        </button>
                      </div>
                      
                      {/* Nested Products for Palette/Schütte */}
                      {hasNestedProducts && (
                        <div className={styles.nestedProducts}>
                          {submission.products!.map((product, idx) => (
                            <div key={`${submission.id}-${idx}`} className={styles.nestedProduct}>
                              <span className={styles.nestedQty}>{product.quantity}x</span>
                              <span className={styles.nestedName}>"{product.name}"</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Photo preview for this item */}
                      {hasPhoto && (
                        <div className={styles.itemPhotoPreview}>
                          <img 
                            src={photosBySubmission[submission.id]} 
                            alt={`Foto: ${submission.itemName}`} 
                            className={styles.itemPreviewImage} 
                          />
                          <button
                            className={styles.itemRemovePhotoBtn}
                            onClick={() => handleRemovePhoto(submission.id)}
                            title="Foto entfernen"
                          >
                            <X size={12} weight="bold" />
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>


              {/* Photo Summary */}
              <div className={styles.photoSummary}>
                <Camera size={16} weight="fill" />
                <span>
                  {photosCount === 0 
                    ? 'Noch keine Fotos hinzugefügt' 
                    : `${photosCount} ${photosCount === 1 ? 'Foto' : 'Fotos'} ausgewählt`}
                </span>
              </div>

              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileSelect}
                style={{ display: 'none' }}
              />
            </>
          )}
        </div>

        {/* Actions */}
        {!uploadSuccess && !isUploading && (
          <div className={styles.modalActions}>
            <button 
              className={styles.secondaryButton}
              onClick={handleSkip}
            >
              Überspringen
            </button>
            <button 
              className={`${styles.primaryButton} ${photosCount === 0 ? styles.primaryButtonDisabled : ''}`}
              onClick={handleUpload}
              disabled={photosCount === 0}
            >
              <Camera size={18} weight="bold" />
              {photosCount === 0 ? 'Fotos hochladen' : `${photosCount} ${photosCount === 1 ? 'Foto' : 'Fotos'} hochladen`}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
