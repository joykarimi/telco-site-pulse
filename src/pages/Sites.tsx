
import { useEffect, useState, useMemo, useRef } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AddSiteForm } from "@/components/sites/add-site-form";
import { getSiteDefinitions, getSiteMonthlyData, deleteSiteDefinition, CombinedSiteData, SiteDefinition, SiteMonthlyData, addMultipleSitesWithMonthlyData } from "@/lib/firebase/firestore";
import { EditSiteForm } from "@/components/sites/edit-site-form";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Trash2, Search, Download } from "lucide-react";
import { read, utils, writeFile } from 'xlsx';
import { useToast } from "@/components/ui/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ImportConfirmationDialog } from "@/components/sites/import-confirmation-dialog";

const currentYear = new Date().getFullYear();
const years = Array.from({ length: 5 }, (_, i) => currentYear + 1 - i);
const months = Array.from({ length: 12 }, (_, i) => ({ value: i + 1, name: new Date(0, i).toLocaleString('default', { month: 'long' }) }));

// Helper to safely convert values to numbers, defaulting to 0
const ensureNumber = (value: any): number => {
    const num = parseFloat(value);
    return isNaN(num) ? 0 : num;
};

const SiteTable = ({ sites, fetchSites, handleDelete, selectedMonth, selectedYear }: { sites: CombinedSiteData[], fetchSites: (month: number, year: number) => void, handleDelete: (siteId: string) => void, selectedMonth: number, selectedYear: number }) => {
    const getMonthlyValue = (site: CombinedSiteData, key: keyof SiteMonthlyData) => {
        if (!site.monthlyData) {
            return 0;
        }
        const value = site.monthlyData[key];
        return ensureNumber(value);
    };
    
    return (
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
                    const earningsSafaricom = getMonthlyValue(site, 'earningsSafaricom');
                    const earningsAirtel = getMonthlyValue(site, 'earningsAirtel');
                    const earningsJtl = getMonthlyValue(site, 'earningsJtl');
                    const gridConsumption = getMonthlyValue(site, 'gridConsumption');
                    const gridUnitCost = getMonthlyValue(site, 'gridUnitCost');
                    const fuelConsumption = getMonthlyValue(site, 'fuelConsumption');
                    const fuelUnitCost = getMonthlyValue(site, 'fuelUnitCost');
                    const solarMaintenanceCost = getMonthlyValue(site, 'solarMaintenanceCost');

                    const totalEarnings = earningsSafaricom + earningsAirtel + earningsJtl;
                    const gridExpense = gridConsumption * gridUnitCost;
                    const fuelExpense = fuelConsumption * fuelUnitCost;
                    const totalExpenses = gridExpense + fuelExpense + solarMaintenanceCost;
                    const netProfit = totalEarnings - totalExpenses;

                    return (
                        <TableRow key={site.id}>
                            <TableCell className="font-medium">{site.name}</TableCell>
                            <TableCell>{site.type}</TableCell>
                            <TableCell className="text-right font-bold">{totalEarnings.toFixed(2)}</TableCell>
                            <TableCell className="text-right">{earningsSafaricom.toFixed(2)}</TableCell>
                            <TableCell className="text-right">{earningsAirtel.toFixed(2)}</TableCell>
                            <TableCell className="text-right">{earningsJtl.toFixed(2)}</TableCell>
                            <TableCell className="text-right text-red-500">{gridExpense.toFixed(2)}</TableCell>
                            <TableCell className="text-right text-red-500">{fuelExpense.toFixed(2)}</TableCell>
                            <TableCell className="text-right text-red-500">{solarMaintenanceCost.toFixed(2)}</TableCell>
                            <TableCell className="text-right text-red-500 font-bold">{totalExpenses.toFixed(2)}</TableCell>
                            <TableCell className={`text-right font-bold ${netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {netProfit.toFixed(2)}
                            </TableCell>
                            <TableCell className="text-right">
                                <div className="flex justify-end items-center">
                                    <EditSiteForm site={site} onSiteUpdated={() => fetchSites(selectedMonth, selectedYear)} selectedMonth={selectedMonth} selectedYear={selectedYear}/>
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
                                                    This action cannot be undone. This will permanently delete the site, 
                                                    all its associated monthly data, and all assets assigned to it.
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
                        No site data found for the selected period. Add sites or import data.
                    </TableCell>
                </TableRow>
            )}
        </TableBody>
    </Table>
)};

const categories = ["All", "Multi-Vendor Sites", "Coloc Sites", "Single-Operator Sites"];

export default function Sites() {
    const [combinedSites, setCombinedSites] = useState<CombinedSiteData[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("All");
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
    const [selectedYear, setSelectedYear] = useState(currentYear);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { toast } = useToast();
    const [dataCheckResult, setDataCheckResult] = useState<string | null>(null);

    const checkAllMonthsData = async () => {
        setLoading(true);
        setDataCheckResult("Checking...");
        const results = [];
        for (const year of years) {
            for (const month of months) {
                try {
                    const monthlyData = await getSiteMonthlyData(month.value, year);
                    if (monthlyData.length > 0) {
                        results.push(`${month.name} ${year}`);
                    }
                } catch (error) {
                    console.error(`Failed to fetch data for ${month.name} ${year}`, error);
                }
            }
        }
        setLoading(false);
        if (results.length > 0) {
            setDataCheckResult(`Data found for the following months: ${results.join(', ')}`);
        } else {
            setDataCheckResult("No data found for any month in the last 5 years.");
        }
    };

    const fetchSitesAndCombineData = async (month: number, year: number) => {
        console.log(`Fetching data for month: ${month}, year: ${year}`);
        try {
            setLoading(true);
            const [siteDefinitions, monthlyData] = await Promise.all([
                getSiteDefinitions(),
                getSiteMonthlyData(month, year)
            ]);

            console.log('Site Definitions:', siteDefinitions);
            console.log('Monthly Data:', monthlyData);

            const monthlyDataMap = new Map(monthlyData.map(m => [m.siteId, m]));

            const combined: CombinedSiteData[] = siteDefinitions.map(def => {
                const correspondingMonthlyData = monthlyDataMap.get(def.id);
                
                // Apply ensureNumber directly during data combination for all relevant fields
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
                }
            });

            console.log('Combined Data:', combined);

            setCombinedSites(combined);
            setError(null);
        } catch (err) {
            setError("Failed to fetch site data. Please try again later.");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (siteId: string) => {
        try {
            await deleteSiteDefinition(siteId);
            fetchSitesAndCombineData(selectedMonth, selectedYear);
            toast({ title: "Success", description: "Site and all its data have been deleted." });
        } catch (err) {
            console.error("Error deleting site: ", err);
            toast({ title: "Error", description: "Failed to delete site.", variant: "destructive" });
        }
    };

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                setLoading(true);
                const data = new Uint8Array(e.target?.result as ArrayBuffer);
                const workbook = read(data, { type: 'array' });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                const json = utils.sheet_to_json<any>(worksheet);

                await addMultipleSitesWithMonthlyData(json, selectedMonth, selectedYear);
                fetchSitesAndCombineData(selectedMonth, selectedYear);
                toast({ title: "Success", description: `Site data for ${months[selectedMonth - 1].name} ${selectedYear} imported successfully.` });

            } catch (error) {
                console.error("Error processing Excel file: ", error);
                toast({ title: "Error", description: "Failed to import from Excel.", variant: "destructive" });
            } finally {
                setLoading(false);
            }
        };
        reader.readAsArrayBuffer(file);
    };

    const handleImportConfirm = () => {
        fileInputRef.current?.click();
    }

    const handleDownloadExcel = () => {
        const monthName = months.find(m => m.value === selectedMonth)?.name || '';
        const fileName = `Bill_for_${monthName}_${selectedYear}.xlsx`;

        const getMonthlyValueForExcel = (site: CombinedSiteData, key: keyof SiteMonthlyData) => {
            if (!site.monthlyData) {
                return 0;
            }
            const value = site.monthlyData[key];
            return ensureNumber(value);
        };
        
        const dataForExcel = sitesToDisplay.map(site => {
            const earningsSafaricom = getMonthlyValueForExcel(site, 'earningsSafaricom');
            const earningsAirtel = getMonthlyValueForExcel(site, 'earningsAirtel');
            const earningsJtl = getMonthlyValueForExcel(site, 'earningsJtl');
            const gridConsumption = getMonthlyValueForExcel(site, 'gridConsumption');
            const gridUnitCost = getMonthlyValueForExcel(site, 'gridUnitCost');
            const fuelConsumption = getMonthlyValueForExcel(site, 'fuelConsumption');
            const fuelUnitCost = getMonthlyValueForExcel(site, 'fuelUnitCost');
            const solarMaintenanceCost = getMonthlyValueForExcel(site, 'solarMaintenanceCost');

            const totalEarnings = earningsSafaricom + earningsAirtel + earningsJtl;
            const gridExpense = gridConsumption * gridUnitCost;
            const fuelExpense = fuelConsumption * fuelUnitCost;
            const totalExpenses = gridExpense + fuelExpense + solarMaintenanceCost;
            const netProfit = totalEarnings - totalExpenses;

            return {
                'Site': site.name,
                'Type': site.type,
                'Total Earnings': totalEarnings.toFixed(2),
                'Safaricom': earningsSafaricom.toFixed(2),
                'Airtel': earningsAirtel.toFixed(2),
                'JTL': earningsJtl.toFixed(2),
                'Grid Expense': gridExpense.toFixed(2),
                'Fuel Expense': fuelExpense.toFixed(2),
                'Solar Expense': solarMaintenanceCost.toFixed(2),
                'Total Expense': totalExpenses.toFixed(2),
                'Net Profit/Loss': netProfit.toFixed(2),
            };
        });

        const worksheet = utils.json_to_sheet(dataForExcel);
        const workbook = utils.book_new();
        utils.book_append_sheet(workbook, worksheet, "Site Financials");
        writeFile(workbook, fileName);
    };

    useEffect(() => {
        fetchSitesAndCombineData(selectedMonth, selectedYear);
    }, [selectedMonth, selectedYear]);

    const filteredSites = useMemo(() => {
        return combinedSites.filter(site =>
            site.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            site.type.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [combinedSites, searchTerm]);

    const categorizedSites = useMemo(() => {
        const getCategorizedMonthlyValue = (site: CombinedSiteData, key: keyof SiteMonthlyData) => {
            if (!site.monthlyData) {
                return 0;
            }
            const value = site.monthlyData[key];
            return ensureNumber(value);
        };
        const multiVendorSites: CombinedSiteData[] = [];
        const colocSites: CombinedSiteData[] = [];
        const singleOperatorSites: CombinedSiteData[] = [];

        filteredSites.forEach(site => {
            const tenantCount = [getCategorizedMonthlyValue(site, 'earningsSafaricom'), getCategorizedMonthlyValue(site, 'earningsAirtel'), getCategorizedMonthlyValue(site, 'earningsJtl')].filter(e => e > 0).length;
            if (tenantCount === 3) {
                multiVendorSites.push(site);
            } else if (tenantCount === 2) {
                colocSites.push(site);
            } else {
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
        const monthName = months.find(m => m.value === selectedMonth)?.name || '';
        const baseDescription = `Displaying financials for ${monthName} ${selectedYear}`;

        switch (selectedCategory) {
            case "All":
                return `${baseDescription}. A breakdown of revenue, expenses, and profit for all sites.`;
            case "Multi-Vendor Sites":
                return `${baseDescription}. Sites with 3 tenants (Safaricom, Airtel, and JTL).`;
            case "Coloc Sites":
                return `${baseDescription}. Sites with 2 tenants.`;
            case "Single-Operator Sites":
                return `${baseDescription}. Sites with a single tenant.`;
            default:
                return "";
        }
    }

    return (
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-2 md:space-y-0">
                <h2 className="text-3xl font-bold tracking-tight">Site Financials</h2>
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
                    <Button onClick={checkAllMonthsData}>Check All Months</Button>
                    <AddSiteForm onSiteAdded={() => fetchSitesAndCombineData(selectedMonth, selectedYear)} selectedMonth={selectedMonth} selectedYear={selectedYear}/>
                    <ImportConfirmationDialog 
                        selectedMonth={selectedMonth} 
                        selectedYear={selectedYear} 
                        onConfirm={handleImportConfirm} 
                    />
                    <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={handleFileUpload} 
                        className="hidden" 
                        accept=".xlsx, .xls"
                    />
                     <Button onClick={handleDownloadExcel}>
                        <Download className="mr-2 h-4 w-4" />
                        Download as Excel
                    </Button>
                </div>
            </div>

            {dataCheckResult && (
                <Card>
                    <CardHeader>
                        <CardTitle>Data Check Result</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p>{dataCheckResult}</p>
                    </CardContent>
                </Card>
            )}

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

            {loading && <p>Loading site data for {months.find(m => m.value === selectedMonth)?.name} {selectedYear}...</p>}
            {error && <p className="text-destructive">{error}</p>}
            {!loading && !error && (
                <Card>
                    <CardHeader>
                        <CardTitle>{selectedCategory}</CardTitle>
                        <CardDescription>{getDescription()}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <SiteTable sites={sitesToDisplay} fetchSites={fetchSitesAndCombineData} handleDelete={handleDelete} selectedMonth={selectedMonth} selectedYear={selectedYear}/>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
