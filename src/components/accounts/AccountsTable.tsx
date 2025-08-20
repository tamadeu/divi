import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Account } from "@/types/database";
import { Pencil, Trash2, Star, Eye, Calculator, MinusCircle } from "lucide-react";
import { Link } from "react-router-dom";

interface AccountsTableProps {
  accounts: Account[];
  onEdit: (account: Account) => void;
  onDelete: (account: Account) => void;
  onSetDefault: (accountId: string) => void;
  settingDefaultId: string | null;
}

const AccountsTable = ({ 
  accounts, 
  onEdit, 
  onDelete, 
  onSetDefault, 
  settingDefaultId 
}: AccountsTableProps) => {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Conta</TableHead>
            <TableHead className="hidden lg:table-cell">Banco</TableHead>
            <TableHead className="hidden lg:table-cell">Tipo</TableHead>
            <TableHead className="text-right">Saldo</TableHead>
            <TableHead className="hidden lg:table-cell">Status</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {accounts.length > 0 ? (
            accounts.map((account) => (
              <TableRow key={account.id}>
                <TableCell className="font-medium">
                  <div>
                    <div className="font-medium flex items-center gap-2">
                      {account.name}
                      {account.include_in_total ? (
                        <Calculator className="h-3 w-3 text-green-600" title="Incluído no saldo total" />
                      ) : (
                        <MinusCircle className="h-3 w-3 text-gray-400" title="Não incluído no saldo total" />
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground lg:hidden">
                      {account.bank} - {account.type}
                    </div>
                    <div className="lg:hidden mt-1 flex flex-wrap gap-1">
                      {account.is_default ? (
                        <Badge variant="secondary" className="text-xs">
                          <Star className="mr-1 h-3 w-3" />
                          Padrão
                        </Badge>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs h-6 px-2"
                          onClick={() => onSetDefault(account.id)}
                          disabled={settingDefaultId === account.id}
                        >
                          {settingDefaultId === account.id ? "..." : "Tornar Padrão"}
                        </Button>
                      )}
                      {account.include_in_total ? (
                        <Badge variant="outline" className="text-xs text-green-600">
                          No Total
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs text-gray-500">
                          Fora do Total
                        </Badge>
                      )}
                    </div>
                  </div>
                </TableCell>
                <TableCell className="hidden lg:table-cell">{account.bank}</TableCell>
                <TableCell className="hidden lg:table-cell">{account.type}</TableCell>
                <TableCell className="text-right font-semibold">
                  <div className="text-sm lg:text-base">
                    {account.balance.toLocaleString("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    })}
                  </div>
                </TableCell>
                <TableCell className="hidden lg:table-cell">
                  <div className="flex flex-col gap-1">
                    {account.is_default ? (
                      <Badge>
                        <Star className="mr-1 h-3 w-3" />
                        Padrão
                      </Badge>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onSetDefault(account.id)}
                        disabled={settingDefaultId === account.id}
                      >
                        {settingDefaultId === account.id ? "Definindo..." : "Tornar Padrão"}
                      </Button>
                    )}
                    {account.include_in_total ? (
                      <Badge variant="outline" className="text-green-600">
                        <Calculator className="mr-1 h-3 w-3" />
                        No Total
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-gray-500">
                        <MinusCircle className="mr-1 h-3 w-3" />
                        Fora do Total
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button asChild variant="ghost" size="icon" className="h-8 w-8">
                      <Link to={`/accounts/${account.id}`}>
                        <Eye className="h-4 w-4" />
                      </Link>
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(account)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onDelete(account)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={6} className="h-24 text-center">
                Nenhuma conta encontrada.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default AccountsTable;