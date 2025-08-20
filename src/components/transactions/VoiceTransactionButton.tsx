import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Mic, Square, Send, Loader2, X, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { showError, showSuccess } from "@/utils/toast";
import { useModal } from "@/contexts/ModalContext";
import { Card, CardContent } from "@/components/ui/card";
import { createPortal } from "react-dom";
import { useWorkspace } from "@/contexts/WorkspaceContext";

interface VoiceTransactionData {
  name: string;
  amount: number;
  type: 'income' | 'expense';
  category?: string;
  category_id?: string;
  description?: string;
  date?: string;
}

interface PendingAILog {
  user_id: string;
  workspace_id: string;
  input_text: string;
  ai_provider: string;
  ai_model?: string;
  ai_response?: string;
  processing_time_ms: number;
  cost_usd?: number;
  tokens_input?: number;
  tokens_output?: number;
  success: boolean;
  error_message?: string;
}

const VoiceTransactionButton = () => {
  const [showModal, setShowModal] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [hasRecording, setHasRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  
  const { openAddTransactionModal } = useModal();
  const { currentWorkspace } = useWorkspace();

  // Verificar suporte do navegador
  const isMediaRecorderSupported = () => {
    return 'MediaRecorder' in window && navigator.mediaDevices && navigator.mediaDevices.getUserMedia;
  };

  // Prevenir scroll quando modal estiver aberto - CORRIGIDO
  useEffect(() => {
    if (showModal) {
      // Salvar posição atual do scroll
      const scrollY = window.scrollY;
      
      // Aplicar estilos para prevenir scroll - SEM pointer-events: none
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.left = '0';
      document.body.style.right = '0';
      document.body.style.overflow = 'hidden';
      document.body.style.height = '100vh';
      document.body.style.width = '100vw';
      // REMOVIDO: document.body.style.pointerEvents = 'none'; // ❌ Isso estava bloqueando cliques!
      
      // Prevenir zoom no iOS
      const viewport = document.querySelector('meta[name=viewport]');
      if (viewport) {
        viewport.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no');
      }
      
      return () => {
        // Restaurar estilos
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.left = '';
        document.body.style.right = '';
        document.body.style.overflow = '';
        document.body.style.height = '';
        document.body.style.width = '';
        // document.body.style.pointerEvents = ''; // ❌ Não precisamos mais disso
        
        // Restaurar posição do scroll
        window.scrollTo(0, scrollY);
        
        // Restaurar viewport
        if (viewport) {
          viewport.setAttribute('content', 'width=device-width, initial-scale=1.0');
        }
      };
    }
  }, [showModal]);

  // Limpar timer quando componente for desmontado
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  const startRecording = async () => {
    console.log("🎤 Função startRecording chamada - INÍCIO");
    
    try {
      // Verificar se o navegador suporta getUserMedia
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Seu navegador não suporta gravação de áudio");
      }

      console.log("🎤 Solicitando permissão do microfone...");
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100,
        } 
      });
      
      console.log("🎤 Permissão concedida, criando MediaRecorder...");
      
      // Verificar tipos MIME suportados
      let mimeType = 'audio/webm';
      if (!MediaRecorder.isTypeSupported('audio/webm')) {
        if (MediaRecorder.isTypeSupported('audio/mp4')) {
          mimeType = 'audio/mp4';
        } else if (MediaRecorder.isTypeSupported('audio/wav')) {
          mimeType = 'audio/wav';
        } else {
          mimeType = ''; // Deixar o navegador escolher
        }
      }
      
      const mediaRecorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      
      mediaRecorder.ondataavailable = (event) => {
        console.log("🎤 Dados de áudio recebidos:", event.data.size, "bytes");
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        console.log("🎤 MediaRecorder parado, criando blob...");
        const audioBlob = new Blob(audioChunksRef.current, { 
          type: mediaRecorder.mimeType || mimeType
        });
        console.log("🎤 Blob criado:", audioBlob.size, "bytes, tipo:", audioBlob.type);
        setAudioBlob(audioBlob);
        setHasRecording(true);
        
        // Parar todas as tracks do stream
        stream.getTracks().forEach(track => {
          track.stop();
          console.log("🎤 Track parada:", track.kind);
        });
      };
      
      mediaRecorder.onerror = (event) => {
        console.error("🎤 Erro no MediaRecorder:", event);
        showError("Erro durante a gravação: " + event.error?.message);
      };
      
      mediaRecorder.start(100); // Coletar dados a cada 100ms
      setIsRecording(true);
      setRecordingTime(0);
      
      // Iniciar timer
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
      
      console.log("🎤 Gravação iniciada com sucesso!");
      
    } catch (error) {
      console.error("🎤 Erro ao iniciar gravação:", error);
      let errorMessage = "Erro ao acessar o microfone.";
      
      if (error instanceof DOMException) {
        switch (error.name) {
          case 'NotAllowedError':
            errorMessage = "Permissão para usar o microfone foi negada. Verifique as configurações do seu navegador.";
            break;
          case 'NotFoundError':
            errorMessage = "Nenhum microfone encontrado no dispositivo.";
            break;
          case 'NotReadableError':
            errorMessage = "Microfone está sendo usado por outro aplicativo.";
            break;
          case 'OverconstrainedError':
            errorMessage = "Configurações de áudio não suportadas pelo dispositivo.";
            break;
          case 'SecurityError':
            errorMessage = "Acesso ao microfone bloqueado por questões de segurança.";
            break;
        }
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      showError(errorMessage);
      
      // Não fechar o modal, deixar o usuário tentar novamente
      console.log("🎤 Mantendo modal aberto para nova tentativa");
    }
  };

  const stopRecording = () => {
    console.log("🎤 Tentando parar gravação...");
    
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      
      console.log("🎤 Gravação parada com sucesso!");
    }
  };

  const discardRecording = () => {
    console.log("🎤 Descartando gravação...");
    setHasRecording(false);
    setAudioBlob(null);
    setRecordingTime(0);
    audioChunksRef.current = [];
  };

  const sendRecording = async () => {
    if (!audioBlob || !currentWorkspace || isProcessing) {
      if (!audioBlob) showError("Nenhuma gravação para enviar.");
      if (!currentWorkspace) showError("Nenhum núcleo financeiro selecionado.");
      return;
    }

    setIsProcessing(true);
    
    try {
      console.log("🤖 Enviando áudio para processamento...");
      console.log("Tamanho do áudio:", audioBlob.size, "bytes");
      console.log("Tipo do áudio:", audioBlob.type);
      
      // Verificar se o áudio não está muito grande (limite de 25MB)
      if (audioBlob.size > 25 * 1024 * 1024) {
        throw new Error("Áudio muito grande. Tente gravar um áudio mais curto.");
      }
      
      // Converter blob para base64 de forma mais eficiente
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onload = () => {
          const result = reader.result as string;
          // Remover o prefixo "data:audio/...;base64,"
          const base64 = result.split(',')[1];
          resolve(base64);
        };
        reader.onerror = () => reject(new Error("Erro ao converter áudio"));
      });
      
      reader.readAsDataURL(audioBlob);
      const base64Audio = await base64Promise;
      
      console.log("Áudio convertido para base64, tamanho:", base64Audio.length);
      
      // Chamar edge function para processar áudio (sem salvar logs ainda)
      const { data, error } = await supabase.functions.invoke('process-voice-transaction-temp', {
        body: { 
          audio_data: base64Audio,
          audio_type: audioBlob.type,
          workspace_id: currentWorkspace.id
        }
      });

      if (error) {
        console.error("Erro na edge function:", error);
        throw new Error(error.message || "Erro ao processar áudio");
      }

      console.log("🤖 Resultado da IA:", data);
      
      if (data && data.success) {
        const transactionData: VoiceTransactionData = data.transaction;
        const pendingLogs: PendingAILog[] = data.pending_logs || [];
        
        // Buscar conta padrão do workspace
        const { data: accounts } = await supabase
          .from("accounts")
          .select("id, is_default")
          .eq("workspace_id", currentWorkspace.id)
          .order("is_default", { ascending: false });
        
        const defaultAccount = accounts?.find(acc => acc.is_default);
        
        // Converter data string para objeto Date se fornecida
        let transactionDate = new Date(); // Default para hoje
        if (transactionData.date) {
          try {
            // Criar data a partir da string YYYY-MM-DD
            const [year, month, day] = transactionData.date.split('-').map(Number);
            transactionDate = new Date(year, month - 1, day); // month é 0-indexed
            console.log("🗓️ Data convertida:", transactionData.date, "→", transactionDate);
          } catch (error) {
            console.error("Erro ao converter data:", error);
            // Manter data atual se houver erro
          }
        }
        
        // Fechar modal de voz
        setShowModal(false);
        resetModal();
        
        // Aguardar um pouco e abrir modal de transação com dados preenchidos
        setTimeout(() => {
          const modalData = {
            name: transactionData.name,
            type: transactionData.type,
            amount: transactionData.amount,
            description: transactionData.description || `Criado por voz (${formatTime(recordingTime)})`,
            date: transactionDate,
            account_id: defaultAccount?.id || "",
            category_id: transactionData.category_id || "",
            // Incluir logs pendentes nos dados do modal
            _pendingAILogs: pendingLogs,
          };
          
          console.log("🎯 Dados para o modal:", modalData);
          openAddTransactionModal(modalData);
        }, 500);
        
        showSuccess("Áudio processado! Verifique os dados antes de salvar.");
      } else {
        throw new Error(data?.error || "Não foi possível processar o áudio.");
      }
    } catch (error) {
      console.error("Erro ao processar áudio:", error);
      const errorMessage = error instanceof Error ? error.message : "Erro inesperado ao processar áudio.";
      showError(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleVoiceInput = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!isMediaRecorderSupported()) {
      showError("Seu navegador não suporta gravação de áudio. Tente usar Chrome, Edge ou Safari.");
      return;
    }

    if (!currentWorkspace) {
      showError("Selecione um núcleo financeiro antes de usar a transação por voz.");
      return;
    }

    console.log("🔥 Abrindo modal de gravação");
    
    // Usar setTimeout para garantir que o evento seja processado
    setTimeout(() => {
      setShowModal(true);
      resetModal();
    }, 100);
  };

  const resetModal = () => {
    setIsRecording(false);
    setIsProcessing(false);
    setHasRecording(false);
    setAudioBlob(null);
    setRecordingTime(0);
    audioChunksRef.current = [];
    
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const closeModal = () => {
    console.log("🔥 Fechando modal");
    
    // Parar gravação se estiver ativa
    if (isRecording) {
      stopRecording();
    }
    
    setShowModal(false);
    resetModal();
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const modalContent = showModal ? (
    <div 
      ref={modalRef}
      className="fixed inset-0 bg-black/80 flex items-center justify-center p-4"
      style={{ 
        zIndex: 999999,
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100vw',
        height: '100vh',
        pointerEvents: 'auto', // ✅ GARANTIR que o modal aceite cliques
      }}
    >
      <div className="w-full max-w-sm mx-auto">
        <Card className="relative bg-white shadow-2xl border-2" style={{ pointerEvents: 'auto' }}>
          <CardContent className="p-6 text-center">
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2 h-8 w-8 hover:bg-gray-100"
              onClick={closeModal}
              disabled={isRecording || isProcessing}
            >
              <X className="h-4 w-4" />
            </Button>

            <div className="mt-4">
              <h2 className="text-xl font-bold mb-4 text-gray-900">Transação por Voz</h2>
              
              {/* Estado: Aguardando início */}
              {!isRecording && !hasRecording && !isProcessing && (
                <div>
                  <Mic className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-600 mb-2">Pronto para gravar</h3>
                  <p className="text-sm text-gray-600 mb-4">Toque no botão para começar a gravar sua transação</p>
                  <p className="text-xs text-gray-500 mb-4">Exemplos:</p>
                  <p className="text-xs text-gray-500 italic">"Gastei 50 reais no Uber hoje"</p>
                  <p className="text-xs text-gray-500 italic">"Recebi 2000 reais de salário"</p>
                  
                  <div className="mt-4 flex justify-center">
                    <button
                      onClick={startRecording}
                      className="bg-red-500 hover:bg-red-600 active:bg-red-700 text-white rounded-full w-16 h-16 flex items-center justify-center transition-colors focus:outline-none focus:ring-4 focus:ring-red-300"
                      style={{ 
                        WebkitTapHighlightColor: 'transparent',
                        touchAction: 'manipulation',
                        userSelect: 'none',
                        pointerEvents: 'auto', // ✅ GARANTIR que o botão aceite cliques
                      }}
                    >
                      <Mic className="h-6 w-6" style={{ margin: 0, padding: 0 }} />
                    </button>
                  </div>
                </div>
              )}
              
              {/* Estado: Gravando */}
              {isRecording && (
                <div>
                  <div className="relative mb-4 flex justify-center">
                    <Mic className="h-16 w-16 text-red-500" />
                    <div className="absolute inset-0 rounded-full border-4 border-red-500 animate-ping"></div>
                  </div>
                  <h3 className="text-lg font-semibold text-red-600 mb-2">Gravando...</h3>
                  <p className="text-2xl font-mono text-red-600 mb-4">{formatTime(recordingTime)}</p>
                  <p className="text-sm text-gray-600 mb-4">Fale sobre sua transação</p>
                  
                  <div className="flex justify-center">
                    <button
                      onClick={stopRecording}
                      className="bg-gray-500 hover:bg-gray-600 active:bg-gray-700 text-white rounded-full w-16 h-16 flex items-center justify-center transition-colors focus:outline-none focus:ring-4 focus:ring-gray-300"
                      style={{ 
                        WebkitTapHighlightColor: 'transparent',
                        touchAction: 'manipulation',
                        userSelect: 'none',
                        pointerEvents: 'auto', // ✅ GARANTIR que o botão aceite cliques
                      }}
                    >
                      <Square className="h-6 w-6" style={{ margin: 0, padding: 0 }} />
                    </button>
                  </div>
                </div>
              )}
              
              {/* Estado: Gravação finalizada */}
              {hasRecording && !isProcessing && (
                <div>
                  <div className="h-16 w-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Mic className="h-8 w-8 text-green-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-green-600 mb-2">Gravação concluída</h3>
                  <p className="text-lg font-mono text-gray-700 mb-4">{formatTime(recordingTime)}</p>
                  <p className="text-sm text-gray-600 mb-4">Enviar para processar ou gravar novamente?</p>
                  
                  <div className="flex justify-center gap-3">
                    <button
                      onClick={discardRecording}
                      className="border border-gray-300 hover:bg-gray-50 active:bg-gray-100 text-gray-700 rounded-full w-12 h-12 flex items-center justify-center transition-colors focus:outline-none focus:ring-4 focus:ring-gray-200"
                      disabled={isProcessing}
                      style={{ 
                        WebkitTapHighlightColor: 'transparent',
                        touchAction: 'manipulation',
                        userSelect: 'none',
                        pointerEvents: 'auto', // ✅ GARANTIR que o botão aceite cliques
                      }}
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                    
                    <button
                      onClick={sendRecording}
                      className="bg-green-500 hover:bg-green-600 active:bg-green-700 text-white rounded-full w-12 h-12 flex items-center justify-center transition-colors focus:outline-none focus:ring-4 focus:ring-green-300"
                      disabled={isProcessing}
                      style={{ 
                        WebkitTapHighlightColor: 'transparent',
                        touchAction: 'manipulation',
                        userSelect: 'none',
                        pointerEvents: 'auto', // ✅ GARANTIR que o botão aceite cliques
                      }}
                    >
                      <Send className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              )}
              
              {/* Estado: Processando */}
              {isProcessing && (
                <div>
                  <Loader2 className="h-16 w-16 text-blue-500 animate-spin mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-blue-600 mb-2">Processando áudio...</h3>
                  <p className="text-sm text-gray-600 mb-2">Analisando sua gravação e criando a transação...</p>
                  <p className="text-xs text-gray-500">Isso pode levar alguns segundos</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  ) : null;

  // Não mostrar o botão se o navegador não suportar gravação
  if (!isMediaRecorderSupported()) {
    return null;
  }

  return (
    <>
      <Button
        size="sm"
        variant="outline"
        className="gap-1 w-full md:w-auto"
        onClick={handleVoiceInput}
        disabled={!currentWorkspace}
      >
        <Mic className="h-4 w-4" />
        <span className="hidden sm:inline">Por Voz</span>
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