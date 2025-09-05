
import { useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from '@/auth/AuthProvider';
import { getAssets, Asset, requestAssetMovement } from '@/lib/firebase/firestore';

// Assuming sites are managed centrally or can be derived
const sites = ["Site A", "Site B", "Site C", "Site D", "Unassigned"];

interface NewMovementRequestFormProps {
    onMovementRequested: () => void;
}

export function NewMovementRequestForm({ onMovementRequested }: NewMovementRequestFormProps) {
  const { user } = useAuth();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [selectedAssetId, setSelectedAssetId] = useState('');
  const [fromSite, setFromSite] = useState('');
  const [toSite, setToSite] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (open) {
      const fetchAssets = async () => {
        const assetsData = await getAssets();
        setAssets(assetsData);
      };
      fetchAssets();
    }
  }, [open]);

  useEffect(() => {
    const selectedAsset = assets.find(a => a.id === selectedAssetId);
    if (selectedAsset) {
        setFromSite(selectedAsset.site);
    }
  }, [selectedAssetId, assets])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
        setError("You must be logged in to make a request.");
        return;
    }
    setError(null);
    setLoading(true);

    try {
        await requestAssetMovement({
            assetId: selectedAssetId,
            fromSite,
            toSite,
            reason,
            requestedBy: user.email || 'Unknown User',
        });
        onMovementRequested();
        setOpen(false);
        // Reset form
        setSelectedAssetId('');
        setFromSite('');
        setToSite('');
        setReason('');

    } catch (err) {
        setError("Failed to submit request. Please try again.");
        console.error(err);
    } finally {
        setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          New Movement Request
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Request Asset Movement</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <p className="text-destructive">{error}</p>}
          <Select onValueChange={setSelectedAssetId} value={selectedAssetId} required>
            <SelectTrigger><SelectValue placeholder="Select Asset" /></SelectTrigger>
            <SelectContent>
              {assets.map(asset => <SelectItem key={asset.id} value={asset.id}>{asset.serialNumber} ({asset.type})</SelectItem>)}
            </SelectContent>
          </Select>
          <Select onValueChange={setFromSite} value={fromSite} required disabled>
            <SelectTrigger><SelectValue placeholder="From Site" /></SelectTrigger>
            <SelectContent>
              {sites.map(site => <SelectItem key={site} value={site}>{site}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select onValueChange={setToSite} value={toSite} required>
            <SelectTrigger><SelectValue placeholder="To Site" /></SelectTrigger>
            <SelectContent>
              {sites.filter(s => s !== fromSite).map(site => <SelectItem key={site} value={site}>{site}</SelectItem>)}
            </SelectContent>
          </Select>
          <Textarea placeholder="Reason for movement (optional)" value={reason} onChange={(e) => setReason(e.target.value)} />
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Submitting...' : 'Submit Request'}
            </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
