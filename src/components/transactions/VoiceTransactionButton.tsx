import { useState, useRef } from "react";
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
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const { openAddTransactionModal } = useModal();

  const stopListening = () => {
    console.log("Parando reconhecimento...");
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setIsListening(false);
    setIsProcessing(false);
    setShowModal(false);
  };

  const handleVoiceInput = async () => {
    console.log("Iniciando reconhecimento de voz...");
    
    // Verificar se o navegador suporta
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      showError("Seu navegador não suporta reconhecimento de voz.");
      return;
    }

    // Verificar permissões de microfone
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (error) {
      showError("Permissão de microfone negada. Por favor, permita o acesso ao microfone.");
      return;
    }

    // Criar nova instância
    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;

    // Configurações
    recognition.lang = 'pt-BR';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.continuous = false;

    // Mostrar modal imediatamente
    console.log("Mostrando modal...");
    setShowModal(true);
    setIsListening(true);
    setIsProcessing(false);

    recognition.onstart = () => {
      console.log("✅ Reconhecimento iniciado com sucesso");
      setIsListening(true);
      setShowModal(true);
    };

    recognition.onend = () => {
      console.log("🔚 Reconhecimento finalizado");
      setIsListening(false);
      
      // Se não está processando, fechar modal após um delay
      if (!isProcessing) {
        setTimeout(() => {
          console.log("Fechando modal após delay...");
          setShowModal(false);
        }, 1000);
      }
    };

    recognition.onerror = (event) => {
      console.error("❌ Erro no reconhecimento:", event.error);
      
      let errorMessage = "Erro no reconhecimento de voz";
      switch (event.error) {
        case 'no-speech':
          errorMessage = "Nenhuma fala detectada. Tente falar mais alto ou mais próximo do microfone.";
          break;
        case 'audio-capture':
          errorMessage = "Não foi possível acessar o microfone. Verifique as permissões.";
          break;
        case 'not-allowed':
          errorMessage = "Permissão de microfone negada. Permita o acesso nas configurações do navegador.";
          break;
        case 'network':
          errorMessage = "Erro de rede. Verifique sua conexão com a internet.";
          break;
        case 'aborted':
          errorMessage = "Reconhecimento cancelado.";
          break;
        default:
          errorMessage = `Erro desconhecido: ${event.error}`;
      }
      
      showError(errorMessage);
      stopListening();
    };

    recognition.onresult = async (event) => {
      const transcript = event.results[0][0].transcript;
      const confidence = event.results[0][0].confidence;
      
      console.log("🎤 Texto reconhecido:", transcript);
      console.log("🎯 Confiança:", confidence);
      
      setIsListening(false);
      setIsProcessing(true);
      
      const toastId = showLoading("Analisando sua fala...");

      try {
        console.log("📤 Enviando para API:", transcript);
        
        const { data, error } = await supabase.functions.invoke('parse-transaction', {
          body: { text: transcript },
        });

        if (error) {
          console.error("❌ Erro da API:", error);
          const errorMessage = error.context?.json?.error || error.message;
          throw new Error(errorMessage);
        }
        
        console.log("✅ Resposta da API:", data);
        
        dismissToast(toastId);
        showSuccess("Pronto! Revise os detalhes e salve.");

        const transactionData = {
          ...data,
          date: data.date ? new Date(data.date) : new Date(),
        };
        
        // Fechar modal e abrir formulário
        setShowModal(false);
        setIsProcessing(false);
        
        setTimeout(() => {
          openAddTransactionModal(() => {}, transactionData);
        }, 300);

      } catch (err: any) {
        console.error("❌ Erro no processamento:", err);
        dismissToast(toastId);
        showError(err.message || "Ocorreu um erro ao processar sua fala.");
        stopListening();
      }
    };

    // Iniciar reconhecimento
    try {
      console.log("🚀 Iniciando recognition.start()...");
      recognition.start();
    } catch (error) {
      console.error("❌ Erro ao iniciar reconhecimento:", error);
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

              {isListening && !isProcessing && (
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

              {!isListening && !isProcessing && (
                <>
                  <div className="flex justify-center mb-4">
                    <Mic className="h-16 w-16 text-gray-400" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2 text-gray-600">Preparando...</h3>
                  <p className="text-sm text-muted-foreground">
                    Aguarde um momento...
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