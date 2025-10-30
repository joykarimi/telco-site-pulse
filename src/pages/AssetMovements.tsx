
import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/auth/AuthProvider";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { NewMovementRequestForm } from "@/components/assets/asset-movement-requests";
import { getAssetMovements, AssetMovement, getAsset, getAssetMovement, getUserProfile } from "@/lib/firebase/firestore";
import { EditAssetMovementForm } from "@/components/asset-movements/edit-asset-movement-form";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Trash2, Download } from "lucide-react";
import { useNotifications } from "@/context/NotificationContext";
import { getFunctions, httpsCallable } from "firebase/functions";
import { utils, writeFile } from 'xlsx';
import { PERMISSIONS, ROLES } from "@/lib/roles";

const statusVariant = {
  'Pending': 'default',
  'Approved': 'success',
  'Rejected': 'destructive',
} as const;

const functions = getFunctions();
const deleteMovementRequest = httpsCallable(functions, 'deleteMovementRequest');
const updateMovementStatus = httpsCallable(functions, 'updateMovementStatus');

export default function AssetMovements() {
  const { user, hasPermission } = useAuth();
  const { addNotification } = useNotifications();
  const [movements, setMovements] = useState<AssetMovement[]>([]);
  const [approverNames, setApproverNames] = useState<Record<string, { approver1?: string, approver2?: string }>>({});
  const [assetSerialNumbers, setAssetSerialNumbers] = useState<Record<string, string>>({}); 
  const [requesterNames, setRequesterNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const canDelete = hasPermission(PERMISSIONS.MOVEMENT_DELETE) || user?.role === ROLES.ADMIN;
  const canDownloadMovements = hasPermission(PERMISSIONS.MOVEMENT_APPROVE) || user?.role === ROLES.ADMIN;

  const fetchMovements = async () => {
    try {
      setLoading(true);
      const movementsData = await getAssetMovements();
      setMovements(movementsData);

      const uniqueUserIds = new Set<string>();

      const approverNamePromises = movementsData.map(async (movement) => {
        if (movement.approver1) uniqueUserIds.add(movement.approver1);
        if (movement.approver2) uniqueUserIds.add(movement.approver2);
        if (movement.requestedBy) uniqueUserIds.add(movement.requestedBy);

        const approver1Profile = movement.approver1 ? await getUserProfile(movement.approver1) : null;
        const approver1Name = approver1Profile?.displayName;

        const approver2Profile = movement.approver2 ? await getUserProfile(movement.approver2) : null;
        const approver2Name = approver2Profile?.displayName;

        return { movementId: movement.id, approver1: approver1Name, approver2: approver2Name };
      });

      const assetSerialPromises = movementsData.map(async (movement) => {
        const asset = await getAsset(movement.assetId);
        return { assetId: movement.assetId, serialNumber: asset?.serialNumber || 'N/A' };
      });

      const [resolvedApproverNames, resolvedAssetSerials] = await Promise.all([
        Promise.all(approverNamePromises),
        Promise.all(assetSerialPromises)
      ]);
      
      const newApproverNames = resolvedApproverNames.reduce((acc, { movementId, approver1, approver2 }) => {
        acc[movementId] = { approver1, approver2 };
        return acc;
      }, {} as Record<string, { approver1?: string, approver2?: string }>);

      setApproverNames(newApproverNames);

      const newAssetSerialNumbers = resolvedAssetSerials.reduce((acc, { assetId, serialNumber }) => {
        acc[assetId] = serialNumber;
        return acc;
      }, {} as Record<string, string>);

      setAssetSerialNumbers(newAssetSerialNumbers);

      const fetchedRequesterNames: Record<string, string> = {};
      await Promise.all(Array.from(uniqueUserIds).map(async (uid) => {
        const userProfile = await getUserProfile(uid);
        if (userProfile) {
          fetchedRequesterNames[uid] = userProfile.displayName || userProfile.email || 'N/A';
        }
      }));
      setRequesterNames(fetchedRequesterNames);

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

  const handleNewMovementRequested = async (newMovementId: string) => {
    await fetchMovements();
    const newMovement = await getAssetMovement(newMovementId);

    if (newMovement) {
        const asset = await getAsset(newMovement.assetId);
        const approverIds = [newMovement.approver1, newMovement.approver2].filter(Boolean);
        
        const notificationMessage = `New asset movement request for ${asset?.serialNumber || newMovement.assetId} from ${newMovement.fromSite} to ${newMovement.toSite}.`;
        const notificationLink = `/asset-movement-requests/${newMovement.id}`;

        for (const approverId of approverIds) {
            if (approverId) {
                addNotification({
                    userId: approverId,
                    message: notificationMessage,
                    type: 'info',
                    link: notificationLink,
                    assetId: newMovement.assetId,
                    fromSite: newMovement.fromSite,
                    toSite: newMovement.toSite,
                    requestedByUserId: newMovement.requestedBy,
                });
            }
        }
    }
  };

  const handleUpdateStatus = async (movement: AssetMovement, status: 'Approved' | 'Rejected') => {
    if (!user) return;

    try {
      await updateMovementStatus({ movementId: movement.id, status });
      fetchMovements();

      const asset = await getAsset(movement.assetId);
      addNotification({
          userId: movement.requestedBy, 
          message: `Your asset movement request for ${asset?.serialNumber || movement.assetId} to ${movement.toSite} has been ${status.toLowerCase()}.`,
          type: status === 'Approved' ? 'success' : 'error',
          link: `/asset-movement-requests/${movement.id}`,
          assetId: movement.assetId,
          fromSite: movement.fromSite,
          toSite: movement.toSite,
      });
    } catch (err) {
        alert(`Failed to ${status.toLowerCase()} request. Please try again.`);
        console.error("Error calling updateMovementStatus: ", err);
    }
  };

  const handleDelete = async (movement: AssetMovement) => {
    if (!user) return;

    try {
      await deleteMovementRequest({ movementId: movement.id });
      fetchMovements();

      const asset = await getAsset(movement.assetId);
      addNotification({
          userId: movement.requestedBy, 
          message: `Your asset movement request for ${asset?.serialNumber || movement.assetId} from ${movement.fromSite} to ${movement.toSite} was deleted by an administrator.`,
          type: 'error',
          link: '',
          assetId: movement.assetId,
          fromSite: movement.fromSite,
          toSite: movement.toSite,
      });
    } catch (err) {
      console.error("Error deleting asset movement: ", err);
      alert("Failed to delete the request. Please try again.");
    }
  };

  const handleDownloadExcel = useCallback(() => {
    const dataForExcel = movements.map(move => ({
      'Asset Serial': assetSerialNumbers[move.assetId] || 'N/A',
      'From Site': move.fromSite || 'N/A',
      'To Site': move.toSite || 'N/A',
      'Reason': move.reason || 'N/A',
      'Requester': requesterNames[move.requestedBy] || 'N/A',
      'Approver 1': approverNames[move.id]?.approver1 || 'N/A',
      'Approver 2': approverNames[move.id]?.approver2 || 'N/A',
      'Status': move.status || 'Unknown Status',
      'Date of Request': move.dateOfRequest instanceof Date && !isNaN(move.dateOfRequest.getTime()) ? move.dateOfRequest.toLocaleDateString() : 'N/A',
      'Date of Approval': move.dateOfApproval ? move.dateOfApproval.toLocaleDateString() : 'N/A',
    }));

    const worksheet = utils.json_to_sheet(dataForExcel);
    const workbook = utils.book_new();
    utils.book_append_sheet(workbook, worksheet, "Asset Movements");
    writeFile(workbook, "Asset_Movements.xlsx");
  }, [movements, assetSerialNumbers, approverNames, requesterNames]);

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Asset Movements</h2>
        <div className="flex flex-col sm:flex-row items-center gap-2 md:gap-4">
          {canDownloadMovements && (
            <Button onClick={handleDownloadExcel} className="w-full sm:w-auto" variant="outline" size="sm">
              <Download className="mr-2 h-4 w-4" />
              Download
            </Button>
          )}
          <NewMovementRequestForm onMovementRequested={handleNewMovementRequested} />
        </div>
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
                  <TableHead>Requester</TableHead>
                  <TableHead>Approver 1</TableHead>
                  <TableHead>Approver 2</TableHead>
                  <TableHead>Date of Request</TableHead>
                  <TableHead>Date of Approval</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {movements.length > 0 ? (
                  movements.map((move) => (
                    <TableRow key={move.id}>
                      <TableCell className="font-medium">{assetSerialNumbers[move.assetId] || 'N/A'}</TableCell>
                      <TableCell>{move.fromSite || 'N/A'}</TableCell>
                      <TableCell>{move.toSite || 'N/A'}</TableCell>
                      <TableCell>{move.reason || 'N/A'}</TableCell>
                      <TableCell>{requesterNames[move.requestedBy] || 'N/A'}</TableCell>
                      <TableCell>{approverNames[move.id]?.approver1 || 'N/A'}</TableCell>
                      <TableCell>{approverNames[move.id]?.approver2 || 'N/A'}</TableCell>
                      <TableCell>{move.dateOfRequest instanceof Date && !isNaN(move.dateOfRequest.getTime()) ? move.dateOfRequest.toLocaleDateString() : 'N/A'}</TableCell>
                      <TableCell>{move.dateOfApproval ? move.dateOfApproval.toLocaleDateString() : 'N/A'}</TableCell>
                      <TableCell>
                        <Badge variant={statusVariant[move.status] || 'default'}>
                          {move.status || 'Unknown Status'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                          <div className="flex justify-end items-center gap-2">
                              {(move.approver1 === user?.uid || move.approver2 === user?.uid) && move.status === 'Pending' && (
                                <div className="flex items-center gap-2">
                                  <Button variant="destructive" size="sm" onClick={() => handleUpdateStatus(move, 'Rejected')}>Reject</Button>
                                  <Button size="sm" className="bg-green-500 hover:bg-green-600" onClick={() => handleUpdateStatus(move, 'Approved')}>Approve</Button>
                                </div>
                              )}
                              {move.status !== 'Approved' && user?.uid !== move.approver1 && user?.uid !== move.approver2 && (
                                <EditAssetMovementForm movement={move} onMovementUpdated={fetchMovements} />
                              )}
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
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={11} className="text-center">No asset movement requests found.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
