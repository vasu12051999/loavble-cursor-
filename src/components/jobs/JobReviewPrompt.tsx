import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle } from 'lucide-react';
import { ReviewDialog } from '@/components/reviews/ReviewDialog';

interface JobReviewPromptProps {
  jobId: string;
  jobTitle: string;
}

export function JobReviewPrompt({ jobId, jobTitle }: JobReviewPromptProps) {
  const { user } = useAuth();
  const [canReview, setCanReview] = useState(false);
  const [reviewTarget, setReviewTarget] = useState<{
    id: string;
    name: string;
    role: 'customer' | 'provider';
  } | null>(null);
  const [hasReviewed, setHasReviewed] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkReviewStatus();
  }, [jobId, user]);

  const checkReviewStatus = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      // Get job details
      const { data: job } = await supabase
        .from('jobs')
        .select('customer_id, awarded_provider_id, status')
        .eq('id', jobId)
        .single();

      if (!job || job.status !== 'completed') {
        setLoading(false);
        return;
      }

      // Check if user already reviewed this job
      const { data: existingReview } = await supabase
        .from('reviews')
        .select('id')
        .eq('job_id', jobId)
        .eq('reviewer_id', user.id)
        .maybeSingle();

      if (existingReview) {
        setHasReviewed(true);
        setLoading(false);
        return;
      }

      // Determine who should be reviewed
      let targetId: string | null = null;
      let targetRole: 'customer' | 'provider' | null = null;

      if (user.id === job.customer_id && job.awarded_provider_id) {
        targetId = job.awarded_provider_id;
        targetRole = 'provider';
      } else if (user.id === job.awarded_provider_id) {
        targetId = job.customer_id;
        targetRole = 'customer';
      }

      if (targetId && targetRole) {
        // Get target user's name
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', targetId)
          .single();

        setReviewTarget({
          id: targetId,
          name: profile?.full_name || 'User',
          role: targetRole,
        });
        setCanReview(true);
      }
    } catch (error) {
      console.error('Error checking review status:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !canReview || !reviewTarget) {
    return null;
  }

  if (hasReviewed) {
    return (
      <Alert className="border-green-200 bg-green-50">
        <CheckCircle className="h-4 w-4 text-green-600" />
        <AlertDescription className="text-green-800">
          Thank you for your review!
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardHeader>
        <CardTitle>How was your experience?</CardTitle>
        <CardDescription>
          Help other users by sharing your experience working with {reviewTarget.name}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ReviewDialog
          jobId={jobId}
          reviewedId={reviewTarget.id}
          reviewedName={reviewTarget.name}
        />
      </CardContent>
    </Card>
  );
}
