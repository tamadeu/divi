import { ReactNode } from 'react';
import PullToRefresh from 'react-pull-to-refresh';
import { useIsMobile } from '@/hooks/use-mobile';
import { RefreshCw } from 'lucide-react';

interface PullToRefreshWrapperProps {
  children: ReactNode;
  onRefresh: () => Promise<void>;
}

const PullToRefreshWrapper = ({ children, onRefresh }: PullToRefreshWrapperProps) => {
  const isMobile = useIsMobile();

  if (!isMobile) {
    return <>{children}</>;
  }

  return (
    <PullToRefresh
      onRefresh={onRefresh}
      style={{
        textAlign: 'center',
        fontSize: '14px',
        color: '#666',
      }}
      pullingContent={
        <div className="flex flex-col items-center justify-center py-4 text-muted-foreground">
          <RefreshCw className="h-5 w-5 mb-2" />
          <span className="text-sm">Puxe para atualizar</span>
        </div>
      }
      refreshingContent={
        <div className="flex flex-col items-center justify-center py-4 text-primary">
          <RefreshCw className="h-5 w-5 mb-2 animate-spin" />
          <span className="text-sm">Atualizando...</span>
        </div>
      }
    >
      {children}
    </PullToRefresh>
  );
};

export default PullToRefreshWrapper;