
import { useEffect, useState } from "react";
import { useAuth } from "@/auth/AuthProvider";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { NewMovementRequestForm } from "@/components/assets/asset-movement-requests";
import { getAssetMovements, updateAssetMovementStatus, deleteAssetMovement, AssetMovement } from "@/lib/firebase/firestore";
import { EditAssetMovementForm } from "@/components/asset-movements/edit-asset-movement-form";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Trash2 } from "lucide-react";

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

  const handleDelete = async (movementId: string) => {
    try {
        await deleteAssetMovement(movementId);
        fetchMovements();
    } catch (err) {
        console.error("Error deleting asset movement: ", err);
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
                  <TableHead>Asset Serial</TableHead>
                  <TableHead>From</TableHead>
                  <TableHead>To</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {movements.map((move) => (
                  <TableRow key={move.id}>
                    <TableCell className="font-medium">{move.assetId}</TableCell>
                    <TableCell>{move.fromSite}</TableCell>
                    <TableCell>{move.toSite}</TableCell>
                    <TableCell>{move.reason}</TableCell>
                    <TableCell>
                      <Badge variant={statusVariant[move.status] || 'default'}>
                        {move.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                        <div className="flex justify-end items-center">
                            {canApprove && move.status === 'Pending' && (
                              <div className="space-x-2">
                                <Button variant="destructive" size="sm" onClick={() => handleUpdateStatus(move.id, 'Rejected')}>Reject</Button>
                                <Button size="sm" className="bg-green-500 hover:bg-green-600" onClick={() => handleUpdateStatus(move.id, 'Approved')}>Approve</Button>
                              </div>
                            )}
                            <EditAssetMovementForm movement={move} onMovementUpdated={fetchMovements} />
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
                                            This action cannot be undone. This will permanently delete the asset movement request.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction onClick={() => handleDelete(move.id)}>Delete</AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </div>
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
