import React, { useState, useRef, useEffect } from 'react';
import { Check, Play, CheckCircle } from '@phosphor-icons/react';
import type { TourRoute } from '../../types/market-types';
import type { User } from '../../types/gl-types';
import { Header } from './Header';
import Aurora from './Aurora';
import StarBorder from './StarBorder';
import SpotlightCard from './SpotlightCard';
import { AnimatedListWrapper } from './AnimatedListWrapper';
import { DevPanel } from './DevPanel';
import { TourCompletionModal } from './TourCompletionModal';
import styles from './TourPage.module.css';

interface TourPageProps {
  route: TourRoute;
  user: User;
  onBack: () => void;
}

export const TourPage: React.FC<TourPageProps> = ({ route, user, onBack }) => {
  const [startTime] = useState<Date>(new Date());
  const [completedMarketIds, setCompletedMarketIds] = useState<string[]>([]);
  const [endTime, setEndTime] = useState<Date | null>(null);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [showMapsModal, setShowMapsModal] = useState(false);
  const marketsListRef = useRef<HTMLDivElement>(null);
  const activeMarketRef = useRef<HTMLDivElement>(null);
  const stackedContainerRef = useRef<HTMLDivElement>(null);
  const isScrollingRef = useRef(false);
  const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const touchStartRef = useRef(0);
  const devPanelToggleRef = useRef<(() => void) | null>(null);
  
  // Current scroll position (which card is at position 0)
  const [scrollIndex, setScrollIndex] = useState(0);
  
  // For demo purposes, let's say the first market is active if none are completed,
  // or the one after the last completed one.
  const activeMarketId = route.optimizedOrder.find(id => !completedMarketIds.includes(id)) || null;
  
  // Get markets that aren't completed
  const pendingMarkets = route.optimizedOrder.filter(id => !completedMarketIds.includes(id));
  const totalPendingMarkets = pendingMarkets.length;
  
  // Check if tour is completed
  const isTourCompleted = completedMarketIds.length === route.optimizedOrder.length;
  
  // Set end time when tour is completed
  useEffect(() => {
    if (isTourCompleted && !endTime) {
      setEndTime(new Date());
    }
  }, [isTourCompleted, endTime]);

  // Calculate actual duration
  const getActualDuration = () => {
    if (!endTime) return '';
    const diffMs = endTime.getTime() - startTime.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const hours = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    return `${hours}h ${mins}min`;
  };

  // Use native event listeners with { passive: false } to properly prevent scroll
  useEffect(() => {
    const container = stackedContainerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      e.stopPropagation();
      
      if (isScrollingRef.current) return;
      
      if (e.deltaY > 15) {
        setScrollIndex(prev => {
          if (prev < totalPendingMarkets - 1) {
            isScrollingRef.current = true;
            return prev + 1;
          }
          return prev;
        });
      } else if (e.deltaY < -15) {
        setScrollIndex(prev => {
          if (prev > 0) {
            isScrollingRef.current = true;
            return prev - 1;
          }
          return prev;
        });
      } else {
        return;
      }
      
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
      scrollTimeoutRef.current = setTimeout(() => {
        isScrollingRef.current = false;
      }, 350);
    };

    const handleTouchStart = (e: TouchEvent) => {
      touchStartRef.current = e.touches[0].clientY;
    };

    const handleTouchMove = (e: TouchEvent) => {
      // This is the key - prevent default with passive: false stops page scroll
      e.preventDefault();
      e.stopPropagation();
    };

    const handleTouchEnd = (e: TouchEvent) => {
      e.stopPropagation();
      
      if (isScrollingRef.current) return;
      
      const touchEnd = e.changedTouches[0].clientY;
      const diff = touchStartRef.current - touchEnd;
      
      if (Math.abs(diff) > 40) {
        if (diff > 0) {
          setScrollIndex(prev => {
            if (prev < totalPendingMarkets - 1) {
              isScrollingRef.current = true;
              return prev + 1;
            }
            return prev;
          });
        } else {
          setScrollIndex(prev => {
            if (prev > 0) {
              isScrollingRef.current = true;
              return prev - 1;
            }
            return prev;
          });
        }
        
        if (scrollTimeoutRef.current) {
          clearTimeout(scrollTimeoutRef.current);
        }
        scrollTimeoutRef.current = setTimeout(() => {
          isScrollingRef.current = false;
        }, 350);
      }
    };

    // Add listeners with { passive: false } to allow preventDefault
    container.addEventListener('wheel', handleWheel, { passive: false });
    container.addEventListener('touchstart', handleTouchStart, { passive: true });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd, { passive: false });

    return () => {
      container.removeEventListener('wheel', handleWheel);
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [totalPendingMarkets]);

  // Calculate position for each card based on scrollIndex
  const getCardPosition = (cardIndex: number): number => {
    return cardIndex - scrollIndex;
  };

  // Get styles for a card based on its position
  // All cards use the same positioning system - they slide up/down based on position
  // Negative positions: slid up and hidden above container
  // Position 0: current/active card at top, full size
  // Positive positions: stacked below, progressively smaller
  const cardHeight = 92; // Height of each card including gap
  
  const getCardStyles = (position: number): React.CSSProperties => {
    // Base top position - each card's vertical position based on its slot
    // Position 0 = top of container, position 1 = one card height down, etc.
    // Negative positions go above (and get clipped by overflow:hidden)
    const baseTop = position * cardHeight;
    
    if (position < 0) {
      // Negative positions: slide UP and out of view (behind container top)
      return {
        transform: 'scale(1)',
        opacity: 0,
        zIndex: 0,
        pointerEvents: 'none',
        position: 'absolute',
        top: `${baseTop}px`,
        left: 0,
        right: 0,
      };
    } else if (position === 0) {
      // Position 0: current/active card - full size at top
      return {
        transform: 'scale(1)',
        opacity: 1,
        zIndex: 10,
        position: 'absolute',
        top: `${baseTop}px`,
        left: 0,
        right: 0,
      };
    } else {
      // Positive positions: stacked below, progressively smaller
      const scale = Math.max(0.88, 1 - position * 0.025);
      const opacity = Math.max(0.4, 1 - position * 0.12);
      
      return {
        transform: `scale(${scale})`,
        opacity,
        zIndex: 10 - position,
        position: 'absolute',
        top: `${baseTop - (position * 6)}px`, // Slight overlap as they stack
        left: 0,
        right: 0,
      };
    }
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  // Scroll active market into view, centered if possible
  useEffect(() => {
    // Use setTimeout to ensure DOM has updated after state change
    const timeoutId = setTimeout(() => {
      if (activeMarketRef.current && marketsListRef.current) {
        const container = marketsListRef.current;
        const activeElement = activeMarketRef.current;
        
        const containerHeight = container.clientHeight;
        const containerScrollTop = container.scrollTop;
        
        // Get position relative to the scroll container
        const elementRect = activeElement.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();
        const elementTopRelative = elementRect.top - containerRect.top + containerScrollTop;
        const elementHeight = activeElement.clientHeight;
        
        // Calculate scroll position to center the element
        const scrollPosition = elementTopRelative - (containerHeight / 2) + (elementHeight / 2);
        
        container.scrollTo({
          top: Math.max(0, scrollPosition),
          behavior: 'smooth'
        });
      }
    }, 150);

    return () => clearTimeout(timeoutId);
  }, [activeMarketId, completedMarketIds]);

  const getEndTime = () => {
    const endTime = new Date(startTime.getTime() + route.totalTime * 60000);
    return endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const handleMarketComplete = (marketId: string) => {
    if (!completedMarketIds.includes(marketId)) {
      setCompletedMarketIds([...completedMarketIds, marketId]);
    }
  };

  const handleCompleteNextMarket = () => {
    const nextMarket = pendingMarkets[0];
    if (nextMarket) {
      handleMarketComplete(nextMarket);
    }
  };

  const handleEndTour = () => {
    console.log('handleEndTour called, showCompletionModal will be set to true');
    setShowCompletionModal(true);
  };

  const handleCloseCompletionModal = () => {
    setShowCompletionModal(false);
    onBack();
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className={styles.tourPage}>
      {/* Aurora Background */}
      <div className={styles.auroraBackground}>
        <Aurora
          colorStops={isTourCompleted 
            ? ["#34D399", "#10B981", "#059669"] 
            : ["#60A5FA", "#3B82F6", "#1E40AF"]
          }
          blend={0.6}
          amplitude={0.8}
          speed={0.3}
        />
      </div>

      <Header firstName={user.firstName} avatar={user.avatar} onDevPanelToggle={() => devPanelToggleRef.current?.()} />
      
      <main className={styles.main}>
        <div className={styles.container}>
          {/* Page Title */}
          <h1 className={styles.pageTitle}>Deine heutige Tour!</h1>

          {/* Progress Tracker */}
          <div className={`${styles.progressTracker} ${isTourCompleted ? styles.progressTrackerComplete : ''}`}>
            <div className={styles.progressLine}>
              {route.optimizedOrder.map((marketId, index) => {
                const isCompleted = completedMarketIds.includes(marketId);
                const isActive = marketId === activeMarketId;
                const isLast = index === route.optimizedOrder.length - 1;
                
                return (
                  <React.Fragment key={marketId}>
                    <div className={`${styles.progressStop} ${isCompleted ? styles.completed : ''} ${isActive ? styles.active : ''}`}>
                      <div className={styles.stopCircle}></div>
                    </div>
                    {!isLast && (
                      <div className={`${styles.progressSegment} ${isCompleted ? styles.completedSegment : ''}`}></div>
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>

          <div className={styles.contentRow}>
            {/* Tour Info Card */}
            <div className={styles.tourInfoCard}>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Startzeit</span>
                <span className={styles.infoValue}>{formatTime(startTime)}</span>
              </div>
              <div className={styles.infoDivider}></div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>
                  {isTourCompleted ? 'Tatsächliches Ende' : 'Geschätztes Ende'}
                </span>
                <span className={isTourCompleted ? styles.infoValueComplete : styles.infoValueAccent}>
                  {isTourCompleted && endTime ? formatTime(endTime) : getEndTime()}
                </span>
              </div>
              <div className={styles.infoDivider}></div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>
                  {isTourCompleted ? 'Tatsächliche Gesamtdauer' : 'Gesamtdauer'}
                </span>
                <span className={isTourCompleted ? styles.infoValueComplete : styles.infoValue}>
                  {isTourCompleted ? getActualDuration() : `${Math.floor(route.totalTime / 60)}h ${route.totalTime % 60}min`}
                </span>
              </div>
              <div className={styles.infoDivider}></div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Fortschritt</span>
                <span className={styles.infoValue}>
                  {completedMarketIds.length} / {route.markets.length}
                </span>
              </div>
            </div>

            {/* Markets List */}
            <div className={styles.marketsCard}>
              <div className={styles.cardHeader}>
                <h2 className={styles.cardTitle}>Geplante Märkte</h2>
                <button 
                  className={isTourCompleted ? styles.marketCountComplete : styles.tourOpenButton}
                  onClick={() => !isTourCompleted && setShowMapsModal(true)}
                  disabled={isTourCompleted}
                >
                  {isTourCompleted ? 'Abgeschlossen' : 'Tour öffnen'}
                </button>
              </div>
              
              <div className={styles.marketsList} ref={marketsListRef}>
                <AnimatedListWrapper delay={50}>
                  {route.optimizedOrder.map((marketId, index) => {
                    const market = route.markets.find(m => m.id === marketId);
                    if (!market) return null;
                    
                    const isCompleted = completedMarketIds.includes(marketId);
                    const isActive = marketId === activeMarketId;

                    const MarketContent = (
                      <div className={`${styles.marketItem} ${isCompleted ? styles.completedMarket : ''} ${isActive ? styles.activeMarket : ''}`}>
                        {isCompleted ? (
                          <div className={styles.completedCheck}>
                            <Check size={12} weight="bold" />
                          </div>
                        ) : (
                          <div className={styles.marketNumber}>{index + 1}</div>
                        )}
                        
                        <div className={styles.marketInfo}>
                          <div className={styles.marketName}>{market.name}</div>
                          <div className={styles.marketAddress}>
                            {market.address}, {market.postalCode} {market.city}
                          </div>
                        </div>
                      </div>
                    );

                    if (isActive) {
                      return (
                        <div key={marketId} className={styles.marketItemWrapper} ref={activeMarketRef}>
                          <StarBorder as="div" className={styles.starBorder} color="var(--color-teal-mid)">
                            <SpotlightCard className={styles.spotlight} spotlightColor="rgba(59, 130, 246, 0.15)">
                              {MarketContent}
                            </SpotlightCard>
                          </StarBorder>
                        </div>
                      );
                    }

                    return (
                      <div key={marketId} className={styles.marketItemWrapper}>
                        {MarketContent}
                      </div>
                    );
                  }).filter((item): item is React.ReactElement => item !== null)}
                </AnimatedListWrapper>
              </div>
            </div>
          </div>

          {/* Stacked Markets Queue */}
          <div className={styles.stackedMarketsSection}>
            <h3 className={styles.sectionTitle}>
              {isTourCompleted ? 'Geschafft!' : 'Nächster Markt'}
            </h3>
            
            {isTourCompleted ? (
              /* Tour Completion Animation */
              <div className={styles.completionContainer}>
                <div className={styles.completionAnimation}>
                  <div className={styles.completionCheckCircle}>
                    <CheckCircle size={72} weight="fill" />
                  </div>
                  <div className={styles.completionText}>
                    <h2 className={styles.completionTitle}>Tour abgeschlossen</h2>
                    <p className={styles.completionSubtitle}>
                      Alle {route.optimizedOrder.length} Märkte erfolgreich besucht
                    </p>
                  </div>
                </div>
                
                <button className={styles.endTourButtonComplete} onClick={handleEndTour}>
                  Tour beenden
                </button>
              </div>
            ) : (
              /* Normal Stacked Cards */
              <>
                <div 
                  ref={stackedContainerRef}
                  className={styles.stackedMarketsContainer}
                >
                  {pendingMarkets.map((marketId, index) => {
                    const market = route.markets.find(m => m.id === marketId);
                    if (!market) return null;
                    
                    const position = getCardPosition(index);
                    const cardStyles = getCardStyles(position);
                    const isAtPosition0 = position === 0;
                    
                    return (
                      <div 
                        key={marketId} 
                        className={`${styles.stackedCard} ${isAtPosition0 ? styles.stackedCardActive : ''}`}
                        style={cardStyles}
                      >
                        <div className={styles.stackedCardContent}>
                          <div className={styles.stackedCardLeft}>
                            <div className={styles.stackedNumber}>{completedMarketIds.length + index + 1}</div>
                            <div className={styles.stackedInfo}>
                              <div className={styles.stackedName}>{market.name}</div>
                              <div className={styles.stackedAddress}>
                                {market.address}, {market.postalCode} {market.city}
                              </div>
                            </div>
                          </div>
                          {isAtPosition0 && (
                            <button 
                              className={styles.startButton}
                              onClick={() => handleMarketComplete(marketId)}
                            >
                              <Play size={16} weight="fill" />
                              Einsatz starten
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  }).filter(Boolean)}
                </div>
                
                {/* End Tour Button */}
                <button className={styles.endTourButton} onClick={handleEndTour}>
                  Tour frühzeitig beenden
                </button>
              </>
            )}
          </div>
        </div>
      </main>

      {/* Dev Panel */}
      <DevPanel 
        onCompleteNextMarket={handleCompleteNextMarket} 
        onToggle={(toggle) => { devPanelToggleRef.current = toggle; }}
      />

      {/* Tour Completion Modal */}
      <TourCompletionModal
        isOpen={showCompletionModal}
        onClose={handleCloseCompletionModal}
        completedMarkets={completedMarketIds}
        pendingMarkets={pendingMarkets}
        marketNames={route.markets.map(m => ({ id: m.id, name: m.name }))}
        startTime={startTime}
        endTime={endTime || new Date()}
        userName={user.firstName}
        isEarlyEnd={!isTourCompleted}
      />

      {/* Maps Selection Modal */}
      {showMapsModal && (
        <div className={styles.mapsModalOverlay} onClick={() => setShowMapsModal(false)}>
          <div className={styles.mapsModal} onClick={(e) => e.stopPropagation()}>
            <h3 className={styles.mapsModalTitle}>Tour in Karten öffnen</h3>
            <div className={styles.mapsOptions}>
              <button 
                className={styles.mapsOption}
                onClick={() => {
                  // Open in Google Maps
                  const waypoints = route.optimizedOrder
                    .map(id => route.markets.find(m => m.id === id))
                    .filter(m => m && m.coordinates)
                    .map(m => `${m!.coordinates!.lat},${m!.coordinates!.lng}`)
                    .join('|');
                  window.open(`https://www.google.com/maps/dir/?api=1&waypoints=${waypoints}&travelmode=driving`, '_blank');
                  setShowMapsModal(false);
                }}
              >
                <div className={styles.mapsIconCircle}>
                  <img 
                    src="https://fonts.gstatic.com/s/i/productlogos/googleg/v6/24px.svg" 
                    alt="Google Maps"
                    width="40"
                    height="40"
                  />
                </div>
                <span className={styles.mapsLabel}>Google Maps</span>
              </button>

              <button 
                className={styles.mapsOption}
                onClick={() => {
                  // Open in Apple Maps
                  const waypoints = route.optimizedOrder
                    .map(id => route.markets.find(m => m.id === id))
                    .filter(m => m && m.coordinates)
                    .map(m => `${m!.coordinates!.lat},${m!.coordinates!.lng}`)
                    .join('&');
                  window.open(`https://maps.apple.com/?daddr=${waypoints}&dirflg=d`, '_blank');
                  setShowMapsModal(false);
                }}
              >
                <div className={styles.mapsIconCircle}>
                  <svg viewBox="0 0 814 1000" fill="none" xmlns="http://www.w3.org/2000/svg" width="40" height="48">
                    <path d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-164-39.5c-76.5 0-103.7 40.8-165.9 40.8s-105.6-57-155.5-127C46.7 790.7 0 663 0 541.8c0-194.4 126.4-297.5 250.8-297.5 66.1 0 121.2 43.4 162.7 43.4 39.5 0 101.1-46 176.3-46 28.5 0 130.9 2.6 198.3 99.2zm-234-181.5c31.1-36.9 53.1-88.1 53.1-139.3 0-7.1-.6-14.3-1.9-20.1-50.6 1.9-110.8 33.7-147.1 75.8-28.5 32.4-55.1 83.6-55.1 135.5 0 7.8 1.3 15.6 1.9 18.1 3.2.6 8.4 1.3 13.6 1.3 45.4 0 102.5-30.4 135.5-71.3z" fill="#000000"/>
                  </svg>
                </div>
                <span className={styles.mapsLabel}>Apple Maps</span>
              </button>
            </div>
            <button className={styles.mapsCloseButton} onClick={() => setShowMapsModal(false)}>
              Schließen
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

