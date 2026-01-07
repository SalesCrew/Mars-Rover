import React, { useState, useRef } from 'react';
import { X, Bug, PaperPlaneRight, Image as ImageIcon, CheckCircle } from '@phosphor-icons/react';
import { useAuth } from '../../contexts/AuthContext';
import { bugReportService } from '../../services/bugReportService';
import { API_BASE_URL } from '../../config/database';
import styles from './BugReportModal.module.css';

interface BugReportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BugReportModal: React.FC<BugReportModalProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const [description, setDescription] = useState('');
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setScreenshot(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setScreenshotPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveScreenshot = () => {
    setScreenshot(null);
    setScreenshotPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async () => {
    if (!description.trim() || !user) return;

    setIsSubmitting(true);
    try {
      let screenshotUrl: string | undefined;

      // Upload screenshot if provided (via backend)
      if (screenshot && screenshotPreview) {
        try {
          const uploadResponse = await fetch(`${API_BASE_URL}/bug-reports/upload`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              base64Data: screenshotPreview,
              fileName: screenshot.name,
              mimeType: screenshot.type,
              userId: user.id,
            }),
          });

          if (uploadResponse.ok) {
            const uploadData = await uploadResponse.json();
            screenshotUrl = uploadData.url;
          }
        } catch (uploadError) {
          console.error('Error uploading screenshot:', uploadError);
        }
      }

      // Create bug report
      const glName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email || 'Unknown';
      await bugReportService.createReport({
        gebietsleiter_id: user.id,
        gebietsleiter_name: glName,
        description: description.trim(),
        screenshot_url: screenshotUrl,
        page_url: window.location.href,
        user_agent: navigator.userAgent,
      });

      setIsSuccess(true);
      
      // Reset and close after showing success
      setTimeout(() => {
        setDescription('');
        setScreenshot(null);
        setScreenshotPreview(null);
        setIsSuccess(false);
        onClose();
      }, 2000);
    } catch (error) {
      console.error('Error submitting bug report:', error);
      alert('Fehler beim Senden. Bitte versuche es erneut.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setDescription('');
      setScreenshot(null);
      setScreenshotPreview(null);
      setIsSuccess(false);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={handleClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {isSuccess ? (
          <div className={styles.successContent}>
            <div className={styles.successIcon}>
              <CheckCircle size={64} weight="fill" />
            </div>
            <h2 className={styles.successTitle}>Danke für dein Feedback!</h2>
            <p className={styles.successText}>Wir schauen uns das an.</p>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className={styles.header}>
              <div className={styles.headerLeft}>
                <Bug size={24} weight="duotone" className={styles.headerIcon} />
                <div>
                  <h2 className={styles.title}>Bug melden</h2>
                  <p className={styles.subtitle}>Fehler aufgefallen? Lass es uns wissen!</p>
                </div>
              </div>
              <button className={styles.closeButton} onClick={handleClose}>
                <X size={20} weight="bold" />
              </button>
            </div>

            {/* Content */}
            <div className={styles.content}>
              <div className={styles.inputSection}>
                <textarea
                  className={styles.textarea}
                  placeholder="Beschreibe den Fehler so genau wie möglich..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={5}
                />
                <p className={styles.hint}>Was hast du gemacht? Was ist passiert? Was hast du erwartet?</p>
              </div>

              {/* Screenshot Section */}
              <div className={styles.screenshotSection}>
                {screenshotPreview ? (
                  <div className={styles.screenshotPreview}>
                    <img src={screenshotPreview} alt="Screenshot" />
                    <button className={styles.removeScreenshot} onClick={handleRemoveScreenshot}>
                      <X size={14} weight="bold" />
                    </button>
                  </div>
                ) : (
                  <button 
                    className={styles.addScreenshot}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <ImageIcon size={20} weight="regular" />
                    <span>Screenshot hinzufügen</span>
                  </button>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  style={{ display: 'none' }}
                />
              </div>
            </div>

            {/* Footer */}
            <div className={styles.footer}>
              <button
                className={styles.submitButton}
                onClick={handleSubmit}
                disabled={!description.trim() || isSubmitting}
              >
                <PaperPlaneRight size={18} weight="bold" />
                <span>{isSubmitting ? 'Senden...' : 'Absenden'}</span>
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
