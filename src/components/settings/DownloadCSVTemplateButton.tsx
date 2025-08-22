"use client";

import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

export function DownloadCSVTemplateButton() {
  const handleDownload = () => {
    const csvContent = [
      "date,name,amount,type,category,account,description",
      "2023-01-01,Salário,3000.00,income,Salário,Conta Corrente,Pagamento mensal",
      "2023-01-05,Aluguel,1200.00,expense,Moradia,Conta Corrente,Aluguel do apartamento",
      "2023-01-10,Supermercado,250.50,expense,Alimentação,Conta Corrente,Compras da semana",
      "2023-01-15,Freelance,500.00,income,Serviços,Conta Poupança,Projeto X",
      "2023-01-20,Cinema,45.00,expense,Lazer,Conta Corrente,Filme com amigos",
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", "template_transacoes.csv");
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <Button type="button" variant="outline" onClick={handleDownload} className="w-full sm:w-auto">
      <Download className="mr-2 h-4 w-4" />
      Baixar Modelo CSV
    </Button>
  );
}