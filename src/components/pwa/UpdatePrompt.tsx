import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RefreshCw, X } from 'lucide-react';
import { usePWA } from '@/hooks/usePWA';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';

const UpdatePrompt = () => {
  const { isUpdateAvailable, updateApp } = usePWA();
  const [isDismissed, setIsDismissed] = useState(false);

  const handleUpdate = () => {
    updateApp();
  };

  const handleDismiss = () => {
    setIsDismissed(true);
  };

  if (!isUpdateAvailable || isDismissed) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -50 }}
        className="fixed top-4 left-4 right-4 z-50"
      >
        <Card className="shadow-lg border-blue-500/20 bg-blue-50 dark:bg-blue-950">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <RefreshCw className="h-5 w-5 text-blue-600" />
                <CardTitle className="text-lg text-blue-900 dark:text-blue-100">
                  Atualização Disponível
                </CardTitle>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 -mt-1"
                onClick={handleDismiss}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <CardDescription className="text-blue-700 dark:text-blue-200">
              Uma nova versão do Divi está disponível com melhorias e correções.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex gap-2">
              <Button onClick={handleUpdate} className="flex-1 bg-blue-600 hover:bg-blue-700">
                <RefreshCw className="h-4 w-4 mr-2" />
                Atualizar Agora
              </Button>
              <Button variant="outline" onClick={handleDismiss}>
                Depois
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
};

export default UpdatePrompt;