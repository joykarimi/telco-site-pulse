
import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { getSiteDefinitions, getSiteMonthlyData, CombinedSiteData, SiteMonthlyData } from "@/lib/firebase/firestore";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const currentYear = new Date().getFullYear();
const currentMonth = new Date().getMonth() + 1;

export default function Dashboard() {
    const [combinedSites, setCombinedSites] = useState<CombinedSiteData[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchSitesAndCombineData = async () => {
            try {
                setLoading(true);
                const [siteDefinitions, monthlyData] = await Promise.all([
                    getSiteDefinitions(),
                    getSiteMonthlyData(currentMonth, currentYear)
                ]);

                const monthlyDataMap = new Map(monthlyData.map(m => [m.siteId, m]));

                const combined: CombinedSiteData[] = siteDefinitions.map(def => ({
                    ...def,
                    monthlyData: monthlyDataMap.get(def.id) || null
                }));

                setCombinedSites(combined);
                setError(null);
            } catch (err) {
                setError("Failed to fetch site data. Please try again later.");
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchSitesAndCombineData();
    }, []);

    const getMonthlyValue = (site: CombinedSiteData, key: keyof SiteMonthlyData, defaultValue: number = 0) => {
        if (!site.monthlyData) return defaultValue;
        const value = site.monthlyData[key];
        return typeof value === 'number' ? value : defaultValue;
    };

    const dashboardData = useMemo(() => {
        if (!combinedSites.length) return null;

        const totalEarnings = combinedSites.reduce((acc, site) => acc + getMonthlyValue(site, 'earningsSafaricom') + getMonthlyValue(site, 'earningsAirtel') + getMonthlyValue(site, 'earningsJtl'), 0);
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
            { name: 'Safaricom', earnings: earningsByTenant.safaricom },
            { name: 'Airtel', earnings: earningsByTenant.airtel },
            { name: 'JTL', earnings: earningsByTenant.jtl },
        ];

        const siteProfitability = combinedSites.map(site => {
            const earnings = getMonthlyValue(site, 'earningsSafaricom') + getMonthlyValue(site, 'earningsAirtel') + getMonthlyValue(site, 'earningsJtl');
            const expenses = (getMonthlyValue(site, 'gridConsumption') * getMonthlyValue(site, 'gridUnitCost')) + 
                               (getMonthlyValue(site, 'fuelConsumption') * getMonthlyValue(site, 'fuelUnitCost')) + 
                               getMonthlyValue(site, 'solarMaintenanceCost');
            return {
                name: site.name,
                profit: earnings - expenses
            };
        }).sort((a, b) => b.profit - a.profit);

        return {
            totalEarnings,
            totalExpenses,
            netProfit,
            tenantData,
            mostProfitableSites: siteProfitability.slice(0, 5),
            leastProfitableSites: siteProfitability.slice(-5).reverse(),
        }
    }, [combinedSites]);

    if (loading) return <p>Loading dashboard for {new Date(0, currentMonth - 1).toLocaleString('default', { month: 'long' })} {currentYear}...</p>;
    if (error) return <p className="text-destructive">{error}</p>;
    if (!dashboardData) return <p>No data available for the current period.</p>;

    const { totalEarnings, totalExpenses, netProfit, tenantData, mostProfitableSites, leastProfitableSites } = dashboardData;

    return (
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
                <p className="text-muted-foreground">Showing data for {new Date(0, currentMonth - 1).toLocaleString('default', { month: 'long' })} {currentYear}</p>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Link to="/revenue-breakdown">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" className="h-4 w-4 text-muted-foreground"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">KES {totalEarnings.toFixed(2)}</div>
                        </CardContent>
                    </Card>
                </Link>
                <Link to="/sites">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" className="h-4 w-4 text-muted-foreground"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-red-500">KES {totalExpenses.toFixed(2)}</div>
                        </CardContent>
                    </Card>
                </Link>
                <Link to="/sites">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Net Profit</CardTitle>
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" className="h-4 w-4 text-muted-foreground"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>
                        </CardHeader>
                        <CardContent>
                            <div className={`text-2xl font-bold ${netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                KES {netProfit.toFixed(2)}
                            </div>
                        </CardContent>
                    </Card>
                </Link>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Card className="col-span-4">
                    <CardHeader>
                        <CardTitle>Earnings by Tenant</CardTitle>
                    </CardHeader>
                    <CardContent className="pl-2">
                        <ResponsiveContainer width="100%" height={350}>
                            <BarChart data={tenantData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" />
                                <YAxis />
                                <Tooltip formatter={(value: number) => `KES ${value.toFixed(2)}`} />
                                <Legend />
                                <Bar dataKey="earnings" fill="#8884d8" name="Earnings" />
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
                            <ul className="space-y-1 text-sm">
                                {mostProfitableSites.map(site => (
                                    <li key={site.name} className="flex justify-between">
                                        <span>{site.name}</span>
                                        <span className="font-mono text-green-600">KES {site.profit.toFixed(2)}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div>
                            <h3 className="font-semibold mb-2 text-red-600">Least Profitable</h3>
                            <ul className="space-y-1 text-sm">
                                {leastProfitableSites.map(site => (
                                    <li key={site.name} className="flex justify-between">
                                        <span>{site.name}</span>
                                        <span className={`font-mono ${site.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                            KES {site.profit.toFixed(2)}
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
