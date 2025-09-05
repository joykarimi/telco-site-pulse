import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { db } from "@/firebase";
import { useEffect, useState } from "react";
import { motion } from 'framer-motion';

interface User {
  id: string;
  fullName: string;
  email: string;
  role: string;
  createdAt: any; // Firestore timestamp object
}

const roleVariantMap: { [key: string]: "default" | "destructive" | "outline" | "secondary" } = {
  admin: "destructive",
  operations_manager: "secondary",
  maintenance_manager: "outline",
  viewer: "default",
};

export default function RolesPage() {
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    const q = query(collection(db, "users"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const usersData: User[] = [];
      querySnapshot.forEach((doc) => {
        usersData.push({ id: doc.id, ...doc.data() } as User);
      });
      setUsers(usersData);
    });

    return () => unsubscribe();
  }, []);

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'N/A';
    return new Date(timestamp.seconds * 1000).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="max-w-7xl mx-auto"
    >
      <Card className="bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 shadow-lg rounded-2xl">
        <CardHeader className="border-b border-slate-200 dark:border-slate-700/60">
          <CardTitle className="text-2xl font-bold tracking-tight">User Roles</CardTitle>
          <CardDescription className="text-slate-500 dark:text-slate-400">
            A real-time list of all registered users and their assigned roles.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-b-0">
                  <TableHead className="px-6 py-4 text-sm font-medium text-slate-600 dark:text-slate-300">Full Name</TableHead>
                  <TableHead className="px-6 py-4 text-sm font-medium text-slate-600 dark:text-slate-300">Email</TableHead>
                  <TableHead className="px-6 py-4 text-sm font-medium text-slate-600 dark:text-slate-300">Role</TableHead>
                  <TableHead className="px-6 py-4 text-sm font-medium text-slate-600 dark:text-slate-300">Date Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id} className="border-t border-slate-200 dark:border-slate-700/60 hover:bg-slate-50 dark:hover:bg-slate-800/20">
                    <TableCell className="px-6 py-4 font-medium text-slate-900 dark:text-slate-100">{user.fullName}</TableCell>
                    <TableCell className="px-6 py-4 text-slate-600 dark:text-slate-300">{user.email}</TableCell>
                    <TableCell className="px-6 py-4">
                      <Badge variant={roleVariantMap[user.role] || 'default'} className="capitalize">
                        {user.role.replace(/_/g, ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-6 py-4 text-slate-600 dark:text-slate-300">{formatDate(user.createdAt)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
