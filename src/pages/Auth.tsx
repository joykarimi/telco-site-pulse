import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { Building2, Loader2, ShieldCheck } from 'lucide-react';

export default function Auth() {
  const [isLoading, setIsLoading] = useState(false);
  const [signInForm, setSignInForm] = useState({ email: '', password: '' });
  
  const { user, signIn } = useAuth();
  const { toast } = useToast();

  // Redirect if already authenticated
  if (user) {
    return <Navigate to="/" replace />;
  }

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    const { error } = await signIn(signInForm.email, signInForm.password);
    
    if (error) {
      toast({
        title: 'Sign In Failed',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Welcome back!',
        description: 'You have been signed in successfully.',
      });
    }
    
    setIsLoading(false);
  };


  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <div className="h-12 w-12 bg-gradient-primary rounded-lg flex items-center justify-center">
              <Building2 className="h-6 w-6 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Telecom P&L System
          </h1>
          <p className="text-muted-foreground mt-2">
            Authorized Access Only
          </p>
          <div className="flex items-center justify-center gap-2 mt-3 text-sm text-muted-foreground">
            <ShieldCheck className="h-4 w-4" />
            <span>Contact your administrator for access credentials</span>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Sign In</CardTitle>
            <CardDescription>
              Enter your credentials provided by your administrator
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSignIn} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="signin-email">Email</Label>
                <Input
                  id="signin-email"
                  type="email"
                  placeholder="Enter your email"
                  value={signInForm.email}
                  onChange={(e) => setSignInForm(prev => ({ ...prev, email: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="signin-password">Password</Label>
                <Input
                  id="signin-password"
                  type="password"
                  placeholder="Enter your password"
                  value={signInForm.password}
                  onChange={(e) => setSignInForm(prev => ({ ...prev, password: e.target.value }))}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Sign In
              </Button>
            </form>
            
            <div className="mt-6 p-4 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground text-center">
                <strong>Default Admin:</strong> admin@profitloss.com
                <br />
                <span className="text-xs">Use this to create the first admin account</span>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}