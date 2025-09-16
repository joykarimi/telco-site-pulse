import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart";
import { Site } from "@/pages/Index";
import { calculateSiteProfitLoss, formatCurrency } from "@/lib/calculations";
import {
  TrendingUp,
  DollarSign,
  Building2,
  Target,
  Activity,
  Zap,
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface RevenueBreakdownProps {
  sites: Site[];
}

export function RevenueBreakdown({ sites }: RevenueBreakdownProps) {
  const revenueBreakdown = sites.reduce((acc, site) => {
    const calculations = calculateSiteProfitLoss(site);
    const hasSafaricom = site.safaricomIncome > 0;
    const hasAirtel = site.airtelIncome > 0;

    let revenueType: "colocated" | "safaricom_only" | "airtel_only" | "none" =
      "none";

    if (hasSafaricom && hasAirtel) {
      revenueType = "colocated";
    } else if (hasSafaricom) {
      revenueType = "safaricom_only";
    } else if (hasAirtel) {
      revenueType = "airtel_only";
    }

    if (revenueType === "none") {
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

  const totalRevenue = Object.values(revenueBreakdown).reduce(
    (sum, val) => sum + val.revenue,
    0
  );

  const pieData = Object.entries(revenueBreakdown).map(([type, data]) => ({
    name:
      type === "colocated"
        ? "Colocated Sites"
        : type === "safaricom_only"
        ? "Safaricom Only"
        : "Airtel Only",
    value: data.revenue,
    count: data.count,
    profit: data.profit,
    fill: `var(--color-${type})`,
    percentage: totalRevenue
      ? ((data.revenue / totalRevenue) * 100).toFixed(1)
      : "0",
  }));

  const chartConfig = {
    colocated: {
      label: "Colocated",
      theme: {
        light: "hsl(193 82% 31%)",
        dark: "hsl(193 82% 51%)",
      },
    },
    safaricom_only: {
      label: "Safaricom",
      theme: {
        light: "hsl(142 76% 36%)",
        dark: "hsl(142 76% 56%)",
      },
    },
    airtel_only: {
      label: "Airtel",
      theme: {
        light: "hsl(217 91% 60%)",
        dark: "hsl(217 91% 70%)",
      },
    },
  } satisfies ChartConfig;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Revenue Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Cards remain the same */}
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
            <ChartContainer config={chartConfig}>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        formatter={(value, name) => [
                          formatCurrency(value as number),
                          name as string,
                        ]}
                      />
                    }
                  />
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percentage }) => `${name}: ${percentage}%`}
                    outerRadius={80}
                    dataKey="value"
                    animationBegin={0}
                    animationDuration={1000}
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <ChartLegend content={<ChartLegendContent />} />
                </PieChart>
              </ResponsiveContainer>
            </ChartContainer>
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
            <ChartContainer
              config={{
                revenue: {
                  label: "Revenue",
                  theme: { light: "hsl(217 91% 60%)", dark: "hsl(217 91% 70%)" },
                },
                profit: {
                  label: "Profit",
                  theme: { light: "hsl(142 76% 36%)", dark: "hsl(142 76% 56%)" },
                },
              }}
            >
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={Object.entries(revenueBreakdown).map(([type, data]) => ({
                    type:
                      type === "colocated"
                        ? "Colocated"
                        : type === "safaricom_only"
                        ? "Safaricom"
                        : "Airtel",
                    revenue: data.revenue,
                    profit: data.profit,
                  }))}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="type" />
                  <YAxis tickFormatter={(value) => `${value / 1000}K`} />
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        formatter={(value, name) => [
                          formatCurrency(value as number),
                          name as string,
                        ]}
                      />
                    }
                  />
                  <Legend />
                  <Bar dataKey="revenue" fill="var(--color-revenue)" radius={4} />
                  <Bar dataKey="profit" fill="var(--color-profit)" radius={4} />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
