import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Star, MapPin, Briefcase, MessageSquare, Calendar, Award, CheckCircle, DollarSign, Clock, Edit } from 'lucide-react';
import { QuickQuoteDialog } from '@/components/providers/QuickQuoteDialog';
import { PortfolioGallery } from '@/components/portfolio/PortfolioGallery';
import { ReviewsList } from '@/components/reviews/ReviewsList';
import { toast } from '@/hooks/use-toast';

export default function Profile() {
  const { uid } = useParams();
  const { user } = useAuth();
  const { t } = useLanguage();
  const [profile, setProfile] = useState<any>(null);
  const [providerSettings, setProviderSettings] = useState<any>(null);
  const [skills, setSkills] = useState<any[]>([]);
  const [certifications, setCertifications] = useState<any[]>([]);
  const [completedJobs, setCompletedJobs] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewStats, setReviewStats] = useState({ averageRating: 0, totalReviews: 0 });

  // Use uid from URL or current user's id if viewing own profile
  const profileId = uid || user?.id;

  const fetchProfile = useCallback(async () => {
    if (!profileId) {
      setLoading(false);
      return;
    }

    try {
      const isOwnProfile = profileId === user?.id;
      
      // Fetch profile data
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', profileId)
        .maybeSingle();

      if (profileError) {
        console.error('Error fetching profile:', profileError);
      }

      if (profileData) {
        // Fetch user roles separately
        const { data: rolesData, error: rolesError } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', profileId);

        if (rolesError) {
          console.error('Error fetching roles:', rolesError);
        }

        // Combine the data
        setProfile({
          ...profileData,
          user_roles: rolesData || []
        });
      }
    } catch (error) {
      console.error('Unexpected error in fetchProfile:', error);
    } finally {
      setLoading(false);
    }
  }, [profileId, user?.id]);

  const fetchProviderData = useCallback(async () => {
    if (!profileId) return;

    try {
      const { data: settings } = await supabase
        .from('provider_settings')
        .select('*')
        .eq('provider_id', profileId)
        .maybeSingle();

      const { data: skillsData } = await supabase
        .from('provider_skills')
        .select('*')
        .eq('provider_id', profileId);

      const { data: certsData } = await supabase
        .from('provider_certifications')
        .select('*')
        .eq('provider_id', profileId);

      setProviderSettings(settings);
      setSkills(skillsData || []);
      setCertifications(certsData || []);
    } catch (error) {
      console.error('Error fetching provider data:', error);
    }
  }, [profileId]);

  const fetchCompletedJobs = useCallback(async () => {
    if (!profileId) return;
    
    try {
      const { data } = await supabase
        .from('jobs')
        .select('*, categories(name)')
        .eq('awarded_provider_id', profileId)
        .eq('status', 'completed')
        .limit(6);

      setCompletedJobs(data || []);
    } catch (error) {
      console.error('Error fetching completed jobs:', error);
    }
  }, [profileId]);

  const fetchReviews = useCallback(async () => {
    if (!profileId) return;
    
    try {
      // Fetch reviews with average rating
      const { data } = await supabase
        .from('reviews')
        .select('rating')
        .eq('reviewed_id', profileId);

      if (data && data.length > 0) {
        const avgRating = data.reduce((sum, r) => sum + r.rating, 0) / data.length;
        setReviews(data);
        setReviewStats({ averageRating: avgRating, totalReviews: data.length });
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
    }
  }, [profileId]);

  useEffect(() => {
    if (profileId) {
      setLoading(true);
      fetchProfile();
      fetchProviderData();
      fetchCompletedJobs();
      fetchReviews();
    }
  }, [profileId, fetchProfile, fetchProviderData, fetchCompletedJobs, fetchReviews]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="container py-8">Loading profile...</div>
        <Footer />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="container py-8">
          <h1 className="text-2xl font-bold mb-4">Profile Not Found</h1>
          <p className="text-muted-foreground">The profile you're looking for doesn't exist.</p>
        </div>
        <Footer />
      </div>
    );
  }

  const isProvider = profile.user_roles?.some((r: any) => r.role === 'provider');
  
  // Use review stats from state
  const { averageRating, totalReviews } = reviewStats;
  const completedJobsCount = completedJobs.length;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <div className="bg-primary/5 border-b">
        <div className="container py-12">
          <div className="flex items-start gap-6">
            <Avatar className="h-32 w-32">
              {profile.avatar_url ? (
                <AvatarImage src={profile.avatar_url} alt={profile.full_name || 'Avatar'} />
              ) : (
                <AvatarFallback className="text-3xl">
                  {profile.full_name?.[0] || 'U'}
                </AvatarFallback>
              )}
            </Avatar>
            
            <div className="flex-1 space-y-4">
              <div>
                <h1 className="text-3xl font-bold">{profile.full_name || 'Anonymous'}</h1>
                <div className="flex items-center gap-4 mt-2 text-muted-foreground">
                  {totalReviews > 0 ? (
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="font-semibold">{averageRating.toFixed(1)}</span>
                      <span>({totalReviews} {totalReviews === 1 ? 'review' : 'reviews'})</span>
                    </div>
                  ) : (
                    <span className="text-muted-foreground text-sm">No reviews yet</span>
                  )}
                  {profile.location && (
                    <div className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      <span>{profile.location}</span>
                    </div>
                  )}
                </div>
              </div>

              {profile.bio && (
                <p className="text-muted-foreground max-w-2xl">{profile.bio}</p>
              )}

              {providerSettings?.bio_headline && (
                <p className="text-lg font-medium">{providerSettings.bio_headline}</p>
              )}

              {isProvider && providerSettings && (
                <div className="flex gap-4 flex-wrap">
                  {providerSettings.hourly_rate && (
                    <Badge variant="secondary" className="flex items-center gap-1">
                      <DollarSign className="h-3 w-3" />
                      ${providerSettings.hourly_rate}/hr
                    </Badge>
                  )}
                  {providerSettings.response_time_hours && (
                    <Badge variant="secondary" className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      ~{providerSettings.response_time_hours}h {t('profile.response')}
                    </Badge>
                  )}
                  {providerSettings.accepts_instant_bookings && (
                    <Badge variant="secondary" className="flex items-center gap-1">
                      <CheckCircle className="h-3 w-3" />
                      {t('profile.instantBooking')}
                    </Badge>
                  )}
                  {providerSettings.available_now && (
                    <Badge className="bg-green-600 flex items-center gap-1">
                      {t('profile.availableNow')}
                    </Badge>
                  )}
                </div>
              )}

              <div className="flex gap-3">
                {user?.id === profileId ? (
                  <Button asChild>
                    <Link to="/profile/edit">
                      <Edit className="mr-2 h-4 w-4" />
                      Edit Profile
                    </Link>
                  </Button>
                ) : isProvider && (
                  <>
                    <Button onClick={() => {
                      if (!user) {
                        toast({ title: t('auth.loginRequired') });
                        window.location.href = '/auth/login';
                        return;
                      }
                      toast({ 
                        title: t('profile.messageInfo'),
                        description: t('profile.messageDescription')
                      });
                    }}>
                      <MessageSquare className="mr-2 h-4 w-4" />
                      {t('profile.message')}
                    </Button>
                    <QuickQuoteDialog providerId={profileId!} providerName={profile.full_name || 'Provider'} />
                  </>
                )}
              </div>
            </div>

            {isProvider && (
              <Card className="w-64">
                <CardContent className="pt-6 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">{t('profile.completedJobs')}</span>
                    <span className="text-2xl font-bold">{completedJobsCount}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">{t('profile.rating')}</span>
                    <span className="text-2xl font-bold">
                      {averageRating > 0 ? averageRating.toFixed(1) : '—'}
                    </span>
                  </div>
                  {providerSettings?.available_now ? (
                    <Badge variant="default" className="w-full justify-center bg-green-600">
                      {t('profile.availableNow')}
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="w-full justify-center">
                      {t('profile.availableSoon')}
                    </Badge>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      <div className="container py-8">
        <Tabs defaultValue="portfolio" className="space-y-6">
          <TabsList>
            <TabsTrigger value="portfolio">{t('profile.portfolio')}</TabsTrigger>
            <TabsTrigger value="reviews">{t('profile.reviews')}</TabsTrigger>
            {isProvider && <TabsTrigger value="skills">{t('profile.skillsCerts')}</TabsTrigger>}
            <TabsTrigger value="about">{t('profile.about')}</TabsTrigger>
          </TabsList>

          <TabsContent value="portfolio" className="space-y-4">
            <h2 className="text-2xl font-bold">{t('profile.completedWork')}</h2>
            
            {/* Portfolio Gallery */}
            <PortfolioGallery 
              providerId={profileId!} 
              isOwnProfile={user?.id === profileId}
            />
          </TabsContent>

          <TabsContent value="reviews" className="space-y-4">
            <h2 className="text-2xl font-bold">{t('profile.reviewsRatings')}</h2>
            <ReviewsList userId={profileId!} limit={10} />
          </TabsContent>

          {isProvider && (
            <TabsContent value="skills" className="space-y-4">
              <h2 className="text-2xl font-bold">{t('profile.skillsCerts')}</h2>
              
              {skills.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>{t('profile.skills')}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {skills.map((skill) => (
                        <div key={skill.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{skill.skill_name}</span>
                            {skill.verified && (
                              <CheckCircle className="h-4 w-4 text-green-600" />
                            )}
                          </div>
                          {skill.years_experience && (
                            <Badge variant="secondary">{skill.years_experience} {t('profile.years')}</Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {certifications.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>{t('profile.certifications')}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {certifications.map((cert) => (
                        <div key={cert.id} className="flex items-start gap-4 p-4 border rounded-lg">
                          <Award className="h-6 w-6 text-primary shrink-0" />
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold">{cert.certification_name}</h3>
                              {cert.verified && (
                                <CheckCircle className="h-4 w-4 text-green-600" />
                              )}
                            </div>
                            {cert.issuing_organization && (
                              <p className="text-sm text-muted-foreground">{cert.issuing_organization}</p>
                            )}
                            {cert.issue_date && (
                              <p className="text-xs text-muted-foreground mt-1">
                                {t('profile.issued')}: {new Date(cert.issue_date).toLocaleDateString()}
                                {cert.expiry_date && ` • ${t('profile.expires')}: ${new Date(cert.expiry_date).toLocaleDateString()}`}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {skills.length === 0 && certifications.length === 0 && (
                <Card className="p-12 text-center">
                  <p className="text-muted-foreground">{t('profile.noSkillsCerts')}</p>
                </Card>
              )}
            </TabsContent>
          )}

          <TabsContent value="about" className="space-y-4">
            <h2 className="text-2xl font-bold">{t('profile.about')}</h2>
            
            <Card>
              <CardContent className="pt-6 space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">{t('profile.bio')}</h3>
                  <p className="text-muted-foreground">
                    {profile.bio || t('profile.noBio')}
                  </p>
                </div>

                {profile.location && (
                  <div>
                    <h3 className="font-semibold mb-2">{t('profile.serviceArea')}</h3>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      <span>{profile.location}</span>
                    </div>
                  </div>
                )}

                <div>
                  <h3 className="font-semibold mb-2">{t('profile.memberSince')}</h3>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>{new Date(profile.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      <Footer />
    </div>
  );
}
