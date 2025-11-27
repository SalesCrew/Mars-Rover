import React, { useState, useEffect } from 'react';
import styles from './DevPanel.module.css';

interface DevPanelProps {
  onCompleteNextMarket: () => void;
  onToggle?: (toggle: () => void) => void;
}

export const DevPanel: React.FC<DevPanelProps> = ({ onCompleteNextMarket, onToggle }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [opacityMultiplier, setOpacityMultiplier] = useState(1);

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

  // Apply opacity multiplier to all elements
  const panelStyle = {
    '--opacity-multiplier': opacityMultiplier,
  } as React.CSSProperties;

  return (
    <div className={styles.devPanel} style={panelStyle}>
      <div className={styles.devPanelHeader}>
        <span className={styles.devPanelTitle}>DEV PANEL</span>
        <div className={styles.headerControls}>
          <select 
            className={styles.opacitySelect}
            value={opacityMultiplier}
            onChange={(e) => setOpacityMultiplier(Number(e.target.value))}
            aria-label="Adjust opacity"
          >
            <option value={1}>100%</option>
            <option value={0.9}>90%</option>
            <option value={0.8}>80%</option>
            <option value={0.7}>70%</option>
            <option value={0.6}>60%</option>
            <option value={0.5}>50%</option>
            <option value={0.4}>40%</option>
            <option value={0.3}>30%</option>
            <option value={0.2}>20%</option>
            <option value={0.1}>10%</option>
          </select>
          <button 
            className={styles.closeButton}
            onClick={() => setIsOpen(false)}
            aria-label="Close dev panel"
          >
            ×
          </button>
        </div>
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

