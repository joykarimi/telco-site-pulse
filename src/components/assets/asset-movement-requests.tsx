import { useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from '@/auth/AuthProvider';
import { getAssets, Asset, getSiteDefinitions, SiteDefinition, requestAssetMovement, getUsersWithPermission, UserProfile } from '@/lib/firebase/firestore';
import { PERMISSIONS } from '@/lib/roles';

interface NewMovementRequestFormProps {
    onMovementRequested: (newMovementId: string) => void;
}

export function NewMovementRequestForm({ onMovementRequested }: NewMovementRequestFormProps) {
  const { user } = useAuth();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [sites, setSites] = useState<SiteDefinition[]>([]);
  const [approvers, setApprovers] = useState<UserProfile[]>([]);
  const [selectedAssetId, setSelectedAssetId] = useState('');
  const [fromSite, setFromSite] = useState('');
  const [toSite, setToSite] = useState('');
  const [reason, setReason] = useState('');
  const [approver1, setApprover1] = useState('');
  const [approver2, setApprover2] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (open) {
      const fetchData = async () => {
        setLoading(true);
        setError(null);
        
        const results = await Promise.allSettled([
          getAssets(),
          getSiteDefinitions(),
          getUsersWithPermission(PERMISSIONS.MOVEMENT_APPROVE)
        ]);

        let hasError = false;
        let errorMessage = "Failed to load necessary data: ";

        if (results[0].status === 'fulfilled') {
          setAssets(results[0].value);
        } else {
          hasError = true;
          errorMessage += "Assets failed to load. ";
          console.error("Error fetching assets:", results[0].reason);
        }

        if (results[1].status === 'fulfilled') {
          setSites(results[1].value);
        } else {
          hasError = true;
          errorMessage += "Sites failed to load. ";
          console.error("Error fetching sites:", results[1].reason);
        }

        if (results[2].status === 'fulfilled') {
          setApprovers(results[2].value);
        } else {
          hasError = true;
          errorMessage += "Approvers failed to load. ";
          console.error("Error fetching approvers:", results[2].reason);
        }

        if (hasError) {
          setError(errorMessage + "Please check console for more details.");
        }
        setLoading(false);
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
    if (!user || !user.uid) { // Ensure user and user.uid exist
        setError("You must be logged in to make a request.");
        return;
    }
    setError(null);
    setLoading(true);

    try {
        const newMovementId = await requestAssetMovement({
            assetId: selectedAssetId,
            fromSite,
            toSite,
            reason,
            requestedBy: user.uid, // Use user.uid instead of user.email
            approver1,
            approver2,
        });
        onMovementRequested(newMovementId);
        setOpen(false);
        // Reset form
        setSelectedAssetId('');
        setFromSite('');
        setToSite('');
        setReason('');
        setApprover1('');
        setApprover2('');
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
              <Label>Approver 1</Label>
              <Select onValueChange={setApprover1} value={approver1} required>
                  <SelectTrigger><SelectValue placeholder="Select Approver" /></SelectTrigger>
                  <SelectContent>
                  {approvers.map(approver => <SelectItem key={approver.uid} value={approver.uid}>{approver.displayName || approver.email} ({approver.role || 'N/A'})</SelectItem>)}
                  </SelectContent>
              </Select>
          </div>
          <div className="space-y-2">
              <Label>Approver 2 (optional)</Label>
              <Select onValueChange={setApprover2} value={approver2}>
                  <SelectTrigger><SelectValue placeholder="Select Approver" /></SelectTrigger>
                  <SelectContent>
                  {approvers.filter(a => a.uid !== approver1).map(approver => <SelectItem key={approver.uid} value={approver.uid}>{approver.displayName || approver.email} ({approver.role || 'N/A'})</SelectItem>)}
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
