import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Mail, X, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export function EmailVerificationBanner() {
  const { user } = useAuth();
  const [dismissed, setDismissed] = useState(false);
  const [resending, setResending] = useState(false);

  // Check if email is verified
  const isEmailVerified = user?.email_confirmed_at !== null && user?.email_confirmed_at !== undefined;

  if (!user || isEmailVerified || dismissed) {
    return null;
  }

  const handleResendVerification = async () => {
    if (!user?.email) return;

    setResending(true);
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: user.email,
      });

      if (error) throw error;

      toast({
        title: 'Verification email sent!',
        description: 'Please check your inbox and spam folder.',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to resend verification email',
        variant: 'destructive',
      });
    } finally {
      setResending(false);
    }
  };

  return (
    <Alert className="relative border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20">
      <Mail className="h-4 w-4 text-yellow-600 dark:text-yellow-500" />
      <AlertDescription className="flex items-center justify-between gap-4 pr-8">
        <div className="flex-1">
          <span className="font-medium">Verify your email address</span>
          <p className="text-sm text-muted-foreground mt-1">
            We sent a verification email to <strong>{user.email}</strong>. 
            Please check your inbox and click the link to verify your account.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleResendVerification}
            disabled={resending}
            className="whitespace-nowrap"
          >
            {resending && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}
            Resend Email
          </Button>
        </div>
      </AlertDescription>
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-2 right-2 h-6 w-6"
        onClick={() => setDismissed(true)}
      >
        <X className="h-4 w-4" />
      </Button>
    </Alert>
  );
}
