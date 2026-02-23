import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { X, Path, ArrowRight, MapPin, Car, CalendarCheck, User, NavigationArrow } from '@phosphor-icons/react';
import { API_ENDPOINTS } from '../../config/database';
import styles from './StichprobeModal.module.css';

export interface StichprobeSegment {
  fromMarket: { name: string; chain: string; address: string; city: string; postalCode: string };
  toMarket: { name: string; chain: string; address: string; city: string; postalCode: string };
  appDurationMinutes: number;
  fromEndTime: string;
  toStartTime: string;
}

interface GoogleResult {
  durationSeconds: number;
  durationText: string;
  distanceText: string;
  status: string;
}

interface StichprobeModalProps {
  glName: string;
  date: string;
  segments: StichprobeSegment[];
  onClose: () => void;
}

const formatMinutes = (min: number): string => {
  const h = Math.floor(min / 60);
  const m = Math.round(min % 60);
  return `${h}:${m.toString().padStart(2, '0')}`;
};

const getChainBadgeStyle = (chain: string): React.CSSProperties => {
  const upperChain = chain.toUpperCase();
  const gradients: Record<string, [string, string]> = {
    'BILLA+': ['#FED304', '#EAB308'],
    'BILLA PLUS': ['#FED304', '#EAB308'],
    'BILLA': ['#F59E0B', '#D97706'],
    'SPAR': ['#EF4444', '#DC2626'],
    'EUROSPAR': ['#DC2626', '#B91C1C'],
    'INTERSPAR': ['#B91C1C', '#991B1B'],
    'SPAR GOURMET': ['#059669', '#047857'],
    'HOFER': ['#3B82F6', '#2563EB'],
    'MERKUR': ['#10B981', '#059669'],
    'ADEG': ['#8B5CF6', '#7C3AED'],
    'FUTTERHAUS': ['#F97316', '#EA580C'],
    'PENNY': ['#3B82F6', '#2563EB'],
  };
  const colors = gradients[upperChain] || ['#6B7280', '#4B5563'];
  return {
    background: `linear-gradient(135deg, ${colors[0]} 0%, ${colors[1]} 100%)`,
    color: 'white',
    padding: '3px 8px',
    borderRadius: '5px',
    fontSize: '10px',
    fontWeight: 700,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.04em',
    whiteSpace: 'nowrap' as const,
  };
};

const buildAddress = (m: { address: string; postalCode: string; city: string }): string => {
  const parts = [m.address, m.postalCode, m.city].filter(Boolean);
  return parts.join(', ');
};

