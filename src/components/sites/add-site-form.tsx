
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { addSiteDefinition, addSiteMonthlyData } from "@/lib/firebase/firestore";

const siteTypes = [
    "Grid only",
    "Grid and Generator",
    "Grid + Generator + Solar",
    "Generator only",
    "Generator + Solar",
    "Grid + Solar",
    "Multi-Vendor Site",
    "Coloc Site",
    "Single-Operator Site"
];

interface AddSiteFormProps {
    onSiteAdded: () => void;
    selectedMonth: number;
    selectedYear: number;
}

export function AddSiteForm({ onSiteAdded, selectedMonth, selectedYear }: AddSiteFormProps) {
    const [name, setName] = useState('');
    const [type, setType] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [open, setOpen] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            // 1. Add the site definition
            const newSiteId = await addSiteDefinition({ name, type });

            // 2. Add an initial empty monthly data entry for the current context
            await addSiteMonthlyData({
                siteId: newSiteId,
                month: selectedMonth,
                year: selectedYear,
                gridConsumption: 0,
                fuelConsumption: 0,
                solarContribution: '0',
                earningsSafaricom: 0,
                earningsAirtel: 0,
                earningsJtl: 0,
                gridUnitCost: 0,
                fuelUnitCost: 0,
                solarMaintenanceCost: 0,
            });

            onSiteAdded();
            setOpen(false);
            // Reset form fields
            setName('');
            setType('');

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
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Add a New Site</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="grid gap-4 py-4">
                    {error && <p className="text-destructive col-span-2">{error}</p>}
                    <div className="space-y-2">
                        <Label htmlFor="name">Site Name/ID</Label>
                        <Input id="name" placeholder="e.g., Kajiado-01" value={name} onChange={(e) => setName(e.target.value)} required />
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
