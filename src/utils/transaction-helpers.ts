import { Company } from "@/types/database";

export const getCompanyLogo = (transactionName: string, companies: Company[]): string | null => {
  if (!transactionName || !companies || companies.length === 0) {
    return null;
  }

  const lowerCaseTransactionName = transactionName.toLowerCase();

  for (const company of companies) {
    if (company.name && company.logo_url) {
      // Check if the transaction name contains the company name
      if (lowerCaseTransactionName.includes(company.name.toLowerCase())) {
        return company.logo_url;
      }
    }
  }
  return null;
};