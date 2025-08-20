import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Mic, Loader2, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { showError, showSuccess, showLoading, dismissToast } from "@/utils/toast";
import { useModal } from "@/contexts/ModalContext";
import { Card, CardContent } from "@/components/ui/card";

const VoiceTransactionButton = () => {
  const [showModal, setShowModal] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const { openAddTransactionModal } = useModal();

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

  return (
    <>
      <Button
        size="sm"
        variant="outline"
        className="gap-1"
        onClick={handleVoiceInput}
        disabled={isListening || isProcessing}
      >
        {isProcessing ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Mic className="h-4 w-4" />
        )}
        {isProcessing ? "Processando..." : isListening ? "Ouvindo..." : "Por Voz"}
      </Button>

      {/* Modal de teste */}
      {showModal && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          style={{ zIndex: 9999 }}
        >
          <Card className="w-full max-w-sm relative bg-white">
            <CardContent className="p-6 text-center">
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2 h-8 w-8"
                onClick={closeModal}
              >
                <X className="h-4 w-4" />
              </Button>

              <div className="mt-4">
                <h2 className="text-xl font-bold mb-4">MODAL DE TESTE</h2>
                
                {isListening && !isProcessing && (
                  <div>
                    <Mic className="h-16 w-16 text-blue-500 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-blue-600">Ouvindo...</h3>
                    <p className="text-sm text-gray-600">Fale agora!</p>
                  </div>
                )}
                
                {isProcessing && (
                  <div>
                    <Loader2 className="h-16 w-16 text-green-500 animate-spin mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-green-600">Processando...</h3>
                    <p className="text-sm text-gray-600">Analisando sua fala...</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
};

export default VoiceTransactionButton;