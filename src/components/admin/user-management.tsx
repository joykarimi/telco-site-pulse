import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { db } from "@/integrations/firebase/client";
import { collection, getDocs } from "firebase/firestore";
import { getFunctions, httpsCallable } from 'firebase/functions';
import { UserPlus, Users, Shield, Settings, User } from "lucide-react";

export type UserRole = "admin" | "maintenance_manager" | "operations_manager" | "user";

interface UserProfile {
  id: string;
  user_id: string;
  full_name: string;
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
const createUserFn = httpsCallable(functions, 'createUser');
const manageUserRoleFn = httpsCallable(functions, 'manageUserRole');

export function UserManagement() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [createUserLoading, setCreateUserLoading] = useState(false);
  const [newUser, setNewUser] = useState({
    email: "",
    fullName: "",
    role: "user" as UserRole,
  });
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

  const createUser = async () => {
    if (!newUser.email || !newUser.fullName) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    setCreateUserLoading(true);
    try {
      await createUserFn({
        email: newUser.email,
        fullName: newUser.fullName,
        role: newUser.role,
      });

      toast({
        title: "Success",
        description: "User created and credentials sent via email",
      });

      setNewUser({ email: "", fullName: "", role: "user" });
      fetchUsers();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create user",
        variant: "destructive",
      });
    } finally {
      setCreateUserLoading(false);
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

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-r from-background/50 to-accent/5 border-accent/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-primary" />
            Create New User
          </CardTitle>
          <CardDescription>
            Create a new user account and send credentials via email
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="user@example.com"
                value={newUser.email}
                onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                placeholder="John Doe"
                value={newUser.fullName}
                onChange={(e) => setNewUser({ ...newUser, fullName: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select value={newUser.role} onValueChange={(value: UserRole) => setNewUser({ ...newUser, role: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="maintenance_manager">Maintenance Manager</SelectItem>
                  <SelectItem value="operations_manager">Operations Manager</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button onClick={createUser} disabled={createUserLoading} className="w-full">
            {createUserLoading ? "Creating..." : "Create User"}
          </Button>
        </CardContent>
      </Card>

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