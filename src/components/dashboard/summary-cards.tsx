import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CompanySummary } from "@/types/site";
import { formatCurrency } from "@/lib/calculations";
import { TrendingUp, TrendingDown, Building, Target } from "lucide-react";

interface SummaryCardsProps {
  summary: CompanySummary;
}

export function SummaryCards({ summary }: SummaryCardsProps) {
  const isProfit = summary.netProfitLoss >= 0;
  
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card className="bg-gradient-primary text-primary-foreground shadow-custom-lg">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium opacity-90">
            Total Revenue
          </CardTitle>
          <TrendingUp className="h-4 w-4 opacity-90" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {formatCurrency(summary.totalRevenue)}
          </div>
          <p className="text-xs opacity-80">
            From {summary.totalSites} sites
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Total Expenses
          </CardTitle>
          <TrendingDown className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {formatCurrency(summary.totalExpense)}
          </div>
          <p className="text-xs text-muted-foreground">
            Operational costs
          </p>
        </CardContent>
      </Card>

      <Card className={`${isProfit ? 'bg-gradient-success text-success-foreground shadow-custom-success' : 'bg-gradient-danger text-destructive-foreground shadow-custom-danger'}`}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium opacity-90">
            Net Profit/Loss
          </CardTitle>
          {isProfit ? (
            <TrendingUp className="h-4 w-4 opacity-90" />
          ) : (
            <TrendingDown className="h-4 w-4 opacity-90" />
          )}
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {formatCurrency(summary.netProfitLoss)}
          </div>
          <p className="text-xs opacity-80">
            {isProfit ? 'Profit this month' : 'Loss this month'}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Site Performance
          </CardTitle>
          <Building className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-success">
            {summary.profitableSites}
          </div>
          <p className="text-xs text-muted-foreground">
            Profitable / {summary.lossMakingSites} loss-making
          </p>
        </CardContent>
      </Card>
    </div>
  );
}