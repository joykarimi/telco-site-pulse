import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Clock, CheckCircle, XCircle, Package, ArrowRight } from "lucide-react";

interface AssetMovementRequest {
  id: string;
  asset_id: string;
  from_site_id?: string;
  to_site_id: string;
  requested_by: string;
  status: 'pending' | 'approved' | 'rejected';
  maintenance_manager_approval?: boolean;
  operations_manager_approval?: boolean;
  reason?: string;
  created_at: string;
  assets?: {
    serial_number: string;
    asset_type: string;
  };
  from_site?: {
    site_id: string;
    location: string;
  };
  to_site?: {
    site_id: string;
    location: string;
  };
  requesting_user?: {
    full_name: string;
  };
}

const statusColors = {
  pending: "default",
  approved: "default", 
  rejected: "destructive",
} as const;

const statusIcons = {
  pending: Clock,
  approved: CheckCircle,
  rejected: XCircle,
};

export function AssetMovementRequests() {
  const [requests, setRequests] = useState<AssetMovementRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const { profile } = useAuth();
  const { toast } = useToast();

  const isAdmin = profile?.role === 'admin';
  const isManager = profile?.role === 'maintenance_manager' || profile?.role === 'operations_manager';

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const { data, error } = await supabase
        .from('asset_movements')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRequests(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to fetch movement requests",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApproval = async (requestId: string, approve: boolean) => {
    try {
      const updateData: any = {};
      
      if (profile?.role === 'maintenance_manager') {
        updateData.maintenance_manager_approval = approve;
        updateData.maintenance_approved_by = profile.user_id;
      } else if (profile?.role === 'operations_manager') {
        updateData.operations_manager_approval = approve;
        updateData.operations_approved_by = profile.user_id;
      } else if (profile?.role === 'admin') {
        updateData.maintenance_manager_approval = approve;
        updateData.operations_manager_approval = approve;
        updateData.maintenance_approved_by = profile.user_id;
        updateData.operations_approved_by = profile.user_id;
      }

      if (approve) {
        updateData.approved_at = new Date().toISOString();
        updateData.status = 'approved';
      } else {
        updateData.rejected_at = new Date().toISOString();
        updateData.status = 'rejected';
      }

      const { error } = await supabase
        .from('asset_movements')
        .update(updateData)
        .eq('id', requestId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Request ${approve ? 'approved' : 'rejected'} successfully`,
      });

      fetchRequests();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update request",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5 text-primary" />
          Asset Movement Requests
        </CardTitle>
        <CardDescription>
          Track and manage asset transfer requests between sites
        </CardDescription>
      </CardHeader>
      <CardContent>
        {requests.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">No movement requests found</p>
        ) : (
          <div className="space-y-4">
            {requests.map((request) => {
              const StatusIcon = statusIcons[request.status];
              const canApprove = (isAdmin || isManager) && request.status === 'pending';
              
              return (
                <div
                  key={request.id}
                  className="p-4 border border-accent/20 rounded-lg bg-gradient-to-r from-background to-accent/5 hover:shadow-md transition-all duration-300"
                >
                  <div className="flex items-start justify-between">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2">
                        <StatusIcon className="h-4 w-4" />
                        <span className="font-medium">
                          {request.assets?.serial_number} ({request.assets?.asset_type})
                        </span>
                        <Badge variant={statusColors[request.status]}>
                          {request.status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>
                          {request.from_site 
                            ? `${request.from_site.site_id} - ${request.from_site.location}`
                            : 'No current site'
                          }
                        </span>
                        <ArrowRight className="h-3 w-3" />
                        <span>
                          {request.to_site?.site_id} - {request.to_site?.location}
                        </span>
                      </div>
                      <div className="text-sm text-muted-foreground space-y-1">
                        <p>Requested by: {request.requesting_user?.full_name}</p>
                        {request.reason && <p>Reason: {request.reason}</p>}
                        <p>Date: {new Date(request.created_at).toLocaleDateString()}</p>
                        
                        {request.status === 'pending' && (
                          <div className="text-xs space-y-1">
                            <p>Maintenance Manager: {request.maintenance_manager_approval ? '✅ Approved' : '⏳ Pending'}</p>
                            <p>Operations Manager: {request.operations_manager_approval ? '✅ Approved' : '⏳ Pending'}</p>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="text-right ml-4">
                      {canApprove && (
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            variant="default"
                            onClick={() => handleApproval(request.id, true)}
                          >
                            Approve
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleApproval(request.id, false)}
                          >
                            Reject
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}