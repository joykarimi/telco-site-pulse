
import { useEffect, useState } from "react";
import { useAuth } from "@/auth/AuthProvider";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { NewMovementRequestForm } from "@/components/assets/asset-movement-requests";
import { getAssetMovements, updateAssetMovementStatus, AssetMovement } from "@/lib/firebase/firestore";

const statusVariant = {
  'Pending': 'default',
  'Approved': 'success',
  'Rejected': 'destructive',
} as const;

export default function AssetMovements() {
  const { role } = useAuth();
  const canApprove = role === 'admin' || role === 'operations_manager' || role === 'maintenance_manager';
  const [movements, setMovements] = useState<AssetMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMovements = async () => {
    try {
      setLoading(true);
      const movementsData = await getAssetMovements();
      setMovements(movementsData);
      setError(null);
    } catch (err) {
      setError("Failed to fetch movement requests. Please try again later.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMovements();
  }, []);

  const handleUpdateStatus = async (id: string, status: 'Approved' | 'Rejected') => {
    try {
        await updateAssetMovementStatus(id, status);
        fetchMovements(); // Re-fetch to update the UI
    } catch (err) {
        alert(`Failed to ${status.toLowerCase()} request. Please try again.`);
        console.error(err);
    }
  };

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Asset Movements</h2>
        <NewMovementRequestForm onMovementRequested={fetchMovements} />
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Movement Requests</CardTitle>
          <CardDescription>Track the status of all asset transfer requests.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading && <p>Loading requests...</p>}
          {error && <p className="text-destructive">{error}</p>}
          {!loading && !error && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Asset ID</TableHead>
                  <TableHead>From</TableHead>
                  <TableHead>To</TableHead>
                  <TableHead>Status</TableHead>
                  {canApprove && <TableHead className="text-right">Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {movements.map((move) => (
                  <TableRow key={move.id}>
                    <TableCell className="font-medium">{move.assetId}</TableCell>
                    <TableCell>{move.fromSite}</TableCell>
                    <TableCell>{move.toSite}</TableCell>
                    <TableCell>
                      <Badge variant={statusVariant[move.status] || 'default'}>
                        {move.status}
                      </Badge>
                    </TableCell>
                    {canApprove && (
                      <TableCell className="text-right">
                        {move.status === 'Pending' && (
                          <div className="space-x-2">
                            <Button variant="outline" size="sm" onClick={() => handleUpdateStatus(move.id, 'Rejected')}>Reject</Button>
                            <Button size="sm" onClick={() => handleUpdateStatus(move.id, 'Approved')}>Approve</Button>
                          </div>
                        )}
                      </TableCell>
                    )}
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
