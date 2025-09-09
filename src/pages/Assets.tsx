
import { useEffect, useState, useMemo } from "react";
import { useAuth } from "@/auth/AuthProvider";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { AddAssetForm } from "@/components/assets/asset-form";
import { getAssets, Asset, deleteAsset, getSites, Site } from "@/lib/firebase/firestore";
import { EditAssetForm } from "@/components/assets/edit-asset-form";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Trash2, Search } from "lucide-react";
import { AddAssetToSiteForm } from "@/components/assets/add-asset-to-site-form";

const statusVariant = {
  'Active': 'success',
  'In Repair': 'warning',
  'Retired': 'destructive',
} as const;

export default function Assets() {
  const { role } = useAuth();
  const canManageAssets = role === 'admin' || role === 'maintenance_manager';
  const [assets, setAssets] = useState<Asset[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchData = async () => {
    try {
      setLoading(true);
      const [assetsData, sitesData] = await Promise.all([getAssets(), getSites()]);
      setAssets(assetsData);
      setSites(sitesData);
      setError(null);
    } catch (err) {
      setError("Failed to fetch data. Please try again later.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (assetId: string) => {
    try {
        await deleteAsset(assetId);
        fetchData(); // Refresh the list after deletion
    } catch (err) {
        console.error("Error deleting asset: ", err);
        // Optionally, show an error message to the user
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredAssets = useMemo(() => {
    return assets.filter(asset => 
        asset.serialNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        asset.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
        asset.status.toLowerCase().includes(searchTerm.toLowerCase()) ||
        asset.site.toLowerCase().includes(searchTerm.toLowerCase())
    );
    }, [assets, searchTerm]);


  const assetsBySite = useMemo(() => {
    return filteredAssets.reduce((acc, asset) => {
      const siteName = asset.site || 'Unassigned';
      if (!acc[siteName]) {
        acc[siteName] = [];
      }
      acc[siteName].push(asset);
      return acc;
    }, {} as Record<string, Asset[]>);
  }, [filteredAssets]);

  const allSites = useMemo(() => {
    const siteNames = new Set(sites.map(s => s.name));
    const assetSiteNames = new Set(filteredAssets.map(a => a.site));
    const allSiteNames = Array.from(new Set([...siteNames, ...assetSiteNames]));

    if (searchTerm) {
        return allSiteNames.filter(siteName => 
            siteName.toLowerCase().includes(searchTerm.toLowerCase()) || assetsBySite[siteName]
        );
    }
    return allSiteNames;

  }, [sites, filteredAssets, searchTerm, assetsBySite]);

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
            <h2 className="text-3xl font-bold tracking-tight">Asset Management</h2>
            <div className="flex items-center space-x-2">
                {canManageAssets && <AddAssetForm onAssetAdded={fetchData} sites={sites} />}
            </div>
        </div>

        <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
                type="search"
                placeholder="Search by serial no, type, status, or site..."
                className="pl-8 sm:w-[300px] md:w-[200px] lg:w-[300px] bg-background"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />
        </div>

        {loading && <p>Loading assets...</p>}
        {error && <p className="text-destructive">{error}</p>}
        {!loading && !error && (
            <div className="space-y-6">
            {allSites.length > 0 ? (
                allSites.map(siteName => {
                    const site = sites.find(s => s.name === siteName);
                    const siteAssets = assetsBySite[siteName] || [];

                    if (searchTerm && siteAssets.length === 0 && !siteName.toLowerCase().includes(searchTerm.toLowerCase())) {
                        return null;
                    }

                    return (
                        <Card key={siteName}>
                            <CardHeader className="flex flex-row items-center justify-between">
                                <CardTitle>{siteName}</CardTitle>
                                {canManageAssets && site && <AddAssetToSiteForm site={site} onAssetAdded={fetchData} />}
                            </CardHeader>
                            <CardContent>
                            {siteAssets.length > 0 ? (
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Serial Number</TableHead>
                                                <TableHead>Type</TableHead>
                                                <TableHead>Status</TableHead>
                                                {canManageAssets && <TableHead className="text-right">Actions</TableHead>}
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {siteAssets.map((asset) => (
                                            <TableRow key={asset.id}>
                                                <TableCell className="font-medium">{asset.serialNumber}</TableCell>
                                                <TableCell>{asset.type}</TableCell>
                                                <TableCell>
                                                <Badge variant={statusVariant[asset.status as keyof typeof statusVariant] || 'default'}>
                                                    {asset.status}
                                                </Badge>
                                                </TableCell>
                                                {canManageAssets && (
                                                    <TableCell className="text-right">
                                                        <div className="flex justify-end items-center">
                                                            <EditAssetForm asset={asset} onAssetUpdated={fetchData} sites={sites} />
                                                            <AlertDialog>
                                                                <AlertDialogTrigger asChild>
                                                                    <Button variant="ghost" size="icon">
                                                                        <Trash2 className="h-4 w-4" />
                                                                    </Button>
                                                                </AlertDialogTrigger>
                                                                <AlertDialogContent>
                                                                    <AlertDialogHeader>
                                                                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                                                        <AlertDialogDescription>
                                                                            This action cannot be undone. This will permanently delete the asset
                                                                            and remove its data from our servers.
                                                                        </AlertDialogDescription>
                                                                    </AlertDialogHeader>
                                                                    <AlertDialogFooter>
                                                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                                        <AlertDialogAction onClick={() => handleDelete(asset.id)}>Delete</AlertDialogAction>
                                                                    </AlertDialogFooter>
                                                                </AlertDialogContent>
                                                            </AlertDialog>
                                                        </div>
                                                    </TableCell>
                                                )}
                                            </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                ) : (
                                    <p>No assets found for this site.</p>
                                )}
                            </CardContent>
                        </Card>
                    )
                })
            ) : (
                <Card>
                    <CardContent className="pt-6">
                        <p>No matching assets found.</p>
                    </CardContent>
                </Card>
            )}
            </div>
        )}
    </div>
  );
}
