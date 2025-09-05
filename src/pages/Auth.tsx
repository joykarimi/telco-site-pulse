
import { useEffect, useState } from 'react';
import { Navigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/auth/AuthProvider';
import { toast } from 'sonner';
import { Building2, Loader2 } from 'lucide-react';
import telecomTowerImage from '@/assets/images/telecom_tower.jpg';
import { getAuth, checkActionCode, applyActionCode, confirmPasswordReset } from 'firebase/auth';

export default function Auth() {
    const [isLoading, setIsLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<'signin' | 'signup' | 'resetPassword'>('signin');

    const [signInForm, setSignInForm] = useState({ email: '', password: '' });
    const [signUpForm, setSignUpForm] = useState({ email: '', password: '', fullName: '' });
    const [resetPasswordForm, setResetPasswordForm] = useState({ password: '', confirmPassword: '' });

    const [searchParams] = useSearchParams();
    const mode = searchParams.get('mode');
    const oobCode = searchParams.get('oobCode');

    const { user, login, signUp, loading: authLoading } = useAuth();

    useEffect(() => {
        if (mode === 'resetPassword' && oobCode) {
            const auth = getAuth();
            checkActionCode(auth, oobCode)
                .then(() => {
                    setActiveTab('resetPassword');
                })
                .catch((error) => {
                    toast.error("Invalid or expired password reset link.", {
                        description: "Please request a new password reset link if needed.",
                    });
                    console.error("Invalid oobCode:", error);
                });
        }
    }, [mode, oobCode]);


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

    const handleSignIn = async (e: React.FormEvent) => {
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

    const handleSignUp = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            await signUp(signUpForm.email, signUpForm.password, signUpForm.fullName);
            toast.success('Account created successfully!', {
                description: 'You can now sign in with your new credentials.',
            });
            setActiveTab('signin'); // Switch to sign-in tab after successful sign-up
        } catch (error: any) {
            const message = error.code === 'auth/email-already-in-use'
                ? 'This email is already registered. Please sign in.'
                : 'An error occurred during sign-up. Please try again.';
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
            const auth = getAuth();
            await confirmPasswordReset(auth, oobCode, resetPasswordForm.password);
            toast.success("Password has been reset successfully!", {
                description: "You can now sign in with your new password.",
            });
            setActiveTab("signin");
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
        switch (activeTab) {
            case 'signin':
                return (
                    <form onSubmit={handleSignIn} className="grid gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="signin-email">Email</Label>
                            <Input
                                id="signin-email"
                                type="email"
                                placeholder="m@example.com"
                                value={signInForm.email}
                                onChange={(e) => setSignInForm(prev => ({ ...prev, email: e.target.value }))}
                                required
                                disabled={isLoading}
                            />
                        </div>
                        <div className="grid gap-2">
                            <div className="flex items-center">
                                <Label htmlFor="signin-password">Password</Label>
                                {/* <a href="#" className="ml-auto inline-block text-sm underline">Forgot your password?</a> */}
                            </div>
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
            case 'signup':
                return (
                    <form onSubmit={handleSignUp} className="grid gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="signup-name">Full Name</Label>
                            <Input
                                id="signup-name"
                                placeholder="Max Robinson"
                                value={signUpForm.fullName}
                                onChange={(e) => setSignUpForm(prev => ({ ...prev, fullName: e.target.value }))}
                                required
                                disabled={isLoading} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="signup-email">Email</Label>
                            <Input
                                id="signup-email"
                                type="email"
                                placeholder="m@example.com"
                                value={signUpForm.email}
                                onChange={(e) => setSignUpForm(prev => ({ ...prev, email: e.target.value }))}
                                required
                                disabled={isLoading}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="signup-password">Password</Label>
                            <Input
                                id="signup-password"
                                type="password"
                                value={signUpForm.password}
                                onChange={(e) => setSignUpForm(prev => ({ ...prev, password: e.target.value }))}
                                required
                                disabled={isLoading} />
                        </div>
                        <Button type="submit" className="w-full" disabled={isLoading}>
                            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Create an Account'}
                        </Button>
                    </form>
                );
            case 'resetPassword':
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
                )
        }
    }

    return (
        <div className="w-full lg:grid lg:min-h-screen lg:grid-cols-2">
            {/* Left Branding Column */}
            <div className="hidden bg-muted lg:flex lg:flex-col items-center justify-center p-8 border-r">
                <div className="flex items-center gap-4 text-foreground">
                    <Building2 className="h-10 w-10" />
                    <h1 className="text-3xl font-bold">Telecom P&L System</h1>
                </div>
                <p className="text-center text-lg mt-4 max-w-md">
                    Your centralized hub for managing telecommunication sites, assets, and profitability with precision and foresight.
                </p>
                <img
                    src={telecomTowerImage}
                    alt="Modern Telecommunication Tower in Kenya"
                    className="mt-8 rounded-md aspect-video object-cover"
                />
                <div className="mt-auto text-sm text-muted-foreground">
                    © 2024 Telecom P&L System. All rights reserved.
                </div>
            </div>

            {/* Right Auth Form Column */}
            <div className="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
                <div className="mx-auto grid w-[380px] gap-6">
                    <div className="grid gap-4 text-center">
                        <div className="flex items-center justify-center gap-2 lg:hidden">
                            <Building2 className="h-8 w-8" />
                            <h1 className="text-2xl font-bold">Telecom P&L System</h1>
                        </div>
                        {activeTab !== 'resetPassword' && (
                             <p className="text-balance text-muted-foreground">
                                Enter your details below to access your dashboard
                            </p>
                        )}
                    </div>

                    {activeTab !== 'resetPassword' && (
                        <div className="grid grid-cols-2 gap-4">
                            <Button variant={activeTab === 'signin' ? 'default' : 'outline'} onClick={() => setActiveTab('signin')}>Sign In</Button>
                            <Button variant={activeTab === 'signup' ? 'default' : 'outline'} onClick={() => setActiveTab('signup')}>Sign Up</Button>
                        </div>
                    )}

                    {renderActiveForm()}

                </div>
            </div>
        </div>
    );
}
