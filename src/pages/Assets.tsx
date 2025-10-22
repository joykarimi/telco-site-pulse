
import { useCallback, useMemo, useState } from "react";
import { useAuth } from "@/auth/AuthProvider";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { AddAssetForm } from "@/components/assets/asset-form";
import { getAssets, Asset, deleteAsset, getSiteDefinitions, SiteDefinition, deleteAllAssets } from "@/lib/firebase/firestore";
import { EditAssetForm } from "@/components/assets/edit-asset-form";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Trash2, Search } from "lucide-react";
import { AddAssetToSiteForm } from "@/components/assets/add-asset-to-site-form";
import { useDataFetching } from "@/hooks/use-data-fetching";
import { PERMISSIONS } from "@/lib/roles"; // Import PERMISSIONS

const statusVariant = {
  'Active': 'success',
  'Inactive': 'destructive',
} as const;

export default function Assets() {
  const { hasPermission } = useAuth(); // Use hasPermission instead of role
  const canManageAssets = hasPermission(PERMISSIONS.ASSET_CREATE) || hasPermission(PERMISSIONS.ASSET_UPDATE) || hasPermission(PERMISSIONS.ASSET_DELETE);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchPageData = useCallback(async () => {
    try {
      const [assets, sites] = await Promise.all([
        getAssets(),
        getSiteDefinitions()
      ]);
      return { assets, sites };
    } catch (err) {
      console.error("Error in fetchPageData:", err); // Catch and log errors
      throw err; // Re-throw to be caught by useDataFetching
    }
  }, []);

  const { data, loading, error, refetch } = useDataFetching(fetchPageData);

  const assets = data?.assets || [];
  const sites = data?.sites || [];

  const handleDeleteAllAssets = useCallback(async () => {
    if (window.confirm("Are you sure you want to delete all assets? This action cannot be undone.")) {
        try {
            await deleteAllAssets();
            refetch();
        } catch (err) {
            console.error("Error deleting all assets: ", err);
            // You could show a toast notification here
        }
    }
  }, [refetch]);

  const handleDelete = useCallback(async (assetId: string) => {
    try {
        await deleteAsset(assetId);
        refetch(); // Refresh the list after deletion
    } catch (err) {
        console.error("Error deleting asset: ", err);
        // Optionally, show an error message to the user
    }
  }, [refetch]);

  const filteredAssets = useMemo(() => {
    return assets.filter(asset => {
        const searchTermLower = searchTerm.toLowerCase();
        return (
            (asset.serialNumber?.toLowerCase() || '').includes(searchTermLower) ||
            (asset.type?.toLowerCase() || '').includes(searchTermLower) ||
            (asset.status?.toLowerCase() || '').includes(searchTermLower) ||
            (asset.site?.toLowerCase() || '').includes(searchTermLower)
        );
    });
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
    const siteNames = new Set(sites.map(s => s.name || 'Unassigned')); // Ensure site.name is not null/undefined
    const assetSiteNames = new Set(filteredAssets.map(a => a.site || 'Unassigned')); // Ensure asset.site is not null/undefined
    const allSiteNames = Array.from(new Set([...siteNames, ...assetSiteNames]));

    if (searchTerm) {
        return allSiteNames.filter(siteName => 
            siteName.toLowerCase().includes(searchTerm.toLowerCase()) || (assetsBySite[siteName] && assetsBySite[siteName].length > 0)
        );
    }
    return allSiteNames;

  }, [sites, filteredAssets, searchTerm, assetsBySite]);

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <h2 className="text-3xl font-bold tracking-tight">Asset Management</h2>
            <div className="flex flex-col sm:flex-row items-center gap-2">
                {canManageAssets && <AddAssetForm onAssetAdded={refetch} sites={sites} />}
                {canManageAssets && <Button variant="destructive" onClick={handleDeleteAllAssets}>Delete All Assets</Button>}
            </div>
        </div>

        <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
                type="search"
                placeholder="Search by serial no, type, status, or site..."
                className="pl-8 w-full max-w-sm bg-background"
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
                            <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                <CardTitle>{siteName}</CardTitle>
                                {canManageAssets && site && <AddAssetToSiteForm site={site} onAssetAdded={refetch} />}
                            </CardHeader>
                            <CardContent>
                            {siteAssets.length > 0 ? (
                                <div className="relative w-full overflow-auto">
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
                                                <TableCell className="font-medium">{asset.serialNumber || 'N/A'}</TableCell>
                                                <TableCell>{asset.type || 'N/A'}</TableCell>
                                                <TableCell>
                                                <Badge variant={asset.status && statusVariant[asset.status as keyof typeof statusVariant] ? statusVariant[asset.status as keyof typeof statusVariant] : 'default'}>
                                                    {asset.status || 'Unknown'}
                                                </Badge>
                                                </TableCell>
                                                {canManageAssets && (
                                                    <TableCell className="text-right">
                                                        <div className="flex justify-end items-center">
                                                            <EditAssetForm asset={asset} onAssetUpdated={refetch} sites={sites} />
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
                                </div>
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
