import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { showError, showSuccess, showLoading, dismissToast } from "@/utils/toast";
import { useModal } from "@/contexts/ModalContext";
import { Card, CardContent } from "@/components/ui/card";

const VoiceTransactionButton = () => {
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showListeningCard, setShowListeningCard] = useState(false);
  const { openAddTransactionModal } = useModal();

  const handleVoiceInput = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      showError("Seu navegador não suporta reconhecimento de voz.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'pt-BR';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsListening(true);
      setShowListeningCard(true);
    };

    recognition.onend = () => {
      setIsListening(false);
      if (!isProcessing) {
        setShowListeningCard(false);
      }
    };

    recognition.onerror = (event) => {
      showError(`Erro no reconhecimento de voz: ${event.error}`);
      setIsListening(false);
      setIsProcessing(false);
      setShowListeningCard(false);
    };

    recognition.onresult = async (event) => {
      const transcript = event.results[0][0].transcript;
      setIsProcessing(true);
      const toastId = showLoading("Analisando sua fala...");

      try {
        const { data, error } = await supabase.functions.invoke('parse-transaction', {
          body: { text: transcript },
        });

        if (error) {
          const errorMessage = error.context?.json?.error || error.message;
          throw new Error(errorMessage);
        }
        
        dismissToast(toastId);
        showSuccess("Pronto! Revise os detalhes e salve.");

        const transactionData = {
          ...data,
          date: data.date ? new Date(data.date) : new Date(),
        };
        
        openAddTransactionModal(() => {}, transactionData);

      } catch (err: any) {
        dismissToast(toastId);
        showError(err.message || "Ocorreu um erro desconhecido.");
      } finally {
        setIsProcessing(false);
        setShowListeningCard(false);
      }
    };

    recognition.start();
  };

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
        ) : isListening ? (
          <MicOff className="h-4 w-4 text-red-500" />
        ) : (
          <Mic className="h-4 w-4" />
        )}
        {isProcessing ? "Processando..." : isListening ? "Ouvindo..." : "Por Voz"}
      </Button>

      {/* Card de feedback visual */}
      {showListeningCard && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-sm">
            <CardContent className="p-6 text-center">
              {isListening && !isProcessing && (
                <>
                  <div className="flex justify-center mb-4">
                    <div className="relative">
                      <Mic className="h-12 w-12 text-blue-500" />
                      <div className="absolute inset-0 rounded-full border-4 border-blue-500 animate-ping"></div>
                    </div>
                  </div>
                  <h3 className="text-lg font-semibold mb-2">Estou ouvindo...</h3>
                  <p className="text-sm text-muted-foreground">
                    Fale sobre sua transação. Por exemplo: "Gastei 50 reais no Uber hoje"
                  </p>
                  <div className="flex justify-center mt-4">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </>
              )}
              
              {isProcessing && (
                <>
                  <div className="flex justify-center mb-4">
                    <Loader2 className="h-12 w-12 text-green-500 animate-spin" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">Processando...</h3>
                  <p className="text-sm text-muted-foreground">
                    Analisando sua fala e preenchendo os dados da transação
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
};

export default VoiceTransactionButton;