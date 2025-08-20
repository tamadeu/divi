import { useState, useEffect, useRef, useCallback } from 'react';
import { useIsMobile } from './use-mobile';

const PULL_THRESHOLD = 100; // Pixels to pull down to trigger refresh
const REFRESH_DURATION = 1500; // Simulated refresh duration in ms

export const usePullToRefresh = (onRefresh: () => Promise<void>) => {
  const isMobile = useIsMobile();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const startY = useRef(0);
  const currentY = useRef(0);
  const lastScrollTop = useRef(0);
  const containerRef = useRef<HTMLElement | null>(null);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (!isMobile || isRefreshing) return;

    const scrollTop = containerRef.current?.scrollTop || 0;
    lastScrollTop.current = scrollTop;

    if (scrollTop === 0) {
      startY.current = e.touches[0].clientY;
      currentY.current = startY.current;
    }
  }, [isMobile, isRefreshing]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!isMobile || isRefreshing || lastScrollTop.current !== 0) return;

    currentY.current = e.touches[0].clientY;
    const pullDelta = currentY.current - startY.current;

    if (pullDelta > 0) {
      e.preventDefault(); // Prevent scrolling down
      // You could update a visual indicator here based on pullDelta
    }
  }, [isMobile, isRefreshing]);

  const handleTouchEnd = useCallback(async () => {
    if (!isMobile || isRefreshing || lastScrollTop.current !== 0) return;

    const pullDelta = currentY.current - startY.current;

    if (pullDelta > PULL_THRESHOLD) {
      setIsRefreshing(true);
      await onRefresh();
      setIsRefreshing(false);
    }

    startY.current = 0;
    currentY.current = 0;
  }, [isMobile, isRefreshing, onRefresh]);

  useEffect(() => {
    const container = containerRef.current || document.body; // Use document.body if no specific container is provided
    container.addEventListener('touchstart', handleTouchStart, { passive: false });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd, { passive: false });

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  return { isRefreshing, setContainerRef: (node: HTMLElement | null) => { containerRef.current = node; } };
};