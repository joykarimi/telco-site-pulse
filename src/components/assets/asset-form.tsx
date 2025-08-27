import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Plus } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Asset, AssetType, AssetStatus } from '@/types/database';
import { Site } from '@/types/site';

interface AssetFormProps {
  sites: Site[];
  onAddAsset: (asset: Omit<Asset, 'id' | 'created_at' | 'updated_at'>) => void;
}

export function AssetForm({ sites, onAddAsset }: AssetFormProps) {
  const [formData, setFormData] = useState({
    serial_number: '',
    asset_type: '' as AssetType,
    purchase_date: undefined as Date | undefined,
    installation_date: undefined as Date | undefined,
    status: 'active' as AssetStatus,
    current_site_id: '',
  });

  const assetTypes: { value: AssetType; label: string }[] = [
    { value: 'generator', label: 'Generator' },
    { value: 'solar_panel', label: 'Solar Panel' },
    { value: 'battery', label: 'Battery' },
    { value: 'aps_board', label: 'APS Board' },
    { value: 'router', label: 'Router' },
    { value: 'rectifier', label: 'Rectifier' },
    { value: 'electronic_lock', label: 'Electronic Lock' },
  ];

  const statusOptions: { value: AssetStatus; label: string }[] = [
    { value: 'active', label: 'Active' },
    { value: 'in_repair', label: 'In Repair' },
    { value: 'retired', label: 'Retired' },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.serial_number || !formData.asset_type) return;
    
    onAddAsset({
      serial_number: formData.serial_number,
      asset_type: formData.asset_type,
      purchase_date: formData.purchase_date?.toISOString().split('T')[0],
      installation_date: formData.installation_date?.toISOString().split('T')[0],
      status: formData.status,
      current_site_id: formData.current_site_id || undefined,
    });

    // Reset form
    setFormData({
      serial_number: '',
      asset_type: '' as AssetType,
      purchase_date: undefined,
      installation_date: undefined,
      status: 'active',
      current_site_id: '',
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Plus className="h-5 w-5" />
          Add New Asset
        </CardTitle>
        <CardDescription>
          Register a new asset in the system
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="serial_number">Serial Number</Label>
              <Input
                id="serial_number"
                placeholder="Enter serial number"
                value={formData.serial_number}
                onChange={(e) => setFormData(prev => ({ ...prev, serial_number: e.target.value }))}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="asset_type">Asset Type</Label>
              <Select 
                value={formData.asset_type} 
                onValueChange={(value: AssetType) => setFormData(prev => ({ ...prev, asset_type: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select asset type" />
                </SelectTrigger>
                <SelectContent>
                  {assetTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Purchase Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !formData.purchase_date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.purchase_date ? (
                      format(formData.purchase_date, "PPP")
                    ) : (
                      <span>Pick a date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={formData.purchase_date}
                    onSelect={(date) => setFormData(prev => ({ ...prev, purchase_date: date }))}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>Installation Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !formData.installation_date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.installation_date ? (
                      format(formData.installation_date, "PPP")
                    ) : (
                      <span>Pick a date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={formData.installation_date}
                    onSelect={(date) => setFormData(prev => ({ ...prev, installation_date: date }))}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select 
                value={formData.status} 
                onValueChange={(value: AssetStatus) => setFormData(prev => ({ ...prev, status: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((status) => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="current_site_id">Current Site</Label>
              <Select 
                value={formData.current_site_id} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, current_site_id: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select site (optional)" />
                </SelectTrigger>
                <SelectContent>
                  {sites.map((site) => (
                    <SelectItem key={site.id} value={site.id}>
                      {site.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button type="submit" className="w-full">
            <Plus className="mr-2 h-4 w-4" />
            Add Asset
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}