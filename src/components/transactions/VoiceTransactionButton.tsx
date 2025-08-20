import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Mic, Loader2, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { showError, showSuccess, showLoading, dismissToast } from "@/utils/toast";
import { useModal } from "@/contexts/ModalContext";
import { Card, CardContent } from "@/components/ui/card";
import { createPortal } from "react-dom";

const VoiceTransactionButton = () => {
  const [showModal, setShowModal] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const { openAddTransactionModal } = useModal();

  // Prevenir scroll quando modal estiver aberto
  useEffect(() => {
    if (showModal) {
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
      document.body.style.height = '100%';
    } else {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
      document.body.style.height = '';
    }

    return () => {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
      document.body.style.height = '';
    };
  }, [showModal]);

  const handleVoiceInput = () => {
    console.log("🔥 Botão clicado - forçando modal");
    setShowModal(true);
    setIsListening(true);
    
    // Simular processo por enquanto
    setTimeout(() => {
      console.log("🔥 Simulando fim do listening");
      setIsListening(false);
      setIsProcessing(true);
      
      setTimeout(() => {
        console.log("🔥 Simulando fim do processing");
        setIsProcessing(false);
        setShowModal(false);
      }, 2000);
    }, 3000);
  };

  const closeModal = () => {
    console.log("🔥 Fechando modal manualmente");
    setShowModal(false);
    setIsListening(false);
    setIsProcessing(false);
  };

  console.log("🔥 Render - showModal:", showModal, "isListening:", isListening, "isProcessing:", isProcessing);

  const modalContent = showModal ? (
    <div 
      className="fixed inset-0 bg-black/80 flex items-center justify-center p-4"
      style={{ 
        zIndex: 99999,
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100vw',
        height: '100vh'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          closeModal();
        }
      }}
    >
      <div 
        className="w-full max-w-sm mx-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <Card className="relative bg-white shadow-2xl border-2">
          <CardContent className="p-6 text-center">
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2 h-8 w-8 hover:bg-gray-100"
              onClick={closeModal}
            >
              <X className="h-4 w-4" />
            </Button>

            <div className="mt-4">
              <h2 className="text-xl font-bold mb-4 text-gray-900">MODAL DE TESTE</h2>
              
              {isListening && !isProcessing && (
                <div>
                  <div className="relative mb-4">
                    <Mic className="h-16 w-16 text-blue-500 mx-auto" />
                    <div className="absolute inset-0 rounded-full border-4 border-blue-500 animate-ping"></div>
                  </div>
                  <h3 className="text-lg font-semibold text-blue-600 mb-2">Ouvindo...</h3>
                  <p className="text-sm text-gray-600">Fale agora!</p>
                </div>
              )}
              
              {isProcessing && (
                <div>
                  <Loader2 className="h-16 w-16 text-green-500 animate-spin mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-green-600 mb-2">Processando...</h3>
                  <p className="text-sm text-gray-600">Analisando sua fala...</p>
                </div>
              )}

              {!isListening && !isProcessing && (
                <div>
                  <Mic className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-600 mb-2">Preparando...</h3>
                  <p className="text-sm text-gray-600">Aguarde um momento...</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  ) : null;

  return (
    <>
      <Button
        size="sm"
        variant="outline"
        className="gap-1 w-full md:w-auto"
        onClick={handleVoiceInput}
        disabled={isListening || isProcessing}
      >
        {isProcessing ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Mic className="h-4 w-4" />
        )}
        <span className="hidden sm:inline">
          {isProcessing ? "Processando..." : isListening ? "Ouvindo..." : "Por Voz"}
        </span>
        <span className="sm:hidden">
          <Mic className="h-4 w-4" />
        </span>
      </Button>

      {/* Renderizar modal usando portal para garantir que apareça no topo */}
      {typeof document !== 'undefined' && modalContent && createPortal(modalContent, document.body)}
    </>
  );
};

export default VoiceTransactionButton;