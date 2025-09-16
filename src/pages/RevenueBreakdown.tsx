
import { useEffect, useState, useMemo } from "react";
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import highcharts3d from 'highcharts/highcharts-3d';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { getSiteDefinitions, getSiteMonthlyData, CombinedSiteData } from "@/lib/firebase/firestore";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Initialize the 3D module
highcharts3d(Highcharts);

const currentYear = new Date().getFullYear();
const years = Array.from({ length: 5 }, (_, i) => currentYear - i);
const months = Array.from({ length: 12 }, (_, i) => ({ value: i + 1, name: new Date(0, i).toLocaleString('default', { month: 'long' }) }));

export default function RevenueBreakdown() {
    const [sites, setSites] = useState<CombinedSiteData[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedSiteType, setSelectedSiteType] = useState('All');
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
                setError("Failed to fetch revenue data. Please try again later.");
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [selectedMonth, selectedYear]);

    const filteredSites = useMemo(() => sites.filter(site => {
        if (selectedSiteType === 'All') return true;
        if (!site.monthlyData) return false;
        const tenantCount = [site.monthlyData.earningsSafaricom, site.monthlyData.earningsAirtel, site.monthlyData.earningsJtl].filter(e => e > 0).length;
        if (selectedSiteType === 'Single-Operator' && tenantCount === 1) return true;
        if (selectedSiteType === 'Colocated' && tenantCount === 2) return true;
        if (selectedSiteType === 'Multi-Vendor' && tenantCount === 3) return true;
        return false;
    }), [sites, selectedSiteType]);

    const totalRevenue = useMemo(() => filteredSites.reduce((acc, site) => acc + (site.monthlyData?.earningsSafaricom ?? 0) + (site.monthlyData?.earningsAirtel ?? 0) + (site.monthlyData?.earningsJtl ?? 0), 0), [filteredSites]);
    
    const revenueByTenant = useMemo(() => ({
        safaricom: filteredSites.reduce((acc, site) => acc + (site.monthlyData?.earningsSafaricom ?? 0), 0),
        airtel: filteredSites.reduce((acc, site) => acc + (site.monthlyData?.earningsAirtel ?? 0), 0),
        jtl: filteredSites.reduce((acc, site) => acc + (site.monthlyData?.earningsJtl ?? 0), 0),
    }), [filteredSites]);

    const pieChartOptions = useMemo(() => ({
        chart: {
            type: 'pie',
            options3d: {
                enabled: true,
                alpha: 45,
                beta: 0
            }
        },
        title: {
            text: 'Revenue Distribution by Tenant'
        },
        tooltip: {
            pointFormat: '{series.name}: <b>{point.percentage:.1f}%</b>'
        },
        plotOptions: {
            pie: {
                allowPointSelect: true,
                cursor: 'pointer',
                depth: 35,
                dataLabels: {
                    enabled: true,
                    format: '{point.name}'
                }
            }
        },
        series: [{
            type: 'pie',
            name: 'Revenue Share',
            data: [
                { name: 'Safaricom', y: revenueByTenant.safaricom },
                { name: 'Airtel', y: revenueByTenant.airtel },
                { name: 'JTL', y: revenueByTenant.jtl }
            ].filter(item => item.y > 0)
        }]
    }), [revenueByTenant]);

    const barChartOptions = useMemo(() => ({
        chart: {
            type: 'column',
            options3d: {
                enabled: true,
                alpha: 15,
                beta: 15,
                depth: 50,
                viewDistance: 25
            }
        },
        title: {
            text: 'Revenue by Tenant'
        },
        xAxis: {
            categories: ['Safaricom', 'Airtel', 'JTL'],
            labels: {
                skew3d: true,
                style: {
                    fontSize: '16px'
                }
            }
        },
        yAxis: {
            allowDecimals: false,
            min: 0,
            title: {
                text: 'Revenue (KES)',
                skew3d: true
            }
        },
        tooltip: {
            headerFormat: '<b>{point.key}</b><br>',
            pointFormat: '<span style="color:{series.color}">●</span> {series.name}: {point.y}'
        },
        plotOptions: {
            column: {
                depth: 25
            }
        },
        series: [{
            type: 'column',
            name: 'Revenue',
            data: [revenueByTenant.safaricom, revenueByTenant.airtel, revenueByTenant.jtl]
        }]
    }), [revenueByTenant]);
    
    const getMonthName = (monthNumber: number) => {
        return months.find(m => m.value === monthNumber)?.name || ''
    }

    if (loading) return <p>Loading revenue data for {getMonthName(selectedMonth)} {selectedYear}...</p>;
    if (error) return <p className="text-destructive">{error}</p>;

    return (
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-2 md:space-y-0">
                <h2 className="text-3xl font-bold tracking-tight">Revenue Breakdown</h2>
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
                    <Select onValueChange={setSelectedSiteType} defaultValue="All">
                        <SelectTrigger className="w-[200px]">
                            <SelectValue placeholder="Filter by site type" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="All">All Sites</SelectItem>
                            <SelectItem value="Single-Operator">Single-Operator Sites</SelectItem>
                            <SelectItem value="Colocated">Colocated Sites</SelectItem>
                            <SelectItem value="Multi-Vendor">Multi-Vendor Sites</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Revenue by Tenant</CardTitle>
                    <CardDescription>
                        Total revenue of <strong>KES {totalRevenue.toFixed(2)}</strong> from {selectedSiteType.toLowerCase()} sites for {getMonthName(selectedMonth)} {selectedYear}.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {totalRevenue > 0 ? (
                        <div className="grid md:grid-cols-2 gap-8">
                            <div>
                                <HighchartsReact highcharts={Highcharts} options={pieChartOptions} />
                            </div>
                            <div>
                                <HighchartsReact highcharts={Highcharts} options={barChartOptions} />
                            </div>
                        </div>
                    ) : (
                        <p>No revenue data to display for the selected period.</p>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
