import { useAuth } from "@/hooks/use-auth";
import { Header } from "@/components/layout/header";
import { SummaryCards } from "@/components/dashboard/summary-cards";
import { RevenueBreakdown } from "@/components/dashboard/revenue-breakdown";
import { AssetsDashboard } from "@/components/dashboard/assets-dashboard";
import { AssetMovementRequests } from "@/components/assets/asset-movement-requests";
import { AssetForm } from "@/components/assets/asset-form";
import { UserManagement } from "@/components/admin/user-management";
import { SitesTable } from "@/components/dashboard/sites-table";
import { SiteForm } from "@/components/dashboard/site-form";

const Index = () => {
  const { user, profile, loading } = useAuth();
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

  const sites = [];
  const assets = [];
  const summary = { 
    totalRevenue: 0, 
    totalExpense: 0, 
    netProfitLoss: 0, 
    profitMargin: 0,
    totalSites: 0,
    profitableSites: 0,
    lossMakingSites: 0
  };

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

        <SummaryCards summary={summary} />
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <RevenueBreakdown sites={sites} />
          <AssetsDashboard assets={assets} sites={sites} />
        </div>

        {/* Admin-only user management */}
        {isAdmin && <UserManagement />}

        {/* Asset form for adding new assets */}
        {(isAdmin || isManager) && <AssetForm />}

        <AssetMovementRequests />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <SitesTable sites={sites} />
          {(isAdmin || isManager) && <SiteForm onAddSite={() => {}} />}
        </div>
      </main>
    </div>
  );
};

export default Index;
