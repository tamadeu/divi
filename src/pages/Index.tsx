import React, { useState, useEffect, useCallback } from 'react';
import { usePullToRefresh } from '@/hooks/use-pull-to-refresh';
import { useIsMobile } from '@/hooks/use-mobile';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const Index = () => {
  const [data, setData] = useState<string[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const isMobile = useIsMobile();

  const fetchData = useCallback(async () => {
    setLoadingData(true);
    // Simulate fetching data
    await new Promise(resolve => setTimeout(resolve, 1000));
    setData([
      `Item 1 (Atualizado: ${new Date().toLocaleTimeString()})`,
      `Item 2 (Atualizado: ${new Date().toLocaleTimeString()})`,
      `Item 3 (Atualizado: ${new Date().toLocaleTimeString()})`,
      `Item 4 (Atualizado: ${new Date().toLocaleTimeString()})`,
      `Item 5 (Atualizado: ${new Date().toLocaleTimeString()})`,
      `Item 6 (Atualizado: ${new Date().toLocaleTimeString()})`,
      `Item 7 (Atualizado: ${new Date().toLocaleTimeString()})`,
      `Item 8 (Atualizado: ${new Date().toLocaleTimeString()})`,
      `Item 9 (Atualizado: ${new Date().toLocaleTimeString()})`,
      `Item 10 (Atualizado: ${new Date().toLocaleTimeString()})`,
      `Item 11 (Atualizado: ${new Date().toLocaleTimeString()})`,
      `Item 12 (Atualizado: ${new Date().toLocaleTimeString()})`,
      `Item 13 (Atualizado: ${new Date().toLocaleTimeString()})`,
      `Item 14 (Atualizado: ${new Date().toLocaleTimeString()})`,
      `Item 15 (Atualizado: ${new Date().toLocaleTimeString()})`,
    ]);
    setLoadingData(false);
  }, []);

  const { isRefreshing, setContainerRef } = usePullToRefresh(fetchData);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <div 
      className="flex flex-col flex-1 overflow-y-auto relative" 
      ref={setContainerRef}
      style={{ WebkitOverflowScrolling: 'touch' }} // Enable smooth scrolling on iOS
    >
      {isMobile && (
        <div className={cn(
          "absolute top-0 left-0 w-full flex justify-center items-center transition-all duration-300",
          isRefreshing ? "h-12 opacity-100" : "h-0 opacity-0"
        )}>
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      )}
      
      <h1 className="text-2xl font-bold mb-4">Painel</h1>
      <p className="text-muted-foreground mb-6">
        Bem-vindo ao seu painel financeiro. Role para baixo para ver mais conteúdo.
        {isMobile && " Puxe para baixo para atualizar!"}
      </p>

      {loadingData ? (
        <div className="flex justify-center items-center h-48">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="space-y-4">
          {data.map((item, index) => (
            <div key={index} className="p-4 border rounded-lg bg-card">
              {item}
            </div>
          ))}
        </div>
      )}
      <div className="h-20"></div> {/* Add some padding at the bottom for scrolling */}
    </div>
  );
};

export default Index;