import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { AssetType, AssetStatus } from "@/types/database";
import { Plus, Package } from "lucide-react";

interface Site {
  id: string;
  site_id: string;
  location: string;
}

interface AssetFormProps {
  onAssetCreated?: () => void;
}

const assetTypeLabels = {
  generator: "Generator",
  solar_panel: "Solar Panel",
  battery: "Battery",
  aps_board: "APS Board",
  router: "Router",
  rectifier: "Rectifier",
  electronic_lock: "Electronic Lock",
};

const statusLabels = {
  active: "Active",
  in_repair: "In Repair",
  retired: "Retired",
};

export function AssetForm({ onAssetCreated }: AssetFormProps) {
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    serial_number: "",
    asset_type: "" as AssetType | "",
    purchase_date: "",
    installation_date: "",
    status: "active" as AssetStatus,
    current_site_id: "",
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchSites();
  }, []);

  const fetchSites = async () => {
    try {
      const { data, error } = await supabase
        .from('sites')
        .select('id, site_id, location')
        .order('site_id');

      if (error) throw error;
      setSites(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to fetch sites",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.serial_number || !formData.asset_type) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('assets')
        .insert({
          serial_number: formData.serial_number,
          asset_type: formData.asset_type as AssetType,
          purchase_date: formData.purchase_date || null,
          installation_date: formData.installation_date || null,
          status: formData.status,
          current_site_id: formData.current_site_id || null,
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Asset created successfully",
      });

      setFormData({
        serial_number: "",
        asset_type: "",
        purchase_date: "",
        installation_date: "",
        status: "active",
        current_site_id: "",
      });

      onAssetCreated?.();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create asset",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="bg-gradient-to-r from-background/50 to-primary/5 border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5 text-primary" />
          Add New Asset
        </CardTitle>
        <CardDescription>
          Create a new asset record in the system
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="serial_number">Serial Number *</Label>
              <Input
                id="serial_number"
                placeholder="Enter serial number"
                value={formData.serial_number}
                onChange={(e) => setFormData({ ...formData, serial_number: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="asset_type">Asset Type *</Label>
              <Select
                value={formData.asset_type}
                onValueChange={(value: AssetType) => setFormData({ ...formData, asset_type: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select asset type" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(assetTypeLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="purchase_date">Purchase Date</Label>
              <Input
                id="purchase_date"
                type="date"
                value={formData.purchase_date}
                onChange={(e) => setFormData({ ...formData, purchase_date: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="installation_date">Installation Date</Label>
              <Input
                id="installation_date"
                type="date"
                value={formData.installation_date}
                onChange={(e) => setFormData({ ...formData, installation_date: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value: AssetStatus) => setFormData({ ...formData, status: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(statusLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="current_site_id">Current Site</Label>
              <Select
                value={formData.current_site_id}
                onValueChange={(value) => setFormData({ ...formData, current_site_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select site (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No site assigned</SelectItem>
                  {sites.map((site) => (
                    <SelectItem key={site.id} value={site.id}>
                      {site.site_id} - {site.location}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button type="submit" disabled={loading} className="w-full">
            <Plus className="h-4 w-4 mr-2" />
            {loading ? "Creating..." : "Create Asset"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}