import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Upload, ArrowLeft, ArrowRight, Check, X, Image as ImageIcon, Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useFileUpload } from '@/hooks/useFileUpload';

const formSchema = z.object({
  title: z.string().min(20, 'Title must be at least 20 characters'),
  description: z.string().min(50, 'Description must be at least 50 characters'),
  category_id: z.string().min(1, 'Please select a category'),
  budget: z.string().min(1, 'Budget is required'),
  location: z.string().min(5, 'Location is required'),
  media_urls: z.array(z.string()).optional(),
});

type FormData = z.infer<typeof formSchema>;

export default function NewJob() {
  const [step, setStep] = useState(1);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploadedPhotos, setUploadedPhotos] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const { uploadFile, uploading, deleteFile } = useFileUpload({
    bucket: 'job-photos',
    maxSizeMB: 10,
    allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
    onSuccess: (url) => {
      setUploadedPhotos(prev => [...prev, url]);
      form.setValue('media_urls', [...uploadedPhotos, url]);
    },
  });

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      description: '',
      category_id: '',
      budget: '',
      location: '',
      media_urls: [],
    },
  });

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      const { data, error } = await supabase.from('categories').select('*');
      if (error) {
        toast({ 
          title: 'Error loading categories', 
          description: 'Failed to load job categories', 
          variant: 'destructive' 
        });
      }
      setCategories(data || []);
    };
    fetchCategories();
  }, []);

  const onSubmit = async (data: FormData) => {
    if (!user) {
      toast({ 
        title: 'Authentication required', 
        description: 'Please log in to post a job', 
        variant: 'destructive' 
      });
      navigate('/auth/login');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.from('jobs').insert({
        customer_id: user.id,
        title: data.title,
        description: data.description,
        category_id: data.category_id,
        budget: parseFloat(data.budget),
        location: data.location,
        media_urls: uploadedPhotos,
      });

      if (error) {
        throw error;
      }

      toast({ title: 'Job posted successfully!' });
      navigate('/jobs');
    } catch (error: any) {
      toast({ 
        title: 'Error posting job', 
        description: 'Failed to post your job. Please try again.', 
        variant: 'destructive' 
      });
    } finally {
      setLoading(false);
    }
  };

  const nextStep = async () => {
    const fields = step === 1 ? ['title', 'description', 'category_id'] : step === 2 ? ['budget', 'location'] : [];
    const valid = await form.trigger(fields as any);
    if (valid) setStep(step + 1);
  };

  const prevStep = () => setStep(step - 1);

  const progress = (step / 4) * 100;

  return (
    <div className="container max-w-3xl py-8">
      <Card>
        <CardHeader>
          <CardTitle>Post a New Job</CardTitle>
          <CardDescription>Step {step} of 4</CardDescription>
          <Progress value={progress} className="mt-2" />
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {step === 1 && (
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Job Title</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., House cleaning needed" {...field} />
                        </FormControl>
                        <p className="text-sm text-muted-foreground">{field.value.length}/100</p>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Describe the job in detail..."
                            className="min-h-32"
                            {...field}
                          />
                        </FormControl>
                        <p className="text-sm text-muted-foreground">{field.value.length}/500</p>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="category_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a category" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {categories.map((cat) => (
                              <SelectItem key={cat.id} value={cat.id}>
                                {cat.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              {step === 2 && (
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="budget"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Budget ($)</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="100" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="location"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Location</FormLabel>
                        <FormControl>
                          <Input placeholder="City, State" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              {step === 3 && (
                <div className="space-y-4">
                  <div className="space-y-4">
                    <h3 className="font-semibold">Add Photos (Optional)</h3>
                    <p className="text-sm text-muted-foreground">Upload up to 5 photos to help providers understand your needs better</p>
                    
                    {/* Photo Grid */}
                    {uploadedPhotos.length > 0 && (
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {uploadedPhotos.map((url, index) => (
                          <div key={index} className="relative group aspect-square">
                            <img 
                              src={url} 
                              alt={`Job photo ${index + 1}`}
                              className="w-full h-full object-cover rounded-lg"
                            />
                            <Button
                              size="icon"
                              variant="destructive"
                              className="absolute top-2 right-2 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={async () => {
                                await deleteFile(url);
                                const newPhotos = uploadedPhotos.filter((_, i) => i !== index);
                                setUploadedPhotos(newPhotos);
                                form.setValue('media_urls', newPhotos);
                              }}
                              type="button"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {/* Upload Area */}
                    {uploadedPhotos.length < 5 && (
                      <div>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                          className="hidden"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (file && user) {
                              await uploadFile(file, user.id);
                              e.target.value = ''; // Reset input
                            }
                          }}
                          disabled={uploading}
                        />
                        <div 
                          className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary transition-colors"
                          onClick={() => !uploading && fileInputRef.current?.click()}
                        >
                          {uploading ? (
                            <>
                              <Loader2 className="mx-auto h-12 w-12 text-primary mb-4 animate-spin" />
                              <p className="text-sm text-muted-foreground">Uploading photo...</p>
                            </>
                          ) : (
                            <>
                              <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                              <p className="text-sm text-muted-foreground">
                                Click to select photos or drag and drop
                              </p>
                              <p className="text-xs text-muted-foreground mt-2">
                                {uploadedPhotos.length} of 5 photos uploaded
                              </p>
                            </>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {step === 4 && (
                <div className="space-y-4">
                  <h3 className="font-semibold">Review Your Job</h3>
                  <div className="space-y-2 text-sm">
                    <p><strong>Title:</strong> {form.getValues('title')}</p>
                    <p><strong>Description:</strong> {form.getValues('description')}</p>
                    <p><strong>Budget:</strong> ${form.getValues('budget')}</p>
                    <p><strong>Location:</strong> {form.getValues('location')}</p>
                  </div>
                  <div className="flex items-start space-x-2">
                    <input type="checkbox" id="terms" className="mt-1" required />
                    <label htmlFor="terms" className="text-sm">
                      I agree to the terms and conditions
                    </label>
                  </div>
                </div>
              )}

              <div className="flex justify-between pt-4">
                {step > 1 && (
                  <Button type="button" variant="outline" onClick={prevStep}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back
                  </Button>
                )}
                {step < 4 ? (
                  <Button type="button" onClick={nextStep} className="ml-auto">
                    Next
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                ) : (
                  <Button type="submit" disabled={loading} className="ml-auto">
                    <Check className="mr-2 h-4 w-4" />
                    {loading ? 'Posting...' : 'Publish Job'}
                  </Button>
                )}
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
