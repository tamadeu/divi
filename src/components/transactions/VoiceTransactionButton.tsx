import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Mic, Loader2, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { showError, showSuccess, showLoading, dismissToast } from "@/utils/toast";
import { useModal } from "@/contexts/ModalContext";
import { Card, CardContent } from "@/components/ui/card";
import { createPortal } from "react-dom";
import { useWorkspace } from "@/contexts/WorkspaceContext";

interface VoiceTransactionData {
  name: string;
  amount: number;
  type: 'income' | 'expense';
  category?: string;
  description?: string;
  date?: string;
}

const VoiceTransactionButton = () => {
  const [showModal, setShowModal] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [recognition, setRecognition] = useState<SpeechRecognition | null>(null);
  const { openAddTransactionModal } = useModal();
  const { currentWorkspace } = useWorkspace();

  // Verificar suporte do navegador
  const isSpeechRecognitionSupported = () => {
    return 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
  };

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

  // Configurar reconhecimento de voz
  useEffect(() => {
    if (!isSpeechRecognitionSupported()) return;

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognitionInstance = new SpeechRecognition();
    
    recognitionInstance.continuous = false;
    recognitionInstance.interimResults = false;
    recognitionInstance.lang = 'pt-BR';
    recognitionInstance.maxAlternatives = 1;

    recognitionInstance.onstart = () => {
      console.log("🎤 Reconhecimento de voz iniciado");
      setIsListening(true);
    };

    recognitionInstance.onresult = (event) => {
      const speechResult = event.results[0][0].transcript;
      console.log("🎤 Resultado:", speechResult);
      setTranscript(speechResult);
      setIsListening(false);
      processVoiceInput(speechResult);
    };

    recognitionInstance.onerror = (event) => {
      console.error("🎤 Erro no reconhecimento:", event.error);
      setIsListening(false);
      setIsProcessing(false);
      
      let errorMessage = "Erro no reconhecimento de voz.";
      switch (event.error) {
        case 'no-speech':
          errorMessage = "Nenhuma fala detectada. Tente novamente.";
          break;
        case 'audio-capture':
          errorMessage = "Erro ao acessar o microfone.";
          break;
        case 'not-allowed':
          errorMessage = "Permissão para usar o microfone foi negada.";
          break;
        case 'network':
          errorMessage = "Erro de rede. Verifique sua conexão.";
          break;
      }
      
      showError(errorMessage);
      setShowModal(false);
    };

    recognitionInstance.onend = () => {
      console.log("🎤 Reconhecimento de voz finalizado");
      setIsListening(false);
    };

    setRecognition(recognitionInstance);

    return () => {
      if (recognitionInstance) {
        recognitionInstance.abort();
      }
    };
  }, []);

  const processVoiceInput = async (speechText: string) => {
    if (!currentWorkspace) {
      showError("Nenhum núcleo financeiro selecionado.");
      setShowModal(false);
      return;
    }

    setIsProcessing(true);
    
    try {
      console.log("🤖 Processando com IA:", speechText);
      
      // Chamar edge function para processar com IA
      const { data, error } = await supabase.functions.invoke('process-voice-transaction', {
        body: { 
          text: speechText,
          workspace_id: currentWorkspace.id
        }
      });

      if (error) {
        console.error("Erro na edge function:", error);
        showError("Erro ao processar transação por voz: " + error.message);
        setShowModal(false);
        setIsProcessing(false);
        return;
      }

      console.log("🤖 Resultado da IA:", data);
      
      if (data && data.success) {
        const transactionData: VoiceTransactionData = data.transaction;
        
        // Fechar modal de voz
        setShowModal(false);
        setIsProcessing(false);
        
        // Aguardar um pouco e abrir modal de transação com dados preenchidos
        setTimeout(() => {
          openAddTransactionModal({
            name: transactionData.name,
            type: transactionData.type,
            amount: transactionData.amount,
            description: transactionData.description || `Criado por voz: "${speechText}"`,
            date: transactionData.date ? new Date(transactionData.date) : new Date(),
          });
        }, 500);
        
        showSuccess("Transação processada! Verifique os dados antes de salvar.");
      } else {
        showError(data?.error || "Não foi possível processar a transação por voz.");
        setShowModal(false);
        setIsProcessing(false);
      }
    } catch (error) {
      console.error("Erro ao processar voz:", error);
      showError("Erro inesperado ao processar transação por voz.");
      setShowModal(false);
      setIsProcessing(false);
    }
  };

  const handleVoiceInput = () => {
    if (!isSpeechRecognitionSupported()) {
      showError("Seu navegador não suporta reconhecimento de voz. Tente usar Chrome, Edge ou Safari.");
      return;
    }

    if (!currentWorkspace) {
      showError("Selecione um núcleo financeiro antes de usar a transação por voz.");
      return;
    }

    console.log("🔥 Iniciando transação por voz");
    setShowModal(true);
    setTranscript("");
    setIsProcessing(false);
    
    // Pequeno delay para garantir que o modal apareça antes de iniciar o reconhecimento
    setTimeout(() => {
      if (recognition) {
        try {
          recognition.start();
        } catch (error) {
          console.error("Erro ao iniciar reconhecimento:", error);
          showError("Erro ao iniciar reconhecimento de voz.");
          setShowModal(false);
        }
      }
    }, 300);
  };

  const closeModal = () => {
    console.log("🔥 Fechando modal manualmente");
    if (recognition && isListening) {
      recognition.abort();
    }
    setShowModal(false);
    setIsListening(false);
    setIsProcessing(false);
    setTranscript("");
  };

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
              <h2 className="text-xl font-bold mb-4 text-gray-900">Transação por Voz</h2>
              
              {isListening && !isProcessing && (
                <div>
                  <div className="relative mb-4">
                    <Mic className="h-16 w-16 text-blue-500 mx-auto" />
                    <div className="absolute inset-0 rounded-full border-4 border-blue-500 animate-ping"></div>
                  </div>
                  <h3 className="text-lg font-semibold text-blue-600 mb-2">Ouvindo...</h3>
                  <p className="text-sm text-gray-600 mb-2">Diga algo como:</p>
                  <p className="text-xs text-gray-500 italic">"Gastei 50 reais no Uber hoje"</p>
                  <p className="text-xs text-gray-500 italic">"Recebi 2000 reais de salário"</p>
                </div>
              )}
              
              {isProcessing && (
                <div>
                  <Loader2 className="h-16 w-16 text-green-500 animate-spin mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-green-600 mb-2">Processando...</h3>
                  <p className="text-sm text-gray-600 mb-2">Analisando sua fala e criando a transação...</p>
                  {transcript && (
                    <p className="text-xs text-gray-500 italic bg-gray-50 p-2 rounded">
                      "{transcript}"
                    </p>
                  )}
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

  // Não mostrar o botão se o navegador não suportar reconhecimento de voz
  if (!isSpeechRecognitionSupported()) {
    return null;
  }

  return (
    <>
      <Button
        size="sm"
        variant="outline"
        className="gap-1 w-full md:w-auto"
        onClick={handleVoiceInput}
        disabled={isListening || isProcessing || !currentWorkspace}
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