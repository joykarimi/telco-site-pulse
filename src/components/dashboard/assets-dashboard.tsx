import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Asset } from '@/types/database';
import { Site } from '@/types/site';
import { 
  Activity, 
  AlertTriangle, 
  Archive, 
  Package, 
  TrendingUp,
  Zap,
  Shield,
  Wifi,
  Server,
  Battery,
  Sun,
  Wrench
} from 'lucide-react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

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

const COLORS = ['hsl(217 91% 60%)', 'hsl(142 76% 36%)', 'hsl(38 92% 50%)', 'hsl(0 84% 60%)', 'hsl(193 82% 31%)', 'hsl(262 52% 47%)', 'hsl(346 77% 49%)'];

export function AssetsDashboard({ assets, sites }: AssetsDashboardProps) {
  // Asset status statistics
  const statusStats = {
    active: assets.filter(a => a.status === 'active').length,
    in_repair: assets.filter(a => a.status === 'in_repair').length,
    retired: assets.filter(a => a.status === 'retired').length,
  };

  const totalAssets = assets.length;
  const activePercentage = totalAssets > 0 ? (statusStats.active / totalAssets) * 100 : 0;

  // Asset type distribution
  const assetTypeData = Object.entries(
    assets.reduce((acc, asset) => {
      acc[asset.asset_type] = (acc[asset.asset_type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  ).map(([type, count]) => ({
    name: type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
    value: count,
    type: type,
  }));

  // Assets per site distribution
  const siteDistribution = sites.map(site => {
    const siteAssets = assets.filter(asset => asset.current_site_id === site.id);
    return {
      siteName: site.name,
      total: siteAssets.length,
      active: siteAssets.filter(a => a.status === 'active').length,
      repair: siteAssets.filter(a => a.status === 'in_repair').length,
    };
  }).filter(site => site.total > 0);

  // Status distribution for pie chart
  const statusData = [
    { name: 'Active', value: statusStats.active, color: 'hsl(142 76% 36%)' },
    { name: 'In Repair', value: statusStats.in_repair, color: 'hsl(38 92% 50%)' },
    { name: 'Retired', value: statusStats.retired, color: 'hsl(215 20% 65%)' },
  ].filter(item => item.value > 0);

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
            <div className="text-2xl font-bold text-foreground">{totalAssets}</div>
            <p className="text-xs text-muted-foreground">
              Across {sites.length} sites
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-success hover:shadow-custom-success transition-all duration-300 animate-scale-in border-0">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-success-foreground">Active Assets</CardTitle>
            <Activity className="h-4 w-4 text-success-foreground animate-pulse" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success-foreground">{statusStats.active}</div>
            <Progress value={activePercentage} className="mt-2 h-1" />
            <p className="text-xs text-success-foreground/80 mt-1">
              {activePercentage.toFixed(1)}% operational
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-warning hover:shadow-custom-warning transition-all duration-300 animate-scale-in border-0">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-warning-foreground">In Repair</CardTitle>
            <AlertTriangle className="h-4 w-4 text-warning-foreground animate-bounce" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning-foreground">{statusStats.in_repair}</div>
            <p className="text-xs text-warning-foreground/80">
              Requires attention
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-muted to-muted/50 hover:shadow-custom-card transition-all duration-300 animate-scale-in border-0">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Retired</CardTitle>
            <Archive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{statusStats.retired}</div>
            <p className="text-xs text-muted-foreground">
              End of lifecycle
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
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={assetTypeData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  animationBegin={0}
                  animationDuration={800}
                >
                  {assetTypeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: number) => [value, 'Count']}
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

        {/* Asset Status Distribution */}
        <Card className="animate-slide-in-right bg-gradient-card hover:shadow-custom-hover transition-all duration-300">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-success animate-pulse" />
              Asset Status Overview
            </CardTitle>
            <CardDescription>Current operational status</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  animationBegin={0}
                  animationDuration={800}
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: number) => [value, 'Assets']}
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: 'var(--radius)',
                  }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
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
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={siteDistribution} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis 
                dataKey="siteName" 
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis 
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: 'var(--radius)',
                }}
              />
              <Legend />
              <Bar 
                dataKey="active" 
                stackId="a" 
                fill="hsl(142 76% 36%)" 
                name="Active"
                radius={[2, 2, 0, 0]}
                animationBegin={0}
                animationDuration={800}
              />
              <Bar 
                dataKey="repair" 
                stackId="a" 
                fill="hsl(38 92% 50%)" 
                name="In Repair"
                radius={[2, 2, 0, 0]}
                animationBegin={200}
                animationDuration={800}
              />
            </BarChart>
          </ResponsiveContainer>
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