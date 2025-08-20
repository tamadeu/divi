import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, RefreshCw } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

interface AIRequestLog {
  id: string;
  user_id: string;
  workspace_id: string;
  transaction_id?: string;
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
  created_at: string;
  profiles?: {
    first_name?: string;
    last_name?: string;
  };
  workspaces?: {
    name: string;
  };
}

const AIRequestLogsTable = () => {
  const [logs, setLogs] = useState<AIRequestLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState<AIRequestLog | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('ai_request_logs')
        .select(`
          *,
          profiles:user_id (first_name, last_name),
          workspaces:workspace_id (name)
        `)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) {
        console.error('Erro ao buscar logs de IA:', error);
      } else {
        setLogs(data || []);
      }
    } catch (error) {
      console.error('Erro ao buscar logs de IA:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const formatCurrency = (value?: number) => {
    if (!value) return '-';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 6
    }).format(value);
  };

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  const getUserName = (log: AIRequestLog) => {
    if (log.profiles?.first_name && log.profiles?.last_name) {
      return `${log.profiles.first_name} ${log.profiles.last_name}`;
    }
    return log.user_id.substring(0, 8) + '...';
  };

  const getProviderBadgeColor = (provider: string) => {
    switch (provider) {
      case 'openai': return 'bg-green-100 text-green-800';
      case 'gemini': return 'bg-blue-100 text-blue-800';
      case 'anthropic': return 'bg-purple-100 text-purple-800';
      case 'fallback': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const totalCost = logs.reduce((sum, log) => sum + (log.cost_usd || 0), 0);
  const successRate = logs.length > 0 ? (logs.filter(log => log.success).length / logs.length) * 100 : 0;

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Logs de Requisições de IA</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Logs de Requisições de IA</CardTitle>
            <div className="flex gap-4 mt-2 text-sm text-muted-foreground">
              <span>Total de requisições: {logs.length}</span>
              <span>Taxa de sucesso: {successRate.toFixed(1)}%</span>
              <span>Custo total: {formatCurrency(totalCost)}</span>
            </div>
          </div>
          <Button onClick={fetchLogs} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data/Hora</TableHead>
                  <TableHead>Usuário</TableHead>
                  <TableHead>Workspace</TableHead>
                  <TableHead>Provedor</TableHead>
                  <TableHead>Modelo</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Tempo</TableHead>
                  <TableHead>Custo</TableHead>
                  <TableHead>Tokens</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.length > 0 ? (
                  logs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="text-sm">
                        {new Date(log.created_at).toLocaleString('pt-BR')}
                      </TableCell>
                      <TableCell className="text-sm">
                        {getUserName(log)}
                      </TableCell>
                      <TableCell className="text-sm">
                        {log.workspaces?.name || 'N/A'}
                      </TableCell>
                      <TableCell>
                        <Badge className={getProviderBadgeColor(log.ai_provider)}>
                          {log.ai_provider}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        {log.ai_model || '-'}
                      </TableCell>
                      <TableCell>
                        <Badge variant={log.success ? "default" : "destructive"}>
                          {log.success ? "Sucesso" : "Erro"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        {formatDuration(log.processing_time_ms)}
                      </TableCell>
                      <TableCell className="text-sm">
                        {formatCurrency(log.cost_usd)}
                      </TableCell>
                      <TableCell className="text-sm">
                        {log.tokens_input && log.tokens_output 
                          ? `${log.tokens_input}/${log.tokens_output}`
                          : '-'
                        }
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedLog(log);
                            setShowDetailModal(true);
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={10} className="h-24 text-center">
                      Nenhum log encontrado.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Modal de Detalhes */}
      <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Detalhes da Requisição de IA</DialogTitle>
          </DialogHeader>
          {selectedLog && (
            <ScrollArea className="max-h-[60vh]">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold mb-2">Informações Gerais</h4>
                    <div className="space-y-1 text-sm">
                      <p><strong>ID:</strong> {selectedLog.id}</p>
                      <p><strong>Data:</strong> {new Date(selectedLog.created_at).toLocaleString('pt-BR')}</p>
                      <p><strong>Usuário:</strong> {getUserName(selectedLog)}</p>
                      <p><strong>Workspace:</strong> {selectedLog.workspaces?.name}</p>
                      <p><strong>Provedor:</strong> {selectedLog.ai_provider}</p>
                      <p><strong>Modelo:</strong> {selectedLog.ai_model || 'N/A'}</p>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Métricas</h4>
                    <div className="space-y-1 text-sm">
                      <p><strong>Status:</strong> {selectedLog.success ? 'Sucesso' : 'Erro'}</p>
                      <p><strong>Tempo:</strong> {formatDuration(selectedLog.processing_time_ms)}</p>
                      <p><strong>Custo:</strong> {formatCurrency(selectedLog.cost_usd)}</p>
                      <p><strong>Tokens Input:</strong> {selectedLog.tokens_input || 'N/A'}</p>
                      <p><strong>Tokens Output:</strong> {selectedLog.tokens_output || 'N/A'}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Texto de Entrada</h4>
                  <div className="bg-gray-50 p-3 rounded text-sm">
                    {selectedLog.input_text}
                  </div>
                </div>

                {selectedLog.ai_response && (
                  <div>
                    <h4 className="font-semibold mb-2">Resposta da IA</h4>
                    <div className="bg-gray-50 p-3 rounded text-sm">
                      <pre className="whitespace-pre-wrap">{selectedLog.ai_response}</pre>
                    </div>
                  </div>
                )}

                {selectedLog.error_message && (
                  <div>
                    <h4 className="font-semibold mb-2 text-red-600">Mensagem de Erro</h4>
                    <div className="bg-red-50 p-3 rounded text-sm text-red-700">
                      {selectedLog.error_message}
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AIRequestLogsTable;