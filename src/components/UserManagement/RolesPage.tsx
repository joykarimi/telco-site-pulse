import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { db } from "@/firebase";
import { collection, getDocs } from "firebase/firestore";
import { getFunctions, httpsCallable } from 'firebase/functions';
import { Users, Shield, Settings, User, Trash2 } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

export type UserRole = "admin" | "maintenance_manager" | "operations_manager" | "user";

interface UserProfile {
  id: string;
  user_id: string;
  full_name: string;
  phoneNumber?: string;
  role: UserRole;
  created_at: any; // Firestore timestamp
}

const roleIcons = {
  admin: Shield,
  maintenance_manager: Settings,
  operations_manager: Users,
  user: User,
};

const roleLabels = {
  admin: "Admin",
  maintenance_manager: "Maintenance Manager",
  operations_manager: "Operations Manager",
  user: "User",
};

const roleColors = {
  admin: "destructive",
  maintenance_manager: "default",
  operations_manager: "secondary",
  user: "outline",
} as const;

const functions = getFunctions();
const manageUserRoleFn = httpsCallable(functions, 'manageUserRole');
const deleteUserFn = httpsCallable(functions, 'deleteUser');

export default function RolesPage() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'profiles'));
      const usersData = querySnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })) as UserProfile[];
      setUsers(usersData);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to fetch users",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateUserRole = async (userId: string, role: UserRole) => {
    try {
      await manageUserRoleFn({ userId, role });

      toast({
        title: "Success",
        description: "User role updated successfully",
      });

      fetchUsers();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update user role",
        variant: "destructive",
      });
    }
  };

  const deleteUser = async (userId: string) => {
    try {
      await deleteUserFn({ userId });
      toast({
        title: "Success",
        description: "User deleted successfully",
      });
      fetchUsers();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete user",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-.primary" />
            User Management
          </CardTitle>
          <CardDescription>
            Manage user roles and permissions
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => {
                  const RoleIcon = roleIcons[user.role];
                  return (
                    <TableRow key={user.id} className="hover:bg-accent/5 transition-colors">
                      <TableCell>
                        <div>
                          <p className="font-medium">{user.full_name}</p>
                           <p className="text-sm text-muted-foreground">{user.user_id}</p>
                          <p className="text-sm text-muted-foreground">{user.phoneNumber}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={roleColors[user.role]} className="flex items-center gap-1 w-fit">
                          <RoleIcon className="h-3 w-3" />
                          {roleLabels[user.role]}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(user.created_at.toDate()).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          {(["user", "maintenance_manager", "operations_manager", "admin"] as UserRole[]).map((role) => (
                            <Button
                              key={role}
                              variant={user.role === role ? "default" : "outline"}
                              size="sm"
                              onClick={() => updateUserRole(user.user_id, role)}
                              disabled={user.role === role}
                              className="text-xs"
                            >
                              {roleLabels[role]}
                            </Button>
                          ))}
                           <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button variant="destructive" size="icon">
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            This action cannot be undone. This will permanently delete the user and all associated data.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction onClick={() => deleteUser(user.user_id)}>Delete</AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
