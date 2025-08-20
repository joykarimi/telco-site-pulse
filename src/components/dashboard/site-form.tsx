import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Site, SiteType } from "@/types/site";
import { Plus } from "lucide-react";

interface SiteFormProps {
  onAddSite: (site: Site) => void;
}

const siteTypes: { value: SiteType; label: string }[] = [
  { value: 'grid-only', label: 'Grid Only' },
  { value: 'grid-generator', label: 'Grid + Generator' },
  { value: 'grid-generator-solar', label: 'Grid + Generator + Solar' },
  { value: 'generator-only', label: 'Generator Only' },
  { value: 'generator-solar', label: 'Generator + Solar' },
  { value: 'grid-solar', label: 'Grid + Solar' },
];

export function SiteForm({ onAddSite }: SiteFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    type: '' as SiteType,
    safaricomIncome: '',
    airtelIncome: '',
    gridConsumption: '',
    fuelConsumption: '',
    solarContribution: '',
    gridCostPerKwh: '',
    fuelCostPerLiter: '',
    solarMaintenanceCost: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const site: Site = {
      id: Date.now().toString(),
      name: formData.name,
      type: formData.type,
      safaricomIncome: parseFloat(formData.safaricomIncome) || 0,
      airtelIncome: parseFloat(formData.airtelIncome) || 0,
      gridConsumption: parseFloat(formData.gridConsumption) || 0,
      fuelConsumption: parseFloat(formData.fuelConsumption) || 0,
      solarContribution: parseFloat(formData.solarContribution) || 0,
      gridCostPerKwh: parseFloat(formData.gridCostPerKwh) || 0,
      fuelCostPerLiter: parseFloat(formData.fuelCostPerLiter) || 0,
      solarMaintenanceCost: parseFloat(formData.solarMaintenanceCost) || 0,
    };

    onAddSite(site);
    
    // Reset form
    setFormData({
      name: '',
      type: '' as SiteType,
      safaricomIncome: '',
      airtelIncome: '',
      gridConsumption: '',
      fuelConsumption: '',
      solarContribution: '',
      gridCostPerKwh: '',
      fuelCostPerLiter: '',
      solarMaintenanceCost: '',
    });
  };

  const hasSolar = formData.type.includes('solar');
  const hasGrid = formData.type.includes('grid');
  const hasGenerator = formData.type.includes('generator');

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Plus className="h-5 w-5" />
          Add New Site
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Site Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Site-001"
                required
              />
            </div>
            
            <div>
              <Label htmlFor="type">Site Type</Label>
              <Select value={formData.type} onValueChange={(value: SiteType) => setFormData({ ...formData, type: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select site type" />
                </SelectTrigger>
                <SelectContent>
                  {siteTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="safaricom">Safaricom Income (KES/month)</Label>
              <Input
                id="safaricom"
                type="number"
                value={formData.safaricomIncome}
                onChange={(e) => setFormData({ ...formData, safaricomIncome: e.target.value })}
                placeholder="50000"
              />
            </div>
            
            <div>
              <Label htmlFor="airtel">Airtel Income (KES/month)</Label>
              <Input
                id="airtel"
                type="number"
                value={formData.airtelIncome}
                onChange={(e) => setFormData({ ...formData, airtelIncome: e.target.value })}
                placeholder="30000"
              />
            </div>
          </div>

          {hasGrid && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="gridConsumption">Grid Consumption (KWh/month)</Label>
                <Input
                  id="gridConsumption"
                  type="number"
                  value={formData.gridConsumption}
                  onChange={(e) => setFormData({ ...formData, gridConsumption: e.target.value })}
                  placeholder="1000"
                />
              </div>
              
              <div>
                <Label htmlFor="gridCost">Grid Cost per KWh (KES)</Label>
                <Input
                  id="gridCost"
                  type="number"
                  step="0.01"
                  value={formData.gridCostPerKwh}
                  onChange={(e) => setFormData({ ...formData, gridCostPerKwh: e.target.value })}
                  placeholder="25.50"
                />
              </div>
            </div>
          )}

          {hasGenerator && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="fuelConsumption">Fuel Consumption (L/month)</Label>
                <Input
                  id="fuelConsumption"
                  type="number"
                  value={formData.fuelConsumption}
                  onChange={(e) => setFormData({ ...formData, fuelConsumption: e.target.value })}
                  placeholder="500"
                />
              </div>
              
              <div>
                <Label htmlFor="fuelCost">Fuel Cost per Liter (KES)</Label>
                <Input
                  id="fuelCost"
                  type="number"
                  step="0.01"
                  value={formData.fuelCostPerLiter}
                  onChange={(e) => setFormData({ ...formData, fuelCostPerLiter: e.target.value })}
                  placeholder="150.00"
                />
              </div>
            </div>
          )}

          {hasSolar && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="solarContribution">Solar Contribution (KWh/month)</Label>
                <Input
                  id="solarContribution"
                  type="number"
                  value={formData.solarContribution}
                  onChange={(e) => setFormData({ ...formData, solarContribution: e.target.value })}
                  placeholder="200"
                />
              </div>
              
              <div>
                <Label htmlFor="solarMaintenance">Solar Maintenance (KES/month)</Label>
                <Input
                  id="solarMaintenance"
                  type="number"
                  value={formData.solarMaintenanceCost}
                  onChange={(e) => setFormData({ ...formData, solarMaintenanceCost: e.target.value })}
                  placeholder="5000"
                />
              </div>
            </div>
          )}

          <Button type="submit" className="w-full">
            Add Site
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}