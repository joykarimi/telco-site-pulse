
import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AddSiteForm } from "@/components/sites/add-site-form";
import { getSites, Site, addSite } from "@/lib/firebase/firestore";

const sampleSites: Omit<Site, 'id'>[] = [
    {
        name: 'Nairobi-01',
        type: 'Grid + Solar',
        gridConsumption: 5000,
        fuelConsumption: 200,
        solarContribution: '30%',
        earningsSafaricom: 15000,
        earningsAirtel: 8000,
        gridUnitCost: 1.2,
        fuelUnitCost: 0.8,
        solarMaintenanceCost: 500,
    },
    {
        name: 'Mombasa-02',
        type: 'Grid and Generator',
        gridConsumption: 8000,
        fuelConsumption: 1500,
        solarContribution: '0%',
        earningsSafaricom: 25000,
        earningsAirtel: 12000,
        gridUnitCost: 1.3,
        fuelUnitCost: 0.9,
        solarMaintenanceCost: 0,
    },
    {
        name: 'Kisumu-03',
        type: 'Generator only',
        gridConsumption: 0,
        fuelConsumption: 3000,
        solarContribution: '0%',
        earningsSafaricom: 18000,
        earningsAirtel: 7000,
        gridUnitCost: 0,
        fuelUnitCost: 1.0,
        solarMaintenanceCost: 0,
    },
    {
        name: 'Eldoret-04',
        type: 'Grid + Generator + Solar',
        gridConsumption: 4000,
        fuelConsumption: 800,
        solarContribution: '40%',
        earningsSafaricom: 22000,
        earningsAirtel: 10000,
        gridUnitCost: 1.1,
        fuelUnitCost: 0.85,
        solarMaintenanceCost: 700,
    },
    {
        name: 'Nakuru-05',
        type: 'Grid only',
        gridConsumption: 6000,
        fuelConsumption: 0,
        solarContribution: '0%',
        earningsSafaricom: 19000,
        earningsAirtel: 9000,
        gridUnitCost: 1.25,
        fuelUnitCost: 0,
        solarMaintenanceCost: 0,
    },
];

const addSampleSites = async () => {
    console.log("Adding sample sites to the database...");
    const promises = sampleSites.map(site => addSite(site));
    await Promise.all(promises);
    console.log("Sample sites added.");
};


export default function Sites() {
    const [sites, setSites] = useState<Site[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchSites = async () => {
        try {
            setLoading(true);
            let sitesData = await getSites();
            if (sitesData.length === 0) {
                await addSampleSites();
                sitesData = await getSites();
            }
            setSites(sitesData);
            setError(null);
        } catch (err) {
            setError("Failed to fetch sites. Please try again later.");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSites();
    }, []);

    return (
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Site Financials</h2>
                <AddSiteForm onSiteAdded={fetchSites} />
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>Site Performance</CardTitle>
                    <CardDescription>A breakdown of revenue, expenses, and profit for each site.</CardDescription>
                </CardHeader>
                <CardContent>
                    {loading && <p>Loading sites...</p>}
                    {error && <p className="text-destructive">{error}</p>}
                    {!loading && !error && (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Site</TableHead>
                                    <TableHead>Type</TableHead>
                                    <TableHead className="text-right">Total Earnings</TableHead>
                                    <TableHead className="text-right">Grid Expense</TableHead>
                                    <TableHead className="text-right">Fuel Expense</TableHead>
                                    <TableHead className="text-right">Solar Expense</TableHead>
                                    <TableHead className="text-right">Total Expense</TableHead>
                                    <TableHead className="text-right">Net Profit/Loss</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {sites.map((site) => {
                                    const totalEarnings = site.earningsSafaricom + site.earningsAirtel;
                                    const gridExpense = site.gridConsumption * site.gridUnitCost;
                                    const fuelExpense = site.fuelConsumption * site.fuelUnitCost;
                                    const totalExpenses = gridExpense + fuelExpense + site.solarMaintenanceCost;
                                    const netProfit = totalEarnings - totalExpenses;
                                    return (
                                        <TableRow key={site.id}>
                                            <TableCell className="font-medium">{site.name}</TableCell>
                                            <TableCell>{site.type}</TableCell>
                                            <TableCell className="text-right">{totalEarnings.toFixed(2)}</TableCell>
                                            <TableCell className="text-right text-red-500">{gridExpense.toFixed(2)}</TableCell>
                                            <TableCell className="text-right text-red-500">{fuelExpense.toFixed(2)}</TableCell>
                                            <TableCell className="text-right text-red-500">{site.solarMaintenanceCost.toFixed(2)}</TableCell>
                                            <TableCell className="text-right text-red-500 font-bold">{totalExpenses.toFixed(2)}</TableCell>
                                            <TableCell className={`text-right font-bold ${netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                {netProfit.toFixed(2)}
                                            </TableCell>
                                        </TableRow>
                                    )
                                })}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            {/* Add monthly/yearly reports here in the future */}

        </div>
    );
}
