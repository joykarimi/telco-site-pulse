import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SummaryCards } from "@/components/dashboard/summary-cards";
import { SitesTable } from "@/components/dashboard/sites-table";
import { SiteForm } from "@/components/dashboard/site-form";
import { Site } from "@/types/site";
import { calculateCompanySummary } from "@/lib/calculations";
import { Building2, FileText, Settings } from "lucide-react";

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
      airtelIncome: 35000,
      gridConsumption: 0,
      fuelConsumption: 350,
      solarContribution: 100,
      gridCostPerKwh: 0,
      fuelCostPerLiter: 160.00,
      solarMaintenanceCost: 6000,
    },
  ]);

  const handleAddSite = (newSite: Site) => {
    setSites([...sites, newSite]);
  };

  const companySummary = calculateCompanySummary(sites);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              Telecom P&L Dashboard
            </h1>
            <p className="text-muted-foreground mt-1">
              Monitor profit & loss across all telecommunication sites
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Building2 className="h-4 w-4" />
            {sites.length} Sites Active
          </div>
        </div>

        {/* Summary Cards */}
        <SummaryCards summary={companySummary} />

        {/* Main Content */}
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="sites" className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Sites Management
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

          <TabsContent value="add-site">
            <SiteForm onAddSite={handleAddSite} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Index;
