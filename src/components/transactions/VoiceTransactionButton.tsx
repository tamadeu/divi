import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { showError, showSuccess } from "@/utils/toast";
import { useModal } from "@/contexts/ModalContext";

const VoiceTransactionButton = () => {
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
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

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onerror = (event) => {
      showError(`Erro no reconhecimento de voz: ${event.error}`);
      setIsListening(false);
    };

    recognition.onresult = async (event) => {
      const transcript = event.results[0][0].transcript;
      setIsProcessing(true);
      showSuccess("Processando sua transação...");

      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Usuário não autenticado.");

        const { data: profile } = await supabase
          .from("profiles")
          .select("ai_provider")
          .eq("id", user.id)
          .single();

        const provider = profile?.ai_provider || 'gemini';

        const { data, error } = await supabase.functions.invoke('parse-transaction', {
          body: { text: transcript, provider },
        });

        if (error) throw error;

        const transactionData = {
          ...data,
          date: data.date ? new Date(data.date) : new Date(),
        };
        
        openAddTransactionModal(() => {}, transactionData);

      } catch (err: any) {
        showError(`IA não conseguiu processar: ${err.message}`);
      } finally {
        setIsProcessing(false);
      }
    };

    recognition.start();
  };

  return (
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
        <MicOff className="h-4 w-4" />
      ) : (
        <Mic className="h-4 w-4" />
      )}
      {isProcessing ? "Processando..." : isListening ? "Ouvindo..." : "Por Voz"}
    </Button>
  );
};

export default VoiceTransactionButton;