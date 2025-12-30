import React from 'react';
import { SignOut } from '@phosphor-icons/react';
import styles from './Header.module.css';

interface HeaderProps {
  firstName: string;
  avatar: string;
  onDevPanelToggle?: () => void;
  onLogout?: () => void;
  onProfileClick?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ firstName, avatar, onDevPanelToggle, onLogout, onProfileClick }) => {
  return (
    <header className={styles.header}>
      <div className={styles.headerContent}>
        <button 
          className={styles.appName}
          onClick={onDevPanelToggle}
          aria-label="Toggle Dev Panel"
        >
          Mars Rover
        </button>
        
        <div className={styles.greeting}>
          Guten Tag, {firstName}
        </div>
        
        <div className={styles.headerActions}>
          <button 
            className={styles.logoutButton} 
            aria-label="Abmelden"
            onClick={onLogout}
            title="Abmelden"
          >
            <SignOut size={20} weight="regular" />
          </button>
          
          <button 
            className={styles.avatarButton} 
            aria-label="Profil"
            onClick={onProfileClick}
          >
            <img src={avatar} alt={firstName} />
          </button>
        </div>
      </div>
    </header>
  );
};

