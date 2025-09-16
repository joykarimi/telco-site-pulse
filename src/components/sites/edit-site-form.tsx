
import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateSiteMonthlyData, addSiteMonthlyData } from "@/lib/firebase/firestore";
import { CombinedSiteData } from "@/lib/firebase/firestore";
import { Pencil } from 'lucide-react';

interface EditSiteFormProps {
    site: CombinedSiteData;
    onSiteUpdated: () => void;
    selectedMonth: number;
    selectedYear: number;
}

export function EditSiteForm({ site, onSiteUpdated, selectedMonth, selectedYear }: EditSiteFormProps) {
    const [gridConsumption, setGridConsumption] = useState('0');
    const [fuelConsumption, setFuelConsumption] = useState('0');
    const [solarContribution, setSolarContribution] = useState('0');
    const [earningsSafaricom, setEarningsSafaricom] = useState('0');
    const [earningsAirtel, setEarningsAirtel] = useState('0');
    const [earningsJtl, setEarningsJtl] = useState('0');
    const [gridUnitCost, setGridUnitCost] = useState('0');
    const [fuelUnitCost, setFuelUnitCost] = useState('0');
    const [solarMaintenanceCost, setSolarMaintenanceCost] = useState('0');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [open, setOpen] = useState(false);

    useEffect(() => {
        if (open) {
            if (site.monthlyData) {
                setGridConsumption((site.monthlyData.gridConsumption ?? 0).toString());
                setFuelConsumption((site.monthlyData.fuelConsumption ?? 0).toString());
                setSolarContribution(site.monthlyData.solarContribution ?? '0');
                setEarningsSafaricom((site.monthlyData.earningsSafaricom ?? 0).toString());
                setEarningsAirtel((site.monthlyData.earningsAirtel ?? 0).toString());
                setEarningsJtl((site.monthlyData.earningsJtl ?? 0).toString());
                setGridUnitCost((site.monthlyData.gridUnitCost ?? 0).toString());
                setFuelUnitCost((site.monthlyData.fuelUnitCost ?? 0).toString());
                setSolarMaintenanceCost((site.monthlyData.solarMaintenanceCost ?? 0).toString());
            } else {
                // Reset to default if no data for this month
                setGridConsumption('0');
                setFuelConsumption('0');
                setSolarContribution('0');
                setEarningsSafaricom('0');
                setEarningsAirtel('0');
                setEarningsJtl('0');
                setGridUnitCost('0');
                setFuelUnitCost('0');
                setSolarMaintenanceCost('0');
            }
        }
    }, [open, site]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        const monthlyDataPayload = {
            siteId: site.id,
            month: selectedMonth,
            year: selectedYear,
            gridConsumption: parseFloat(gridConsumption),
            fuelConsumption: parseFloat(fuelConsumption),
            solarContribution,
            earningsSafaricom: parseFloat(earningsSafaricom),
            earningsAirtel: parseFloat(earningsAirtel),
            earningsJtl: parseFloat(earningsJtl),
            gridUnitCost: parseFloat(gridUnitCost),
            fuelUnitCost: parseFloat(fuelUnitCost),
            solarMaintenanceCost: parseFloat(solarMaintenanceCost),
        };

        try {
            if (site.monthlyData?.id) {
                await updateSiteMonthlyData(site.monthlyData.id, monthlyDataPayload);
            } else {
                await addSiteMonthlyData(monthlyDataPayload);
            }
            onSiteUpdated();
            setOpen(false);
        } catch (err) {
            setError("Failed to update site financials. Please try again.");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="icon">
                    <Pencil className="h-4 w-4" />
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>Edit Monthly Financials for {site.name}</DialogTitle>
                    <p className="text-sm text-muted-foreground">{site.type}</p>
                    <p className="text-sm font-semibold">{new Date(0, selectedMonth - 1).toLocaleString('default', { month: 'long' })} {selectedYear}</p>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4 py-4">
                    {error && <p className="text-destructive col-span-2">{error}</p>}
                    <div className="space-y-2">
                        <Label htmlFor="gridConsumption">Monthly Grid Consumption (KWh)</Label>
                        <Input id="gridConsumption" type="number" value={gridConsumption} onChange={(e) => setGridConsumption(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="fuelConsumption">Monthly Fuel Consumption (liters)</Label>
                        <Input id="fuelConsumption" type="number" value={fuelConsumption} onChange={(e) => setFuelConsumption(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="solarContribution">Solar Contribution (KWh or %)</Label>
                        <Input id="solarContribution" placeholder="e.g., 500 KWh or 20%" value={solarContribution} onChange={(e) => setSolarContribution(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="earningsSafaricom">Earnings from Safaricom</Label>
                        <Input id="earningsSafaricom" type="number" value={earningsSafaricom} onChange={(e) => setEarningsSafaricom(e.g.target.value)} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="earningsAirtel">Earnings from Airtel</Label>
                        <Input id="earningsAirtel" type="number" value={earningsAirtel} onChange={(e) => setEarningsAirtel(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="earningsJtl">Earnings from JTL</Label>
                        <Input id="earningsJtl" type="number" value={earningsJtl} onChange={(e) => setEarningsJtl(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="gridUnitCost">Grid Unit Cost</Label>
                        <Input id="gridUnitCost" type="number" value={gridUnitCost} onChange={(e) => setGridUnitCost(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="fuelUnitCost">Fuel Unit Cost</Label>
                        <Input id="fuelUnitCost" type="number" value={fuelUnitCost} onChange={(e) => setFuelUnitCost(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="solarMaintenanceCost">Solar Maintenance Cost</Label>
                        <Input id="solarMaintenanceCost" type="number" value={solarMaintenanceCost} onChange={(e) => setSolarMaintenanceCost(e.target.value)} />
                    </div>
                    <div className="col-span-2">
                        <Button type="submit" className="w-full" disabled={loading}>
                            {loading ? 'Updating Financials...' : 'Update Financials'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
