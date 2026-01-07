import React, { useState, useEffect } from 'react';
import { ShoppingCart } from '@phosphor-icons/react';
import { API_BASE_URL } from '../../config/database';
import styles from './PreorderNotification.module.css';

interface Welle {
  id: string;
  name: string;
  image: string | null;
  startDate: string;
  endDate: string;
  kwDays?: Array<{ kw: string; days: string[] }>;
}

interface PreorderNotificationProps {
  trigger?: number;
  onOpenVorbesteller?: () => void;
}

// Get current day abbreviation in German
const getCurrentDayAbbr = (): string => {
  const days = ['SO', 'MO', 'DI', 'MI', 'DO', 'FR', 'SA'];
  return days[new Date().getDay()];
};

// Get current calendar week
const getCurrentKW = (): string => {
  const now = new Date();
  const firstDayOfYear = new Date(now.getFullYear(), 0, 1);
  const pastDaysOfYear = (now.getTime() - firstDayOfYear.getTime()) / 86400000;
  const weekNumber = Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
  return `KW${weekNumber}`;
};

// Check if a wave is sellable today
const isWaveSellableToday = (welle: Welle): boolean => {
  if (!welle.kwDays || welle.kwDays.length === 0) return false;
  
  const currentDay = getCurrentDayAbbr();
  const currentKW = getCurrentKW();
  
  return welle.kwDays.some(kwDay => {
    const matchesKW = kwDay.kw.toUpperCase() === currentKW.toUpperCase();
    const matchesDay = kwDay.days.some(day => day.toUpperCase() === currentDay);
    return matchesKW && matchesDay;
  });
};

export const PreorderNotification: React.FC<PreorderNotificationProps> = ({ 
  trigger = 0,
  onOpenVorbesteller 
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [activeWaves, setActiveWaves] = useState<Welle[]>([]);

  // Fetch active wellen
  useEffect(() => {
    const fetchActiveWaves = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/wellen`);
        if (response.ok) {
          const wellen = await response.json();
          // Filter for active waves that are sellable today
          const sellableToday = wellen.filter((w: Welle) => 
            w.startDate && w.endDate && isWaveSellableToday(w)
          );
          setActiveWaves(sellableToday);
        }
      } catch (error) {
        console.error('Error fetching waves:', error);
      }
    };

    fetchActiveWaves();
  }, []);

  useEffect(() => {
    if (activeWaves.length === 0) return;

    if (trigger === 0) {
      // Initial auto-show on page load
      const slideInTimer = setTimeout(() => {
        setIsVisible(true);
      }, 500);

      const slideOutTimer = setTimeout(() => {
        setIsVisible(false);
      }, 6000);

      return () => {
        clearTimeout(slideInTimer);
        clearTimeout(slideOutTimer);
      };
    } else {
      // Manual trigger from button click
      setIsVisible(true);
      
      const slideOutTimer = setTimeout(() => {
        setIsVisible(false);
      }, 5000);

      return () => {
        clearTimeout(slideOutTimer);
      };
    }
  }, [trigger, activeWaves.length]);

  const handleClick = () => {
    if (onOpenVorbesteller) {
      onOpenVorbesteller();
    }
    setIsVisible(false);
  };

  if (activeWaves.length === 0) return null;

  return (
    <div className={styles.notificationsContainer}>
      {activeWaves.map((wave, index) => (
        <div 
          key={wave.id}
          className={`${styles.notificationCard} ${isVisible ? styles.visible : ''}`}
          style={{ 
            transitionDelay: `${index * 100}ms`,
            top: `calc(var(--header-height) + var(--space-xl) + ${index * 160}px)`
          }}
          onClick={handleClick}
        >
          <div className={styles.imageSection}>
            {wave.image ? (
              <img 
                src={wave.image} 
                alt={wave.name}
                className={styles.image}
              />
            ) : (
              <div className={styles.imagePlaceholder}>
                <ShoppingCart size={32} weight="duotone" />
              </div>
            )}
          </div>
          
          <div className={styles.contentSection}>
            <div className={styles.header}>
              <h3 className={styles.title}>{wave.name}</h3>
            </div>
            
            <button className={styles.orderButton}>
              <ShoppingCart size={16} weight="bold" />
              <span>Jetzt vorbestellen</span>
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};
