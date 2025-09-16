
import { useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from '@/auth/AuthProvider';
import { getAssets, Asset, getSiteDefinitions, SiteDefinition, requestAssetMovement } from '@/lib/firebase/firestore';

interface NewMovementRequestFormProps {
    onMovementRequested: () => void;
}

export function NewMovementRequestForm({ onMovementRequested }: NewMovementRequestFormProps) {
  const { user } = useAuth();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [sites, setSites] = useState<SiteDefinition[]>([]);
  const [selectedAssetId, setSelectedAssetId] = useState('');
  const [fromSite, setFromSite] = useState('');
  const [toSite, setToSite] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (open) {
      const fetchData = async () => {
        try {
            const [assetsData, sitesData] = await Promise.all([
                getAssets(),
                getSiteDefinitions()
            ]);
            setAssets(assetsData);
            setSites(sitesData);
        } catch (err) {
            setError("Failed to load assets and sites.");
            console.error(err);
        }
      };
      fetchData();
    }
  }, [open]);

  useEffect(() => {
    const selectedAsset = assets.find(a => a.id === selectedAssetId);
    if (selectedAsset) {
        setFromSite(selectedAsset.site);
    } else {
        setFromSite('');
    }
  }, [selectedAssetId, assets]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
        setError("You must be logged in to make a request.");
        return;
    }
    setError(null);
    setLoading(true);

    const selectedAsset = assets.find(a => a.id === selectedAssetId);

    try {
        await requestAssetMovement({
            assetId: selectedAsset ? selectedAsset.serialNumber : selectedAssetId,
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
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Request Asset Movement</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          {error && <p className="text-destructive">{error}</p>}
          <div className="space-y-2">
            <Label>Asset</Label>
            <Select onValueChange={setSelectedAssetId} value={selectedAssetId} required>
                <SelectTrigger><SelectValue placeholder="Select Asset" /></SelectTrigger>
                <SelectContent>
                {assets.map(asset => <SelectItem key={asset.id} value={asset.id}>{asset.serialNumber} ({asset.type})</SelectItem>)}
                </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="fromSite">From Site</Label>
            <Input id="fromSite" value={fromSite} disabled placeholder="Automatically assigned" />
          </div>
          <div className="space-y-2">
            <Label>To Site</Label>
            <Select onValueChange={setToSite} value={toSite} required>
                <SelectTrigger><SelectValue placeholder="Select Destination Site" /></SelectTrigger>
                <SelectContent>
                {sites.filter(s => s.name !== fromSite).map(site => <SelectItem key={site.id} value={site.name}>{site.name}</SelectItem>)}
                </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="reason">Reason</Label>
            <Textarea id="reason" placeholder="Reason for movement (optional)" value={reason} onChange={(e) => setReason(e.target.value)} />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Submitting...' : 'Submit Request'}
            </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
