import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Asset, AssetMovement, Site } from "@/pages/Index";
import { Profile } from '@/hooks/use-auth';
import { Label } from '@/components/ui/label';

interface AssetMovementTableProps {
  assetMovements: AssetMovement[];
  assets: Asset[];
  sites: Site[];
  profile: Profile;
  onAddMovement: (movementData: Omit<AssetMovement, 'id' | 'created_at' | 'status' | 'requested_by'>) => Promise<void>;
}

export function AssetMovementTable({ assetMovements, assets, sites, profile, onAddMovement }: AssetMovementTableProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newMovement, setNewMovement] = useState<{ asset_id: string; to_site_id: string }>({ asset_id: '', to_site_id: '' });

  const handleAddMovement = async () => {
    const asset = assets.find(a => a.id === newMovement.asset_id);
    if (!asset || !newMovement.to_site_id) {
      // Optionally, show a toast notification for validation error
      return;
    }

    await onAddMovement({
      ...newMovement,
      from_site_id: asset.site_id,
    });

    setIsDialogOpen(false);
    setNewMovement({ asset_id: '', to_site_id: '' });
  };
  
  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'pending': return 'secondary';
      case 'approved': return 'default';
      case 'rejected': return 'destructive';
      default: return 'outline';
    }
  };

  return (
    <div className="rounded-md border">
      <div className="p-4 flex justify-between items-center">
        <h3 className="font-semibold">Asset Movement History</h3>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>Request Asset Movement</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>New Asset Movement Request</DialogTitle>
              <DialogDescription>Select an asset to move and its new location.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="asset-select">Asset</Label>
                <Select onValueChange={value => setNewMovement(prev => ({ ...prev, asset_id: value }))}>
                  <SelectTrigger id="asset-select">
                    <SelectValue placeholder="Select an asset" />
                  </SelectTrigger>
                  <SelectContent>
                    {assets.map(asset => (
                      <SelectItem key={asset.id} value={asset.id}>
                        {asset.name} ({asset.serial_number}) - Current Site: {sites.find(s=>s.id === asset.site_id)?.name || 'Unknown'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="site-select">To Site</Label>
                <Select onValueChange={value => setNewMovement(prev => ({ ...prev, to_site_id: value }))}>
                  <SelectTrigger id="site-select">
                    <SelectValue placeholder="Select destination site" />
                  </SelectTrigger>
                  <SelectContent>
                    {sites.map(site => (
                      <SelectItem key={site.id} value={site.id}>{site.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleAddMovement}>Submit Request</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Asset</TableHead>
            <TableHead>From</TableHead>
            <TableHead>To</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {assetMovements.length > 0 ? (
            assetMovements.map((movement) => (
              <TableRow key={movement.id}>
                <TableCell>
                  <div className="font-medium">{movement.asset?.name || 'Loading...'}</div>
                  <div className="text-sm text-muted-foreground">{movement.asset?.serial_number || '...'}</div>
                </TableCell>
                <TableCell>{movement.from_site?.name || 'Loading...'}</TableCell>
                <TableCell>{movement.to_site?.name || 'Loading...'}</TableCell>
                <TableCell>
                  <Badge variant={getStatusBadgeVariant(movement.status)}>{movement.status}</Badge>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={4} className="text-center">No movements yet.</TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
