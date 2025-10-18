import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { useFileUpload } from '@/hooks/useFileUpload';
import { Upload, Save, Loader2, X } from 'lucide-react';

const profileSchema = z.object({
  full_name: z.string().min(2, 'Name must be at least 2 characters'),
  bio: z.string().max(500, 'Bio must be less than 500 characters').optional(),
  location: z.string().optional(),
  phone: z.string().optional(),
  language_preference: z.enum(['en', 'es']),
});

type ProfileFormData = z.infer<typeof profileSchema>;

export default function EditProfile() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { uploadFile, uploading, deleteFile } = useFileUpload({
    bucket: 'avatars',
    maxSizeMB: 5,
    allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
    onSuccess: (url) => {
      setAvatarUrl(url);
    },
  });

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      full_name: '',
      bio: '',
      location: '',
      phone: '',
      language_preference: 'en',
    },
  });

  useEffect(() => {
    fetchProfile();
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        toast({ 
          title: 'Error loading profile', 
          description: error.message, 
          variant: 'destructive' 
        });
        return;
      }

      if (data) {
        setProfile(data);
        setAvatarUrl(data.avatar_url);
        form.reset({
          full_name: data.full_name || '',
          bio: data.bio || '',
          location: data.location || '',
          phone: data.phone || '',
          language_preference: (data.language_preference === 'es' ? 'es' : 'en') as 'en' | 'es',
        });
      }
    } catch (error: any) {
      console.error('Unexpected error:', error);
      toast({ 
        title: 'Error loading profile', 
        description: error.message, 
        variant: 'destructive' 
      });
    }
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    // Upload the file
    await uploadFile(file, user.id);
  };

  const handleRemoveAvatar = async () => {
    if (!avatarUrl || !user) return;

    // Delete old avatar from storage
    await deleteFile(avatarUrl);
    
    // Update profile to remove avatar_url
    await supabase
      .from('profiles')
      .update({ avatar_url: null })
      .eq('id', user.id);
    
    setAvatarUrl(null);
  };

  const onSubmit = async (data: ProfileFormData) => {
    if (!user) return;

    setLoading(true);
    try {
      // Update profile with avatar URL
      const { error } = await supabase
        .from('profiles')
        .update({
          ...data,
          avatar_url: avatarUrl,
        })
        .eq('id', user.id);

      if (error) throw error;

      toast({ title: 'Profile updated successfully!' });
      navigate(`/profile/${user.id}`);
    } catch (error: any) {
      toast({ 
        title: 'Error updating profile', 
        description: error.message, 
        variant: 'destructive' 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 py-8 px-4">
        <div className="container max-w-4xl">
          <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Edit Profile</h1>
          <p className="text-muted-foreground">Update your personal information</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Profile Photo</CardTitle>
            <CardDescription>Upload a profile picture (Max 5MB)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-6">
              <div className="relative">
                <Avatar className="h-24 w-24">
                  {avatarUrl ? (
                    <AvatarImage src={avatarUrl} alt={profile?.full_name || 'Avatar'} />
                  ) : (
                    <AvatarFallback className="text-2xl">
                      {profile?.full_name?.[0] || 'U'}
                    </AvatarFallback>
                  )}
                </Avatar>
                {avatarUrl && !uploading && (
                  <Button
                    size="icon"
                    variant="destructive"
                    className="absolute -top-2 -right-2 h-8 w-8 rounded-full"
                    onClick={handleRemoveAvatar}
                    type="button"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
              <div className="space-y-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                  className="hidden"
                  onChange={handleFileSelect}
                  disabled={uploading}
                />
                <Button 
                  variant="outline" 
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  type="button"
                >
                  {uploading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      Upload Photo
                    </>
                  )}
                </Button>
                <p className="text-xs text-muted-foreground">
                  JPG, PNG, GIF or WebP. Max size 5MB
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="full_name">Full Name</Label>
                <Input
                  id="full_name"
                  {...form.register('full_name')}
                  placeholder="John Doe"
                />
                {form.formState.errors.full_name && (
                  <p className="text-sm text-destructive mt-1">
                    {form.formState.errors.full_name.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  {...form.register('bio')}
                  placeholder="Tell us about yourself..."
                  className="min-h-32"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {form.watch('bio')?.length || 0}/500 characters
                </p>
                {form.formState.errors.bio && (
                  <p className="text-sm text-destructive mt-1">
                    {form.formState.errors.bio.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  {...form.register('location')}
                  placeholder="City, State"
                />
              </div>

              <div>
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  {...form.register('phone')}
                  placeholder="+1 (555) 123-4567"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Preferences</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="language_preference">Language Preference</Label>
                <Select
                  value={form.watch('language_preference')}
                  onValueChange={(value) => 
                    form.setValue('language_preference', value as 'en' | 'es')
                  }
                >
                  <SelectTrigger id="language_preference">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="es">Español</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-3">
            <Button type="submit" disabled={loading}>
              <Save className="mr-2 h-4 w-4" />
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => navigate(-1)}
            >
              Cancel
            </Button>
          </div>
          </form>
        </div>
      </div>
    </main>
    <Footer />
  </div>
  );
}
