import { ReactNode, useState, useRef, useEffect } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface PullToRefreshWrapperProps {
  children: ReactNode;
  onRefresh: () => Promise<void>;
}

const PullToRefreshWrapper = ({ children, onRefresh }: PullToRefreshWrapperProps) => {
  const isMobile = useIsMobile();
  const [isPulling, setIsPulling] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [startY, setStartY] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const PULL_THRESHOLD = 80;
  const MAX_PULL_DISTANCE = 120;

  useEffect(() => {
    if (!isMobile || !containerRef.current) return;

    const container = containerRef.current;
    let touchStartY = 0;
    let isAtTop = false;

    const handleTouchStart = (e: TouchEvent) => {
      if (container.scrollTop === 0) {
        isAtTop = true;
        touchStartY = e.touches[0].clientY;
        setStartY(touchStartY);
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isAtTop || isRefreshing) return;

      const currentY = e.touches[0].clientY;
      const deltaY = currentY - touchStartY;

      if (deltaY > 0) {
        e.preventDefault();
        const distance = Math.min(deltaY * 0.5, MAX_PULL_DISTANCE);
        setPullDistance(distance);
        setIsPulling(distance > 10);
      }
    };

    const handleTouchEnd = async () => {
      if (!isAtTop || isRefreshing) return;

      if (pullDistance >= PULL_THRESHOLD) {
        setIsRefreshing(true);
        try {
          await onRefresh();
        } catch (error) {
          console.error('Refresh failed:', error);
        } finally {
          setIsRefreshing(false);
        }
      }

      setIsPulling(false);
      setPullDistance(0);
      isAtTop = false;
    };

    container.addEventListener('touchstart', handleTouchStart, { passive: false });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd);

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isMobile, onRefresh, pullDistance, isRefreshing]);

  if (!isMobile) {
    return <div>{children}</div>;
  }

  const getRefreshText = () => {
    if (isRefreshing) return 'Atualizando...';
    if (pullDistance >= PULL_THRESHOLD) return 'Solte para atualizar';
    return 'Puxe para atualizar';
  };

  const getIconRotation = () => {
    if (isRefreshing) return 360;
    return (pullDistance / PULL_THRESHOLD) * 180;
  };

  return (
    <div ref={containerRef} className="overflow-auto h-full">
      <AnimatePresence>
        {(isPulling || isRefreshing) && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ 
              opacity: 1, 
              y: 0,
              height: Math.max(pullDistance, isRefreshing ? 60 : 0)
            }}
            exit={{ opacity: 0, y: -50 }}
            className="flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm border-b"
            style={{
              transform: `translateY(${Math.max(0, pullDistance - 60)}px)`,
            }}
          >
            <motion.div
              animate={{ 
                rotate: isRefreshing ? [0, 360] : getIconRotation(),
                scale: pullDistance >= PULL_THRESHOLD ? 1.1 : 1
              }}
              transition={{ 
                rotate: isRefreshing ? { duration: 1, repeat: Infinity, ease: "linear" } : { duration: 0.3 },
                scale: { duration: 0.2 }
              }}
              className={`mb-2 ${pullDistance >= PULL_THRESHOLD ? 'text-primary' : 'text-muted-foreground'}`}
            >
              <RefreshCw className="h-5 w-5" />
            </motion.div>
            <motion.span 
              className={`text-sm font-medium ${pullDistance >= PULL_THRESHOLD ? 'text-primary' : 'text-muted-foreground'}`}
              animate={{ 
                color: pullDistance >= PULL_THRESHOLD ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))'
              }}
            >
              {getRefreshText()}
            </motion.span>
          </motion.div>
        )}
      </AnimatePresence>
      
      <motion.div
        animate={{ 
          y: isPulling || isRefreshing ? pullDistance : 0 
        }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        {children}
      </motion.div>
    </div>
  );
};

export default PullToRefreshWrapper;