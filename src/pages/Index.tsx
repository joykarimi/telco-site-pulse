import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SummaryCards } from "@/components/dashboard/summary-cards";
import { SitesTable } from "@/components/dashboard/sites-table";
import { SiteForm } from "@/components/dashboard/site-form";
import { AssetForm } from "@/components/assets/asset-form";
import { AssetsTable } from "@/components/assets/assets-table";
import { AssetsDashboard } from "@/components/dashboard/assets-dashboard";
import { AssetMovementRequests } from "@/components/assets/asset-movement-requests";
import { RevenueBreakdown } from "@/components/dashboard/revenue-breakdown";
import { Header } from "@/components/layout/header";
import { Site } from "@/types/site";
import { Asset, AssetMovement } from "@/types/database";
import { calculateCompanySummary } from "@/lib/calculations";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { 
  Building2, 
  FileText, 
  Settings, 
  Package, 
  BarChart3, 
  Activity, 
  MoveRight,
  TrendingUp,
  Sparkles
} from "lucide-react";

const Index = () => {
  const [sites, setSites] = useState<Site[]>([
    {
      id: "1",
      name: "Site-001-Nairobi",
      type: "grid-generator-solar",
      revenueType: "colocated",
      safaricomIncome: 75000,
      airtelIncome: 45000,
      gridConsumption: 800,
      fuelConsumption: 200,
      solarContribution: 150,
      gridCostPerKwh: 25.50,
      fuelCostPerLiter: 165.00,
      solarMaintenanceCost: 8000,
    },
    {
      id: "2", 
      name: "Site-002-Mombasa",
      type: "grid-only",
      revenueType: "colocated",
      safaricomIncome: 65000,
      airtelIncome: 40000,
      gridConsumption: 1200,
      fuelConsumption: 0,
      solarContribution: 0,
      gridCostPerKwh: 27.00,
      fuelCostPerLiter: 0,
      solarMaintenanceCost: 0,
    },
    {
      id: "3",
      name: "Site-003-Kisumu", 
      type: "generator-solar",
      revenueType: "safaricom_only",
      safaricomIncome: 55000,
      airtelIncome: 0,
      gridConsumption: 0,
      fuelConsumption: 350,
      solarContribution: 100,
      gridCostPerKwh: 0,
      fuelCostPerLiter: 160.00,
      solarMaintenanceCost: 6000,
    },
  ]);

  const [assets, setAssets] = useState<Asset[]>([]);
  const [movements, setMovements] = useState<AssetMovement[]>([]);
  const { profile } = useAuth();
  const { toast } = useToast();

  const handleAddSite = (newSite: Site) => {
    setSites([...sites, newSite]);
  };

  const handleAddAsset = async (assetData: Omit<Asset, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error } = await supabase
        .from('assets')
        .insert([assetData])
        .select()
        .single();

      if (error) throw error;

      setAssets([...assets, data]);
      toast({
        title: 'Asset Added',
        description: 'Asset has been successfully registered.',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleRequestMovement = async (assetId: string, toSiteId?: string, reason?: string) => {
    if (!toSiteId) {
      // TODO: Implement asset movement request dialog
      toast({
        title: 'Feature Coming Soon',
        description: 'Asset movement functionality will be available soon.',
      });
      return;
    }

    try {
      const asset = assets.find(a => a.id === assetId);
      const { data, error } = await supabase
        .from('asset_movements')
        .insert([{
          asset_id: assetId,
          from_site_id: asset?.current_site_id,
          to_site_id: toSiteId,
          requested_by: profile?.user_id || '',
          reason,
        }])
        .select()
        .single();

      if (error) throw error;

      setMovements([...movements, data]);
      toast({
        title: 'Movement Request Submitted',
        description: 'Asset movement request has been submitted for approval.',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleApproveMovement = async (movementId: string, role: 'maintenance' | 'operations') => {
    try {
      const updateData = role === 'maintenance' 
        ? { 
            maintenance_manager_approval: true,
            maintenance_approved_by: profile?.user_id,
          }
        : { 
            operations_manager_approval: true,
            operations_approved_by: profile?.user_id,
          };

      const { data, error } = await supabase
        .from('asset_movements')
        .update(updateData)
        .eq('id', movementId)
        .select()
        .single();

      if (error) throw error;

      // Check if both approvals are complete
      if (data.maintenance_manager_approval && data.operations_manager_approval) {
        await supabase
          .from('asset_movements')
          .update({ 
            status: 'approved',
            approved_at: new Date().toISOString(),
          })
          .eq('id', movementId);
        
        // Update asset location
        await supabase
          .from('assets')
          .update({ current_site_id: data.to_site_id })
          .eq('id', data.asset_id);
      }

      // Refresh movements
      loadMovements();
      loadAssets();
      
      toast({
        title: 'Movement Approved',
        description: `Movement request approved by ${role} manager.`,
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleRejectMovement = async (movementId: string, reason: string) => {
    try {
      await supabase
        .from('asset_movements')
        .update({ 
          status: 'rejected',
          rejected_at: new Date().toISOString(),
          reason,
        })
        .eq('id', movementId);

      loadMovements();
      
      toast({
        title: 'Movement Rejected',
        description: 'Movement request has been rejected.',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const canManageAssets = profile?.role === 'admin' || 
                          profile?.role === 'maintenance_manager' || 
                          profile?.role === 'operations_manager';

  const companySummary = calculateCompanySummary(sites);

  // Load assets from database
  const loadAssets = async () => {
    try {
      const { data, error } = await supabase
        .from('assets')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAssets(data || []);
    } catch (error: any) {
      console.error('Error loading assets:', error);
    }
  };

  // Load asset movements from database
  const loadMovements = async () => {
    try {
      const { data, error } = await supabase
        .from('asset_movements')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMovements(data || []);
    } catch (error: any) {
      console.error('Error loading movements:', error);
    }
  };

  useEffect(() => {
    loadAssets();
    loadMovements();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="animate-fade-in">
          <Header sitesCount={sites.length} />
        </div>

        {/* Summary Cards */}
        <div className="animate-fade-in-up">
          <SummaryCards summary={companySummary} />
        </div>

        {/* Main Content */}
        <div className="animate-slide-in-right">
          <Tabs defaultValue="overview" className="space-y-4">
            <TabsList className="grid w-full grid-cols-7 bg-gradient-card shadow-custom-card">
              <TabsTrigger value="overview" className="flex items-center gap-2 data-[state=active]:bg-gradient-primary data-[state=active]:text-primary-foreground transition-all duration-300">
                <FileText className="h-4 w-4" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="revenue" className="flex items-center gap-2 data-[state=active]:bg-gradient-info data-[state=active]:text-primary-foreground transition-all duration-300">
                <BarChart3 className="h-4 w-4" />
                Revenue
              </TabsTrigger>
              <TabsTrigger value="sites" className="flex items-center gap-2 data-[state=active]:bg-gradient-success data-[state=active]:text-success-foreground transition-all duration-300">
                <Building2 className="h-4 w-4" />
                Sites
              </TabsTrigger>
              <TabsTrigger value="assets" className="flex items-center gap-2 data-[state=active]:bg-gradient-warning data-[state=active]:text-warning-foreground transition-all duration-300">
                <Package className="h-4 w-4" />
                Assets
              </TabsTrigger>
              <TabsTrigger value="asset-dashboard" className="flex items-center gap-2 data-[state=active]:bg-gradient-primary data-[state=active]:text-primary-foreground transition-all duration-300">
                <Activity className="h-4 w-4" />
                Dashboard
              </TabsTrigger>
              <TabsTrigger value="movements" className="flex items-center gap-2 data-[state=active]:bg-gradient-danger data-[state=active]:text-destructive-foreground transition-all duration-300">
                <MoveRight className="h-4 w-4" />
                Movements
              </TabsTrigger>
              <TabsTrigger value="add-site" className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-primary/80 data-[state=active]:text-primary-foreground transition-all duration-300">
                <Settings className="h-4 w-4" />
                Add Site
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4 animate-fade-in">
              <Card className="bg-gradient-card hover:shadow-custom-hover transition-all duration-300">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-primary animate-float" />
                    Site Performance Overview
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <SitesTable sites={sites} />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="revenue" className="space-y-4 animate-fade-in">
              <RevenueBreakdown sites={sites} />
            </TabsContent>

            <TabsContent value="sites" className="space-y-4 animate-fade-in">
              <Card className="bg-gradient-card hover:shadow-custom-hover transition-all duration-300">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-primary animate-float" />
                    All Sites
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <SitesTable sites={sites} />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="assets" className="space-y-4 animate-fade-in">
              {canManageAssets && (
                <div className="animate-scale-in">
                  <AssetForm sites={sites} onAddAsset={handleAddAsset} />
                </div>
              )}
              <Card className="bg-gradient-card hover:shadow-custom-hover transition-all duration-300 animate-fade-in-up">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5 text-primary animate-float" />
                    Assets Inventory
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <AssetsTable 
                    assets={assets} 
                    sites={sites} 
                    onRequestMovement={(assetId) => handleRequestMovement(assetId)}
                    canRequestMovement={!!profile}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="asset-dashboard" className="space-y-4 animate-fade-in">
              <AssetsDashboard assets={assets} sites={sites} />
            </TabsContent>

            <TabsContent value="movements" className="space-y-4 animate-fade-in">
              <AssetMovementRequests
                movements={movements}
                assets={assets}
                sites={sites}
                onRequestMovement={handleRequestMovement}
                onApproveMovement={handleApproveMovement}
                onRejectMovement={handleRejectMovement}
              />
            </TabsContent>

            <TabsContent value="add-site" className="animate-fade-in">
              <SiteForm onAddSite={handleAddSite} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default Index;
