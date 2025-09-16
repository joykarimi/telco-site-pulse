import { useMemo } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  ChartConfig,
} from '@/components/ui/chart';
import { Asset, Site } from '@/pages/Index';
import {
  Package,
  TrendingUp,
  Zap,
  Sun,
  Battery,
  Server,
  Wifi,
  Shield,
  Wrench,
} from 'lucide-react';
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
  Tooltip,
  Legend,
} from 'recharts';

interface AssetsDashboardProps {
  assets: Asset[];
  sites: Site[];
}

const ASSET_ICONS: Record<string, React.ComponentType<any>> = {
  generator: Zap,
  solar_panel: Sun,
  battery: Battery,
  aps_board: Server,
  router: Wifi,
  rectifier: Shield,
  electronic_lock: Wrench,
};

export function AssetsDashboard({ assets, sites }: AssetsDashboardProps) {
  const assetTypeData = useMemo(() => {
    return Object.entries(
      assets.reduce((acc, asset) => {
        acc[asset.type] = (acc[asset.type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    ).map(([type, count]) => ({
      name: type.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
      value: count,
      type: type,
      fill: `var(--color-${type})`,
    }));
  }, [assets]);

  const siteDistribution = useMemo(() => {
    return sites
      .map((site) => {
        const siteAssets = assets.filter((asset) => asset.site_id === site.id);
        return {
          siteName: site.name,
          total: siteAssets.length,
        };
      })
      .filter((site) => site.total > 0);
  }, [assets, sites]);

  const chartConfig = {
    ...assetTypeData.reduce((acc, cur) => {
      acc[cur.type] = {
        label: cur.name,
        theme: {
          light: `hsl(var(--chart-${assetTypeData.findIndex((a) => a.type === cur.type) + 1}))`,
          dark: `hsl(var(--chart-${assetTypeData.findIndex((a) => a.type === cur.type) + 1}))`,
        },
      };
      return acc;
    }, {} as ChartConfig),
    total: {
      label: 'Total',
      theme: {
        light: 'hsl(142 76% 36%)',
        dark: 'hsl(142 76% 46%)',
      },
    },
  } satisfies ChartConfig;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-card hover:shadow-custom-hover transition-all duration-300 animate-scale-in border-0">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Assets</CardTitle>
            <Package className="h-4 w-4 text-primary animate-float" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{assets.length}</div>
            <p className="text-xs text-muted-foreground">
              Across {sites.length} sites
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Asset Type Distribution */}
        <Card className="animate-slide-in-right bg-gradient-card hover:shadow-custom-hover transition-all duration-300">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary animate-float" />
              Asset Type Distribution
            </CardTitle>
            <CardDescription>Equipment breakdown by category</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig}>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Pie
                    data={assetTypeData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    dataKey="value"
                  >
                    {assetTypeData.map((entry) => (
                      <Cell key={`cell-${entry.type}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <ChartLegend content={<ChartLegendContent />} />
                </PieChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Site Distribution */}
      <Card className="animate-fade-in-up bg-gradient-card hover:shadow-custom-hover transition-all duration-300">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-primary animate-float" />
            Assets by Site
          </CardTitle>
          <CardDescription>Asset distribution across all locations</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig}>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={siteDistribution} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="siteName"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis fontSize={12} tickLine={false} axisLine={false} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Legend />
                <Bar
                  dataKey="total"
                  stackId="a"
                  fill="var(--color-total)"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Asset Type Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        {assetTypeData.map((asset, index) => {
          const IconComponent = ASSET_ICONS[asset.type] || Package;
          return (
            <Card
              key={asset.type}
              className="bg-gradient-card hover:shadow-custom-hover transition-all duration-300 hover:scale-105 animate-bounce-in border-0"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <CardContent className="p-4 text-center">
                <IconComponent className="h-8 w-8 mx-auto mb-2 text-primary animate-float" />
                <div className="text-2xl font-bold text-foreground">{asset.value}</div>
                <p className="text-xs text-muted-foreground capitalize">
                  {asset.name}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
