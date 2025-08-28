import { useState } from 'react';
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Asset, AssetMovement, MovementStatus } from '@/types/database';
import { Site } from '@/types/site';
import { useAuth } from '@/hooks/use-auth';
import { 
  MoveRight, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Plus,
  Eye,
  Calendar,
  User,
  MapPin
} from 'lucide-react';
import { format } from 'date-fns';

interface AssetMovementRequestsProps {
  movements: AssetMovement[];
  assets: Asset[];
  sites: Site[];
  onRequestMovement: (assetId: string, toSiteId: string, reason?: string) => void;
  onApproveMovement: (movementId: string, role: 'maintenance' | 'operations') => void;
  onRejectMovement: (movementId: string, reason: string) => void;
}

export function AssetMovementRequests({ 
  movements, 
  assets, 
  sites, 
  onRequestMovement,
  onApproveMovement,
  onRejectMovement
}: AssetMovementRequestsProps) {
  const { profile } = useAuth();
  const [selectedAsset, setSelectedAsset] = useState<string>('');
  const [selectedSite, setSelectedSite] = useState<string>('');
  const [reason, setReason] = useState<string>('');
  const [isRequestDialogOpen, setIsRequestDialogOpen] = useState(false);
  const [selectedMovement, setSelectedMovement] = useState<AssetMovement | null>(null);

  const getStatusBadge = (status: MovementStatus) => {
    const statusConfig = {
      pending: {
        variant: 'secondary' as const,
        icon: Clock,
        className: 'animate-pulse bg-gradient-warning text-warning-foreground',
      },
      approved: {
        variant: 'default' as const,
        icon: CheckCircle,
        className: 'bg-gradient-success text-success-foreground animate-bounce-in',
      },
      rejected: {
        variant: 'destructive' as const,
        icon: XCircle,
        className: 'bg-gradient-danger text-destructive-foreground',
      },
    };

    const config = statusConfig[status];
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className={`${config.className} gap-1 transition-all duration-300`}>
        <Icon className="h-3 w-3" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const getAssetName = (assetId: string) => {
    const asset = assets.find(a => a.id === assetId);
    return asset ? `${asset.asset_type.replace('_', ' ')} - ${asset.serial_number}` : 'Unknown Asset';
  };

  const getSiteName = (siteId?: string) => {
    if (!siteId) return 'Unassigned';
    const site = sites.find(s => s.id === siteId);
    return site?.name || 'Unknown Site';
  };

  const canApprove = (movement: AssetMovement) => {
    if (!profile) return false;
    
    const isMaintenance = profile.role === 'maintenance_manager' || profile.role === 'admin';
    const isOperations = profile.role === 'operations_manager' || profile.role === 'admin';
    
    if (movement.status !== 'pending') return false;
    
    if (isMaintenance && !movement.maintenance_manager_approval) return true;
    if (isOperations && !movement.operations_manager_approval) return true;
    
    return false;
  };

  const handleRequestSubmit = () => {
    if (selectedAsset && selectedSite) {
      onRequestMovement(selectedAsset, selectedSite, reason || undefined);
      setSelectedAsset('');
      setSelectedSite('');
      setReason('');
      setIsRequestDialogOpen(false);
    }
  };

  const pendingCount = movements.filter(m => m.status === 'pending').length;
  const approvedCount = movements.filter(m => m.status === 'approved').length;
  const rejectedCount = movements.filter(m => m.status === 'rejected').length;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-card hover:shadow-custom-hover transition-all duration-300 animate-scale-in">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Requests</CardTitle>
            <MoveRight className="h-4 w-4 text-primary animate-float" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{movements.length}</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-warning hover:shadow-custom-warning transition-all duration-300 animate-scale-in">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-warning-foreground">Pending</CardTitle>
            <Clock className="h-4 w-4 text-warning-foreground animate-pulse" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning-foreground">{pendingCount}</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-success hover:shadow-custom-success transition-all duration-300 animate-scale-in">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-success-foreground">Approved</CardTitle>
            <CheckCircle className="h-4 w-4 text-success-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success-foreground">{approvedCount}</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-danger hover:shadow-custom-danger transition-all duration-300 animate-scale-in">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-destructive-foreground">Rejected</CardTitle>
            <XCircle className="h-4 w-4 text-destructive-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive-foreground">{rejectedCount}</div>
          </CardContent>
        </Card>
      </div>

      {/* Movement Requests Table */}
      <Card className="animate-fade-in-up bg-gradient-card hover:shadow-custom-hover transition-all duration-300">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <MoveRight className="h-5 w-5 text-primary animate-float" />
              Asset Movement Requests
            </CardTitle>
            <CardDescription>Track and manage asset transfers between sites</CardDescription>
          </div>
          
          <Dialog open={isRequestDialogOpen} onOpenChange={setIsRequestDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-primary hover:shadow-custom-hover transition-all duration-300">
                <Plus className="mr-2 h-4 w-4" />
                New Request
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[525px] animate-scale-in bg-gradient-card">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Plus className="h-5 w-5 text-primary" />
                  Request Asset Movement
                </DialogTitle>
                <DialogDescription>
                  Submit a request to move an asset to a different site
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="asset">Select Asset</Label>
                  <Select value={selectedAsset} onValueChange={setSelectedAsset}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose an asset to move" />
                    </SelectTrigger>
                    <SelectContent>
                      {assets.filter(a => a.status === 'active').map((asset) => (
                        <SelectItem key={asset.id} value={asset.id}>
                          {asset.asset_type.replace('_', ' ')} - {asset.serial_number}
                          {asset.current_site_id && ` (${getSiteName(asset.current_site_id)})`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="site">Destination Site</Label>
                  <Select value={selectedSite} onValueChange={setSelectedSite}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose destination site" />
                    </SelectTrigger>
                    <SelectContent>
                      {sites.map((site) => (
                        <SelectItem key={site.id} value={site.id}>
                          {site.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reason">Reason (Optional)</Label>
                  <Textarea
                    id="reason"
                    placeholder="Explain why this asset needs to be moved..."
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="resize-none"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsRequestDialogOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleRequestSubmit}
                  disabled={!selectedAsset || !selectedSite}
                  className="bg-gradient-primary hover:shadow-custom-hover transition-all duration-300"
                >
                  Submit Request
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border border-border/50 overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow>
                  <TableHead>Asset</TableHead>
                  <TableHead>From → To</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Requested By</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Approvals</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {movements.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                      <div className="flex flex-col items-center gap-2">
                        <AlertTriangle className="h-8 w-8 text-muted-foreground/50" />
                        No movement requests found
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  movements.map((movement, index) => (
                    <TableRow 
                      key={movement.id} 
                      className="hover:bg-muted/50 transition-colors animate-fade-in-up"
                      style={{ animationDelay: `${index * 100}ms` }}
                    >
                      <TableCell className="font-medium">
                        <div className="flex flex-col">
                          <span>{getAssetName(movement.asset_id)}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">
                            {getSiteName(movement.from_site_id)}
                          </span>
                          <MoveRight className="h-4 w-4 text-primary animate-float" />
                          <span className="text-sm font-medium">
                            {getSiteName(movement.to_site_id)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(movement.status)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">Requester</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">
                            {format(new Date(movement.created_at), 'MMM dd, yyyy')}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-1">
                            {movement.maintenance_manager_approval ? (
                              <CheckCircle className="h-3 w-3 text-success" />
                            ) : (
                              <Clock className="h-3 w-3 text-warning" />
                            )}
                            <span className="text-xs">Maintenance</span>
                          </div>
                          <div className="flex items-center gap-1">
                            {movement.operations_manager_approval ? (
                              <CheckCircle className="h-3 w-3 text-success" />
                            ) : (
                              <Clock className="h-3 w-3 text-warning" />
                            )}
                            <span className="text-xs">Operations</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          {canApprove(movement) && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => onApproveMovement(movement.id, 
                                  profile?.role === 'maintenance_manager' ? 'maintenance' : 'operations'
                                )}
                                className="hover:bg-success hover:text-success-foreground transition-colors"
                              >
                                <CheckCircle className="mr-1 h-3 w-3" />
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => onRejectMovement(movement.id, 'Rejected by manager')}
                                className="hover:bg-destructive hover:text-destructive-foreground transition-colors"
                              >
                                <XCircle className="mr-1 h-3 w-3" />
                                Reject
                              </Button>
                            </>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setSelectedMovement(movement)}
                          >
                            <Eye className="mr-1 h-3 w-3" />
                            View
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}