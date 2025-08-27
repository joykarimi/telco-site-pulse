import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Asset } from '@/types/database';
import { Site } from '@/types/site';
import { ArrowUpDown, MoveRight } from 'lucide-react';
import { format } from 'date-fns';

interface AssetsTableProps {
  assets: Asset[];
  sites: Site[];
  onRequestMovement: (assetId: string) => void;
  canRequestMovement: boolean;
}

export function AssetsTable({ assets, sites, onRequestMovement, canRequestMovement }: AssetsTableProps) {
  const getSiteName = (siteId?: string) => {
    if (!siteId) return 'Unassigned';
    const site = sites.find(s => s.id === siteId);
    return site?.name || 'Unknown Site';
  };

  const getAssetTypeLabel = (type: string) => {
    const labels = {
      generator: 'Generator',
      solar_panel: 'Solar Panel',
      battery: 'Battery',
      aps_board: 'APS Board',
      router: 'Router',
      rectifier: 'Rectifier',
      electronic_lock: 'Electronic Lock',
    };
    return labels[type as keyof typeof labels] || type;
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'active':
        return 'default';
      case 'in_repair':
        return 'destructive';
      case 'retired':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[180px]">
              <Button variant="ghost" className="h-auto p-0 font-semibold">
                Serial Number
                <ArrowUpDown className="ml-2 h-4 w-4" />
              </Button>
            </TableHead>
            <TableHead>Asset Type</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Current Site</TableHead>
            <TableHead>Purchase Date</TableHead>
            <TableHead>Installation Date</TableHead>
            {canRequestMovement && <TableHead>Actions</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {assets.length === 0 ? (
            <TableRow>
              <TableCell 
                colSpan={canRequestMovement ? 7 : 6} 
                className="text-center text-muted-foreground py-8"
              >
                No assets found
              </TableCell>
            </TableRow>
          ) : (
            assets.map((asset) => (
              <TableRow key={asset.id}>
                <TableCell className="font-medium">
                  {asset.serial_number}
                </TableCell>
                <TableCell>
                  {getAssetTypeLabel(asset.asset_type)}
                </TableCell>
                <TableCell>
                  <Badge variant={getStatusBadgeVariant(asset.status)}>
                    {asset.status.replace('_', ' ')}
                  </Badge>
                </TableCell>
                <TableCell>
                  {getSiteName(asset.current_site_id)}
                </TableCell>
                <TableCell>
                  {asset.purchase_date 
                    ? format(new Date(asset.purchase_date), 'MMM dd, yyyy')
                    : 'Not set'
                  }
                </TableCell>
                <TableCell>
                  {asset.installation_date 
                    ? format(new Date(asset.installation_date), 'MMM dd, yyyy')
                    : 'Not set'
                  }
                </TableCell>
                {canRequestMovement && (
                  <TableCell>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onRequestMovement(asset.id)}
                      disabled={asset.status !== 'active'}
                    >
                      <MoveRight className="mr-2 h-4 w-4" />
                      Move
                    </Button>
                  </TableCell>
                )}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}