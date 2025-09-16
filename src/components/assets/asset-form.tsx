
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { addAsset, isSerialNumberUnique, SiteDefinition } from '@/lib/firebase/firestore';
import { assetTypes } from '@/lib/asset-types';
import { SearchableSelect } from "@/components/ui/searchable-select"; // Import the new component

const assetStatus = ["Active", "In Repair", "Retired"];

interface AddAssetFormProps {
    onAssetAdded: () => void;
    sites: SiteDefinition[];
}

export function AddAssetForm({ onAssetAdded, sites }: AddAssetFormProps) {
  const [serialNumber, setSerialNumber] = useState('');
  const [assetType, setAssetType] = useState('');
  const [purchaseDate, setPurchaseDate] = useState<Date | undefined>();
  const [installationDate, setInstallationDate] = useState<Date | undefined>();
  const [status, setStatus] = useState('');
  const [site, setSite] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  const siteOptions = sites.filter(s => s.name !== 'Unassigned').map(s => ({ value: s.name, label: s.name }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!serialNumber) {
        setError("Serial number is required.");
        return;
    }

    if (!site) {
        setError("Please select a site.");
        return;
    }

    setLoading(true);

    try {
        const isUnique = await isSerialNumberUnique(serialNumber);
        if (!isUnique) {
            setError("Serial number already exists. Please use a unique serial number.");
            setLoading(false);
            return;
        }

        await addAsset({
            serialNumber,
            type: assetType,
            purchaseDate,
            installationDate,
            status,
            site,
        });
        onAssetAdded();
        setOpen(false);
        // Reset form fields
        setSerialNumber('');
        setAssetType('');
        setPurchaseDate(undefined);
        setInstallationDate(undefined);
        setStatus('');
        setSite('');

    } catch (err) {
        setError("Failed to add asset. Please try again.");
        console.error(err);
    } finally {
        setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          Add Asset
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add a New Asset</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <p className="text-destructive">{error}</p>}
          <Input placeholder="Serial Number" value={serialNumber} onChange={(e) => setSerialNumber(e.target.value)} required />
          <Select onValueChange={setAssetType} value={assetType} required>
            <SelectTrigger><SelectValue placeholder="Asset Type" /></SelectTrigger>
            <SelectContent>
              {assetTypes.map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}
            </SelectContent>
          </Select>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !purchaseDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {purchaseDate ? format(purchaseDate, "PPP") : <span>Purchase Date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar mode="single" selected={purchaseDate} onSelect={setPurchaseDate} />
            </PopoverContent>
          </Popover>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !installationDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {installationDate ? format(installationDate, "PPP") : <span>Installation Date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar mode="single" selected={installationDate} onSelect={setInstallationDate} />
            </PopoverContent>
          </Popover>
          <Select onValueChange={setStatus} value={status} required>
            <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              {assetStatus.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
          <SearchableSelect 
            options={siteOptions} 
            value={site} 
            onChange={setSite} 
            placeholder="Select a site"
          />
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Adding Asset...' : 'Add Asset'}
            </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
