import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, Loader2, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { showError, showSuccess, showLoading, dismissToast } from "@/utils/toast";
import { useModal } from "@/contexts/ModalContext";
import { Card, CardContent } from "@/components/ui/card";

const VoiceTransactionButton = () => {
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [recognitionInstance, setRecognitionInstance] = useState<SpeechRecognition | null>(null);
  const { openAddTransactionModal } = useModal();

  const stopListening = () => {
    if (recognitionInstance) {
      recognitionInstance.stop();
    }
    setIsListening(false);
    setIsProcessing(false);
    setShowModal(false);
    setRecognitionInstance(null);
  };

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
    recognition.continuous = false;
    
    // Configurações para melhor experiência
    if ('webkitSpeechRecognition' in window) {
      recognition.webkitSpeechRecognition = true;
    }

    setRecognitionInstance(recognition);

    recognition.onstart = () => {
      console.log("Reconhecimento iniciado");
      setIsListening(true);
      setShowModal(true);
      setIsProcessing(false);
    };

    recognition.onend = () => {
      console.log("Reconhecimento finalizado");
      setIsListening(false);
      if (!isProcessing) {
        // Só fecha o modal se não estiver processando
        setTimeout(() => {
          if (!isProcessing) {
            setShowModal(false);
            setRecognitionInstance(null);
          }
        }, 500);
      }
    };

    recognition.onerror = (event) => {
      console.error("Erro no reconhecimento:", event.error);
      let errorMessage = "Erro no reconhecimento de voz";
      
      switch (event.error) {
        case 'no-speech':
          errorMessage = "Nenhuma fala foi detectada. Tente novamente.";
          break;
        case 'audio-capture':
          errorMessage = "Não foi possível acessar o microfone.";
          break;
        case 'not-allowed':
          errorMessage = "Permissão para usar o microfone foi negada.";
          break;
        case 'network':
          errorMessage = "Erro de rede. Verifique sua conexão.";
          break;
        default:
          errorMessage = `Erro: ${event.error}`;
      }
      
      showError(errorMessage);
      stopListening();
    };

    recognition.onresult = async (event) => {
      const transcript = event.results[0][0].transcript;
      console.log("Texto reconhecido:", transcript);
      
      setIsListening(false);
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
        
        // Fecha o modal antes de abrir o formulário
        setShowModal(false);
        setIsProcessing(false);
        setRecognitionInstance(null);
        
        // Pequeno delay para suavizar a transição
        setTimeout(() => {
          openAddTransactionModal(() => {}, transactionData);
        }, 300);

      } catch (err: any) {
        dismissToast(toastId);
        showError(err.message || "Ocorreu um erro desconhecido.");
        stopListening();
      }
    };

    // Inicia o reconhecimento
    try {
      recognition.start();
    } catch (error) {
      console.error("Erro ao iniciar reconhecimento:", error);
      showError("Não foi possível iniciar o reconhecimento de voz.");
      stopListening();
    }
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

      {/* Modal de feedback visual */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-sm relative">
            <CardContent className="p-6 text-center">
              {/* Botão de fechar */}
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2 h-8 w-8"
                onClick={stopListening}
              >
                <X className="h-4 w-4" />
              </Button>

              {isListening && (
                <>
                  <div className="flex justify-center mb-4">
                    <div className="relative">
                      <Mic className="h-16 w-16 text-blue-500" />
                      <div className="absolute inset-0 rounded-full border-4 border-blue-500 animate-ping"></div>
                      <div className="absolute inset-2 rounded-full border-2 border-blue-400 animate-pulse"></div>
                    </div>
                  </div>
                  <h3 className="text-xl font-semibold mb-2 text-blue-600">Estou ouvindo...</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Fale sobre sua transação. Por exemplo:
                  </p>
                  <div className="bg-muted p-3 rounded-lg text-xs text-muted-foreground mb-4">
                    "Gastei 50 reais no Uber hoje"<br/>
                    "Recebi 2000 reais de salário"<br/>
                    "Paguei 120 reais no supermercado"
                  </div>
                  <div className="flex justify-center">
                    <div className="flex space-x-1">
                      <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce"></div>
                      <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </>
              )}
              
              {isProcessing && (
                <>
                  <div className="flex justify-center mb-4">
                    <Loader2 className="h-16 w-16 text-green-500 animate-spin" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2 text-green-600">Processando...</h3>
                  <p className="text-sm text-muted-foreground">
                    Analisando sua fala e preenchendo os dados da transação
                  </p>
                  <div className="mt-4">
                    <div className="w-full bg-muted rounded-full h-2">
                      <div className="bg-green-500 h-2 rounded-full animate-pulse" style={{ width: '70%' }}></div>
                    </div>
                  </div>
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