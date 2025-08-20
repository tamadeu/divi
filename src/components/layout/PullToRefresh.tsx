import { ReactNode } from 'react';

interface PullToRefreshWrapperProps {
  children: ReactNode;
  onRefresh: () => Promise<void>;
}

const PullToRefreshWrapper = ({ children }: PullToRefreshWrapperProps) => {
  return (
    <div className="h-full overflow-auto">
      {children}
    </div>
  );
};

export default PullToRefreshWrapper;