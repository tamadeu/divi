import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface SummaryCardProps {
  title: string;
  value: string;
  icon: LucideIcon;
  variant?: "default" | "income" | "expense";
}

const SummaryCard = ({ title, value, icon: Icon, variant = "default" }: SummaryCardProps) => {
  const valueColor = {
    default: "text-foreground",
    income: "text-green-500",
    expense: "text-red-500",
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className={cn("text-2xl font-bold", valueColor[variant])}>{value}</div>
      </CardContent>
    </Card>
  );
};

export default SummaryCard;