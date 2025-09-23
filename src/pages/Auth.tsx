
import { useEffect, useState, useRef } from 'react';
import { Navigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/auth/AuthProvider';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import towerImage from '@/assets/images/tower.jpg';
import { getAuth, checkActionCode, confirmPasswordReset, RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult } from 'firebase/auth';
import PhoneInput from 'react-phone-number-input';
import 'react-phone-number-input/style.css';
import '@/assets/css/phone-input.css';
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "@/components/ui/input-otp"

export default function Auth() {
    const [isLoading, setIsLoading] = useState(false);
    // 'phone', 'email', or 'resetPassword'
    const [authMode, setAuthMode] = useState<'phone' | 'email' | 'resetPassword'>('phone');

    const [signInForm, setSignInForm] = useState({ email: '', password: '' });
    const [resetPasswordForm, setResetPasswordForm] = useState({ password: '', confirmPassword: '' });

    // Phone auth state
    const [phoneNumber, setPhoneNumber] = useState<string | undefined>('');
    const [otp, setOtp] = useState('');
    const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
    const [isOtpSent, setIsOtpSent] = useState(false);

    const [searchParams] = useSearchParams();
    const mode = searchParams.get('mode');
    const oobCode = searchParams.get('oobCode');

    const { user, login, loading: authLoading } = useAuth();
    const auth = getAuth();
    const recaptchaVerifierRef = useRef<RecaptchaVerifier | null>(null);
    const recaptchaContainerRef = useRef<HTMLDivElement>(null);

    // Initialize Recaptcha Verifier
    useEffect(() => {
        if (!recaptchaContainerRef.current) return;
        if (recaptchaVerifierRef.current) return; // Already initialized

        recaptchaVerifierRef.current = new RecaptchaVerifier(auth, recaptchaContainerRef.current, {
            'size': 'invisible',
            'callback': (response: any) => {
                // reCAPTCHA solved, allow signInWithPhoneNumber.
                console.log("Recaptcha verified");
            },
            'expired-callback': () => {
                // Response expired. Ask user to solve reCAPTCHA again.
                toast.error("Recaptcha expired. Please try again.");
            }
        });
        recaptchaVerifierRef.current.render(); // Render the invisible reCAPTCHA
    }, [auth]);


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
    
    const handlePhoneSignIn = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!phoneNumber) {
             toast.error("Please enter a valid phone number.");
            return;
        }
        if (!recaptchaVerifierRef.current) {
            toast.error("Recaptcha not initialized. Please wait or refresh the page.");
            return;
        }
        setIsLoading(true);
        try {
            const confirmation = await signInWithPhoneNumber(auth, phoneNumber, recaptchaVerifierRef.current);
            setConfirmationResult(confirmation);
            setIsOtpSent(true);
            toast.success('OTP sent successfully!');
        } catch (error) {
            console.error("Error sending OTP: ", error);
            toast.error("Failed to send OTP. Check the phone number or try again.");
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleOtpVerification = async () => {
        if (!confirmationResult) {
            toast.error("Verification failed. Please request a new OTP.");
            return;
        }
        if (otp.length !== 6) {
            toast.error("Please enter a 6-digit OTP.");
            return;
        }
        setIsLoading(true);
        try {
            await confirmationResult.confirm(otp);
            toast.success('Signed in successfully!');
            // onAuthStateChanged in AuthProvider will handle the redirect
        } catch (error) {
            console.error("Error verifying OTP: ", error);
            toast.error("Invalid OTP. Please try again.");
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
            await confirmPasswordReset(auth, oobCode, resetPasswordForm.password);
            toast.success("Password has been reset successfully!", {
                description: "You can now sign in with your new password.",
            });
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
        switch (authMode) {
            case 'phone':
                if (isOtpSent) {
                    return (
                        <div className="grid gap-4">
                            <div className="grid gap-2 text-center">
                                <h1 className="text-2xl font-bold">Enter OTP</h1>
                                <p className="text-balance text-muted-foreground">
                                    A 6-digit code was sent to your phone number.
                                </p>
                            </div>
                            <InputOTP maxLength={6} value={otp} onChange={(value) => setOtp(value)}>
                                <InputOTPGroup>
                                    <InputOTPSlot index={0} />
                                    <InputOTPSlot index={1} />
                                    <InputOTPSlot index={2} />
                                </InputOTPGroup>
                                <InputOTPSeparator />
                                <InputOTPGroup>
                                    <InputOTPSlot index={3} />
                                    <InputOTPSlot index={4} />
                                    <InputOTPSlot index={5} />
                                </InputOTPGroup>
                            </InputOTP>
                            <Button onClick={handleOtpVerification} className="w-full" disabled={isLoading}>
                                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Verify OTP & Sign In'}
                            </Button>
                            <Button variant="link" size="sm" onClick={() => setIsOtpSent(false)} disabled={isLoading}>
                                Back to phone number entry
                            </Button>
                        </div>
                    );
                }
                return (
                     <form onSubmit={handlePhoneSignIn} className="grid gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="phone-number">Phone Number</Label>
                            <PhoneInput
                                id="phone-number"
                                placeholder="Enter phone number"
                                value={phoneNumber}
                                onChange={setPhoneNumber}
                                defaultCountry="KE"
                                international
                                countryCallingCodeEditable={false}
                            />
                        </div>
                        <Button type="submit" className="w-full" disabled={isLoading}>
                            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Send OTP'}
                        </Button>
                    </form>
                );
            case 'email':
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
                            <div className="flex items-center">
                                <Label htmlFor="signin-password">Password</Label>
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
    
    const getTitle = () => {
        if (authMode === 'resetPassword') return '';
        if (authMode === 'email') return 'Admin Sign In';
        if (isOtpSent) return '';
        return 'User Sign In';
    }

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
                 <div id="recaptcha-container" ref={recaptchaContainerRef}></div>
                <div className="mx-auto grid w-[380px] gap-6">
                    <div className="grid gap-4 text-center">
                        <h1 className="text-3xl font-bold">{getTitle()}</h1>
                        {authMode !== 'resetPassword' && (
                             <p className="text-balance text-muted-foreground">
                                Enter your details below to access your dashboard
                            </p>
                        )}
                    </div>

                    {renderActiveForm()}

                    {authMode !== 'resetPassword' && (
                        <div className="mt-4 text-center text-sm">
                            {authMode === 'phone' ? (
                                <>
                                    Are you an administrator?{' '}
                                    <Button variant="link" onClick={() => setAuthMode('email')} className="p-0 h-auto">
                                        Sign in with email
                                    </Button>
                                </>
                            ) : (
                                <>
                                    Are you a user?{' '}
                                     <Button variant="link" onClick={() => setAuthMode('phone')} className="p-0 h-auto">
                                        Sign in with phone
                                    </Button>
                                </>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
