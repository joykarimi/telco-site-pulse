import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, LineChart, Line } from 'recharts';
import { Site } from '@/pages/Index';
import { calculateSiteProfitLoss, formatCurrency } from '@/lib/calculations';
import { TrendingUp, DollarSign, Building2, Target, Activity, Zap } from 'lucide-react';

interface RevenueBreakdownProps {
  sites: Site[];
}

const REVENUE_COLORS = {
  colocated: 'hsl(193 82% 31%)',
  safaricom_only: 'hsl(142 76% 36%)',
  airtel_only: 'hsl(217 91% 60%)',
};

export function RevenueBreakdown({ sites }: RevenueBreakdownProps) {
  // Group sites by revenue type
  const revenueBreakdown = sites.reduce((acc, site) => {
    const calculations = calculateSiteProfitLoss(site);
    const hasSafaricom = site.safaricomIncome > 0;
    const hasAirtel = site.airtelIncome > 0;

    let revenueType: 'colocated' | 'safaricom_only' | 'airtel_only' | 'none' = 'none';

    if (hasSafaricom && hasAirtel) {
      revenueType = 'colocated';
    } else if (hasSafaricom) {
      revenueType = 'safaricom_only';
    } else if (hasAirtel) {
      revenueType = 'airtel_only';
    }

    if (revenueType === 'none') {
      return acc;
    }

    if (!acc[revenueType]) {
      acc[revenueType] = { count: 0, revenue: 0, profit: 0 };
    }
    
    acc[revenueType].count += 1;
    acc[revenueType].revenue += calculations.totalRevenue;
    acc[revenueType].profit += calculations.netProfitLoss;
    
    return acc;
  }, {} as Record<string, { count: number; revenue: number; profit: number }>);

  const totalRevenue = Object.values(revenueBreakdown).reduce((sum, val) => sum + val.revenue, 0);

  const pieData = Object.entries(revenueBreakdown).map(([type, data]) => ({
    name: type === 'colocated' ? 'Colocated Sites' : 
          type === 'safaricom_only' ? 'Safaricom Only' : 'Airtel Only',
    value: data.revenue,
    count: data.count,
    profit: data.profit,
    color: REVENUE_COLORS[type as keyof typeof REVENUE_COLORS],
    percentage: totalRevenue ? (data.revenue / totalRevenue * 100).toFixed(1) : '0'
  }));

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Revenue Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-primary hover:shadow-custom-lg transition-all duration-300 animate-scale-in border-0">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-primary-foreground">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-primary-foreground animate-float" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary-foreground">
              {formatCurrency(totalRevenue)}
            </div>
            <p className="text-xs text-primary-foreground/80">Across all sites</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-info hover:shadow-custom-hover transition-all duration-300 animate-scale-in border-0">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-primary-foreground">Colocated</CardTitle>
            <Building2 className="h-4 w-4 text-primary-foreground animate-bounce" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary-foreground">
              {formatCurrency(revenueBreakdown.colocated?.revenue || 0)}
            </div>
            <p className="text-xs text-primary-foreground/80">
              {revenueBreakdown.colocated?.count || 0} sites
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-success hover:shadow-custom-success transition-all duration-300 animate-scale-in border-0">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-success-foreground">Single Operator</CardTitle>
            <Target className="h-4 w-4 text-success-foreground animate-pulse" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success-foreground">
              {formatCurrency((revenueBreakdown.safaricom_only?.revenue || 0) + (revenueBreakdown.airtel_only?.revenue || 0))}
            </div>
            <p className="text-xs text-success-foreground/80">
              {(revenueBreakdown.safaricom_only?.count || 0) + (revenueBreakdown.airtel_only?.count || 0)} sites
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-warning hover:shadow-custom-warning transition-all duration-300 animate-scale-in border-0">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-warning-foreground">Avg Margin</CardTitle>
            <TrendingUp className="h-4 w-4 text-warning-foreground animate-float" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning-foreground">
              {totalRevenue ? ((Object.values(revenueBreakdown).reduce((a, b) => a + b.profit, 0) / totalRevenue) * 100).toFixed(1) : '0'}%
            </div>
            <p className="text-xs text-warning-foreground/80">Overall margin</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="animate-slide-in-right bg-gradient-card hover:shadow-custom-hover transition-all duration-300">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary animate-pulse" />
              Revenue Distribution
            </CardTitle>
            <CardDescription>Breakdown by site configuration</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percentage }) => `${name}: ${percentage}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  animationBegin={0}
                  animationDuration={1000}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: number) => [formatCurrency(value), 'Revenue']}
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: 'var(--radius)',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="animate-slide-in-right bg-gradient-card hover:shadow-custom-hover transition-all duration-300">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-success animate-float" />
              Profit Comparison
            </CardTitle>
            <CardDescription>Revenue vs profit analysis</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={Object.entries(revenueBreakdown).map(([type, data]) => ({
                type: type === 'colocated' ? 'Colocated' : 
                      type === 'safaricom_only' ? 'Safaricom' : 'Airtel',
                revenue: data.revenue,
                profit: data.profit,
              }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="type" stroke="hsl(var(--muted-foreground))" />
                <YAxis stroke="hsl(var(--muted-foreground))" tickFormatter={(value) => `${(value / 1000)}K`} />
                <Tooltip 
                  formatter={(value: number, name: string) => [formatCurrency(value), name]}
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: 'var(--radius)',
                  }}
                />
                <Legend />
                <Bar dataKey="revenue" fill="hsl(217 91% 60%)" name="Revenue" animationBegin={0} animationDuration={800} />
                <Bar dataKey="profit" fill="hsl(142 76% 36%)" name="Profit" animationBegin={200} animationDuration={800} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
