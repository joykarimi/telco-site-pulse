
import { useEffect, useState } from 'react';
import { Navigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/auth/AuthProvider';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import towerImage from '@/assets/images/torr.jpeg'; // Updated image path
import { getAuth, checkActionCode, confirmPasswordReset } from 'firebase/auth';

export default function Auth() {
    const [isLoading, setIsLoading] = useState(false);
    const [authMode, setAuthMode] = useState<'email' | 'resetPassword'>('email');

    const [signInForm, setSignInForm] = useState({ email: '', password: '' });
    const [resetPasswordForm, setResetPasswordForm] = useState({ password: '', confirmPassword: '' });

    const [searchParams] = useSearchParams();
    const mode = searchParams.get('mode');
    const oobCode = searchParams.get('oobCode');

    const { user, login, loading: authLoading } = useAuth();
    const auth = getAuth();

    useEffect(() => {
        if (mode === 'resetPassword' && oobCode) {
            checkActionCode(auth, oobCode)
                .then(() => {
                    setAuthMode('resetPassword');
                })
                .catch((error) => {
                    toast.error("Invalid or expired password reset link.", {
                        description: "Please request a new password reset link if needed.",
                    });
                    console.error("Invalid oobCode:", error);
                });
        }
    }, [mode, oobCode, auth]);

    if (authLoading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (user) {
        return <Navigate to="/" replace />;
    }

    const handleEmailSignIn = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            await login(signInForm.email, signInForm.password);
            toast.success('Signed in successfully!');
        } catch (error: any) {
            const message = error.code === 'auth/invalid-credential'
                ? 'Invalid email or password. Please try again.'
                : 'An unexpected error occurred. Please try again.';
            toast.error(message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        // ... (reset password logic)
    };

    return (
        <div 
            className="w-full min-h-screen flex items-center justify-center bg-cover bg-center p-4"
            style={{ backgroundImage: `url(${towerImage})` }}
        >
            <div className="absolute inset-0 bg-black opacity-50"></div>
            <div className="mx-auto grid w-full max-w-sm gap-6 bg-white/10 backdrop-blur-md p-6 sm:p-8 rounded-lg shadow-lg z-10">
                <div className="grid gap-4 text-center text-white">
                    <h1 className="text-3xl font-bold">Sign In</h1>
                    {authMode !== 'resetPassword' && (
                         <p className="text-balance text-white/80">
                            Enter your email and password below to access your dashboard.
                        </p>
                    )}
                </div>

                {authMode === 'resetPassword' ? (
                     <form onSubmit={handleResetPassword} className="grid gap-4">
                         {/* ... reset password form ... */}
                     </form>
                ) : (
                    <form onSubmit={handleEmailSignIn} className="grid gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="signin-email" className="text-white">Email</Label>
                            <Input
                                id="signin-email"
                                type="email"
                                placeholder="admin@example.com"
                                value={signInForm.email}
                                onChange={(e) => setSignInForm(prev => ({ ...prev, email: e.target.value }))}
                                required
                                disabled={isLoading}
                                className="bg-white/20 border-white/30 text-white placeholder:text-white/60"
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="signin-password" className="text-white">Password</Label>
                            <Input
                                id="signin-password"
                                type="password"
                                value={signInForm.password}
                                onChange={(e) => setSignInForm(prev => ({ ...prev, password: e.target.value }))}
                                required
                                disabled={isLoading}
                                className="bg-white/20 border-white/30 text-white placeholder:text-white/60"
                            />
                        </div>
                        <Button type="submit" className="w-full bg-primary/80 hover:bg-primary" disabled={isLoading}>
                            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Sign In'}
                        </Button>
                     </form>
                )}

                <div className="mt-4 text-center text-sm text-white/60">
                    © {new Date().getFullYear()} Alan Dick & Company. All rights reserved.
                </div>
            </div>
        </div>
    );
}
