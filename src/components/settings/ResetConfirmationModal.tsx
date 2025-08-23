"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CheckCircle } from "lucide-react";

interface ResetConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ResetConfirmationModal({ isOpen, onClose }: ResetConfirmationModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader className="flex flex-col items-center text-center">
          <CheckCircle className="h-12 w-12 text-green-500 mb-4" />
          <DialogTitle className="text-xl">Dados Restaurados!</DialogTitle>
          <DialogDescription>
            Os dados selecionados do seu núcleo financeiro foram resetados com sucesso.
            Você pode começar do zero agora.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex justify-center">
          <Button onClick={onClose}>
            Entendi
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}