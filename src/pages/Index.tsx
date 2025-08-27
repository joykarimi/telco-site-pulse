import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"; // Temporarily removed for routing
import { Routes, Route, Link, useLocation } from "react-router-dom";
import { SummaryCards } from "@/components/dashboard/summary-cards";
import { SitesTable } from "@/components/dashboard/sites-table";
import { SiteForm } from "@/components/dashboard/site-form";
import { AssetForm } from "@/components/assets/asset-form";
import { AssetsTable } from "@/components/assets/assets-table";
import { RevenueBreakdown } from "@/components/dashboard/revenue-breakdown";
import { Header } from "@/components/layout/header";
import { Site } from "@/types/site";
import { Asset, AssetMovement } from "@/types/database";
import { AssetMovementTable } from "@/components/assets/asset-movement-table";
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
  const [assetMovements, setAssetMovements] = useState<AssetMovement[]>([]);
  const { profile } = useAuth();
  const { toast } = useToast();
  const location = useLocation();

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

  const handleRequestMovement = async (assetId: string, fromSiteId: string, toSiteId: string) => {
    try {
      const { data, error } = await supabase
        .from('asset_movements')
        .insert([{ asset_id: assetId, from_site_id: fromSiteId, to_site_id: toSiteId, requested_by: profile?.id, status: 'pending' }])
        .select()
        .single();

      if (error) throw error;

      setAssetMovements([...assetMovements, data]);
      toast({
        title: 'Movement Request Sent',
        description: 'Asset movement request has been submitted for approval.',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
      });
    }
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

  // Load asset movements from database
  useEffect(() => {
    const loadAssetMovements = async () => {
      try {
        const { data, error } = await supabase
          .from('asset_movements')
          .select('*, assets(name, serial_number), from_site:sites!asset_movements_from_site_id_fkey(name), to_site:sites!asset_movements_to_site_id_fkey(name)')
          .order('created_at', { ascending: false });

        if (error) throw error;
        setAssetMovements(data || []);
      } catch (error: any) {
        console.error('Error loading asset movements:', error);
      }
    };

    if (profile?.role === 'admin' || profile?.role === 'maintenance_manager' || profile?.role === 'operations_manager') {
      loadAssetMovements();
    }
  }, [profile?.role]);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <Header sitesCount={sites.length} />
        {/* Summary Cards */}
        <SummaryCards summary={companySummary} />

        {/* Navigation Links */}
        <nav className="flex space-x-4 border-b pb-2">
          <Link to="/" className={`flex items-center gap-2 ${location.pathname === '/' ? 'text-primary font-medium' : 'text-muted-foreground'}`}>
            <FileText className="h-4 w-4" />
            Overview
          </Link>
          <Link to="/revenue-breakdown" className={`flex items-center gap-2 ${location.pathname === '/revenue-breakdown' ? 'text-primary font-medium' : 'text-muted-foreground'}`}>
            <BarChart3 className="h-4 w-4" />
            Revenue Analysis
          </Link>
          <Link to="/sites" className={`flex items-center gap-2 ${location.pathname === '/sites' ? 'text-primary font-medium' : 'text-muted-foreground'}`}>
            <Building2 className="h-4 w-4" />
            Sites
          </Link>
          <Link to="/assets" className={`flex items-center gap-2 ${location.pathname === '/assets' ? 'text-primary font-medium' : 'text-muted-foreground'}`}>
            <Package className="h-4 w-4" />
            Assets
          </Link>
          {(profile?.role === 'admin' || profile?.role === 'maintenance_manager' || profile?.role === 'operations_manager') && (
            <Link to="/asset-movements" className={`flex items-center gap-2 ${location.pathname === '/asset-movements' ? 'text-primary font-medium' : 'text-muted-foreground'}`}>
              <FileText className="h-4 w-4" />
              Asset Movements
            </Link>
          )}
          {profile?.role === 'admin' && (
            <Link to="/add-site" className={`flex items-center gap-2 ${location.pathname === '/add-site' ? 'text-primary font-medium' : 'text-muted-foreground'}`}>
              <Settings className="h-4 w-4" />
              Add Site
            </Link>
          )}
        </nav>

        {/* Route Content */}
        <Routes>
          <Route path="/" element={
            <Card className="space-y-4">
              <CardHeader><CardTitle>Site Performance Overview</CardTitle></CardHeader>
              <CardContent><SitesTable sites={sites} /></CardContent>
            </Card>
          } />
          <Route path="/revenue-breakdown" element={
            <RevenueBreakdown sites={sites} />
          } />
          <Route path="/sites" element={
            <Card className="space-y-4">
              <CardHeader><CardTitle>All Sites</CardTitle></CardHeader>
              <CardContent><SitesTable sites={sites} /></CardContent>
            </Card>
          } />
          <Route path="/assets" element={
            <div className="space-y-4">
              {canManageAssets && (
                <AssetForm sites={sites} onAddAsset={handleAddAsset} />
              )}
              <Card>
                <CardHeader><CardTitle>Assets Inventory</CardTitle></CardHeader>
                <CardContent>
                  <AssetsTable
                    assets={assets}
                    sites={sites}
                    onRequestMovement={handleRequestMovement}
                    canRequestMovement={!!profile}
                  />
                </CardContent>
              </Card>
            </div>
          } />
          {(profile?.role === 'admin' || profile?.role === 'maintenance_manager' || profile?.role === 'operations_manager') && (
            <Route path="/asset-movements" element={
              <Card className="space-y-4">
                <CardHeader><CardTitle>Asset Movement Requests</CardTitle></CardHeader>
                <CardContent><AssetMovementTable movements={assetMovements} sites={sites} /></CardContent>
              </Card>
            } />
          )}
          {profile?.role === 'admin' && (
            <Route path="/add-site" element={
              <SiteForm onAddSite={handleAddSite} />
            } />
          )}
          {/* Add a catch-all for 404 */}
          {/* <Route path="*" element={<NotFound />} /> */}
        </Routes>
      </div>
    </div>
  );
};

export default Index;
