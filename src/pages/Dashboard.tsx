
import { useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom"; 
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { getSiteDefinitions, getSiteMonthlyData, CombinedSiteData, SiteMonthlyData } from "@/lib/firebase/firestore";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LabelList, Cell } from 'recharts';
import { useDataFetching } from "@/hooks/use-data-fetching";
import { InfoCard } from "@/components/InfoCard";

const currentYear = new Date().getFullYear();
const currentMonth = new Date().getMonth() + 1;

// Helper to safely convert values to numbers, defaulting to 0
const ensureNumber = (value: any): number => {
    const num = parseFloat(value);
    return isNaN(num) ? 0 : num;
};

// Helper for currency formatting
const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
        style: 'currency',
        currency: 'KES',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount);
};

// Helper to format large currency numbers for axis ticks (e.g., KES 100K, KES 1.5M)
const formatLargeCurrency = (value: number) => {
    if (Math.abs(value) >= 1_000_000) {
        return `KES ${(value / 1_000_000).toFixed(1)}M`;
    } else if (Math.abs(value) >= 1_000) {
        return `KES ${(value / 1_000).toFixed(0)}K`;
    }
    return `KES ${value.toFixed(0)}`; // For smaller values, show actual number (no decimals for whole KES)
};

export default function Dashboard() {
    const navigate = useNavigate(); // Initialize useNavigate

    const fetchCombinedData = useCallback(async () => {
        const [siteDefinitions, monthlyData] = await Promise.all([
            getSiteDefinitions(),
            getSiteMonthlyData(currentMonth, currentYear)
        ]);

        const monthlyDataMap = new Map(monthlyData.map(m => [m.siteId, m]));

        return siteDefinitions.map(def => {
            const correspondingMonthlyData = monthlyDataMap.get(def.id);
            return {
                ...def,
                monthlyData: correspondingMonthlyData ? {
                    ...correspondingMonthlyData,
                    gridConsumption: ensureNumber(correspondingMonthlyData.gridConsumption),
                    fuelConsumption: ensureNumber(correspondingMonthlyData.fuelConsumption),
                    solarContribution: ensureNumber(correspondingMonthlyData.solarContribution),
                    earningsSafaricom: ensureNumber(correspondingMonthlyData.earningsSafaricom),
                    earningsAirtel: ensureNumber(correspondingMonthlyData.earningsAirtel),
                    earningsJtl: ensureNumber(correspondingMonthlyData.earningsJtl),
                    gridUnitCost: ensureNumber(correspondingMonthlyData.gridUnitCost),
                    fuelUnitCost: ensureNumber(correspondingMonthlyData.fuelUnitCost),
                    solarMaintenanceCost: ensureNumber(correspondingMonthlyData.solarMaintenanceCost),
                } : null,
            };
        });
    }, []);

    const { data: combinedSites, loading, error } = useDataFetching(fetchCombinedData);

    const getMonthlyValue = useCallback((site: CombinedSiteData, key: keyof SiteMonthlyData) => {
        if (!site.monthlyData) return 0;
        return ensureNumber(site.monthlyData[key]);
    }, []);

    const dashboardData = useMemo(() => {
        if (!combinedSites || !combinedSites.length) return null;

        const totalEarnings = combinedSites.reduce((acc, site) => 
            acc + getMonthlyValue(site, 'earningsSafaricom') + 
            getMonthlyValue(site, 'earningsAirtel') + 
            getMonthlyValue(site, 'earningsJtl'), 0
        );
        
        const totalExpenses = combinedSites.reduce((acc, site) => {
            const gridExpense = getMonthlyValue(site, 'gridConsumption') * getMonthlyValue(site, 'gridUnitCost');
            const fuelExpense = getMonthlyValue(site, 'fuelConsumption') * getMonthlyValue(site, 'fuelUnitCost');
            const solarExpense = getMonthlyValue(site, 'solarMaintenanceCost');
            return acc + gridExpense + fuelExpense + solarExpense;
        }, 0);

        const netProfit = totalEarnings - totalExpenses;

        const earningsByTenant = {
            safaricom: combinedSites.reduce((acc, site) => acc + getMonthlyValue(site, 'earningsSafaricom'), 0),
            airtel: combinedSites.reduce((acc, site) => acc + getMonthlyValue(site, 'earningsAirtel'), 0),
            jtl: combinedSites.reduce((acc, site) => acc + getMonthlyValue(site, 'earningsJtl'), 0),
        };

        const tenantData = [
            { name: 'Safaricom', earnings: earningsByTenant.safaricom, color: "hsl(142, 70%, 50%)" }, // Green
            { name: 'Airtel', earnings: earningsByTenant.airtel, color: "hsl(210, 70%, 50%)" },     // Blue
            { name: 'JTL', earnings: earningsByTenant.jtl, color: "hsl(45, 70%, 50%)" },         // Orange
        ].filter(item => item.earnings > 0);

        const siteProfitability = combinedSites.map(site => {
            const earnings = getMonthlyValue(site, 'earningsSafaricom') + getMonthlyValue(site, 'earningsAirtel') + getMonthlyValue(site, 'earningsJtl');
            const expenses = (getMonthlyValue(site, 'gridConsumption') * getMonthlyValue(site, 'gridUnitCost')) + 
                               (getMonthlyValue(site, 'fuelConsumption') * getMonthlyValue(site, 'fuelUnitCost')) + 
                               getMonthlyValue(site, 'solarMaintenanceCost');
            return {
                name: site.name,
                profit: ensureNumber(earnings) - ensureNumber(expenses)
            };
        }).sort((a, b) => ensureNumber(b.profit) - ensureNumber(a.profit));

        return {
            totalEarnings: ensureNumber(totalEarnings),
            totalExpenses: ensureNumber(totalExpenses),
            netProfit: ensureNumber(netProfit),
            tenantData,
            mostProfitableSites: siteProfitability.slice(0, 5),
            leastProfitableSites: siteProfitability.slice(-5).reverse(),
        }
    }, [combinedSites, getMonthlyValue]);

    if (loading) return <p>Loading dashboard for {new Date(0, currentMonth - 1).toLocaleString('default', { month: 'long' })} {currentYear}...</p>;
    if (error) return <p className="text-destructive">{error}</p>;
    if (!dashboardData) return <p>No data available for the current period.</p>;

    const { totalEarnings, totalExpenses, netProfit, tenantData, mostProfitableSites, leastProfitableSites } = dashboardData;

    const handleBarClick = (data: any, index: number) => {
        const tenantName = data.name;
        // Redirect to /sites page with a query parameter for filtering
        navigate(`/sites?tenant=${tenantName}`);
    };

    return (
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
                <p className="text-muted-foreground">Showing data for {new Date(0, currentMonth - 1).toLocaleString('default', { month: 'long' })} {currentYear}</p>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <InfoCard 
                    title="Total Earnings"
                    value={formatCurrency(totalEarnings)}
                />
                <InfoCard 
                    title="Total Expenses"
                    value={formatCurrency(totalExpenses)}
                    valueClassName="text-red-500"
                />
                <InfoCard 
                    title="Net Profit"
                    value={formatCurrency(netProfit)}
                    valueClassName={netProfit >= 0 ? 'text-green-600' : 'text-red-600'}
                />
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Card className="col-span-4">
                    <CardHeader>
                        <CardTitle>Earnings by Tenant</CardTitle>
                    </CardHeader>
                    <CardContent className="pl-2">
                        <ResponsiveContainer width="100%" height={350}>
                            <BarChart data={tenantData} margin={{ top: 20, right: 30, left: 60, bottom: 5 }}> 
                                <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.3} /> 
                                <XAxis dataKey="name" tickLine={false} axisLine={false} />
                                <YAxis 
                                    label={{ value: 'Earnings (KES)', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fontSize: '14px', fontWeight: 'bold' } }} 
                                    tickFormatter={formatLargeCurrency} 
                                    axisLine={false} 
                                    tickLine={false} 
                                    width={100} 
                                    tick={{ fill: 'hsl(var(--foreground))' , fontSize: '12px', fontWeight: 'bold' }} 
                                />
                                <Tooltip formatter={(value: number) => formatCurrency(value)} />
                                <Legend />
                                <Bar dataKey="earnings" radius={[4, 4, 0, 0]} animationBegin={0} animationDuration={800} barSize={60} stroke="hsl(var(--card-foreground))" strokeWidth={1} onClick={handleBarClick}> {/* Added onClick handler */}
                                    {tenantData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                    <LabelList dataKey="earnings" position="top" formatter={(value: number) => formatCurrency(value)} fill="hsl(var(--foreground))" fontSize={12} fontWeight="bold" /> 
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                <Card className="col-span-3">
                    <CardHeader>
                        <CardTitle>Site Profitability</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="mb-4">
                            <h3 className="font-semibold mb-2 text-green-600">Most Profitable</h3>
                            <ul className="space-y-2 text-sm">
                                {mostProfitableSites.map(site => (
                                    <li key={site.name} className="flex justify-between items-center py-1 border-b border-border last:border-b-0">
                                        <span className="font-medium">{site.name}</span>
                                        <span className="font-mono text-green-600 font-bold">{formatCurrency(site.profit)}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div>
                            <h3 className="font-semibold mb-2 text-red-600">Least Profitable</h3>
                            <ul className="space-y-2 text-sm">
                                {leastProfitableSites.map(site => (
                                    <li key={site.name} className="flex justify-between items-center py-1 border-b border-border last:border-b-0">
                                        <span className="font-medium">{site.name}</span>
                                        <span className={`font-mono font-bold ${site.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                            {formatCurrency(site.profit)}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
