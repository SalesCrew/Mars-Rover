import React, { useRef, useState, useEffect } from 'react';
import type { ReactNode, UIEvent } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import './AnimatedList.css';

interface VirtualizedAnimatedListProps {
  items?: string[];
  onItemSelect?: (item: string, index: number) => void;
  showGradients?: boolean;
  enableArrowNavigation?: boolean;
  className?: string;
  itemClassName?: string;
  displayScrollbar?: boolean;
  initialSelectedIndex?: number;
  children?: (item: string, index: number) => ReactNode;
  estimateSize?: number;
}

const VirtualizedAnimatedList: React.FC<VirtualizedAnimatedListProps> = ({
  items = [],
  onItemSelect,
  showGradients = true,
  enableArrowNavigation = false,
  className = '',
  itemClassName = '',
  displayScrollbar = false,
  initialSelectedIndex = -1,
  children,
  estimateSize = 80,
}) => {
  const listRef = useRef<HTMLDivElement>(null);
  const [selectedIndex, setSelectedIndex] = useState<number>(initialSelectedIndex);
  const [keyboardNav, setKeyboardNav] = useState<boolean>(false);
  const [topGradientOpacity, setTopGradientOpacity] = useState<number>(0);
  const [bottomGradientOpacity, setBottomGradientOpacity] = useState<number>(1);
  const scrollPositionRef = useRef<number>(0);

  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => listRef.current,
    estimateSize: () => estimateSize,
    overscan: 5,
    initialOffset: scrollPositionRef.current,
  });

  const handleScroll = (e: UIEvent<HTMLDivElement>) => {
    const target = e.target as HTMLDivElement;
    const { scrollTop, scrollHeight, clientHeight } = target;

    // Store scroll position
    scrollPositionRef.current = scrollTop;

    setTopGradientOpacity(Math.min(scrollTop / 50, 1));

    const bottomDistance = scrollHeight - (scrollTop + clientHeight);
    setBottomGradientOpacity(scrollHeight <= clientHeight ? 0 : Math.min(bottomDistance / 50, 1));
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    const { scrollTop, scrollHeight, clientHeight } = target;
    
    const isAtTop = scrollTop <= 0;
    const isAtBottom = scrollTop + clientHeight >= scrollHeight;
    
    if ((isAtTop && e.touches[0].clientY > e.touches[0].clientY) || 
        (isAtBottom && e.touches[0].clientY < e.touches[0].clientY)) {
      e.stopPropagation();
    }
  };

  useEffect(() => {
    if (!enableArrowNavigation) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown' || (e.key === 'Tab' && !e.shiftKey)) {
        e.preventDefault();
        setKeyboardNav(true);
        setSelectedIndex(prev => Math.min(prev + 1, items.length - 1));
      } else if (e.key === 'ArrowUp' || (e.key === 'Tab' && e.shiftKey)) {
        e.preventDefault();
        setKeyboardNav(true);
        setSelectedIndex(prev => Math.max(prev - 1, 0));
      } else if (e.key === 'Enter') {
        if (selectedIndex >= 0 && selectedIndex < items.length) {
          e.preventDefault();
          if (onItemSelect) {
            onItemSelect(items[selectedIndex], selectedIndex);
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [items, selectedIndex, onItemSelect, enableArrowNavigation]);

  useEffect(() => {
    if (!keyboardNav || selectedIndex < 0) return;

    virtualizer.scrollToIndex(selectedIndex, { align: 'center', behavior: 'smooth' });
    setKeyboardNav(false);
  }, [selectedIndex, keyboardNav, virtualizer]);

  // Restore scroll position when items change
  useEffect(() => {
    if (listRef.current && scrollPositionRef.current > 0) {
      listRef.current.scrollTop = scrollPositionRef.current;
    }
  }, [items.length]);

  const virtualItems = virtualizer.getVirtualItems();

  return (
    <div className={`scroll-list-container ${className}`}>
      <div 
        ref={listRef} 
        className={`scroll-list ${!displayScrollbar ? 'no-scrollbar' : ''}`} 
        onScroll={handleScroll}
        onTouchMove={handleTouchMove}
      >
        <div
          style={{
            height: `${virtualizer.getTotalSize()}px`,
            width: '100%',
            position: 'relative',
          }}
        >
          {virtualItems.map((virtualItem) => {
            const index = virtualItem.index;
            const item = items[index];
            
            return (
              <div
                key={virtualItem.key}
                data-index={index}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: `${virtualItem.size}px`,
                  transform: `translateY(${virtualItem.start}px)`,
                }}
                onMouseEnter={() => setSelectedIndex(index)}
                onClick={() => {
                  setSelectedIndex(index);
                  if (onItemSelect) {
                    onItemSelect(item, index);
                  }
                }}
              >
                {children ? children(item, index) : (
                  <div className={`item ${selectedIndex === index ? 'selected' : ''} ${itemClassName}`}>
                    <p className="item-text">{item}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
      {showGradients && (
        <>
          <div className="top-gradient" style={{ opacity: topGradientOpacity }}></div>
          <div className="bottom-gradient" style={{ opacity: bottomGradientOpacity }}></div>
        </>
      )}
    </div>
  );
};

export default VirtualizedAnimatedList;
