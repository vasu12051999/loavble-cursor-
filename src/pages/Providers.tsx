import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import ProviderCard from "@/components/providers/ProviderCard";
import { ProviderFilters as ProviderFiltersType, ProviderFilters as ProviderFiltersComponent } from "@/components/providers/ProviderFilters";

export default function Providers() {
  const [searchParams] = useSearchParams();
  const skillParam = searchParams.get('skill');
  
  const [providers, setProviders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<ProviderFiltersType>({
    query: skillParam || '',
    sortBy: 'rating'
  });
  const [categories, setCategories] = useState<any[]>([]);

  useEffect(() => {
    fetchCategories();
    fetchProviders();
  }, [filters]);

  const fetchCategories = async () => {
    const { data } = await supabase
      .from('categories')
      .select('*')
      .order('name');
    
    if (data) {
      setCategories(data);
    }
  };

  const fetchProviders = async () => {
    setLoading(true);
    
    // First get all provider user IDs from user_roles
    const { data: providerRoles } = await supabase
      .from('user_roles')
      .select('user_id')
      .eq('role', 'provider');
    
    if (!providerRoles || providerRoles.length === 0) {
      setProviders([]);
      setLoading(false);
      return;
    }
    
    const providerIds = providerRoles.map(r => r.user_id);
    
    // Get all providers with their settings
    let query = supabase
      .from('profiles')
      .select(`
        *,
        provider_settings (*),
        provider_skills (skill_name, years_experience, verified)
      `)
      .in('id', providerIds);

    // Apply filters
    if (filters.availableOnly) {
      query = query.eq('provider_settings.available_now', true);
    }

    const { data } = await query;
    
    if (data) {
      let filteredData = data;
      
      // Filter by search query (name, bio, skills)
      if (filters.query && filters.query.trim()) {
        const searchTerm = filters.query.toLowerCase();
        filteredData = filteredData.filter(provider => 
          provider.full_name?.toLowerCase().includes(searchTerm) ||
          provider.bio?.toLowerCase().includes(searchTerm) ||
          provider.provider_settings?.bio_headline?.toLowerCase().includes(searchTerm) ||
          provider.provider_skills?.some((skill: any) => 
            skill.skill_name.toLowerCase().includes(searchTerm)
          )
        );
      }
      
      // Filter by location
      if (filters.location) {
        filteredData = filteredData.filter(provider =>
          provider.location?.toLowerCase().includes(filters.location!.toLowerCase())
        );
      }
      
      // Get average ratings for each provider
      const providersWithRatings = await Promise.all(
        filteredData.map(async (provider) => {
          const { data: reviews } = await supabase
            .from('reviews')
            .select('rating')
            .eq('reviewed_id', provider.id);
          
          const avgRating = reviews && reviews.length > 0
            ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
            : 0;
          
          return {
            ...provider,
            avgRating,
            reviewCount: reviews?.length || 0
          };
        })
      );

      // Apply additional filters
      let finalData = providersWithRatings;

      // Filter by minimum rating
      if (filters.minRating) {
        finalData = finalData.filter(p => p.avgRating >= filters.minRating!);
      }

      // Filter by hourly rate
      if (filters.minHourlyRate || filters.maxHourlyRate) {
        finalData = finalData.filter(p => {
          const rate = p.provider_settings?.hourly_rate;
          if (!rate) return false;
          if (filters.minHourlyRate && rate < filters.minHourlyRate) return false;
          if (filters.maxHourlyRate && rate > filters.maxHourlyRate) return false;
          return true;
        });
      }

      // Filter by response time
      if (filters.responseTime && filters.responseTime !== 'any') {
        const maxResponseHours = parseInt(filters.responseTime);
        finalData = finalData.filter(p => {
          const responseTime = p.provider_settings?.response_time_hours;
          return responseTime && responseTime <= maxResponseHours;
        });
      }

      // Filter by verified
      if (filters.verifiedOnly) {
        finalData = finalData.filter(p => 
          p.provider_skills?.some((skill: any) => skill.verified)
        );
      }

      // Sort providers
      finalData.sort((a, b) => {
        switch (filters.sortBy) {
          case 'rating':
            return b.avgRating - a.avgRating;
          case 'reviews':
            return b.reviewCount - a.reviewCount;
          case 'price_low':
            return (a.provider_settings?.hourly_rate || 0) - (b.provider_settings?.hourly_rate || 0);
          case 'price_high':
            return (b.provider_settings?.hourly_rate || 0) - (a.provider_settings?.hourly_rate || 0);
          case 'recent':
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
          default:
            return 0;
        }
      });

      setProviders(finalData);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1">
        {/* Hero */}
        <section className="py-12 px-4 bg-gradient-to-b from-primary/5 to-background">
          <div className="container mx-auto max-w-6xl">
            <h1 className="text-4xl md:text-5xl font-bold text-center mb-6">
              {skillParam ? `Find ${skillParam} Professionals` : 'Find Trusted Professionals'}
            </h1>
            <p className="text-xl text-muted-foreground text-center mb-8">
              {skillParam 
                ? `Browse skilled ${skillParam.toLowerCase()} providers ready to help with your next project`
                : 'Browse skilled providers ready to help with your next project'
              }
            </p>
            
            {/* Search */}
            <div className="max-w-4xl mx-auto">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search by name, skills, bio, or location..."
                  className="pl-10 h-12"
                  value={filters.query || ''}
                  onChange={(e) => setFilters({...filters, query: e.target.value})}
                />
                {filters.query && (
                  <button
                    onClick={() => setFilters({...filters, query: ''})}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2"
                  >
                    <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Filters */}
        <section className="py-6 px-4">
          <div className="container mx-auto max-w-6xl">
            <ProviderFiltersComponent filters={filters} onFiltersChange={setFilters} />
          </div>
        </section>

        {/* Providers Grid */}
        <section className="py-8 px-4">
          <div className="container mx-auto max-w-6xl">
            <div className="flex items-center justify-between mb-8">
              <p className="text-muted-foreground">
                {providers.length} {providers.length === 1 ? 'provider' : 'providers'} found
              </p>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <Skeleton key={i} className="h-80 w-full" />
                ))}
              </div>
            ) : providers.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground text-lg mb-4">No providers found</p>
                <p className="text-sm text-muted-foreground">Try adjusting your search or filters</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {providers.map((provider) => (
                  <ProviderCard key={provider.id} provider={provider} />
                ))}
              </div>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}