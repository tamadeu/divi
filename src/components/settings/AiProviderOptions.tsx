"use client"

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { showError, showSuccess } from "@/utils/toast";
import { Skeleton } from "@/components/ui/skeleton";

const aiProviderSchema = z.object({
  ai_provider: z.enum(["gemini", "openai"]),
});

type AiProviderFormValues = z.infer<typeof aiProviderSchema>;

export function AiProviderOptions() {
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<AiProviderFormValues>({
    resolver: zodResolver(aiProviderSchema),
    defaultValues: {
      ai_provider: "gemini",
    },
  });

  useEffect(() => {
    const fetchProvider = async () => {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile, error } = await supabase
          .from("profiles")
          .select("ai_provider")
          .eq("id", user.id)
          .single();

        if (error) {
          console.error("Error fetching AI provider preference:", error);
        } else if (profile && profile.ai_provider) {
          form.reset({ ai_provider: profile.ai_provider as "gemini" | "openai" });
        }
      }
      setLoading(false);
    };

    fetchProvider();
  }, [form]);

  const handleSubmit = async (values: AiProviderFormValues) => {
    setIsSubmitting(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      showError("Usuário não encontrado.");
      setIsSubmitting(false);
      return;
    }

    const { error } = await supabase
      .from("profiles")
      .update({ ai_provider: values.ai_provider })
      .eq("id", user.id);

    if (error) {
      showError("Erro ao atualizar provedor de IA: " + error.message);
    } else {
      showSuccess("Provedor de IA atualizado com sucesso!");
    }
    setIsSubmitting(false);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-32" />
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="ai_provider"
          render={({ field }) => (
            <FormItem className="space-y-3">
              <FormLabel>Escolha seu provedor de IA preferido</FormLabel>
              <FormControl>
                <RadioGroup
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  className="flex flex-col space-y-1"
                >
                  <FormItem className="flex items-center space-x-3 space-y-0">
                    <FormControl>
                      <RadioGroupItem value="gemini" />
                    </FormControl>
                    <FormLabel className="font-normal">Google Gemini</FormLabel>
                  </FormItem>
                  <FormItem className="flex items-center space-x-3 space-y-0">
                    <FormControl>
                      <RadioGroupItem value="openai" />
                    </FormControl>
                    <FormLabel className="font-normal">OpenAI GPT</FormLabel>
                  </FormItem>
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Salvando..." : "Salvar Preferência"}
        </Button>
      </form>
    </Form>
  );
}