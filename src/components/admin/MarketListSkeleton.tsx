import React from 'react';
import styles from './MarketListSkeleton.module.css';

export const MarketListSkeleton: React.FC = () => {
  // Generate 8 skeleton rows to fill the initial view
  const skeletonRows = Array.from({ length: 8 }, (_, i) => i);

  return (
    <div className={styles.skeletonWrapper}>
      {skeletonRows.map((index) => (
        <div key={index} className={styles.skeletonItem}>
          {/* Chain Cell - 180px */}
          <div className={styles.chainCell}>
            <div className={styles.skeletonBadge} />
          </div>
          
          {/* ID Cell - 80px */}
          <div className={styles.idCell}>
            <div className={styles.skeletonText} style={{ width: '60%' }} />
          </div>
          
          {/* Address Cell - 280px */}
          <div className={styles.addressCell}>
            <div className={styles.skeletonText} style={{ width: '85%', marginBottom: '4px' }} />
            <div className={styles.skeletonText} style={{ width: '65%' }} />
          </div>

          {/* Gebietsleiter Cell - 1fr */}
          <div className={styles.gebietsleiterCell}>
            <div className={styles.skeletonText} style={{ width: '70%' }} />
          </div>

          {/* Subgroup Cell - 160px */}
          <div className={styles.subgroupCell}>
            <div className={styles.skeletonText} style={{ width: '60%' }} />
          </div>

          {/* Last Visit - 60px */}
          <div className={styles.lastVisitCell}>
            <div className={styles.skeletonText} style={{ width: '100%' }} />
          </div>
          
          {/* Frequency Cell - 120px */}
          <div className={styles.frequencyCell}>
            <div className={styles.skeletonRing} />
          </div>
          
          {/* Status Cell - 100px */}
          <div className={styles.statusCell}>
            <div className={styles.skeletonDot} />
            <div className={styles.skeletonText} style={{ width: '60%' }} />
          </div>
        </div>
      ))}
    </div>
  );
};

