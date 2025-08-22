"use client"

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { showError, showSuccess } from "@/utils/toast";
import { Skeleton } from "@/components/ui/skeleton";
import { useProfile } from "@/hooks/useProfile"; // Import useProfile

const profileSchema = z.object({
  first_name: z.string().min(1, "O nome é obrigatório."),
  last_name: z.string().min(1, "O sobrenome é obrigatório."),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export function ProfileForm() {
  const { profile, loading: profileLoading, refreshProfile } = useProfile(); // Use useProfile hook
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      first_name: "",
      last_name: "",
    },
  });

  useEffect(() => {
    const loadProfileData = async () => {
      if (!profileLoading && profile) {
        setEmail(profile.email || ""); // Assuming email is part of profile or fetched separately
        form.reset({
          first_name: profile.first_name || "",
          last_name: profile.last_name || "",
        });
      } else if (!profileLoading && !profile) {
        // If no profile found, try to get user email
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setEmail(user.email || "");
        }
      }
    };

    loadProfileData();
  }, [profile, profileLoading, form]);

  const handleSubmit = async (values: ProfileFormValues) => {
    setIsSubmitting(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      showError("Usuário não encontrado.");
      setIsSubmitting(false);
      return;
    }

    const { error } = await supabase
      .from("profiles")
      .update({
        first_name: values.first_name,
        last_name: values.last_name,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    if (error) {
      showError("Erro ao atualizar perfil: " + error.message);
    } else {
      showSuccess("Perfil atualizado com sucesso!");
      refreshProfile(); // Refresh the cached profile data
    }
    setIsSubmitting(false);
  };

  if (profileLoading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-32" />
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="first_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nome</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="last_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Sobrenome</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" value={email} readOnly disabled />
        </div>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Salvando..." : "Salvar Alterações"}
        </Button>
      </form>
    </Form>
  );
}