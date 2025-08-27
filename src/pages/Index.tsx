import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SummaryCards } from "@/components/dashboard/summary-cards";
import { SitesTable } from "@/components/dashboard/sites-table";
import { SiteForm } from "@/components/dashboard/site-form";
import { AssetForm } from "@/components/assets/asset-form";
import { AssetsTable } from "@/components/assets/assets-table";
import { RevenueBreakdown } from "@/components/dashboard/revenue-breakdown";
import { Header } from "@/components/layout/header";
import { Site } from "@/types/site";
import { Asset } from "@/types/database";
import { calculateCompanySummary } from "@/lib/calculations";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Building2, FileText, Settings, Package, BarChart3 } from "lucide-react";

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

  const handleRequestMovement = (assetId: string) => {
    // TODO: Implement asset movement request
    toast({
      title: 'Feature Coming Soon',
      description: 'Asset movement functionality will be available soon.',
    });
  };

  const canManageAssets = profile?.role === 'admin' || 
                          profile?.role === 'maintenance_manager' || 
                          profile?.role === 'operations_manager';

  const companySummary = calculateCompanySummary(sites);

  // Load assets from database
  useEffect(() => {
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

    loadAssets();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <Header sitesCount={sites.length} />

        {/* Summary Cards */}
        <SummaryCards summary={companySummary} />

        {/* Main Content */}
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="revenue" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Revenue Analysis
            </TabsTrigger>
            <TabsTrigger value="sites" className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Sites
            </TabsTrigger>
            <TabsTrigger value="assets" className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              Assets
            </TabsTrigger>
            <TabsTrigger value="add-site" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Add Site
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Site Performance Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <SitesTable sites={sites} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="revenue" className="space-y-4">
            <RevenueBreakdown sites={sites} />
          </TabsContent>

          <TabsContent value="sites" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>All Sites</CardTitle>
              </CardHeader>
              <CardContent>
                <SitesTable sites={sites} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="assets" className="space-y-4">
            {canManageAssets && (
              <AssetForm sites={sites} onAddAsset={handleAddAsset} />
            )}
            <Card>
              <CardHeader>
                <CardTitle>Assets Inventory</CardTitle>
              </CardHeader>
              <CardContent>
                <AssetsTable 
                  assets={assets} 
                  sites={sites} 
                  onRequestMovement={handleRequestMovement}
                  canRequestMovement={!!profile}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="add-site">
            <SiteForm onAddSite={handleAddSite} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Index;
