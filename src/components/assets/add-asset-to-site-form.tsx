
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { assetTypes } from '@/lib/asset-types';
import { addAsset, Site, isSerialNumberUnique } from '@/lib/firebase/firestore';
import { Plus } from 'lucide-react';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';

interface AddAssetToSiteFormProps {
  site: Site;
  onAssetAdded: () => void;
}

export function AddAssetToSiteForm({ site, onAssetAdded }: AddAssetToSiteFormProps) {
  const [serialNumber, setSerialNumber] = useState('');
  const [assetType, setAssetType] = useState('');
  const [status, setStatus] = useState('Active');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!serialNumber || !assetType || !status) {
        setError("All fields are required.");
        return;
    }

    setLoading(true);

    try {
      const isUnique = await isSerialNumberUnique(serialNumber);
      if (!isUnique) {
        setError('Serial number must be unique.');
        setLoading(false);
        return;
      }

      await addAsset({
        serialNumber,
        type: assetType,
        status,
        site: site.name,
      });

      onAssetAdded();
      setOpen(false);
      setSerialNumber('');
      setAssetType('');
      setStatus('Active');
    } catch (err) {
      setError('Failed to add asset. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon">
            <Plus className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Asset to {site.name}</DialogTitle>
          <VisuallyHidden>
            <DialogDescription>
              Fill in the form below to add a new asset to this site.
            </DialogDescription>
          </VisuallyHidden>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <p className="text-destructive">{error}</p>}
          <Input
            placeholder="Serial Number"
            value={serialNumber}
            onChange={(e) => setSerialNumber(e.target.value)}
            required
          />
          <Select onValueChange={setAssetType} value={assetType} required>
            <SelectTrigger>
              <SelectValue placeholder="Select Asset Type" />
            </SelectTrigger>
            <SelectContent>
              {assetTypes.map((type) => (
                <SelectItem key={type} value={type}>
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select onValueChange={setStatus} value={status} required>
            <SelectTrigger>
              <SelectValue placeholder="Select Status" />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="In Repair">In Repair</SelectItem>
                <SelectItem value="Retired">Retired</SelectItem>
            </SelectContent>
          </Select>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Adding Asset...' : 'Add Asset'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
