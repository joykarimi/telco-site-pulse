
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/components/ui/use-toast';
import { functions } from '@/firebase';
import { httpsCallable } from 'firebase/functions';
import { Loader2, CheckCircle, AlertTriangle } from 'lucide-react';
import BackgroundImage from '@/assets/images/background.webp';

const formSchema = z.object({
    displayName: z.string().min(2, { message: "Name must be at least 2 characters." }),
    email: z.string().email({ message: "Please enter a valid email address." }),
    role: z.enum(['admin', 'operations_manager', 'maintenance_manager', 'viewer'], { 
        errorMap: () => ({ message: "Please select a role." }) 
    }),
});

const createUser = httpsCallable(functions, 'createUser');

export default function CreateUserForm() {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submissionStatus, setSubmissionStatus] = useState<'success' | 'error' | null>(null);
    const { toast } = useToast();

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            displayName: "",
            email: "",
        },
    });

    async function onSubmit(values: z.infer<typeof formSchema>) {
        setIsSubmitting(true);
        setSubmissionStatus(null);
        try {
            await createUser(values);
            setSubmissionStatus('success');
            toast({
                title: "Invitation Sent",
                description: `An invitation email has been sent to ${values.email}.`,
                variant: "success",
            });
            form.reset();
        } catch (error: any) {
            console.error("Error sending invitation:", error);
            setSubmissionStatus('error');
            toast({
                title: "Failed to Send Invitation",
                description: error.message || "An unexpected error occurred.",
                variant: "destructive",
            });
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ duration: 0.5 }}
            className="min-h-screen bg-cover bg-center p-4 sm:p-6 md:p-8"
            style={{ backgroundImage: `url(${BackgroundImage})` }}
        >
            <Card className="max-w-2xl mx-auto bg-background/80 backdrop-blur-sm border-2 border-primary/10 shadow-2xl rounded-2xl">
                <CardHeader className="text-center">
                    <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.2, duration: 0.5 }}>
                        <CardTitle className="text-3xl font-bold tracking-tight">Invite a New User</CardTitle>
                        <CardDescription className="mt-2 text-lg">Fill out the form below to send an invitation.</CardDescription>
                    </motion.div>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                            <FormField
                                control={form.control}
                                name="displayName"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Full Name</FormLabel>
                                        <FormControl>
                                            <Input placeholder="e.g., Jane Doe" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="email"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Email Address</FormLabel>
                                        <FormControl>
                                            <Input type="email" placeholder="e.g., user@example.com" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="role"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Role</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select a role for the user" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="admin">Administrator</SelectItem>
                                                <SelectItem value="operations_manager">Operations Manager</SelectItem>
                                                <SelectItem value="maintenance_manager">Maintenance Manager</SelectItem>
                                                <SelectItem value="viewer">Viewer</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <div className="flex justify-end pt-4">
                                <Button type="submit" size="lg" className="font-semibold w-full sm:w-auto" disabled={isSubmitting}>
                                    {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                    Send Invitation
                                </Button>
                            </div>
                        </form>
                    </Form>
                    {submissionStatus && (
                        <motion.div 
                            initial={{ opacity: 0, y: 10 }} 
                            animate={{ opacity: 1, y: 0 }} 
                            className={`mt-4 p-4 rounded-md flex items-center ${submissionStatus === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                            {submissionStatus === 'success' ? <CheckCircle className="h-5 w-5 mr-3" /> : <AlertTriangle className="h-5 w-5 mr-3" />}
                            {submissionStatus === 'success' ? "Invitation sent successfully!" : "Failed to send invitation. Please try again."}
                        </motion.div>
                    )}
                </CardContent>
            </Card>
        </motion.div>
    );
}
