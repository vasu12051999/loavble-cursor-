import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ReviewCard } from './ReviewCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Star } from 'lucide-react';

interface Review {
  id: string;
  rating: number;
  comment: string;
  created_at: string;
  reviewer: {
    id: string;
    full_name: string;
    avatar_url?: string;
  };
}

interface ReviewsListProps {
  userId: string;
  limit?: number;
}

export function ReviewsList({ userId, limit }: ReviewsListProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    averageRating: 0,
    totalReviews: 0,
    ratingDistribution: {
      5: 0,
      4: 0,
      3: 0,
      2: 0,
      1: 0,
    },
  });
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    fetchReviews();
  }, [userId]);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      // Fetch reviews with reviewer profile info
      let query = supabase
        .from('reviews')
        .select(`
          id,
          rating,
          comment,
          created_at,
          reviewer:profiles!reviews_reviewer_id_fkey(
            id,
            full_name,
            avatar_url
          )
        `)
        .eq('reviewed_id', userId)
        .order('created_at', { ascending: false });

      if (limit && !showAll) {
        query = query.limit(limit);
      }

      const { data, error } = await query;

      if (error) throw error;

      if (data) {
        // Transform the data to match our interface
        const transformedReviews = data.map((review: any) => ({
          ...review,
          reviewer: Array.isArray(review.reviewer) ? review.reviewer[0] : review.reviewer,
        }));
        
        setReviews(transformedReviews);
        calculateStats(transformedReviews);
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (reviewsList: Review[]) => {
    if (reviewsList.length === 0) {
      setStats({
        averageRating: 0,
        totalReviews: 0,
        ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
      });
      return;
    }

    const totalRating = reviewsList.reduce((sum, r) => sum + r.rating, 0);
    const avgRating = totalRating / reviewsList.length;

    const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviewsList.forEach((review) => {
      distribution[review.rating as keyof typeof distribution]++;
    });

    setStats({
      averageRating: avgRating,
      totalReviews: reviewsList.length,
      ratingDistribution: distribution,
    });
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-32 w-full" />
        ))}
      </div>
    );
  }

  if (reviews.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Star className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>No reviews yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Rating Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="text-5xl font-bold">{stats.averageRating.toFixed(1)}</div>
            <div>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`h-5 w-5 ${
                      star <= Math.round(stats.averageRating)
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-gray-300'
                    }`}
                  />
                ))}
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Based on {stats.totalReviews} {stats.totalReviews === 1 ? 'review' : 'reviews'}
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          {[5, 4, 3, 2, 1].map((rating) => {
            const count = stats.ratingDistribution[rating as keyof typeof stats.ratingDistribution];
            const percentage = stats.totalReviews > 0 ? (count / stats.totalReviews) * 100 : 0;
            
            return (
              <div key={rating} className="flex items-center gap-3">
                <div className="flex items-center gap-1 w-16">
                  <span className="text-sm font-medium">{rating}</span>
                  <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                </div>
                <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-yellow-400 transition-all"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <span className="text-sm text-muted-foreground w-12 text-right">
                  {count}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Reviews List */}
      <div className="space-y-4">
        {reviews.map((review) => (
          <ReviewCard key={review.id} review={review} />
        ))}
      </div>

      {/* Load More Button */}
      {limit && reviews.length >= limit && !showAll && (
        <div className="text-center">
          <Button variant="outline" onClick={() => setShowAll(true)}>
            Show All Reviews
          </Button>
        </div>
      )}
    </div>
  );
}
