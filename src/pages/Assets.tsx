
import { useEffect, useState } from "react";
import { useAuth } from "@/auth/AuthProvider";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { AddAssetForm } from "@/components/assets/asset-form";
import { getAssets, Asset } from "@/lib/firebase/firestore";

const statusVariant = {
  'Active': 'success',
  'In Repair': 'warning',
  'Retired': 'destructive',
} as const;

export default function Assets() {
  const { role } = useAuth();
  const canAddAssets = role === 'admin' || role === 'maintenance_manager';
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAssets = async () => {
    try {
      setLoading(true);
      const assetsData = await getAssets();
      setAssets(assetsData);
      setError(null);
    } catch (err) {
      setError("Failed to fetch assets. Please try again later.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssets();
  }, []);

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Asset Management</h2>
        {canAddAssets && <AddAssetForm onAssetAdded={fetchAssets} />}
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Asset Inventory</CardTitle>
          <CardDescription>A list of all assets across all sites.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading && <p>Loading assets...</p>}
          {error && <p className="text-destructive">{error}</p>}
          {!loading && !error && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Serial Number</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Current Site</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {assets.map((asset) => (
                  <TableRow key={asset.id}>
                    <TableCell className="font-medium">{asset.serialNumber}</TableCell>
                    <TableCell>{asset.type}</TableCell>
                    <TableCell>{asset.site}</TableCell>
                    <TableCell>
                      <Badge variant={statusVariant[asset.status as keyof typeof statusVariant] || 'default'}>
                        {asset.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
