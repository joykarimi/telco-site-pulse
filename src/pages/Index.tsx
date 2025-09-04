import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SummaryCards } from "@/components/dashboard/summary-cards";
import { RevenueBreakdown } from "@/components/dashboard/revenue-breakdown";
import { AssetsDashboard } from "@/components/dashboard/assets-dashboard";
import { AssetMovementRequests } from "@/components/assets/asset-movement-requests";
import { AssetForm } from "@/components/assets/asset-form";
import { UserManagement } from "@/components/admin/user-management";
import { SitesTable } from "@/components/dashboard/sites-table";
import { SiteForm } from "@/components/dashboard/site-form";
import { Header } from "@/components/layout/header";
import { Site } from "@/types/site";
import { AssetMovementTable } from "@/components/assets/asset-movement-table";
import { calculateCompanySummary } from "@/lib/calculations";
import { useAuth } from "@/hooks/use-auth.tsx";
import { db } from "@/integrations/firebase/client";
import { collection, getDocs, addDoc, query, orderBy, Timestamp, doc, getDoc, serverTimestamp } from 'firebase/firestore';
import { useToast } from "@/hooks/use-toast";
import { Toaster } from "@/components/ui/toaster";

// Type definitions
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
  asset?: { name: string; serial_number: string };
  from_site?: { name: string };
  to_site?: { name: string };
};

const Index = () => {
  const [sites, setSites] = useState<Site[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [assetMovements, setAssetMovements] = useState<AssetMovement[]>([]);
  const { user, profile, loading } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    // Mock sites data for initial load, replace with Firebase data fetching
    setSites([
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
    ]);
  }, []);

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

    if (profile) {
      loadAssets();
    }
  }, [profile]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user || !profile) {
    return null;
  }

  const isAdmin = profile.role === 'admin';
  const isManager = profile.role === 'maintenance_manager' || profile.role === 'operations_manager';
  const companySummary = calculateCompanySummary(sites);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-primary/5">
      <Header sitesCount={sites.length} />
      <main className="container mx-auto px-4 py-8 space-y-8">
        <div className="space-y-1">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            Telecom P&L Dashboard
          </h1>
          <p className="text-muted-foreground">
            Welcome back, {profile.full_name} ({profile.role.replace('_', ' ')})
          </p>
        </div>

        <SummaryCards summary={companySummary} />
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <RevenueBreakdown sites={sites} />
          <AssetsDashboard assets={assets} sites={sites} />
        </div>

        {isAdmin && <UserManagement />}

        {(isAdmin || isManager) && <AssetForm sites={sites} onAddAsset={handleAddAsset} />}

        <AssetMovementRequests />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <SitesTable sites={sites} />
          {(isAdmin || isManager) && <SiteForm onAddSite={handleAddSite} />}
        </div>
      </main>
      <Toaster />
    </div>
  );
};

export default Index;