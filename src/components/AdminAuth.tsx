import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, Shield, Crown, Lock, AlertTriangle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { User as SupabaseUser } from '@supabase/supabase-js';

interface AdminAuthProps {
  onAdminVerified: (user: SupabaseUser) => void;
  onBack: () => void;
}

export default function AdminAuth({ onAdminVerified, onBack }: AdminAuthProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [currentUser, setCurrentUser] = useState<SupabaseUser | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  // Check if user is already logged in and has admin privileges
  useEffect(() => {
    const checkExistingAuth = async () => {
      try {
        setIsCheckingAuth(true);
        console.log('Checking existing authentication...');

        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting session:', error);
          return;
        }

        if (session?.user) {
          console.log('Found existing session for:', session.user.email);
          setCurrentUser(session.user);
          
          // Check if user has admin privileges
          const { data: adminData, error: adminError } = await supabase
            .from('admin_users')
            .select('role')
            .eq('user_id', session.user.id)
            .maybeSingle();

          if (adminError) {
            console.error('Error checking admin status:', adminError);
            return;
          }

          const userIsAdmin = adminData?.role === 'admin';
          console.log('Admin status:', userIsAdmin);
          setIsAdmin(userIsAdmin);

          if (userIsAdmin) {
            // Automatically proceed to admin dashboard
            onAdminVerified(session.user);
          }
        } else {
          console.log('No existing session found');
        }
      } catch (error) {
        console.error('Error checking auth:', error);
      } finally {
        setIsCheckingAuth(false);
      }
    };

    checkExistingAuth();
  }, [onAdminVerified]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast({
        title: "Validation Error",
        description: "Please enter both email and password",
        variant: "destructive"
      });
      return;
    }

    try {
      setLoading(true);
      console.log('Attempting admin sign in for:', email);

      // Sign in the user
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password
      });

      if (authError) {
        console.error('Authentication error:', authError);
        
        if (authError.message.includes('Invalid login credentials')) {
          toast({
            title: "Authentication Failed",
            description: "Invalid email or password. Please check your credentials.",
            variant: "destructive"
          });
        } else {
          toast({
            title: "Sign In Error",
            description: authError.message,
            variant: "destructive"
          });
        }
        return;
      }

      if (!authData.user) {
        toast({
          title: "Authentication Error",
          description: "Failed to authenticate user",
          variant: "destructive"
        });
        return;
      }

      console.log('User authenticated successfully:', authData.user.email);

      // Check if the authenticated user has admin privileges
      const { data: adminData, error: adminError } = await supabase
        .from('admin_users')
        .select('role')
        .eq('user_id', authData.user.id)
        .maybeSingle();

      if (adminError) {
        console.error('Error checking admin privileges:', adminError);
        toast({
          title: "Admin Check Error",
          description: "Failed to verify admin privileges. Please try again.",
          variant: "destructive"
        });
        
        // Sign out the user since we couldn't verify admin status
        await supabase.auth.signOut();
        return;
      }

      const userIsAdmin = adminData?.role === 'admin';
      console.log('User admin status:', userIsAdmin);

      if (!userIsAdmin) {
        toast({
          title: "Access Denied",
          description: "You don't have administrator privileges. Only admin users can access the dashboard.",
          variant: "destructive"
        });
        
        // Sign out the non-admin user
        await supabase.auth.signOut();
        return;
      }

      // Success! User is authenticated and is an admin
      toast({
        title: "Admin Access Granted",
        description: `Welcome back, ${authData.user.email}!`,
      });

      // Proceed to admin dashboard
      onAdminVerified(authData.user);

    } catch (error) {
      console.error('Unexpected error during admin sign in:', error);
      toast({
        title: "Unexpected Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      setLoading(true);
      console.log('Signing out current user...');
      
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('Sign out error:', error);
        toast({
          title: "Sign Out Error",
          description: error.message,
          variant: "destructive"
        });
        return;
      }

      setCurrentUser(null);
      setIsAdmin(false);
      setEmail('');
      setPassword('');
      
      toast({
        title: "Signed Out",
        description: "You have been signed out successfully",
      });
    } catch (error) {
      console.error('Unexpected error during sign out:', error);
    } finally {
      setLoading(false);
    }
  };

  // Show loading state while checking authentication
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md p-8 text-center">
          <Shield className="h-16 w-16 text-orange-500 mx-auto mb-4 animate-pulse" />
          <h2 className="text-2xl font-display font-bold mb-2">Checking Authentication</h2>
          <p className="text-muted-foreground">Please wait...</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Shield className="h-12 w-12 text-orange-500 mr-2" />
            <Crown className="h-10 w-10 text-yellow-500" />
          </div>
          <h1 className="text-3xl font-display font-bold text-gradient mb-2">
            Admin Access
          </h1>
          <p className="text-muted-foreground">
            Administrator authentication required
          </p>
        </div>

        {currentUser && (
          <div className="mb-6 p-4 bg-muted rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
                  <Crown className="h-4 w-4 text-white" />
                </div>
                <div>
                  <p className="font-medium text-sm">{currentUser.email}</p>
                  <div className="flex items-center gap-1">
                    {isAdmin ? (
                      <>
                        <CheckCircle className="h-3 w-3 text-green-500" />
                        <span className="text-xs text-green-600">Admin Verified</span>
                      </>
                    ) : (
                      <>
                        <AlertTriangle className="h-3 w-3 text-red-500" />
                        <span className="text-xs text-red-600">No Admin Access</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSignOut}
                disabled={loading}
              >
                Sign Out
              </Button>
            </div>
            
            {isAdmin ? (
              <Button
                className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
                onClick={() => onAdminVerified(currentUser)}
                disabled={loading}
              >
                <Crown className="h-4 w-4 mr-2" />
                Access Admin Dashboard
              </Button>
            ) : (
              <div className="text-center">
                <p className="text-sm text-red-600 mb-2">
                  This account doesn't have admin privileges
                </p>
                <p className="text-xs text-muted-foreground">
                  Please sign in with an administrator account
                </p>
              </div>
            )}
          </div>
        )}

        {!currentUser && (
          <form onSubmit={handleSignIn} className="space-y-4">
            <div>
              <Label htmlFor="email">Admin Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@sweetartisan.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
                className="mt-1"
              />
            </div>
            
            <div>
              <Label htmlFor="password">Password</Label>
              <div className="relative mt-1">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter admin password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={loading}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Verifying...
                </div>
              ) : (
                <div className="flex items-center">
                  <Lock className="h-4 w-4 mr-2" />
                  Sign In as Admin
                </div>
              )}
            </Button>
          </form>
        )}

        <div className="mt-6 pt-6 border-t border-border">
          <div className="text-center space-y-2">
            <p className="text-xs text-muted-foreground">
              Only authorized administrators can access this area
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={onBack}
              disabled={loading}
            >
              Back to Store
            </Button>
          </div>
        </div>

        {/* Debug info in development */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-6 p-4 bg-gray-100 rounded-lg text-xs">
            <p className="font-bold mb-2">Debug Info:</p>
            <p>Current User: {currentUser?.email || 'None'}</p>
            <p>Is Admin: {isAdmin ? 'Yes' : 'No'}</p>
            <p>Loading: {loading ? 'Yes' : 'No'}</p>
            <p>Checking Auth: {isCheckingAuth ? 'Yes' : 'No'}</p>
          </div>
        )}
      </Card>
    </div>
  );
}
