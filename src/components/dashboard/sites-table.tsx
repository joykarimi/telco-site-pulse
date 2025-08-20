import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Site } from "@/types/site";
import { calculateSiteProfitLoss, formatCurrency, getSiteTypeLabel } from "@/lib/calculations";

interface SitesTableProps {
  sites: Site[];
}

export function SitesTable({ sites }: SitesTableProps) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Site Name</TableHead>
            <TableHead>Type</TableHead>
            <TableHead className="text-right">Revenue</TableHead>
            <TableHead className="text-right">Grid Cost</TableHead>
            <TableHead className="text-right">Fuel Cost</TableHead>
            <TableHead className="text-right">Solar Cost</TableHead>
            <TableHead className="text-right">Total Expense</TableHead>
            <TableHead className="text-right">Net P&L</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sites.map((site) => {
            const calc = calculateSiteProfitLoss(site);
            const isProfit = calc.netProfitLoss >= 0;
            
            return (
              <TableRow key={site.id}>
                <TableCell className="font-medium">{site.name}</TableCell>
                <TableCell>
                  <Badge variant="outline">
                    {getSiteTypeLabel(site.type)}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  {formatCurrency(calc.totalRevenue)}
                </TableCell>
                <TableCell className="text-right">
                  {formatCurrency(calc.gridExpense)}
                </TableCell>
                <TableCell className="text-right">
                  {formatCurrency(calc.fuelExpense)}
                </TableCell>
                <TableCell className="text-right">
                  {formatCurrency(calc.solarExpense)}
                </TableCell>
                <TableCell className="text-right">
                  {formatCurrency(calc.totalExpense)}
                </TableCell>
                <TableCell className={`text-right font-medium ${isProfit ? 'text-success' : 'text-destructive'}`}>
                  {formatCurrency(calc.netProfitLoss)}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}