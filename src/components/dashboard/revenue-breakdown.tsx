import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis } from 'recharts';
import { Site } from '@/types/site';
import { calculateSiteProfitLoss, formatCurrency } from '@/lib/calculations';
import { TrendingUp, Users } from 'lucide-react';

interface RevenueBreakdownProps {
  sites: Site[];
}

export function RevenueBreakdown({ sites }: RevenueBreakdownProps) {
  // Group sites by revenue type
  const revenueBreakdown = sites.reduce((acc, site) => {
    const calculations = calculateSiteProfitLoss(site);
    const revenueType = site.type.includes('safaricom') && site.type.includes('airtel') 
      ? 'colocated' 
      : site.safaricomIncome > 0 && site.airtelIncome > 0 
        ? 'colocated'
        : site.safaricomIncome > 0 
          ? 'safaricom_only' 
          : 'airtel_only';

    if (!acc[revenueType]) {
      acc[revenueType] = { count: 0, revenue: 0, profit: 0 };
    }
    
    acc[revenueType].count += 1;
    acc[revenueType].revenue += calculations.totalRevenue;
    acc[revenueType].profit += calculations.netProfitLoss;
    
    return acc;
  }, {} as Record<string, { count: number; revenue: number; profit: number }>);

  const pieData = Object.entries(revenueBreakdown).map(([type, data]) => ({
    name: type === 'colocated' ? 'Colocated Sites' : 
          type === 'safaricom_only' ? 'Safaricom Only' : 'Airtel Only',
    value: data.revenue,
    count: data.count,
    profit: data.profit,
  }));

  const barData = Object.entries(revenueBreakdown).map(([type, data]) => ({
    type: type === 'colocated' ? 'Colocated' : 
          type === 'safaricom_only' ? 'Safaricom' : 'Airtel',
    revenue: data.revenue,
    profit: data.profit,
    margin: data.revenue > 0 ? (data.profit / data.revenue) * 100 : 0,
  }));

  const chartConfig = {
    revenue: {
      label: 'Revenue',
      color: 'hsl(var(--chart-1))',
    },
    profit: {
      label: 'Profit',
      color: 'hsl(var(--chart-2))',
    },
  };

  const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))'];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Revenue Distribution
          </CardTitle>
          <CardDescription>
            Revenue breakdown by site configuration
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig}>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${formatCurrency(value)}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <ChartTooltip
                  content={<ChartTooltipContent 
                    formatter={(value: number, name: string) => [
                      formatCurrency(value),
                      name
                    ]}
                  />}
                />
              </PieChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Profit Comparison
          </CardTitle>
          <CardDescription>
            Revenue vs profit by site type
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig}>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={barData}>
                <XAxis dataKey="type" />
                <YAxis tickFormatter={(value) => formatCurrency(value)} />
                <ChartTooltip
                  content={<ChartTooltipContent 
                    formatter={(value: number, name: string) => [
                      formatCurrency(value),
                      name
                    ]}
                  />}
                />
                <Bar dataKey="revenue" fill="hsl(var(--chart-1))" name="Revenue" />
                <Bar dataKey="profit" fill="hsl(var(--chart-2))" name="Profit" />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  );
}