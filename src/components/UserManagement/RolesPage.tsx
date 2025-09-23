
import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { db, functions } from "@/firebase";
import { collection, getDocs, Timestamp } from "firebase/firestore";
import { httpsCallable } from 'firebase/functions';
import { Users, Shield, Settings, User as UserIcon, Trash2, Loader2 } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { ROLES, Role, ROLE_ICONS, ROLE_LABELS, ROLE_COLORS } from "@/lib/roles";
import { motion } from "framer-motion";

interface UserProfile {
  id: string;
  uid: string;
  displayName: string;
  email: string;
  role: Role;
  createdAt: Timestamp;
}

const manageUserRoleFn = httpsCallable(functions, 'manageUserRole');
const deleteUserFn = httpsCallable(functions, 'deleteUser');

export default function RolesPage() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const querySnapshot = await getDocs(collection(db, 'userProfiles'));
      const usersData = querySnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }) as UserProfile[]);
      setUsers(usersData);
    } catch (error: any) {
      toast({
        title: "Error Fetching Users",
        description: error.message || "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleUpdateRole = async (userId: string, newRole: Role) => {
    setUpdatingUserId(userId);
    try {
      await manageUserRoleFn({ uid: userId, role: newRole });
      setUsers(prevUsers => prevUsers.map(user => user.uid === userId ? { ...user, role: newRole } : user));
      toast({
        title: "Role Updated",
        description: `User role has been successfully changed to ${ROLE_LABELS[newRole]}.`,
        variant: "success",
      });
    } catch (error: any) {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update user role.",
        variant: "destructive",
      });
    } finally {
      setUpdatingUserId(null);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      await deleteUserFn({ uid: userId });
      setUsers(prevUsers => prevUsers.filter(user => user.uid !== userId));
      toast({
        title: "User Deleted",
        description: "The user has been successfully deleted.",
        variant: "success",
      });
    } catch (error: any) {
      toast({
        title: "Deletion Failed",
        description: error.message || "Failed to delete user.",
        variant: "destructive",
      });
    }
  };

  const sortedUsers = useMemo(() => {
    return [...users].sort((a, b) => ROLES.indexOf(a.role) - ROLES.indexOf(b.role));
  }, [users]);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }} className="space-y-6">
      <Card className="overflow-hidden shadow-lg border-primary/10">
        <CardHeader className="bg-muted/30">
          <CardTitle className="flex items-center gap-2 text-2xl font-bold">
            <Users className="h-6 w-6 text-primary" />
            User Role Management
          </CardTitle>
          <CardDescription>View, assign, and manage user roles across the platform.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="overflow-x-auto">
                <Table>
                    <TableHeader>
                        <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Date Joined</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {sortedUsers.map((user) => {
                        const RoleIcon = ROLE_ICONS[user.role];
                        return (
                            <TableRow key={user.id} className="hover:bg-muted/50">
                                <TableCell className="font-medium">{user.displayName}</TableCell>
                                <TableCell>
                                    <Badge variant={ROLE_COLORS[user.role]} className="flex items-center gap-1.5 w-fit capitalize">
                                        <RoleIcon className="h-3.5 w-3.5" />
                                        {ROLE_LABELS[user.role]}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-muted-foreground">{user.email}</TableCell>
                                <TableCell className="text-muted-foreground">
                                    {user.createdAt ? new Date(user.createdAt.toDate()).toLocaleDateString() : 'N/A'}
                                </TableCell>
                                <TableCell className="text-right">
                                    {updatingUserId === user.uid ? (
                                        <Loader2 className="h-5 w-5 animate-spin" />
                                    ) : (
                                        <div className="flex justify-end gap-2">
                                            {ROLES.map((role) => (
                                                <Button
                                                key={role}
                                                variant={user.role === role ? "default" : "outline"}
                                                size="sm"
                                                onClick={() => handleUpdateRole(user.uid, role)}
                                                disabled={user.role === role}
                                                >
                                                {ROLE_LABELS[role]}
                                                </Button>
                                            ))}
                                            <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                    <Button variant="destructive" size="icon" className="ml-2">
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle>Confirm User Deletion</AlertDialogTitle>
                                                        <AlertDialogDescription>
                                                            Are you sure you want to delete {user.displayName}? This action is permanent and cannot be undone.
                                                        </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                        <AlertDialogAction onClick={() => handleDeleteUser(user.uid)}>Delete User</AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        </div>
                                    )}
                                </TableCell>
                            </TableRow>
                        );
                        })}
                    </TableBody>
                </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
