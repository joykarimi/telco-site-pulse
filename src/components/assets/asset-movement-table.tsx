import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { AssetMovement } from '@/types/database'; // Assuming AssetMovement type is in this file
import { Site } from '@/types/site'; // Assuming Site type is in this file

interface AssetMovementTableProps {
  movements: AssetMovement[];
  sites: Site[];
}

export function AssetMovementTable({ movements, sites }: AssetMovementTableProps) {
  const getSiteName = (siteId?: string | null) => {
    if (!siteId) return 'N/A';
    const site = sites.find(s => s.id === siteId);
    return site?.name || 'Unknown Site';
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'pending':
        return 'secondary';
      case 'approved':
        return 'default';
      case 'rejected':
        return 'destructive';
      case 'completed':
        return 'success'; // Assuming 'success' variant exists or use 'default'
      default:
        return 'outline';
    }
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Asset</TableHead>
            <TableHead>From Site</TableHead>
            <TableHead>To Site</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {movements.length === 0 ? (
            <TableRow>
              <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                No asset movement requests found
              </TableCell>
            </TableRow>
          ) : (
            movements.map((movement) => (
              <TableRow key={movement.id}>
                <TableCell className="font-medium">
                  {movement.assets?.name || 'Unknown Asset'} ({movement.assets?.serial_number || 'N/A'})
                </TableCell>
                <TableCell>{getSiteName(movement.from_site_id)}</TableCell>
                <TableCell>{getSiteName(movement.to_site_id)}</TableCell>
                <TableCell>
                  <Badge variant={getStatusBadgeVariant(movement.status)}>
                    {movement.status.replace('_', ' ')}
                  </Badge>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}