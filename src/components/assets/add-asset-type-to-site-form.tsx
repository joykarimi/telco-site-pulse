
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { assetTypes } from '@/lib/asset-types';
import { Site, addAssetTypeToSite } from '@/lib/firebase/firestore';

interface AddAssetTypeToSiteFormProps {
  site: Site;
  onAssetTypeAdded: () => void;
}

export function AddAssetTypeToSiteForm({ site, onAssetTypeAdded }: AddAssetTypeToSiteFormProps) {
  const [assetType, setAssetType] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await addAssetTypeToSite(site.id, assetType);
      onAssetTypeAdded();
      setOpen(false);
      setAssetType('');
    } catch (err) {
      setError('Failed to add asset type. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">Add Asset Type</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Asset Type to {site.name}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <p className="text-destructive">{error}</p>}
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
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Adding Asset Type...' : 'Add Asset Type'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
