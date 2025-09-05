import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { getFunctions, httpsCallable } from "firebase/functions";
import { useForm, Controller } from "react-hook-form";

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
    try {
      const createUser = httpsCallable(functions, 'createUser');
      await createUser(data);
      toast({
        title: "Success!",
        description: `User ${data.fullName} has been created with the role ${data.role}.`,
      });
    } catch (error: any) { // Consider more specific error typing
      console.error(error);
      toast({
        title: "Error!",
        description: error.message || "An unknown error occurred.",
        variant: "destructive",
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create New User</CardTitle>
        <CardDescription>Enter the details below to create a new user account.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="fullName">Full Name</Label>
            <Input id="fullName" {...register("fullName", { required: "Full name is required" })} />
            {errors.fullName && <p className="text-red-500 text-xs">{errors.fullName.message}</p>}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" {...register("email", { required: "Email is required" })} />
            {errors.email && <p className="text-red-500 text-xs">{errors.email.message}</p>}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="role">Role</Label>
            <Controller
              name="role"
              control={control}
              rules={{ required: "Role is required" }}
              render={({ field }) => (
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="operations_manager">Operations Manager</SelectItem>
                    <SelectItem value="maintenance_manager">Maintenance Manager</SelectItem>
                    <SelectItem value="viewer">Viewer</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
            {errors.role && <p className="text-red-500 text-xs">{errors.role.message}</p>}
          </div>

          <Button type="submit" className="w-full">Create User</Button>
        </form>
      </CardContent>
    </Card>
  );
}
