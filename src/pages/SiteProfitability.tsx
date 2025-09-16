
import { useEffect, useState, useMemo } from "react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { getSiteDefinitions, getSiteMonthlyData, SiteDefinition, SiteMonthlyData, CombinedSiteData } from "@/lib/firebase/firestore";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface SiteProfit {
    name: string;
    profit: number;
}

const currentYear = new Date().getFullYear();
const years = Array.from({ length: 5 }, (_, i) => currentYear - i);
const months = Array.from({ length: 12 }, (_, i) => ({ value: i + 1, name: new Date(0, i).toLocaleString('default', { month: 'long' }) }));

export default function SiteProfitability() {
    const [sites, setSites] = useState<CombinedSiteData[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
    const [selectedYear, setSelectedYear] = useState(currentYear);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const [siteDefinitions, monthlyData] = await Promise.all([
                    getSiteDefinitions(),
                    getSiteMonthlyData(selectedMonth, selectedYear),
                ]);

                const monthlyDataMap = new Map(monthlyData.map(d => [d.siteId, d]));

                const combinedData = siteDefinitions.map(siteDef => {
                    const correspondingMonthlyData = monthlyDataMap.get(siteDef.id);
                    return {
                        ...siteDef,
                        monthlyData: correspondingMonthlyData ? {
                            month: correspondingMonthlyData.month,
                            year: correspondingMonthlyData.year,
                            gridConsumption: correspondingMonthlyData.gridConsumption,
                            fuelConsumption: correspondingMonthlyData.fuelConsumption,
                            solarContribution: correspondingMonthlyData.solarContribution,
                            earningsSafaricom: correspondingMonthlyData.earningsSafaricom,
                            earningsAirtel: correspondingMonthlyData.earningsAirtel,
                            earningsJtl: correspondingMonthlyData.earningsJtl,
                            gridUnitCost: correspondingMonthlyData.gridUnitCost,
                            fuelUnitCost: correspondingMonthlyData.fuelUnitCost,
                            solarMaintenanceCost: correspondingMonthlyData.solarMaintenanceCost,
                        } : null,
                    };
                });

                setSites(combinedData);
                setError(null);
            } catch (err) {
                setError("Failed to fetch site profitability data. Please try again later.");
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [selectedMonth, selectedYear]);

    const siteProfitability: SiteProfit[] = useMemo(() => {
        if (!sites) return [];
        return sites.map(site => {
            if (!site.monthlyData) {
                return { name: site.name, profit: 0 };
            }
            const monthly = site.monthlyData;
            const profit = ((monthly.earningsSafaricom ?? 0) + (monthly.earningsAirtel ?? 0) + (monthly.earningsJtl ?? 0)) -
                           ((monthly.gridConsumption * monthly.gridUnitCost) +
                            (monthly.fuelConsumption * monthly.fuelUnitCost) +
                            monthly.solarMaintenanceCost);
            return { name: site.name, profit };
        }).sort((a, b) => b.profit - a.profit);
    }, [sites]);

    const profitableSites = siteProfitability.filter(s => s.profit >= 0);
    const unprofitableSites = siteProfitability.filter(s => s.profit < 0);

    const getMonthName = (monthNumber: number) => {
        return months.find(m => m.value === monthNumber)?.name || ''
    }

    return (
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-2 md:space-y-0">
                <h2 className="text-3xl font-bold tracking-tight">Site Profitability</h2>
                <div className="flex items-center space-x-2">
                    <Select value={String(selectedMonth)} onValueChange={(value) => setSelectedMonth(Number(value))}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Select Month" />
                        </SelectTrigger>
                        <SelectContent>
                            {months.map(month => (
                                <SelectItem key={month.value} value={String(month.value)}>{month.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Select value={String(selectedYear)} onValueChange={(value) => setSelectedYear(Number(value))}>
                        <SelectTrigger className="w-[120px]">
                            <SelectValue placeholder="Select Year" />
                        </SelectTrigger>
                        <SelectContent>
                            {years.map(year => (
                                <SelectItem key={year} value={String(year)}>{year}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {loading ? (
                <p>Loading site profitability data for {getMonthName(selectedMonth)} {selectedYear}...</p>
            ) : error ? (
                <p className="text-destructive">{error}</p>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
                    <Card>
                        <CardHeader>
                            <CardTitle>Profitable Sites</CardTitle>
                            <CardDescription>Sites that generated a profit for {getMonthName(selectedMonth)} {selectedYear}.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {profitableSites.length > 0 ? profitableSites.map((site) => (
                                <div key={site.name} className="flex items-center">
                                    <div>{site.name}</div>
                                    <div className="ml-auto font-medium text-green-600">KES {site.profit.toFixed(2)}</div>
                                </div>
                            )) : <p>No profitable sites found for the selected period.</p>}
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle>Unprofitable Sites</CardTitle>
                            <CardDescription>Sites that incurred a loss for {getMonthName(selectedMonth)} {selectedYear}.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {unprofitableSites.length > 0 ? unprofitableSites.map((site) => (
                                <div key={site.name} className="flex items-center">
                                    <div>{site.name}</div>
                                    <div className="ml-auto font-medium text-red-600">KES {site.profit.toFixed(2)}</div>
                                </div>
                            )) : <p>No unprofitable sites found for the selected period.</p>}
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}
