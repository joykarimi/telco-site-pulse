
import { useEffect, useState } from "react";
import { useAuth } from "@/auth/AuthProvider";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { NewMovementRequestForm } from "@/components/assets/asset-movement-requests";
import { getAssetMovements, AssetMovement, getAsset, getUserByRole } from "@/lib/firebase/firestore";
import { EditAssetMovementForm } from "@/components/asset-movements/edit-asset-movement-form";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Trash2 } from "lucide-react";
import { useNotifications } from "@/context/NotificationContext";
import { getFunctions, httpsCallable } from 'firebase/functions';

const statusVariant = {
  'Pending': 'default',
  'Approved': 'success',
  'Rejected': 'destructive',
} as const;

export default function AssetMovements() {
  const { user, role } = useAuth();
  const { addNotification, refreshNotifications } = useNotifications();
  const canApprove = role === 'admin' || role === 'operations_manager';
  const canDelete = role === 'admin';
  const [movements, setMovements] = useState<AssetMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const functions = getFunctions();

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

  const handleNewMovementRequested = async () => {
    await fetchMovements();
    // Notify Admins and Operations Managers of a new request
    const adminUsers = await getUserByRole('admin');
    const opsManagers = await getUserByRole('operations_manager');
    const relevantUsers = [...adminUsers, ...opsManagers];

    relevantUsers.forEach(async (u) => {
        const latestMovement = (await getAssetMovements()).sort((a,b) => (b.id > a.id ? 1 : -1))[0]; // Get the very last added movement
        if (latestMovement) {
          const asset = await getAsset(latestMovement.assetId);
          addNotification(
              `New asset movement request for ${asset?.serialNumber || latestMovement.assetId} from ${latestMovement.fromSite} to ${latestMovement.toSite}.`,
              'info',
              `/asset-movement-requests/${latestMovement.id}`,
              u.uid
          );
        }
    });
    refreshNotifications();
  };

  const handleUpdateStatus = async (movement: AssetMovement, status: 'Approved' | 'Rejected') => {
    const updateStatus = httpsCallable(functions, 'updateMovementStatus');
    try {
      await updateStatus({ movementId: movement.id, status });
      fetchMovements(); // Re-fetch to update the UI

      // Notify the requester about the status update
      const asset = await getAsset(movement.assetId);
      addNotification(
          `Your asset movement request for ${asset?.serialNumber || movement.assetId} to ${movement.toSite} has been ${status.toLowerCase()}.`,
          status === 'Approved' ? 'success' : 'error',
          `/asset-movement-requests/${movement.id}`,
          movement.requestedBy
      );
      refreshNotifications();
    } catch (err) {
        alert(`Failed to ${status.toLowerCase()} request. Please try again.`);
        console.error("Error calling updateMovementStatus: ", err);
    }
  };

  const handleDelete = async (movement: AssetMovement) => {
    const deleteMovement = httpsCallable(functions, 'deleteMovementRequest');
    try {
      await deleteMovement({ movementId: movement.id });
      fetchMovements();

      // Notify the requester that their request was deleted
      const asset = await getAsset(movement.assetId);
      addNotification(
          `Your asset movement request for ${asset?.serialNumber || movement.assetId} from ${movement.fromSite} to ${movement.toSite} was deleted by an administrator.`,
          'error', // Use 'error' or 'info' as appropriate
          undefined,      // No specific link is needed for a deleted item
          movement.requestedBy // Target the user who made the request
      );

      refreshNotifications();
    } catch (err) {
      console.error("Error deleting asset movement: ", err);
      alert("Failed to delete the request. Please try again."); // Inform user of failure
    }
  };

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Asset Movements</h2>
        <NewMovementRequestForm onMovementRequested={handleNewMovementRequested} />
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
                                <Button variant="destructive" size="sm" onClick={() => handleUpdateStatus(move, 'Rejected')}>Reject</Button>
                                <Button size="sm" className="bg-green-500 hover:bg-green-600" onClick={() => handleUpdateStatus(move, 'Approved')}>Approve</Button>
                              </div>
                            )}
                            <EditAssetMovementForm movement={move} onMovementUpdated={fetchMovements} />
                            {canDelete && (
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
                                        <AlertDialogAction onClick={() => handleDelete(move)}>Delete</AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                            )}
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
