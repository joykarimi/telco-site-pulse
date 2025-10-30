
import { useEffect, useState } from "react";
import { useAuth } from "@/auth/AuthProvider";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ApprovalLog, getApprovalLogs, getUserProfile } from "@/lib/firebase/firestore";
import { PERMISSIONS, ROLES } from "@/lib/roles";
import { Loader2 } from "lucide-react";

export default function ApprovalLogs() {
  const { user, hasPermission, loading: authLoading } = useAuth();
  const [logs, setLogs] = useState<ApprovalLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userDisplayNames, setUserDisplayNames] = useState<Record<string, string>>({});

  const isAdmin = user?.role === ROLES.ADMIN;

  useEffect(() => {
    if (authLoading || !isAdmin) {
      setLoading(false);
      return;
    }

    const fetchLogs = async () => {
      try {
        setLoading(true);
        const fetchedLogs = await getApprovalLogs();
        setLogs(fetchedLogs);

        const uniqueUserIds = Array.from(new Set(fetchedLogs.map(log => log.userId)));
        const fetchedNames: Record<string, string> = {};
        await Promise.all(uniqueUserIds.map(async (uid) => {
          const userProfile = await getUserProfile(uid);
          if (userProfile) {
            fetchedNames[uid] = userProfile.displayName;
          }
        }));
        setUserDisplayNames(fetchedNames);

        setError(null);
      } catch (err) {
        console.error("Failed to fetch approval logs:", err);
        setError("Failed to fetch approval logs. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
  }, [authLoading, isAdmin]);

  if (authLoading || loading) {
    return (
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <Card>
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
          </CardHeader>
          <CardContent>
            <p>You do not have permission to view this page.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Approval Logs</h2>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Recent Approval Activities</CardTitle>
          <CardDescription>A comprehensive log of all asset movement approvals.</CardDescription>
        </CardHeader>
        <CardContent>
          {error && <p className="text-destructive">{error}</p>}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Timestamp</TableHead>
                <TableHead>Approved By</TableHead>
                <TableHead>Movement Request ID</TableHead>
                <TableHead>Notes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.length > 0 ? (
                logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>{new Date(log.timestamp).toLocaleString()}</TableCell>
                    <TableCell className="font-medium">{userDisplayNames[log.userId] || log.userDisplayName || 'N/A'}</TableCell>
                    <TableCell>{log.movementRequestId}</TableCell>
                    <TableCell>{log.notes || 'N/A'}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="text-center">No approval logs found.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
