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
import { Pencil, Trash2, Star, Eye } from "lucide-react";
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
            <TableHead>Banco</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead className="text-right">Saldo</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {accounts.length > 0 ? (
            accounts.map((account) => (
              <TableRow key={account.id}>
                <TableCell className="font-medium">{account.name}</TableCell>
                <TableCell>{account.bank}</TableCell>
                <TableCell>{account.type}</TableCell>
                <TableCell className="text-right font-semibold">
                  {account.balance.toLocaleString("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  })}
                </TableCell>
                <TableCell>
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
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button asChild variant="ghost" size="icon">
                      <Link to={`/accounts/${account.id}`}>
                        <Eye className="h-4 w-4" />
                      </Link>
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => onEdit(account)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => onDelete(account)}>
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