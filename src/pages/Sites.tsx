
import { useEffect, useState, useMemo } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AddSiteForm } from "@/components/sites/add-site-form";
import { getSites, Site, deleteSite } from "@/lib/firebase/firestore";
import { EditSiteForm } from "@/components/sites/edit-site-form";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Trash2, Search } from "lucide-react";

const SiteTable = ({ sites, fetchSites, handleDelete }: { sites: Site[], fetchSites: () => void, handleDelete: (siteId: string) => void }) => (
    <Table>
        <TableHeader>
            <TableRow>
                <TableHead>Site</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right font-bold">Total Earnings</TableHead>
                <TableHead className="text-right">Safaricom</TableHead>
                <TableHead className="text-right">Airtel</TableHead>
                <TableHead className="text-right">JTL</TableHead>
                <TableHead className="text-right">Grid Expense</TableHead>
                <TableHead className="text-right">Fuel Expense</TableHead>
                <TableHead className="text-right">Solar Expense</TableHead>
                <TableHead className="text-right">Total Expense</TableHead>
                <TableHead className="text-right">Net Profit/Loss</TableHead>
                <TableHead className="text-right">Actions</TableHead>
            </TableRow>
        </TableHeader>
        <TableBody>
            {sites.length > 0 ? (
                sites.map((site) => {
                    const totalEarnings = (site.earningsSafaricom ?? 0) + (site.earningsAirtel ?? 0) + (site.earningsJtl ?? 0);
                    const gridExpense = site.gridConsumption * site.gridUnitCost;
                    const fuelExpense = site.fuelConsumption * site.fuelUnitCost;
                    const totalExpenses = gridExpense + fuelExpense + site.solarMaintenanceCost;
                    const netProfit = totalEarnings - totalExpenses;
                    return (
                        <TableRow key={site.id}>
                            <TableCell className="font-medium">{site.name}</TableCell>
                            <TableCell>{site.type}</TableCell>
                            <TableCell className="text-right font-bold">{totalEarnings.toFixed(2)}</TableCell>
                            <TableCell className="text-right">{(site.earningsSafaricom ?? 0).toFixed(2)}</TableCell>
                            <TableCell className="text-right">{(site.earningsAirtel ?? 0).toFixed(2)}</TableCell>
                            <TableCell className="text-right">{(site.earningsJtl ?? 0).toFixed(2)}</TableCell>
                            <TableCell className="text-right text-red-500">{gridExpense.toFixed(2)}</TableCell>
                            <TableCell className="text-right text-red-500">{fuelExpense.toFixed(2)}</TableCell>
                            <TableCell className="text-right text-red-500">{site.solarMaintenanceCost.toFixed(2)}</TableCell>
                            <TableCell className="text-right text-red-500 font-bold">{totalExpenses.toFixed(2)}</TableCell>
                            <TableCell className={`text-right font-bold ${netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {netProfit.toFixed(2)}
                            </TableCell>
                            <TableCell className="text-right">
                                <div className="flex justify-end items-center">
                                    <EditSiteForm site={site} onSiteUpdated={fetchSites} />
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button variant="ghost" size="icon">
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    This action cannot be undone. This will permanently delete the site
                                                    and remove its data from our servers.
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                <AlertDialogAction onClick={() => handleDelete(site.id)}>Delete</AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </div>
                            </TableCell>
                        </TableRow>
                    )
                })
            ) : (
                <TableRow>
                    <TableCell colSpan={12} className="h-24 text-center">
                        No results found.
                    </TableCell>
                </TableRow>
            )}
        </TableBody>
    </Table>
);

const categories = ["All", "Multi-Vendor Sites", "Coloc Sites", "Single-Operator Sites"];

export default function Sites() {
    const [sites, setSites] = useState<Site[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("All");

    const fetchSites = async () => {
        try {
            setLoading(true);
            const sitesData = await getSites();
            setSites(sitesData);
            setError(null);
        } catch (err) {
            setError("Failed to fetch sites. Please try again later.");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (siteId: string) => {
        try {
            await deleteSite(siteId);
            fetchSites();
        } catch (err) {
            console.error("Error deleting site: ", err);
        }
    };

    useEffect(() => {
        fetchSites();
    }, []);

    const filteredSites = useMemo(() => {
        return sites.filter(site =>
            site.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            site.type.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [sites, searchTerm]);

    const categorizedSites = useMemo(() => {
        const multiVendorSites: Site[] = [];
        const colocSites: Site[] = [];
        const singleOperatorSites: Site[] = [];

        filteredSites.forEach(site => {
            const tenantCount = [site.earningsSafaricom, site.earningsAirtel, site.earningsJtl].filter(e => e > 0).length;
            if (tenantCount === 3) {
                multiVendorSites.push(site);
            } else if (tenantCount === 2) {
                colocSites.push(site);
            } else if (tenantCount === 1) {
                singleOperatorSites.push(site);
            }
        });

        return {
            "Multi-Vendor Sites": multiVendorSites,
            "Coloc Sites": colocSites,
            "Single-Operator Sites": singleOperatorSites,
        };
    }, [filteredSites]);

    const sitesToDisplay = useMemo(() => {
        if (selectedCategory === "All") {
            return filteredSites;
        }
        return categorizedSites[selectedCategory as keyof typeof categorizedSites] || [];
    }, [selectedCategory, filteredSites, categorizedSites]);

    const getDescription = () => {
        switch (selectedCategory) {
            case "All":
                return "A breakdown of revenue, expenses, and profit for all sites.";
            case "Multi-Vendor Sites":
                return "Sites with 3 tenants (Safaricom, Airtel, and JTL).";
            case "Coloc Sites":
                return "Sites with 2 tenants.";
            case "Single-Operator Sites":
                return "Sites with a single tenant.";
            default:
                return "";
        }
    }

    return (
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Site Financials</h2>
                <AddSiteForm onSiteAdded={fetchSites} />
            </div>

            <div className="flex flex-col space-y-4">
                <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        type="search"
                        placeholder="Search by site name or type..."
                        className="pl-8 sm:w-[300px] md:w-[200px] lg:w-[300px] bg-background"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="flex items-center space-x-2">
                    {categories.map(category => (
                        <Button
                            key={category}
                            variant={selectedCategory === category ? 'default' : 'outline'}
                            onClick={() => setSelectedCategory(category)}
                        >
                            {category}
                        </Button>
                    ))}
                </div>
            </div>

            {loading && <p>Loading sites...</p>}
            {error && <p className="text-destructive">{error}</p>}
            {!loading && !error && (
                <Card>
                    <CardHeader>
                        <CardTitle>{selectedCategory}</CardTitle>
                        <CardDescription>{getDescription()}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <SiteTable sites={sitesToDisplay} fetchSites={fetchSites} handleDelete={handleDelete} />
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
