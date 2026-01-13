import React from 'react';
import { TrendUp, TrendDown, Storefront, ChartBar } from '@phosphor-icons/react';
import styles from './ChainAverageCard.module.css';

interface ChainAverageData {
  chainName: string;
  chainColor: string;
  goalType: 'percentage' | 'value';
  goalPercentage?: number;
  goalValue?: number;
  totalMarkets: number;
  marketsWithProgress: number;
  currentPercentage?: number;
  currentValue?: number;
  totalValue?: number;
}

interface ChainAverageCardProps {
  data: ChainAverageData;
}

export const ChainAverageCard: React.FC<ChainAverageCardProps> = ({ data }) => {
  const {
    chainName,
    chainColor,
    goalType,
    goalPercentage,
    goalValue,
    totalMarkets,
    marketsWithProgress,
    currentPercentage,
    currentValue,
    // totalValue - not used, progress bar uses goalValue instead
  } = data;

  const remainingMarkets = totalMarkets - marketsWithProgress;
  
  // Calculate progress percentage for the bar
  // For value-based goals, use goalValue (the target) not totalValue
  const progressPercentage = goalType === 'percentage'
    ? (currentPercentage || 0)
    : goalValue && goalValue > 0
      ? Math.min(100, ((currentValue || 0) / goalValue) * 100)
      : 0;

  // Check if goal is met
  const goalMet = goalType === 'percentage'
    ? (currentPercentage || 0) >= (goalPercentage || 100)
    : (currentValue || 0) >= (goalValue || 0);

  return (
    <div className={styles.card}>
      {/* Chain Badge */}
      <div className={styles.header}>
        <span className={styles.chainBadge} style={{ background: chainColor }}>
          {chainName}
        </span>
        {goalMet && (
          <div className={styles.goalBadge}>
            <TrendUp size={14} weight="bold" />
            <span>Ziel erreicht</span>
          </div>
        )}
      </div>

      {/* Main Display */}
      <div className={styles.mainDisplay}>
        {goalType === 'percentage' ? (
          <>
            <div className={`${styles.value} ${goalMet ? styles.valueSuccess : ''}`}>
              {currentPercentage || 0}%
            </div>
            <div className={styles.goal}>von {goalPercentage}%</div>
          </>
        ) : (
          <>
            <div className={`${styles.value} ${goalMet ? styles.valueSuccess : ''}`}>
              €{(currentValue || 0).toLocaleString('de-DE')}
            </div>
            <div className={styles.goal}>von €{(goalValue || 0).toLocaleString('de-DE')}</div>
          </>
        )}
      </div>

      {/* Progress Bar */}
      <div className={styles.progressTrack}>
        <div
          className={`${styles.progressBar} ${goalMet ? styles.progressSuccess : ''}`}
          style={{ width: `${Math.min(progressPercentage, 100)}%` }}
        />
      </div>

      {/* Metrics */}
      <div className={styles.metrics}>
        <div className={styles.metric}>
          <div className={styles.metricIcon}>
            <Storefront size={14} weight="fill" />
          </div>
          <div className={styles.metricInfo}>
            <div className={styles.metricValue}>
              {totalMarkets}
            </div>
            <div className={styles.metricLabel}>Gesamt</div>
          </div>
        </div>
        <div className={styles.metric}>
          <div className={styles.metricIcon}>
            <ChartBar size={14} weight="fill" />
          </div>
          <div className={styles.metricInfo}>
            <div className={styles.metricValue}>
              {marketsWithProgress}
            </div>
            <div className={styles.metricLabel}>Mit Fortschritt</div>
          </div>
        </div>
        <div className={styles.metric}>
          <div className={styles.metricIcon}>
            <TrendDown size={14} weight="fill" />
          </div>
          <div className={styles.metricInfo}>
            <div className={styles.metricValue}>
              {remainingMarkets}
            </div>
            <div className={styles.metricLabel}>Fehlen noch</div>
          </div>
        </div>
      </div>
    </div>
  );
};
