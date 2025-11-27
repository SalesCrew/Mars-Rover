import React from 'react';
import { Bell } from '@phosphor-icons/react';
import styles from './Header.module.css';

interface HeaderProps {
  firstName: string;
  avatar: string;
}

export const Header: React.FC<HeaderProps> = ({ firstName, avatar }) => {
  return (
    <header className={styles.header}>
      <div className={styles.headerContent}>
        <div className={styles.appName}>
          Mars Rover
        </div>
        
        <div className={styles.greeting}>
          Guten Tag, {firstName}
        </div>
        
        <div className={styles.headerActions}>
          <button className={styles.notificationButton} aria-label="Benachrichtigungen">
            <Bell size={20} weight="regular" />
          </button>
          
          <button className={styles.avatarButton} aria-label="Profil">
            <img src={avatar} alt={firstName} />
          </button>
        </div>
      </div>
    </header>
  );
};

