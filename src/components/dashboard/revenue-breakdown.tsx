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
import { Site } from "@/types/site";
import { calculateSiteProfitLoss, formatCurrency } from "@/lib/calculations";
import {
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

// Custom label for PieChart with improved positioning and always visible
const PieLabel = ({ cx, cy, midAngle, outerRadius, percent, name, value }: any) => {
  const RADIAN = Math.PI / 180;
  const sin = Math.sin(-RADIAN * midAngle);
  const cos = Math.cos(-RADIAN * midAngle);
  const sx = cx + outerRadius * cos;
  const sy = cy + outerRadius * sin;
  const mx = cx + (outerRadius + 30) * cos;
  const my = cy + (outerRadius + 30) * sin;
  const ex = mx + (cos >= 0 ? 1 : -1) * 22;
  const ey = my;
  const textAnchor = cos >= 0 ? 'start' : 'end';

  return (
    <g>
      <path d={`M${sx},${sy}L${mx},${my}L${ex},${ey}`} stroke="hsl(var(--muted-foreground))" fill="none" strokeWidth={1} />
      <circle cx={ex} cy={ey} r={2} fill="hsl(var(--muted-foreground))" stroke="none" />
      <text x={ex + (cos >= 0 ? 1 : -1) * 12} y={ey} textAnchor={textAnchor} fill="hsl(var(--foreground))" className="text-xs font-semibold">
        {`${name} ${(percent * 100).toFixed(1)}%`}
      </text>
    </g>
  );
};

export function RevenueBreakdown({ sites }: RevenueBreakdownProps) {
  const revenueBreakdown = sites.reduce((acc, site) => {
    const calculations = calculateSiteProfitLoss(site);
    const hasSafaricom = site.safaricomIncome > 0;
    const hasAirtel = site.airtelIncome > 0;
    const hasJtl = site.jtlIncome > 0;

    let revenueType: "colocated" | "safaricom_only" | "airtel_only" | "jtl_only" | "multi_vendor" | "safaricom_jtl_colocated" | "airtel_jtl_colocated" | "none" =
      "none";

    const operatorCount = [hasSafaricom, hasAirtel, hasJtl].filter(Boolean).length;

    if (operatorCount === 3) {
        revenueType = "multi_vendor";
    } else if (hasSafaricom && hasAirtel && !hasJtl) {
        revenueType = "colocated";
    } else if (hasSafaricom && hasJtl && !hasAirtel) {
        revenueType = "safaricom_jtl_colocated";
    } else if (hasAirtel && hasJtl && !hasSafaricom) {
        revenueType = "airtel_jtl_colocated";
    } else if (hasSafaricom && !hasAirtel && !hasJtl) {
        revenueType = "safaricom_only";
    } else if (hasAirtel && !hasSafaricom && !hasJtl) {
        revenueType = "airtel_only";
    } else if (hasJtl && !hasSafaricom && !hasAirtel) {
        revenueType = "jtl_only";
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
    originalType: type, // Store the original type key
    name:
      type === "colocated"
        ? "Safaricom & Airtel"
        : type === "safaricom_only"
        ? "Safaricom Only"
        : type === "airtel_only"
        ? "Airtel Only"
        : type === "jtl_only"
        ? "JTL Only"
        : type === "multi_vendor"
        ? "Multi-Vendor"
        : type === "safaricom_jtl_colocated"
        ? "Safaricom & JTL"
        : type === "airtel_jtl_colocated"
        ? "Airtel & JTL"
        : "Unknown",
    value: data.revenue,
    count: data.count,
    profit: data.profit,
    percentage: totalRevenue
      ? ((data.revenue / totalRevenue) * 100).toFixed(1)
      : "0",
  }));

  // Define a rich, modern color palette using HSL values
  const colorPalette = {
    safaricom_only: { light: "hsl(142, 70%, 50%)", dark: "hsl(142, 70%, 65%)" }, // Greenish
    airtel_only: { light: "hsl(210, 70%, 50%)", dark: "hsl(210, 70%, 65%)" },   // Bluish
    jtl_only: { light: "hsl(45, 70%, 50%)", dark: "hsl(45, 70%, 65%)" },       // Yellowish/Orange
    colocated: { light: "hsl(270, 50%, 50%)", dark: "hsl(270, 50%, 65%)" },     // Purplish (Safaricom & Airtel)
    safaricom_jtl_colocated: { light: "hsl(100, 50%, 40%)", dark: "hsl(100, 50%, 55%)" }, // Blended Green-Yellow
    airtel_jtl_colocated: { light: "hsl(180, 50%, 40%)", dark: "hsl(180, 50%, 55%)" },   // Blended Blue-Green
    multi_vendor: { light: "hsl(330, 60%, 50%)", dark: "hsl(330, 60%, 65%)" },   // Magenta (All three)
  }; 

  const chartConfig = {
    colocated: { label: "Safaricom & Airtel", theme: colorPalette.colocated },
    safaricom_only: { label: "Safaricom Only", theme: colorPalette.safaricom_only },
    airtel_only: { label: "Airtel Only", theme: colorPalette.airtel_only },
    jtl_only: { label: "JTL Only", theme: colorPalette.jtl_only },
    multi_vendor: { label: "Multi-Vendor", theme: colorPalette.multi_vendor },
    safaricom_jtl_colocated: { label: "Safaricom & JTL Colocated", theme: colorPalette.safaricom_jtl_colocated },
    airtel_jtl_colocated: { label: "Airtel & JTL Colocated", theme: colorPalette.airtel_jtl_colocated },
    revenue: { label: "Revenue", theme: { light: "hsl(217 91% 60%)", dark: "hsl(217 91% 70%)" } }, // Default for bar revenue
    profit: { label: "Profit", theme: { light: "hsl(142 76% 36%)", dark: "hsl(142 76% 56%)" } },   // Default for bar profit
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
          <CardContent className="p-0 pb-4">
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
                    innerRadius={60} // Donut chart effect
                    outerRadius={100}
                    paddingAngle={2} // Small gap between segments
                    dataKey="value"
                    animationBegin={0}
                    animationDuration={800}
                    labelLine={false} // Label line is now part of the custom label
                    label={PieLabel} // Use custom label component
                  >
                    {pieData.map((entry, index) => {
                      const fill = colorPalette[entry.originalType as keyof typeof colorPalette]?.light || "#cccccc";
                      return <Cell key={`cell-${index}`} fill={fill} />;
                    })}
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
              Revenue by Site Type
            </CardTitle>
            <CardDescription>Total revenue for each site configuration</CardDescription>
          </CardHeader>
          <CardContent className="px-2">
            <ChartContainer
              config={chartConfig}
            >
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={pieData.map(item => ({
                    type: item.name,
                    revenue: item.value,
                    originalType: item.originalType, // Pass originalType for coloring
                  }))}
                  layout="vertical"
                  margin={{ left: 10, right: 80, top: 10, bottom: 10 }} // Added right margin for labels
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" tickFormatter={(value) => `${value / 1000}K`} />
                  <YAxis type="category" dataKey="type" width={120} />
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
                  <Bar 
                    dataKey="revenue" 
                    radius={[4, 4, 0, 0]} // Rounded top corners
                    animationBegin={0}
                    animationDuration={800}
                    label={{ position: 'right', formatter: (value: number) => formatCurrency(value) }}
                  >
                    {pieData.map((entry, index) => {
                      const fill = colorPalette[entry.originalType as keyof typeof colorPalette]?.light || "#cccccc";
                      return <Cell key={`cell-${index}`} fill={fill} />;
                    })}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
