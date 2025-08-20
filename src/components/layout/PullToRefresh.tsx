import { ReactNode, useState, useRef, useEffect, useCallback } from 'react';
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
  const containerRef = useRef<HTMLDivElement>(null);
  const startYRef = useRef(0);
  const startScrollTopRef = useRef(0);
  const isPullingRef = useRef(false);

  const PULL_THRESHOLD = 80;
  const MAX_PULL_DISTANCE = 120;

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (isRefreshing) return;
    
    const container = containerRef.current;
    if (!container) return;

    // Armazena a posição inicial do scroll e do touch
    startScrollTopRef.current = container.scrollTop;
    startYRef.current = e.touches[0].clientY;
    
    // Só permite pull-to-refresh se estiver exatamente no topo
    if (startScrollTopRef.current === 0) {
      isPullingRef.current = true;
    }
  }, [isRefreshing]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!isPullingRef.current || isRefreshing) return;

    const container = containerRef.current;
    if (!container) return;

    const currentY = e.touches[0].clientY;
    const deltaY = currentY - startYRef.current;
    const currentScrollTop = container.scrollTop;

    // Se não está mais no topo ou está fazendo scroll para baixo, cancela o pull
    if (currentScrollTop > 0 || deltaY <= 0) {
      isPullingRef.current = false;
      setPullDistance(0);
      setIsPulling(false);
      return;
    }

    // Se está puxando para baixo E ainda está no topo
    if (deltaY > 0 && currentScrollTop === 0) {
      e.preventDefault(); // Previne o scroll padrão
      
      const distance = Math.min(deltaY * 0.4, MAX_PULL_DISTANCE);
      setPullDistance(distance);
      setIsPulling(distance > 10);
    }
  }, [isRefreshing, MAX_PULL_DISTANCE]);

  const handleTouchEnd = useCallback(async () => {
    if (!isPullingRef.current || isRefreshing) return;

    isPullingRef.current = false;

    if (pullDistance >= PULL_THRESHOLD) {
      setIsRefreshing(true);
      setIsPulling(false);
      
      try {
        await onRefresh();
      } catch (error) {
        console.error('Refresh failed:', error);
      } finally {
        setTimeout(() => {
          setIsRefreshing(false);
          setPullDistance(0);
        }, 500);
      }
    } else {
      setIsPulling(false);
      setPullDistance(0);
    }
  }, [pullDistance, PULL_THRESHOLD, onRefresh, isRefreshing]);

  // Listener adicional para detectar quando o scroll muda durante o pull
  const handleScroll = useCallback(() => {
    const container = containerRef.current;
    if (!container || !isPullingRef.current) return;

    // Se começou a fazer scroll durante o pull, cancela
    if (container.scrollTop > 0) {
      isPullingRef.current = false;
      setPullDistance(0);
      setIsPulling(false);
    }
  }, []);

  useEffect(() => {
    if (!isMobile) return;

    const container = containerRef.current;
    if (!container) return;

    // Adiciona os event listeners
    container.addEventListener('touchstart', handleTouchStart, { passive: false });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd, { passive: true });
    container.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
      container.removeEventListener('scroll', handleScroll);
    };
  }, [isMobile, handleTouchStart, handleTouchMove, handleTouchEnd, handleScroll]);

  if (!isMobile) {
    return <div className="h-full overflow-auto">{children}</div>;
  }

  const getRefreshText = () => {
    if (isRefreshing) return 'Atualizando...';
    if (pullDistance >= PULL_THRESHOLD) return 'Solte para atualizar';
    return 'Puxe para atualizar';
  };

  const getIconRotation = () => {
    if (isRefreshing) return 360;
    return Math.min((pullDistance / PULL_THRESHOLD) * 180, 180);
  };

  return (
    <div 
      ref={containerRef} 
      className="h-full overflow-auto relative"
      style={{ 
        WebkitOverflowScrolling: 'touch',
        overscrollBehavior: 'none'
      }}
    >
      <AnimatePresence>
        {(isPulling || isRefreshing) && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ 
              opacity: 1, 
              height: Math.max(pullDistance * 0.8, isRefreshing ? 60 : 0)
            }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute top-0 left-0 right-0 z-10 flex flex-col items-center justify-center bg-background/95 backdrop-blur-sm border-b"
          >
            <motion.div
              animate={{ 
                rotate: isRefreshing ? [0, 360] : getIconRotation(),
                scale: pullDistance >= PULL_THRESHOLD ? 1.2 : 1
              }}
              transition={{ 
                rotate: isRefreshing ? { 
                  duration: 1, 
                  repeat: Infinity, 
                  ease: "linear" 
                } : { 
                  duration: 0.3 
                },
                scale: { duration: 0.2 }
              }}
              className={`mb-2 transition-colors duration-200 ${
                pullDistance >= PULL_THRESHOLD ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              <RefreshCw className="h-5 w-5" />
            </motion.div>
            <motion.span 
              className={`text-sm font-medium transition-colors duration-200 ${
                pullDistance >= PULL_THRESHOLD ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              {getRefreshText()}
            </motion.span>
          </motion.div>
        )}
      </AnimatePresence>
      
      <motion.div
        animate={{ 
          y: isPulling || isRefreshing ? Math.max(pullDistance * 0.8, isRefreshing ? 60 : 0) : 0 
        }}
        transition={{ 
          type: "spring", 
          stiffness: 400, 
          damping: 40,
          duration: isPulling ? 0 : 0.3
        }}
        className="min-h-full"
      >
        {children}
      </motion.div>
    </div>
  );
};

export default PullToRefreshWrapper;