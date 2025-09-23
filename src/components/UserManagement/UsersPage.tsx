
import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/components/ui/use-toast";
import { functions } from "@/firebase";
import { httpsCallable } from 'firebase/functions';
import { Users, Loader2, Trash2, UserPlus, Shield, Wrench, GanttChart, User, Eye } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { UserRole } from "@/lib/roles";
import { motion } from "framer-motion";

// UI Mappings for Roles
const ROLE_DISPLAY_NAMES: Record<UserRole, string> = {
    admin: "Administrator",
    operations_manager: "Operations Manager",
    maintenance_manager: "Maintenance Manager",
    user: "User",
    viewer: "Viewer",
};

const ROLE_ICONS: Record<UserRole, React.ElementType> = {
    admin: Shield,
    operations_manager: GanttChart,
    maintenance_manager: Wrench,
    user: User,
    viewer: Eye,
};

const ROLE_COLORS: Record<UserRole, "default" | "primary" | "secondary" | "destructive" | "warning"> = {
    admin: "destructive",
    operations_manager: "primary",
    maintenance_manager: "secondary",
    user: "default",
    viewer: "default",
};

interface UserData {
  uid: string;
  displayName: string;
  email: string;
  role: UserRole;
  createdAt: string; 
}

const listUsersFn = httpsCallable(functions, 'listUsers');
const deleteUserFn = httpsCallable(functions, 'deleteUser');

export default function RolesPage() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const result = await listUsersFn();
      const usersData = (result.data as { users: UserData[] }).users;
      setUsers(usersData);
    } catch (error: any) {
      console.error("Error fetching users:", error);
      toast({ title: "Error Fetching Users", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleDeleteUser = async (uid: string) => {
    try {
      await deleteUserFn({ uid });
      setUsers(prev => prev.filter(u => u.uid !== uid));
      toast({ title: "User Deleted", description: "The user has been permanently deleted.", variant: "success" });
    } catch (error: any) {
      toast({ title: "Deletion Failed", description: error.message, variant: "destructive" });
    }
  };

  const getInitials = (name: string) => {
    const parts = name.split(' ').filter(Boolean);
    if (parts.length === 0) return '';
    if (parts.length === 1) return parts[0][0].toUpperCase();
    return (parts[0][0] + (parts[parts.length - 1][0])).toUpperCase();
  };

  const sortedUsers = useMemo(() => 
    [...users].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()), 
  [users]);

  const containerVariants = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.05 } } };
  const itemVariants = { hidden: { y: 20, opacity: 0 }, show: { y: 0, opacity: 1 } };

  return (
    <motion.div initial="hidden" animate="show" variants={containerVariants} className="space-y-6">
      <Card className="overflow-hidden shadow-xl border-primary/10 rounded-2xl">
        <CardHeader className="bg-muted/20 border-b border-primary/10">
          <motion.div variants={itemVariants} className="flex justify-between items-center">
            <div>
              <CardTitle className="flex items-center gap-3 text-2xl font-bold tracking-tight">
                <Users className="h-7 w-7 text-primary" />
                User & Role Management
              </CardTitle>
              <CardDescription className="mt-2">View, manage, and assign user roles across the platform.</CardDescription>
            </div>
            <Button asChild>
              <Link to="/users/create"><UserPlus className="mr-2 h-4 w-4" />Create User</Link>
            </Button>
          </motion.div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center items-center h-96"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>
          ) : sortedUsers.length === 0 ? (
            <motion.div variants={itemVariants} className="text-center p-12">
              <Users className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">No Users Found</h3>
              <p className="mt-1 text-sm text-muted-foreground">Start by creating a new user to see them here.</p>
            </motion.div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[40%]">User</TableHead>
                    <TableHead>Assigned Role</TableHead>
                    <TableHead>Date Joined</TableHead>
                    <TableHead className="text-right pr-6">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <motion.tbody initial="hidden" animate="show" variants={containerVariants}>
                  {sortedUsers.map((user) => {
                    const RoleIcon = ROLE_ICONS[user.role] || Eye;
                    return (
                      <motion.tr key={user.uid} variants={itemVariants} className="border-b border-primary/5 hover:bg-muted/50">
                        <TableCell className="font-medium py-4">
                          <div className="flex items-center gap-4">
                            <Avatar className="h-10 w-10 border-2 border-primary/10">
                              <AvatarFallback className="bg-muted font-bold">{getInitials(user.displayName)}</AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-bold">{user.displayName}</div>
                              <div className="text-sm text-muted-foreground">{user.email}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={ROLE_COLORS[user.role]} className="flex items-center gap-1.5 w-fit capitalize text-sm py-1 px-3 rounded-full">
                            <RoleIcon className="h-4 w-4" />
                            {ROLE_DISPLAY_NAMES[user.role]}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">{new Date(user.createdAt).toLocaleDateString()}</TableCell>
                        <TableCell className="text-right pr-4">
                            <AlertDialog>
                              <AlertDialogTrigger asChild><Button variant="destructive" size="icon"><Trash2 className="h-4 w-4" /></Button></AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Confirm User Deletion</AlertDialogTitle>
                                  <AlertDialogDescription>Are you sure you want to permanently delete {user.displayName}? This action cannot be undone.</AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleDeleteUser(user.uid)}>Delete User</AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                        </TableCell>
                      </motion.tr>
                    );
                  })}
                </motion.tbody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
