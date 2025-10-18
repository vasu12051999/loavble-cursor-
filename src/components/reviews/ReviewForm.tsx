import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Star, Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const reviewSchema = z.object({
  rating: z.number().min(1).max(5),
  comment: z.string().min(10, 'Review must be at least 10 characters').max(500, 'Review must be less than 500 characters'),
});

type ReviewFormData = z.infer<typeof reviewSchema>;

interface ReviewFormProps {
  jobId: string;
  reviewedId: string;
  reviewedName: string;
  onSuccess?: () => void;
}

export function ReviewForm({ jobId, reviewedId, reviewedName, onSuccess }: ReviewFormProps) {
  const { user } = useAuth();
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [loading, setLoading] = useState(false);

  const form = useForm<ReviewFormData>({
    resolver: zodResolver(reviewSchema),
    defaultValues: {
      rating: 0,
      comment: '',
    },
  });

  const onSubmit = async (data: ReviewFormData) => {
    if (!user) {
      toast({
        title: 'Authentication required',
        description: 'Please log in to submit a review',
        variant: 'destructive',
      });
      return;
    }

    if (data.rating === 0) {
      toast({
        title: 'Rating required',
        description: 'Please select a star rating',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      // Check if review already exists
      const { data: existingReview } = await supabase
        .from('reviews')
        .select('id')
        .eq('job_id', jobId)
        .eq('reviewer_id', user.id)
        .maybeSingle();

      if (existingReview) {
        toast({
          title: 'Review already exists',
          description: 'You have already reviewed this job',
          variant: 'destructive',
        });
        return;
      }

      // Insert review
      const { error } = await supabase.from('reviews').insert({
        job_id: jobId,
        reviewer_id: user.id,
        reviewed_id: reviewedId,
        rating: data.rating,
        comment: data.comment,
      });

      if (error) throw error;

      toast({
        title: 'Review submitted!',
        description: 'Thank you for your feedback',
      });

      // Reset form
      form.reset();
      setRating(0);

      if (onSuccess) {
        onSuccess();
      }
    } catch (error: any) {
      toast({
        title: 'Failed to submit review',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <div>
        <Label className="text-base">How was your experience with {reviewedName}?</Label>
        <p className="text-sm text-muted-foreground mb-3">Click to rate</p>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => {
                setRating(star);
                form.setValue('rating', star);
              }}
              onMouseEnter={() => setHoveredRating(star)}
              onMouseLeave={() => setHoveredRating(0)}
              className="transition-transform hover:scale-110"
            >
              <Star
                className={cn(
                  'h-10 w-10 transition-colors',
                  (hoveredRating >= star || rating >= star)
                    ? 'fill-yellow-400 text-yellow-400'
                    : 'text-gray-300'
                )}
              />
            </button>
          ))}
        </div>
        {rating > 0 && (
          <p className="text-sm text-muted-foreground mt-2">
            {rating === 1 && 'Poor'}
            {rating === 2 && 'Fair'}
            {rating === 3 && 'Good'}
            {rating === 4 && 'Very Good'}
            {rating === 5 && 'Excellent'}
          </p>
        )}
      </div>

      <div>
        <Label htmlFor="comment">Your Review</Label>
        <Textarea
          id="comment"
          placeholder="Tell us about your experience..."
          className="min-h-32 mt-2"
          {...form.register('comment')}
        />
        <p className="text-xs text-muted-foreground mt-1">
          {form.watch('comment')?.length || 0}/500 characters
        </p>
        {form.formState.errors.comment && (
          <p className="text-sm text-destructive mt-1">
            {form.formState.errors.comment.message}
          </p>
        )}
      </div>

      <Button type="submit" disabled={loading || rating === 0} className="w-full">
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Submitting...
          </>
        ) : (
          'Submit Review'
        )}
      </Button>
    </form>
  );
}
