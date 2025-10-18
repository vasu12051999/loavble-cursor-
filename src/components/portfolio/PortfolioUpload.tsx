import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { Upload, X, Loader2, Plus, Image as ImageIcon } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Switch } from '@/components/ui/switch';

interface PortfolioUploadProps {
  onUploadComplete?: () => void;
}

export function PortfolioUpload({ onUploadComplete }: PortfolioUploadProps) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [beforeImage, setBeforeImage] = useState('');
  const [afterImage, setAfterImage] = useState('');
  const [completedDate, setCompletedDate] = useState('');
  const [isFeatured, setIsFeatured] = useState(false);
  const [hasBeforeAfter, setHasBeforeAfter] = useState(false);

  // Categories
  const [categories, setCategories] = useState<any[]>([]);

  useState(() => {
    fetchCategories();
  });

  const fetchCategories = async () => {
    const { data } = await supabase.from('categories').select('*').order('name');
    if (data) setCategories(data);
  };

  const handleImageUpload = async (file: File, type: 'gallery' | 'before' | 'after') => {
    if (!user) return;

    setUploading(true);
    try {
      // Validate file
      if (!file.type.startsWith('image/')) {
        throw new Error('File must be an image');
      }
      if (file.size > 10 * 1024 * 1024) {
        throw new Error('Image must be less than 10MB');
      }

      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError, data } = await supabase.storage
        .from('portfolio')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('portfolio')
        .getPublicUrl(fileName);

      if (type === 'gallery') {
        setImages([...images, publicUrl]);
      } else if (type === 'before') {
        setBeforeImage(publicUrl);
      } else if (type === 'after') {
        setAfterImage(publicUrl);
      }

      toast({ title: 'Image uploaded successfully!' });
    } catch (error: any) {
      toast({
        title: 'Error uploading image',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  const removeImage = async (url: string, type: 'gallery' | 'before' | 'after') => {
    // Extract file path from URL
    const path = url.split('/portfolio/')[1];
    if (path) {
      await supabase.storage.from('portfolio').remove([path]);
    }

    if (type === 'gallery') {
      setImages(images.filter(img => img !== url));
    } else if (type === 'before') {
      setBeforeImage('');
    } else if (type === 'after') {
      setAfterImage('');
    }
  };

  const handleSubmit = async () => {
    if (!user || !title || images.length === 0) {
      toast({
        title: 'Missing required fields',
        description: 'Please provide a title and at least one image',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.from('portfolio_items').insert({
        provider_id: user.id,
        title,
        description,
        category_id: categoryId || null,
        images,
        before_image: hasBeforeAfter ? beforeImage : null,
        after_image: hasBeforeAfter ? afterImage : null,
        completed_date: completedDate || null,
        is_featured: isFeatured,
      });

      if (error) throw error;

      toast({ title: 'Portfolio item added successfully!' });
      resetForm();
      setOpen(false);
      onUploadComplete?.();
    } catch (error: any) {
      toast({
        title: 'Error adding portfolio item',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setCategoryId('');
    setImages([]);
    setBeforeImage('');
    setAfterImage('');
    setCompletedDate('');
    setIsFeatured(false);
    setHasBeforeAfter(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Portfolio Item
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Portfolio Item</DialogTitle>
          <DialogDescription>
            Showcase your work by adding photos and details
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Project Title *</Label>
            <Input
              id="title"
              placeholder="e.g., Modern Kitchen Renovation"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Describe the project, challenges, and results..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
            />
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger id="category">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Completed Date */}
          <div className="space-y-2">
            <Label htmlFor="date">Completed Date</Label>
            <Input
              id="date"
              type="date"
              value={completedDate}
              onChange={(e) => setCompletedDate(e.target.value)}
            />
          </div>

          {/* Featured */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="featured">Feature this item</Label>
              <p className="text-sm text-muted-foreground">
                Show prominently on your profile
              </p>
            </div>
            <Switch
              id="featured"
              checked={isFeatured}
              onCheckedChange={setIsFeatured}
            />
          </div>

          {/* Before/After Toggle */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="before-after">Before & After Photos</Label>
              <p className="text-sm text-muted-foreground">
                Add before and after comparison
              </p>
            </div>
            <Switch
              id="before-after"
              checked={hasBeforeAfter}
              onCheckedChange={setHasBeforeAfter}
            />
          </div>

          {/* Before/After Images */}
          {hasBeforeAfter && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Before Photo</Label>
                {beforeImage ? (
                  <Card className="relative aspect-video">
                    <img
                      src={beforeImage}
                      alt="Before"
                      className="w-full h-full object-cover rounded-lg"
                    />
                    <Button
                      size="icon"
                      variant="destructive"
                      className="absolute top-2 right-2"
                      onClick={() => removeImage(beforeImage, 'before')}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </Card>
                ) : (
                  <label className="flex flex-col items-center justify-center aspect-video border-2 border-dashed rounded-lg cursor-pointer hover:bg-accent/50 transition-colors">
                    <ImageIcon className="h-8 w-8 mb-2 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Upload Before</span>
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleImageUpload(file, 'before');
                      }}
                      disabled={uploading}
                    />
                  </label>
                )}
              </div>

              <div className="space-y-2">
                <Label>After Photo</Label>
                {afterImage ? (
                  <Card className="relative aspect-video">
                    <img
                      src={afterImage}
                      alt="After"
                      className="w-full h-full object-cover rounded-lg"
                    />
                    <Button
                      size="icon"
                      variant="destructive"
                      className="absolute top-2 right-2"
                      onClick={() => removeImage(afterImage, 'after')}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </Card>
                ) : (
                  <label className="flex flex-col items-center justify-center aspect-video border-2 border-dashed rounded-lg cursor-pointer hover:bg-accent/50 transition-colors">
                    <ImageIcon className="h-8 w-8 mb-2 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Upload After</span>
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleImageUpload(file, 'after');
                      }}
                      disabled={uploading}
                    />
                  </label>
                )}
              </div>
            </div>
          )}

          {/* Gallery Images */}
          <div className="space-y-2">
            <Label>Project Photos * (1-10 images)</Label>
            <div className="grid grid-cols-3 gap-4">
              {images.map((img, idx) => (
                <Card key={idx} className="relative aspect-square">
                  <img
                    src={img}
                    alt={`Gallery ${idx + 1}`}
                    className="w-full h-full object-cover rounded-lg"
                  />
                  <Button
                    size="icon"
                    variant="destructive"
                    className="absolute top-2 right-2"
                    onClick={() => removeImage(img, 'gallery')}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </Card>
              ))}

              {images.length < 10 && (
                <label className="flex flex-col items-center justify-center aspect-square border-2 border-dashed rounded-lg cursor-pointer hover:bg-accent/50 transition-colors">
                  {uploading ? (
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  ) : (
                    <>
                      <Upload className="h-8 w-8 mb-2 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Add Photo</span>
                    </>
                  )}
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleImageUpload(file, 'gallery');
                    }}
                    disabled={uploading}
                  />
                </label>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Upload up to 10 images. Max 10MB per image.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading || uploading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Add to Portfolio
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
