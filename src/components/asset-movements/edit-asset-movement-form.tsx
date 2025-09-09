
import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AssetMovement, updateAssetMovement } from "@/lib/firebase/firestore";
import { Pencil } from 'lucide-react';

interface EditAssetMovementFormProps {
    movement: AssetMovement;
    onMovementUpdated: () => void;
}

export function EditAssetMovementForm({ movement, onMovementUpdated }: EditAssetMovementFormProps) {
    const [assetId, setAssetId] = useState(movement.assetId);
    const [fromSite, setFromSite] = useState(movement.fromSite);
    const [toSite, setToSite] = useState(movement.toSite);
    const [reason, setReason] = useState(movement.reason || '');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [open, setOpen] = useState(false);

    useEffect(() => {
        if (open) {
            setAssetId(movement.assetId);
            setFromSite(movement.fromSite);
            setToSite(movement.toSite);
            setReason(movement.reason || '');
        }
    }, [open, movement]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            await updateAssetMovement(movement.id, {
                assetId,
                fromSite,
                toSite,
                reason,
            });
            onMovementUpdated();
            setOpen(false);
        } catch (err) {
            setError("Failed to update asset movement. Please try again.");
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
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Edit Asset Movement</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="grid gap-4 py-4">
                    {error && <p className="text-destructive">{error}</p>}
                    <div className="space-y-2">
                        <Label htmlFor="assetId">Asset ID</Label>
                        <Input id="assetId" value={assetId} onChange={(e) => setAssetId(e.target.value)} required />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="fromSite">From Site</Label>
                        <Input id="fromSite" value={fromSite} onChange={(e) => setFromSite(e.target.value)} required />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="toSite">To Site</Label>
                        <Input id="toSite" value={toSite} onChange={(e) => setToSite(e.target.value)} required />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="reason">Reason</Label>
                        <Input id="reason" value={reason} onChange={(e) => setReason(e.target.value)} />
                    </div>
                    <Button type="submit" disabled={loading}>
                        {loading ? 'Updating Movement...' : 'Update Movement'}
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    );
}
