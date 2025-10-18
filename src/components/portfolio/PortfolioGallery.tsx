import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { Star, Calendar, Trash2, ChevronLeft, ChevronRight, ArrowLeftRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { PortfolioUpload } from './PortfolioUpload';

interface PortfolioGalleryProps {
  providerId: string;
  isOwnProfile?: boolean;
}

export function PortfolioGallery({ providerId, isOwnProfile }: PortfolioGalleryProps) {
  const [portfolioItems, setPortfolioItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showBeforeAfter, setShowBeforeAfter] = useState<'before' | 'after'>('before');

  useEffect(() => {
    fetchPortfolio();
  }, [providerId]);

  const fetchPortfolio = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('portfolio_items')
      .select('*, categories(name)')
      .eq('provider_id', providerId)
      .order('is_featured', { ascending: false })
      .order('created_at', { ascending: false });

    if (!error && data) {
      setPortfolioItems(data);
    }
    setLoading(false);
  };

  const deleteItem = async (itemId: string) => {
    try {
      const { error } = await supabase
        .from('portfolio_items')
        .delete()
        .eq('id', itemId);

      if (error) throw error;

      toast({ title: 'Portfolio item deleted' });
      fetchPortfolio();
    } catch (error: any) {
      toast({
        title: 'Error deleting item',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const openItem = (item: any) => {
    setSelectedItem(item);
    setCurrentImageIndex(0);
    setShowBeforeAfter('before');
  };

  const nextImage = () => {
    if (selectedItem && currentImageIndex < selectedItem.images.length - 1) {
      setCurrentImageIndex(currentImageIndex + 1);
    }
  };

  const prevImage = () => {
    if (currentImageIndex > 0) {
      setCurrentImageIndex(currentImageIndex - 1);
    }
  };

  if (loading) {
    return <div>Loading portfolio...</div>;
  }

  return (
    <div className="space-y-4">
      {isOwnProfile && (
        <div className="flex justify-between items-center">
          <p className="text-sm text-muted-foreground">
            {portfolioItems.length} portfolio {portfolioItems.length === 1 ? 'item' : 'items'}
          </p>
          <PortfolioUpload onUploadComplete={fetchPortfolio} />
        </div>
      )}

      {portfolioItems.length === 0 ? (
        <Card className="p-12 text-center">
          <p className="text-muted-foreground">
            {isOwnProfile ? 'Add your first portfolio item to showcase your work' : 'No portfolio items yet'}
          </p>
          {isOwnProfile && (
            <PortfolioUpload onUploadComplete={fetchPortfolio} />
          )}
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {portfolioItems.map((item) => (
            <Card key={item.id} className="overflow-hidden group cursor-pointer" onClick={() => openItem(item)}>
              <div className="relative aspect-square">
                <img
                  src={item.images[0]}
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                {item.is_featured && (
                  <Badge className="absolute top-2 right-2">
                    <Star className="h-3 w-3 mr-1" />
                    Featured
                  </Badge>
                )}
                {item.before_image && item.after_image && (
                  <Badge variant="secondary" className="absolute top-2 left-2">
                    <ArrowLeftRight className="h-3 w-3 mr-1" />
                    Before/After
                  </Badge>
                )}
                {item.images.length > 1 && (
                  <Badge variant="secondary" className="absolute bottom-2 right-2">
                    +{item.images.length - 1} more
                  </Badge>
                )}
              </div>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold truncate">{item.title}</h3>
                    {item.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                        {item.description}
                      </p>
                    )}
                    <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                      {item.categories && (
                        <Badge variant="outline" className="text-xs">
                          {item.categories.name}
                        </Badge>
                      )}
                      {item.completed_date && (
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(item.completed_date).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                  {isOwnProfile && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="shrink-0"
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete portfolio item?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete this portfolio item.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => deleteItem(item.id)}
                            className="bg-destructive text-destructive-foreground"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Portfolio Item Detail Dialog */}
      <Dialog open={!!selectedItem} onOpenChange={() => setSelectedItem(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{selectedItem?.title}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Before/After Toggle */}
            {selectedItem?.before_image && selectedItem?.after_image && (
              <div className="flex items-center justify-center gap-2">
                <Button
                  variant={showBeforeAfter === 'before' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setShowBeforeAfter('before')}
                >
                  Before
                </Button>
                <Button
                  variant={showBeforeAfter === 'after' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setShowBeforeAfter('after')}
                >
                  After
                </Button>
              </div>
            )}

            {/* Image Display */}
            {selectedItem?.before_image && selectedItem?.after_image ? (
              <div className="relative aspect-video bg-muted rounded-lg overflow-hidden">
                <img
                  src={showBeforeAfter === 'before' ? selectedItem.before_image : selectedItem.after_image}
                  alt={showBeforeAfter === 'before' ? 'Before' : 'After'}
                  className="w-full h-full object-contain"
                />
                <Badge className="absolute top-2 left-2">
                  {showBeforeAfter === 'before' ? 'Before' : 'After'}
                </Badge>
              </div>
            ) : (
              selectedItem?.images && (
                <div className="relative aspect-video bg-muted rounded-lg overflow-hidden">
                  <img
                    src={selectedItem.images[currentImageIndex]}
                    alt={`${selectedItem.title} - Image ${currentImageIndex + 1}`}
                    className="w-full h-full object-contain"
                  />
                  {selectedItem.images.length > 1 && (
                    <>
                      <Button
                        variant="secondary"
                        size="icon"
                        className="absolute left-2 top-1/2 -translate-y-1/2"
                        onClick={prevImage}
                        disabled={currentImageIndex === 0}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="secondary"
                        size="icon"
                        className="absolute right-2 top-1/2 -translate-y-1/2"
                        onClick={nextImage}
                        disabled={currentImageIndex === selectedItem.images.length - 1}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                      <Badge className="absolute bottom-2 right-2">
                        {currentImageIndex + 1} / {selectedItem.images.length}
                      </Badge>
                    </>
                  )}
                </div>
              )
            )}

            {/* Thumbnails */}
            {selectedItem?.images && selectedItem.images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto">
                {selectedItem.images.map((img: string, idx: number) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentImageIndex(idx)}
                    className={`relative aspect-square w-20 h-20 rounded-lg overflow-hidden border-2 transition-colors ${
                      idx === currentImageIndex ? 'border-primary' : 'border-transparent'
                    }`}
                  >
                    <img src={img} alt={`Thumbnail ${idx + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}

            {/* Description and Details */}
            <div className="space-y-2">
              {selectedItem?.description && (
                <div>
                  <h4 className="font-semibold mb-1">Description</h4>
                  <p className="text-muted-foreground">{selectedItem.description}</p>
                </div>
              )}
              <div className="flex items-center gap-4 text-sm">
                {selectedItem?.categories && (
                  <Badge variant="secondary">{selectedItem.categories.name}</Badge>
                )}
                {selectedItem?.completed_date && (
                  <span className="flex items-center gap-1 text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    Completed: {new Date(selectedItem.completed_date).toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
