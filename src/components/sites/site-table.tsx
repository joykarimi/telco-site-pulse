
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CombinedSiteData, SiteMonthlyData } from "@/lib/firebase/firestore";
import { ensureNumber } from "@/lib/utils";
import { EditSiteForm } from "./edit-site-form";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";

const getMonthlyValue = (site: CombinedSiteData, key: keyof SiteMonthlyData) => {
    if (!site.monthlyData) {
        return 0;
    }
    const value = site.monthlyData[key];
    return ensureNumber(value);
};

export const SiteTable = ({ sites, fetchSites, handleDelete, selectedMonth, selectedYear }: { sites: CombinedSiteData[], fetchSites: (month: number, year: number) => void, handleDelete: (siteId: string) => void, selectedMonth: number, selectedYear: number }) => {
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
