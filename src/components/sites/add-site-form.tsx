
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { addSite } from "@/lib/firebase/firestore";

const siteTypes = [
    "Grid only",
    "Grid and Generator",
    "Grid + Generator + Solar",
    "Generator only",
    "Generator + Solar",
    "Grid + Solar"
];

interface AddSiteFormProps {
    onSiteAdded: () => void;
}

export function AddSiteForm({ onSiteAdded }: AddSiteFormProps) {
    const [name, setName] = useState('');
    const [type, setType] = useState('');
    const [gridConsumption, setGridConsumption] = useState('0');
    const [fuelConsumption, setFuelConsumption] = useState('0');
    const [solarContribution, setSolarContribution] = useState('0');
    const [earningsSafaricom, setEarningsSafaricom] = useState('0');
    const [earningsAirtel, setEarningsAirtel] = useState('0');
    const [gridUnitCost, setGridUnitCost] = useState('0');
    const [fuelUnitCost, setFuelUnitCost] = useState('0');
    const [solarMaintenanceCost, setSolarMaintenanceCost] = useState('0');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [open, setOpen] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            await addSite({
                name,
                type,
                gridConsumption: parseFloat(gridConsumption),
                fuelConsumption: parseFloat(fuelConsumption),
                solarContribution,
                earningsSafaricom: parseFloat(earningsSafaricom),
                earningsAirtel: parseFloat(earningsAirtel),
                gridUnitCost: parseFloat(gridUnitCost),
                fuelUnitCost: parseFloat(fuelUnitCost),
                solarMaintenanceCost: parseFloat(solarMaintenanceCost),
            });
            onSiteAdded();
            setOpen(false);
            // Reset form fields
            setName('');
            setType('');
            setGridConsumption('0');
            setFuelConsumption('0');
            setSolarContribution('0');
            setEarningsSafaricom('0');
            setEarningsAirtel('0');
            setGridUnitCost('0');
            setFuelUnitCost('0');
            setSolarMaintenanceCost('0');

        } catch (err) {
            setError("Failed to add site. Please try again.");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>
                    Add Site
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>Add a New Site</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
                    {error && <p className="text-destructive col-span-2">{error}</p>}
                    <Input placeholder="Site Name/ID" value={name} onChange={(e) => setName(e.target.value)} required />
                    <Select onValueChange={setType} value={type} required>
                        <SelectTrigger><SelectValue placeholder="Site Type" /></SelectTrigger>
                        <SelectContent>
                            {siteTypes.map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}
                        </SelectContent>
                    </Select>
                    <Input placeholder="Monthly Grid Consumption (KWh)" type="number" value={gridConsumption} onChange={(e) => setGridConsumption(e.target.value)} />
                    <Input placeholder="Monthly Fuel Consumption (liters)" type="number" value={fuelConsumption} onChange={(e) => setFuelConsumption(e.target.value)} />
                    <Input placeholder="Solar Contribution (KWh or %)" value={solarContribution} onChange={(e) => setSolarContribution(e.target.value)} />
                    <Input placeholder="Earnings from Safaricom" type="number" value={earningsSafaricom} onChange={(e) => setEarningsSafaricom(e.target.value)} />
                    <Input placeholder="Earnings from Airtel" type="number" value={earningsAirtel} onChange={(e) => setEarningsAirtel(e.target.value)} />
                    <Input placeholder="Grid Unit Cost" type="number" value={gridUnitCost} onChange={(e) => setGridUnitCost(e.target.value)} />
                    <Input placeholder="Fuel Unit Cost" type="number" value={fuelUnitCost} onChange={(e) => setFuelUnitCost(e.target.value)} />
                    <Input placeholder="Solar Maintenance Cost" type="number" value={solarMaintenanceCost} onChange={(e) => setSolarMaintenanceCost(e.target.value)} />
                    <div className="col-span-2">
                        <Button type="submit" className="w-full" disabled={loading}>
                            {loading ? 'Adding Site...' : 'Add Site'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
