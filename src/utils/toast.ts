import { toast } from "@/hooks/use-toast";

export const showSuccess = (message: string) => {
  toast({
    title: "Sucesso",
    description: message,
    variant: "default",
  });
};

export const showError = (message: string) => {
  toast({
    title: "Erro",
    description: message,
    variant: "destructive",
  });
};

export const showInfo = (message: string) => {
  toast({
    title: "Informação",
    description: message,
    variant: "default",
  });
};