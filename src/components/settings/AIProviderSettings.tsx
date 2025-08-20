import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { showError, showSuccess } from "@/utils/toast";
import { useSession } from "@/contexts/SessionContext";
import { useProfile } from "@/hooks/useProfile";
import { Brain, Zap } from "lucide-react";

const AIProviderSettings = () => {
  const { session } = useSession();
  const { profile } = useProfile();
  const [loading, setLoading] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<string>("gemini");

  useEffect(() => {
    if (profile?.ai_provider) {
      setSelectedProvider(profile.ai_provider);
    }
  }, [profile]);

  const handleSave = async () => {
    if (!session?.user?.id) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: session.user.id,
          ai_provider: selectedProvider,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;

      showSuccess('Provedor IA atualizado com sucesso!');
    } catch (error: any) {
      showError('Erro ao atualizar provedor IA: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const providers = [
    {
      value: "gemini",
      label: "Google Gemini",
      description: "Modelo de IA do Google, rápido e eficiente"
    },
    {
      value: "openai",
      label: "OpenAI GPT",
      description: "Modelos GPT da OpenAI, versáteis e precisos"
    },
    {
      value: "anthropic",
      label: "Anthropic Claude",
      description: "IA da Anthropic, focada em segurança e precisão"
    }
  ];

  const currentProvider = providers.find(p => p.value === selectedProvider);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5" />
          Provedor de IA
        </CardTitle>
        <CardDescription>
          Escolha qual provedor de IA usar para análise de transações e outras funcionalidades.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label>Provedor Atual</Label>
          <Select value={selectedProvider} onValueChange={setSelectedProvider}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione um provedor" />
            </SelectTrigger>
            <SelectContent>
              {providers.map((provider) => (
                <SelectItem key={provider.value} value={provider.value}>
                  <div className="flex flex-col">
                    <span className="font-medium">{provider.label}</span>
                    <span className="text-xs text-muted-foreground">
                      {provider.description}
                    </span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {currentProvider && (
          <div className="p-4 bg-muted rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="h-4 w-4 text-primary" />
              <span className="font-medium">{currentProvider.label}</span>
            </div>
            <p className="text-sm text-muted-foreground">
              {currentProvider.description}
            </p>
          </div>
        )}

        <Button onClick={handleSave} disabled={loading}>
          {loading ? "Salvando..." : "Salvar Configuração"}
        </Button>
      </CardContent>
    </Card>
  );
};

export default AIProviderSettings;