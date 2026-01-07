import React from 'react';
import { SignOut, Bug } from '@phosphor-icons/react';
import styles from './Header.module.css';

interface HeaderProps {
  firstName: string;
  avatar: string;
  onLogout?: () => void;
  onProfileClick?: () => void;
  onLogoClick?: () => void;
  onBugReport?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ firstName, avatar, onLogout, onProfileClick, onLogoClick, onBugReport }) => {
  return (
    <header className={styles.header}>
      <div className={styles.headerContent}>
        <button 
          className={styles.appName}
          onClick={onLogoClick}
          aria-label="Go to Dashboard"
        >
          Mars Rover
        </button>
        
        <div className={styles.greeting}>
          Guten Tag, {firstName}
        </div>
        
        <div className={styles.headerActions}>
          <button 
            className={styles.bugButton} 
            aria-label="Bug melden"
            onClick={onBugReport}
            title="Bug melden"
          >
            <Bug size={20} weight="regular" />
          </button>
          
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

