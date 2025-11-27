import React, { useState, useEffect } from 'react';
import styles from './DevPanel.module.css';

interface DevPanelProps {
  onCompleteNextMarket: () => void;
  onToggle?: (toggle: () => void) => void;
}

export const DevPanel: React.FC<DevPanelProps> = ({ onCompleteNextMarket, onToggle }) => {
  const [isOpen, setIsOpen] = useState(false);

  const togglePanel = () => {
    setIsOpen(prev => !prev);
  };

  // Expose toggle function to parent
  useEffect(() => {
    if (onToggle) {
      onToggle(togglePanel);
    }
  }, [onToggle]);

  // Toggle dev panel with Ctrl+Shift+D
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'D') {
        e.preventDefault();
        togglePanel();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (!isOpen) return null;

  return (
    <div className={styles.devPanel}>
      <div className={styles.devPanelHeader}>
        <span className={styles.devPanelTitle}>DEV PANEL</span>
        <button 
          className={styles.closeButton}
          onClick={() => setIsOpen(false)}
          aria-label="Close dev panel"
        >
          ×
        </button>
      </div>
      
      <div className={styles.buttonGrid}>
        <button className={styles.devButton} onClick={onCompleteNextMarket}>
          Complete Next Market
        </button>
        
        {/* Placeholder buttons for future functionality */}
        {Array.from({ length: 19 }, (_, i) => (
          <button key={i} className={styles.devButton} disabled>
            Function {i + 2}
          </button>
        ))}
      </div>
    </div>
  );
};

