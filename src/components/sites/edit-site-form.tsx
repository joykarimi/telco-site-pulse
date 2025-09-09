
import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Site, updateSite } from "@/lib/firebase/firestore";
import { Pencil } from 'lucide-react';

const siteTypes = [
    "Grid only",
    "Grid and Generator",
    "Grid + Generator + Solar",
    "Generator only",
    "Generator + Solar",
    "Grid + Solar"
];

interface EditSiteFormProps {
    site: Site;
    onSiteUpdated: () => void;
}

export function EditSiteForm({ site, onSiteUpdated }: EditSiteFormProps) {
    const [name, setName] = useState(site.name);
    const [type, setType] = useState(site.type);
    const [gridConsumption, setGridConsumption] = useState(site.gridConsumption.toString());
    const [fuelConsumption, setFuelConsumption] = useState(site.fuelConsumption.toString());
    const [solarContribution, setSolarContribution] = useState(site.solarContribution);
    const [earningsSafaricom, setEarningsSafaricom] = useState(site.earningsSafaricom.toString());
    const [earningsAirtel, setEarningsAirtel] = useState(site.earningsAirtel.toString());
    const [earningsJtl, setEarningsJtl] = useState((site.earningsJtl ?? 0).toString());
    const [gridUnitCost, setGridUnitCost] = useState(site.gridUnitCost.toString());
    const [fuelUnitCost, setFuelUnitCost] = useState(site.fuelUnitCost.toString());
    const [solarMaintenanceCost, setSolarMaintenanceCost] = useState(site.solarMaintenanceCost.toString());
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [open, setOpen] = useState(false);

    useEffect(() => {
        if (open) {
            setName(site.name);
            setType(site.type);
            setGridConsumption(site.gridConsumption.toString());
            setFuelConsumption(site.fuelConsumption.toString());
            setSolarContribution(site.solarContribution);
            setEarningsSafaricom(site.earningsSafaricom.toString());
            setEarningsAirtel(site.earningsAirtel.toString());
            setEarningsJtl((site.earningsJtl ?? 0).toString());
            setGridUnitCost(site.gridUnitCost.toString());
            setFuelUnitCost(site.fuelUnitCost.toString());
            setSolarMaintenanceCost(site.solarMaintenanceCost.toString());
        }
    }, [open, site]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            await updateSite(site.id, {
                name,
                type,
                gridConsumption: parseFloat(gridConsumption),
                fuelConsumption: parseFloat(fuelConsumption),
                solarContribution,
                earningsSafaricom: parseFloat(earningsSafaricom),
                earningsAirtel: parseFloat(earningsAirtel),
                earningsJtl: parseFloat(earningsJtl),
                gridUnitCost: parseFloat(gridUnitCost),
                fuelUnitCost: parseFloat(fuelUnitCost),
                solarMaintenanceCost: parseFloat(solarMaintenanceCost),
            });
            onSiteUpdated();
            setOpen(false);
        } catch (err) {
            setError("Failed to update site. Please try again.");
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
                    <DialogTitle>Edit Site: {site.name}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4 py-4">
                    {error && <p className="text-destructive col-span-2">{error}</p>}
                    <div className="space-y-2">
                        <Label htmlFor="name">Site Name/ID</Label>
                        <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="type">Site Type</Label>
                        <Select onValueChange={setType} value={type} required>
                            <SelectTrigger id="type">
                                <SelectValue placeholder="Select a type" />
                            </SelectTrigger>
                            <SelectContent>
                                {siteTypes.map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
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
                        <Input id="solarContribution" value={solarContribution} onChange={(e) => setSolarContribution(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="earningsSafaricom">Earnings from Safaricom</Label>
                        <Input id="earningsSafaricom" type="number" value={earningsSafaricom} onChange={(e) => setEarningsSafaricom(e.target.value)} />
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
                            {loading ? 'Updating Site...' : 'Update Site'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
