
import { useEffect, useState } from 'react';
import { Navigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/auth/AuthProvider';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import towerImage from '@/assets/images/tower.jpg';
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
            // Verify the password reset code is valid.
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
        if (resetPasswordForm.password !== resetPasswordForm.confirmPassword) {
            toast.error("Passwords do not match.");
            return;
        }
        if (!oobCode) {
            toast.error("Missing action code. Please use the link from your email.");
            return;
        }

        setIsLoading(true);
        try {
            // Complete the password reset process.
            await confirmPasswordReset(auth, oobCode, resetPasswordForm.password);
            toast.success("Password has been reset successfully!", {
                description: "You can now sign in with your new password.",
            });
            // Switch back to the sign-in form after a successful password reset.
            setAuthMode("email");
        } catch (error: any) {
            toast.error("Failed to reset password.", {
                description: "The link may have expired. Please try resetting your password again.",
            });
            console.error("Password Reset Error:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const renderActiveForm = () => {
        if (authMode === 'resetPassword') {
            return (
                <form onSubmit={handleResetPassword} className="grid gap-4">
                    <div className="grid gap-2 text-center">
                        <h1 className="text-2xl font-bold">Set Your New Password</h1>
                        <p className="text-balance text-muted-foreground">
                            Please enter and confirm your new password below.
                        </p>
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="reset-password">New Password</Label>
                        <Input
                            id="reset-password"
                            type="password"
                            value={resetPasswordForm.password}
                            onChange={(e) => setResetPasswordForm(prev => ({ ...prev, password: e.target.value }))}
                            required
                            disabled={isLoading}
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="reset-confirm-password">Confirm New Password</Label>
                        <Input
                            id="reset-confirm-password"
                            type="password"
                            value={resetPasswordForm.confirmPassword}
                            onChange={(e) => setResetPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                            required
                            disabled={isLoading}
                        />
                    </div>
                    <Button type="submit" className="w-full" disabled={isLoading}>
                        {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Set New Password'}
                    </Button>
                </form>
            );
        }

        // Default to email sign-in form
        return (
            <form onSubmit={handleEmailSignIn} className="grid gap-4">
                <div className="grid gap-2">
                    <Label htmlFor="signin-email">Email</Label>
                    <Input
                        id="signin-email"
                        type="email"
                        placeholder="admin@example.com"
                        value={signInForm.email}
                        onChange={(e) => setSignInForm(prev => ({ ...prev, email: e.target.value }))}
                        required
                        disabled={isLoading}
                    />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="signin-password">Password</Label>
                    <Input
                        id="signin-password"
                        type="password"
                        value={signInForm.password}
                        onChange={(e) => setSignInForm(prev => ({ ...prev, password: e.target.value }))}
                        required
                        disabled={isLoading}
                    />
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Sign In'}
                </Button>
            </form>
        );
    };

    return (
        <div className="w-full lg:grid lg:min-h-screen lg:grid-cols-2">
            {/* Left Branding Column */}
            <div className="hidden bg-muted lg:flex lg:flex-col items-center justify-center p-8 border-r">
                <p className="text-center text-lg mt-4 max-w-md">
                    Your centralized hub for managing telecommunication sites, assets, and profitability with precision and foresight.
                </p>
                <img
                    src={towerImage}
                    alt="Telecommunication Tower"
                    className="mt-8 rounded-md aspect-video object-cover"
                />
                <div className="mt-auto text-sm text-muted-foreground">
                    © {new Date().getFullYear()} Alan Dick & Company. All rights reserved.
                </div>
            </div>

            {/* Right Auth Form Column */}
            <div className="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
                <div className="mx-auto grid w-[380px] gap-6">
                    <div className="grid gap-4 text-center">
                        <h1 className="text-3xl font-bold">Sign In</h1>
                        {authMode !== 'resetPassword' && (
                             <p className="text-balance text-muted-foreground">
                                Enter your email and password below to access your dashboard.
                            </p>
                        )}
                    </div>

                    {renderActiveForm()}

                </div>
            </div>
        </div>
    );
}
