import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Star, PlayCircle, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface JobStatusActionsProps {
  job: any;
  isOwner: boolean;
  isProvider: boolean;
  onStatusChange: () => void;
}

export function JobStatusActions({ job, isOwner, isProvider, onStatusChange }: JobStatusActionsProps) {
  const [loading, setLoading] = useState(false);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [reviewComment, setReviewComment] = useState('');
  const [cancelReason, setCancelReason] = useState('');

  const handleStartJob = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('jobs')
        .update({ status: 'in_progress' })
        .eq('id', job.id);

      if (error) throw error;

      toast({ title: 'Job started!', description: 'The job is now in progress.' });
      onStatusChange();
    } catch (error: any) {
      toast({ 
        title: 'Error', 
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteJob = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('jobs')
        .update({ status: 'completed' })
        .eq('id', job.id);

      if (error) throw error;

      toast({ 
        title: 'Job completed!', 
        description: 'Please leave a review for the provider.' 
      });
      onStatusChange();
      
      // Open review dialog
      if (isOwner) {
        setReviewDialogOpen(true);
      }
    } catch (error: any) {
      toast({ 
        title: 'Error', 
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancelJob = async (reason: string) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('jobs')
        .update({ status: 'canceled' })
        .eq('id', job.id);

      if (error) throw error;

      toast({ 
        title: 'Job canceled', 
        description: 'The job has been canceled successfully.' 
      });
      onStatusChange();
    } catch (error: any) {
      toast({ 
        title: 'Error', 
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitReview = async () => {
    if (rating === 0) {
      toast({ 
        title: 'Rating required', 
        description: 'Please select a rating',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.from('reviews').insert({
        job_id: job.id,
        reviewer_id: job.customer_id,
        reviewed_id: job.awarded_provider_id,
        rating,
        comment: reviewComment,
      });

      if (error) throw error;

      toast({ title: 'Review submitted!', description: 'Thank you for your feedback.' });
      setReviewDialogOpen(false);
      setRating(0);
      setReviewComment('');
    } catch (error: any) {
      toast({ 
        title: 'Error', 
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  // Only show actions for owner or awarded provider
  const isAwardedProvider = isProvider && job.awarded_provider_id === job.awarded_provider_id;

  if (!isOwner && !isAwardedProvider) {
    return null;
  }

  return (
    <div className="space-y-3">
      {/* Start Job - Only when awarded */}
      {job.status === 'awarded' && (isOwner || isAwardedProvider) && (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button className="w-full" disabled={loading}>
              <PlayCircle className="mr-2 h-4 w-4" />
              Start Job
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Start this job?</AlertDialogTitle>
              <AlertDialogDescription>
                This will mark the job as in progress. The provider can begin working on the project.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleStartJob} disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Start Job
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      {/* Complete Job - Only when in progress */}
      {job.status === 'in_progress' && (isOwner || isAwardedProvider) && (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button className="w-full" disabled={loading}>
              <CheckCircle className="mr-2 h-4 w-4" />
              Complete Job
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Mark job as completed?</AlertDialogTitle>
              <AlertDialogDescription>
                This will mark the job as completed. {isOwner && "You'll be prompted to leave a review for the provider."}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleCompleteJob} disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Complete Job
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      {/* Cancel Job - Available for open, awarded, and in_progress */}
      {['open', 'awarded', 'in_progress'].includes(job.status) && isOwner && (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" className="w-full" disabled={loading}>
              <XCircle className="mr-2 h-4 w-4" />
              Cancel Job
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Cancel this job?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. The job will be marked as canceled and all bids will be rejected.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="py-4">
              <Label htmlFor="cancel-reason">Reason for cancellation (optional)</Label>
              <Textarea
                id="cancel-reason"
                placeholder="Let us know why you're canceling..."
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="mt-2"
              />
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel>Keep Job</AlertDialogCancel>
              <AlertDialogAction 
                onClick={() => handleCancelJob(cancelReason)} 
                disabled={loading}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Cancel Job
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      {/* Review Dialog */}
      <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Leave a Review</DialogTitle>
            <DialogDescription>
              How was your experience with the provider?
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Rating</Label>
              <div className="flex gap-1 mt-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className="focus:outline-none"
                  >
                    <Star
                      className={`h-8 w-8 transition-colors ${
                        star <= rating
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-gray-300'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label htmlFor="review-comment">Comment (optional)</Label>
              <Textarea
                id="review-comment"
                placeholder="Share your experience..."
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                className="mt-2"
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setReviewDialogOpen(false)}
              disabled={loading}
            >
              Skip
            </Button>
            <Button
              type="button"
              onClick={handleSubmitReview}
              disabled={loading}
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Submit Review
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
