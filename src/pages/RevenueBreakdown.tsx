
import { useEffect, useState, useMemo } from "react";
import { getSiteDefinitions, getSiteMonthlyData, CombinedSiteData } from "@/lib/firebase/firestore";
import { RevenueBreakdown as RevenueBreakdownComponent } from "@/components/dashboard/revenue-breakdown";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Site } from "@/types/site"; // Import the Site interface

const currentYear = new Date().getFullYear();
const years = Array.from({ length: 5 }, (_, i) => currentYear - i);
const months = Array.from({ length: 12 }, (_, i) => ({ value: i + 1, name: new Date(0, i).toLocaleString('default', { month: 'long' }) }));

export default function RevenueBreakdown() {
    const [sites, setSites] = useState<Site[]>([]); // Use Site[] for the state
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedSiteType, setSelectedSiteType] = useState('All'); // State for site type filter
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

                const combinedData: Site[] = siteDefinitions.map(siteDef => {
                    const correspondingMonthlyData = monthlyDataMap.get(siteDef.id);
                    
                    // Map the fetched data to the Site interface expected by RevenueBreakdownComponent
                    return {
                        id: siteDef.id,
                        name: siteDef.name,
                        type: siteDef.type as Site['type'], // Type assertion
                        safaricomIncome: correspondingMonthlyData?.earningsSafaricom ?? 0,
                        airtelIncome: correspondingMonthlyData?.earningsAirtel ?? 0,
                        jtlIncome: correspondingMonthlyData?.earningsJtl ?? 0, // Map JTL earnings
                        gridConsumption: correspondingMonthlyData?.gridConsumption ?? 0,
                        fuelConsumption: correspondingMonthlyData?.fuelConsumption ?? 0,
                        solarContribution: parseFloat(correspondingMonthlyData?.solarContribution ?? '0'), // Convert to number
                        gridCostPerKwh: correspondingMonthlyData?.gridUnitCost ?? 0,
                        fuelCostPerLiter: correspondingMonthlyData?.fuelUnitCost ?? 0,
                        solarMaintenanceCost: correspondingMonthlyData?.solarMaintenanceCost ?? 0,
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
    
    // Filtering logic based on selectedSiteType
    const filteredSites = useMemo(() => sites.filter(site => {
        const hasSafaricom = site.safaricomIncome > 0;
        const hasAirtel = site.airtelIncome > 0;
        const hasJtl = site.jtlIncome > 0;
        const operatorCount = [hasSafaricom, hasAirtel, hasJtl].filter(Boolean).length;

        if (selectedSiteType === 'All') return true;
        if (selectedSiteType === 'Single-Operator' && operatorCount === 1) {
            return (hasSafaricom && !hasAirtel && !hasJtl) ||
                   (!hasSafaricom && hasAirtel && !hasJtl) ||
                   (!hasSafaricom && !hasAirtel && hasJtl);
        }
        if (selectedSiteType === 'Colocated' && operatorCount === 2) {
            return (hasSafaricom && hasAirtel && !hasJtl) ||
                   (hasSafaricom && !hasAirtel && hasJtl) ||
                   (!hasSafaricom && hasAirtel && hasJtl);
        }
        if (selectedSiteType === 'Multi-Vendor' && operatorCount === 3) {
            return hasSafaricom && hasAirtel && hasJtl;
        }
        return false;
    }), [sites, selectedSiteType]);

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
                    {/* Site Type Filter */}
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
            <RevenueBreakdownComponent sites={filteredSites} />{/* Pass filtered sites */} 
        </div>
    );
}
