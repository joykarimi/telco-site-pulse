import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Routes, Route, Link, useLocation } from "react-router-dom";
import { SummaryCards } from "@/components/dashboard/summary-cards";
import { SitesTable } from "@/components/dashboard/sites-table";
import { SiteForm } from "@/components/dashboard/site-form";
import { AssetForm } from "@/components/assets/asset-form";
import { AssetsTable } from "@/components/assets/assets-table";
import { RevenueBreakdown } from "@/components/dashboard/revenue-breakdown";
import { Header } from "@/components/layout/header";
import { Site } from "@/types/site";
import { AssetMovementTable } from "@/components/assets/asset-movement-table";
import { calculateCompanySummary } from "@/lib/calculations";
import { useAuth } from "@/hooks/use-auth.tsx";
import { db } from "@/integrations/firebase/client";
import { collection, getDocs, addDoc, query, orderBy, Timestamp, doc, getDoc, serverTimestamp } from 'firebase/firestore';
import { useToast } from "@/hooks/use-toast";
import { Building2, FileText, Settings, Package, BarChart3 } from "lucide-react";
import NotFound from "./NotFound";
import { Toaster } from "@/components/ui/toaster";

// Type definitions moved here after removing src/types/database.ts
export interface Asset {
  id: string;
  name: string;
  serial_number: string;
  type: string;
  site_id: string;
  created_at: Timestamp;
  updated_at: Timestamp;
};

export interface AssetMovement {
  id: string;
  asset_id: string;
  from_site_id: string;
  to_site_id: string;
  requested_by: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: Timestamp;
  // Denormalized or populated data for display
  asset?: { name: string; serial_number: string };
  from_site?: { name: string };
  to_site?: { name: string };
};

const Index = () => {
  const [sites, setSites] = useState<Site[]>([
    {
      id: "1",
      name: "Site-001-Nairobi",
      type: "grid-generator-solar",
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
      const docRef = await addDoc(collection(db, 'assets'), {
        ...assetData,
        created_at: serverTimestamp(),
        updated_at: serverTimestamp(),
      });
      
      const newAsset = { ...assetData, id: docRef.id, created_at: Timestamp.now(), updated_at: Timestamp.now() };
      setAssets([...assets, newAsset]);

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
    if (!profile) return;
    try {
      const docRef = await addDoc(collection(db, 'asset_movements'), {
        asset_id: assetId,
        from_site_id: fromSiteId,
        to_site_id: toSiteId,
        requested_by: profile.id,
        status: 'pending',
        created_at: serverTimestamp(),
      });

      const fromSite = sites.find(s => s.id === fromSiteId);
      const toSite = sites.find(s => s.id === toSiteId);
      const movedAsset = assets.find(a => a.id === assetId);

      const newMovement: AssetMovement = {
        id: docRef.id,
        asset_id: assetId,
        from_site_id: fromSiteId,
        to_site_id: toSiteId,
        requested_by: profile.id,
        status: 'pending',
        created_at: Timestamp.now(),
        asset: movedAsset ? { name: movedAsset.name, serial_number: movedAsset.serial_number } : undefined,
        from_site: fromSite ? { name: fromSite.name } : undefined,
        to_site: toSite ? { name: toSite.name } : undefined
      };
      setAssetMovements([...assetMovements, newMovement]);

      toast({
        title: 'Movement Request Sent',
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

  const canManageAssets = profile?.role === 'admin' || 
                          profile?.role === 'maintenance_manager' || 
                          profile?.role === 'operations_manager';

  const companySummary = calculateCompanySummary(sites);

  useEffect(() => {
    const loadAssets = async () => {
      try {
        const q = query(collection(db, 'assets'), orderBy('created_at', 'desc'));
        const querySnapshot = await getDocs(q);
        const assetsData = querySnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Asset));
        setAssets(assetsData);
      } catch (error: any) {
        console.error('Error loading assets:', error);
      }
    };

    loadAssets();
  }, []);

  useEffect(() => {
    const loadAssetMovements = async () => {
      try {
        const q = query(collection(db, 'asset_movements'), orderBy('created_at', 'desc'));
        const querySnapshot = await getDocs(q);
        
        const movementsData = await Promise.all(querySnapshot.docs.map(async (docSnapshot) => {
          const movement = { ...docSnapshot.data(), id: docSnapshot.id } as AssetMovement;

          let assetData;
          if (movement.asset_id) {
              const assetDoc = await getDoc(doc(db, 'assets', movement.asset_id));
              if (assetDoc.exists()) {
                  const asset = assetDoc.data();
                  assetData = { name: asset.name, serial_number: asset.serial_number };
              }
          }
          
          const fromSite = sites.find(s => s.id === movement.from_site_id);
          const toSite = sites.find(s => s.id === movement.to_site_id);

          return {
              ...movement,
              asset: assetData,
              from_site: fromSite ? { name: fromSite.name } : undefined,
              to_site: toSite ? { name: toSite.name } : undefined,
          };
        }));

        setAssetMovements(movementsData);
      } catch (error: any) {
        console.error('Error loading asset movements:', error);
      }
    };

    if (canManageAssets) {
      loadAssetMovements();
    }
  }, [profile?.role, sites, canManageAssets]);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6 space-y-6">
        <Header sitesCount={sites.length} />
        <SummaryCards summary={companySummary} />

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
          {canManageAssets && (
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
          {canManageAssets && (
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
          <Route path="*" element={<NotFound />} />
        </Routes>
      </div>
      <Toaster />
    </div>
  );
};

export default Index;
