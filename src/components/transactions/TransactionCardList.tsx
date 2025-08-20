import { useState, useEffect } from "react";
import { Transaction } from "@/types/database";
import { supabase } from "@/integrations/supabase/client";
import TransactionCard from "./TransactionCard";

interface TransactionCardListProps {
  transactions: Transaction[];
  onRowClick: (transaction: Transaction) => void;
}

interface CompanyMatch {
  [transactionName: string]: string | null;
}

const TransactionCardList = ({ transactions, onRowClick }: TransactionCardListProps) => {
  const [companyLogos, setCompanyLogos] = useState<CompanyMatch>({});

  useEffect(() => {
    const fetchCompanyLogos = async () => {
      if (transactions.length === 0) return;

      try {
        // Buscar todas as empresas
        const { data: companies, error } = await supabase
          .from('companies')
          .select('name, logo_url');

        if (error) {
          console.error('Error fetching companies:', error);
          return;
        }

        if (!companies) return;

        // Criar mapa de correspondências
        const logoMap: CompanyMatch = {};

        transactions.forEach(transaction => {
          // Pular transferências
          if (transaction.transfer_id) {
            logoMap[transaction.name] = null;
            return;
          }

          // Buscar empresa correspondente (case insensitive)
          const matchingCompany = companies.find(company => 
            company.name.toLowerCase() === transaction.name.toLowerCase()
          );

          logoMap[transaction.name] = matchingCompany?.logo_url || null;
        });

        setCompanyLogos(logoMap);
      } catch (error) {
        console.error('Error in fetchCompanyLogos:', error);
      }
    };

    fetchCompanyLogos();
  }, [transactions]);

  return (
    <div className="space-y-3">
      {transactions.length > 0 ? (
        transactions.map((transaction) => (
          <TransactionCard
            key={transaction.id}
            transaction={transaction}
            onRowClick={onRowClick}
            companyLogo={companyLogos[transaction.name]}
          />
        ))
      ) : (
        <div className="text-center py-8">
          <p className="text-gray-500">Nenhuma transação encontrada.</p>
        </div>
      )}
    </div>
  );
};

export default TransactionCardList;