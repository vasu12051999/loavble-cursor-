import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Star } from 'lucide-react';
import { ReviewForm } from './ReviewForm';
import { ReactNode, useState } from 'react';

interface ReviewDialogProps {
  jobId: string;
  reviewedId: string;
  reviewedName: string;
  trigger?: ReactNode;
}

export function ReviewDialog({ jobId, reviewedId, reviewedName, trigger }: ReviewDialogProps) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline">
            <Star className="mr-2 h-4 w-4" />
            Leave Review
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Write a Review</DialogTitle>
          <DialogDescription>
            Share your experience working with {reviewedName}
          </DialogDescription>
        </DialogHeader>
        <ReviewForm
          jobId={jobId}
          reviewedId={reviewedId}
          reviewedName={reviewedName}
          onSuccess={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