const StichprobeModal: React.FC<StichprobeModalProps> = ({ glName, date, segments, onClose }) => {
  const [googleResults, setGoogleResults] = useState<(GoogleResult | null)[]>(new Array(segments.length).fill(null));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (segments.length === 0) {
      setLoading(false);
      return;
    }

    const fetchDrivingTimes = async () => {
      try {
        const pairs = segments.map(seg => ({
          originAddress: buildAddress(seg.fromMarket),
          destinationAddress: buildAddress(seg.toMarket),
        }));

        const resp = await fetch(API_ENDPOINTS.maps.drivingTimes, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ pairs }),
        });

        if (!resp.ok) throw new Error('API error');

        const data = await resp.json();
        const results: (GoogleResult | null)[] = data.results.map((r: any) =>
          r.status === 'OK'
            ? { durationSeconds: r.durationSeconds, durationText: r.durationText, distanceText: r.distanceText, status: r.status }
            : null
        );
        setGoogleResults(results);
      } catch {
        setGoogleResults(new Array(segments.length).fill(null));
      } finally {
        setLoading(false);
      }
    };

    fetchDrivingTimes();
  }, [segments]);

  const formatDate = (d: string): string => {
    const parts = d.split('-');
    if (parts.length === 3) return `${parts[2]}.${parts[1]}.${parts[0]}`;
    return d;
  };

  const avgDeviation = (): number | null => {
    const deviations: number[] = [];
    segments.forEach((seg, i) => {
      const gr = googleResults[i];
      if (gr) {
        const googleMin = gr.durationSeconds / 60;
        deviations.push(seg.appDurationMinutes - googleMin);
      }
    });
    if (deviations.length === 0) return null;
    return deviations.reduce((a, b) => a + b, 0) / deviations.length;
  };

  const getDeltaClass = (deltaMin: number): string => {
    const abs = Math.abs(deltaMin);
    if (abs <= 5) return styles.deltaGreen;
    if (abs <= 15) return styles.deltaAmber;
    return styles.deltaRed;
  };

  const avg = avgDeviation();

  const modal = (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <div className={styles.titleRow}>
              <div className={styles.titleIcon}>
                <NavigationArrow size={18} weight="fill" />
              </div>
              <h2 className={styles.title}>Stichprobe Fahrtzeiten</h2>
            </div>
            <span className={styles.subtitle}>Vergleich der erfassten Fahrtzeiten mit Google Maps Schätzungen</span>
          </div>
          <button className={styles.closeButton} onClick={onClose}>
            <X size={20} weight="bold" />
          </button>
        </div>

        {/* Meta */}
        <div className={styles.meta}>
          <span className={styles.metaBadge}>
            <User size={14} weight="fill" />
            {glName}
          </span>
          <span className={styles.metaBadge}>
            <CalendarCheck size={14} weight="fill" />
            {formatDate(date)}
          </span>
          <span className={styles.metaBadge}>
            <Path size={14} weight="fill" />
            {segments.length} {segments.length === 1 ? 'Strecke' : 'Strecken'}
          </span>
        </div>

        {/* Body */}
        <div className={styles.body}>
          {loading ? (
            <div className={styles.loading}>
              <div className={styles.spinner} />
              <span>Google Maps Daten werden geladen...</span>
            </div>
          ) : segments.length === 0 ? (
            <div className={styles.empty}>
              <div className={styles.emptyIcon}>
                <Car size={24} weight="light" />
              </div>
              <span className={styles.emptyText}>
                Keine aufeinanderfolgenden Marktbesuche<br />für Vergleich gefunden
              </span>
            </div>
          ) : (
            <div className={styles.segments}>
              {segments.map((seg, idx) => {
                const gr = googleResults[idx];
                const googleMin = gr ? gr.durationSeconds / 60 : null;
                const deltaMin = googleMin !== null ? seg.appDurationMinutes - googleMin : null;

                return (
                  <div key={idx} className={styles.segmentCard}>
                    {/* Route header */}
                    <div className={styles.route}>
                      <div className={styles.routeMarket}>
                        <span className={styles.chainBadge} style={getChainBadgeStyle(seg.fromMarket.chain)}>
                          {seg.fromMarket.chain}
                        </span>
                        <span className={styles.routeMarketName}>{seg.fromMarket.name}</span>
                      </div>
                      <ArrowRight size={16} weight="bold" className={styles.routeArrow} />
                      <div className={styles.routeMarket}>
                        <span className={styles.chainBadge} style={getChainBadgeStyle(seg.toMarket.chain)}>
                          {seg.toMarket.chain}
                        </span>
                        <span className={styles.routeMarketName}>{seg.toMarket.name}</span>
                      </div>
                    </div>

                    {/* Address row */}
                    <div className={styles.addressRow}>
                      <span className={styles.addressText}>
                        <MapPin size={10} weight="fill" style={{ marginRight: 3, opacity: 0.6 }} />
                        {buildAddress(seg.fromMarket)}
                      </span>
                      <div className={styles.addressArrowSpacer} />
                      <span className={styles.addressText}>
                        <MapPin size={10} weight="fill" style={{ marginRight: 3, opacity: 0.6 }} />
                        {buildAddress(seg.toMarket)}
                      </span>
                    </div>

                    {/* Comparison boxes */}
                    <div className={styles.comparison}>
                      <div className={`${styles.comparisonBox} ${styles.comparisonBoxApp}`}>
                        <span className={`${styles.comparisonLabel} ${styles.comparisonLabelApp}`}>Erfasst</span>
                        <span className={`${styles.comparisonTime} ${styles.comparisonTimeApp}`}>
                          {formatMinutes(seg.appDurationMinutes)}
                        </span>
                        <span className={styles.comparisonDistance}>
                          {seg.fromEndTime} → {seg.toStartTime}
                        </span>
                      </div>
                      <div className={`${styles.comparisonBox} ${styles.comparisonBoxGoogle}`}>
                        <span className={`${styles.comparisonLabel} ${styles.comparisonLabelGoogle}`}>Google Maps</span>
                        {gr ? (
                          <>
                            <span className={`${styles.comparisonTime} ${styles.comparisonTimeGoogle}`}>
                              {formatMinutes(gr.durationSeconds / 60)}
                            </span>
                            <span className={styles.comparisonDistance}>{gr.distanceText}</span>
                          </>
                        ) : (
                          <span className={styles.segmentError}>Nicht verfügbar</span>
                        )}
                      </div>
                    </div>

                    {/* Delta pill */}
                    {deltaMin !== null && (
                      <div className={`${styles.deltaPill} ${getDeltaClass(deltaMin)}`}>
                        {deltaMin >= 0 ? '+' : ''}{Math.round(deltaMin)} min
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        {!loading && segments.length > 0 && avg !== null && (
          <div className={styles.footer}>
            <div className={styles.summary}>
              <span>Durchschnittliche Abweichung:</span>
              <span className={`${styles.summaryValue} ${getDeltaClass(avg)}`} style={{ border: 'none', background: 'none', padding: 0, fontSize: '14px' }}>
                {avg >= 0 ? '+' : ''}{Math.round(avg)} min
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return ReactDOM.createPortal(modal, document.body);
};

export default StichprobeModal;
