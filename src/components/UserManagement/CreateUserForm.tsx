import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { getFunctions, httpsCallable } from "firebase/functions";
import { useForm, Controller } from "react-hook-form";
import { motion } from 'framer-motion';

interface FormData {
  fullName: string;
  email: string;
  role: string;
}

export default function CreateUserForm() {
  const { register, handleSubmit, control, formState: { errors } } = useForm<FormData>();
  const { toast } = useToast();
  const functions = getFunctions();

  const onSubmit = async (data: FormData) => {
    const createUser = httpsCallable(functions, 'createUserWithRole');
    try {
      await createUser(data);
      toast({
        title: "Invitation Submitted Successfully ✨",
        description: `The invitation for ${data.email} has been queued. They should receive an email with setup instructions shortly.`,
      });
    } catch (error: any) {
      console.error("Function call failed:", error);
      toast({
        title: "Submission Failed!",
        description: error.message || "An unknown error occurred while submitting the invitation.",
        variant: "destructive",
      });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="max-w-4xl mx-auto"
    >
      <Card className="bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 shadow-lg rounded-2xl">
        <CardHeader className="border-b border-slate-200 dark:border-slate-700/60">
          <CardTitle className="text-2xl font-bold tracking-tight">Invite New User</CardTitle>
          <CardDescription className="text-slate-500 dark:text-slate-400">
            Provision a new user account and assign them a role. They will receive an email to set their password.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  {...register("fullName", { required: "Full name is required" })}
                  placeholder="e.g., John Doe"
                />
                {errors.fullName && <p className="text-red-500 text-xs pt-1">{errors.fullName.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  {...register("email", { required: "Email is required", pattern: { value: /\S+@\S+\.\S+/, message: "Invalid email format" } })}
                  placeholder="e.g., john.doe@example.com"
                />
                {errors.email && <p className="text-red-500 text-xs pt-1">{errors.email.message}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Controller
                name="role"
                control={control}
                rules={{ required: "Role is required" }}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a role for the user" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Administrator</SelectItem>
                      <SelectItem value="operations_manager">Operations Manager</SelectItem>
                      <SelectItem value="maintenance_manager">Maintenance Manager</SelectItem>
                      <SelectItem value="viewer">Viewer</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.role && <p className="text-red-500 text-xs pt-1">{errors.role.message}</p>}
            </div>

            <div className="flex justify-end pt-4">
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button type="submit" size="lg" className="font-semibold">
                    Send Invitation
                  </Button>
                </motion.div>
            </div>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  );
}