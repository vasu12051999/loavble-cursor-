import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Search, List, Map, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import JobCard from '@/components/jobs/JobCard';
import { AdvancedFilters } from '@/components/jobs/AdvancedFilters';
import { SavedSearches } from '@/components/jobs/SavedSearches';
import { JobMapView } from '@/components/jobs/JobMapView';
import { useAdvancedSearch, SearchFilters } from '@/hooks/useAdvancedSearch';
import { analytics } from '@/utils/analytics';

export default function Jobs() {
  const [filters, setFilters] = useState<SearchFilters>({
    sortBy: 'recent',
    datePosted: 'all'
  });
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [showSavedSearches, setShowSavedSearches] = useState(false);
  const { jobs, loading } = useAdvancedSearch(filters);

  const handleSearchChange = (value: string) => {
    setFilters(prev => ({ ...prev, query: value }));
    if (value) {
      analytics.trackSearch(value, filters);
    }
  };

  const handleLoadSearch = (savedFilters: SearchFilters) => {
    setFilters(savedFilters);
    setShowSavedSearches(false);
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.query) count++;
    if (filters.category) count++;
    if (filters.minBudget || filters.maxBudget) count++;
    if (filters.location) count++;
    if (filters.radius && filters.radius !== 25) count++;
    if (filters.datePosted && filters.datePosted !== 'all') count++;
    return count;
  };

  const removeFilter = (key: keyof SearchFilters) => {
    const newFilters = { ...filters };
    delete newFilters[key];
    if (key === 'minBudget' || key === 'maxBudget') {
      delete newFilters.minBudget;
      delete newFilters.maxBudget;
    }
    setFilters(newFilters);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Browse Jobs</h1>
            <p className="text-muted-foreground">Find your next opportunity</p>
          </div>
          <Link to="/jobs/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Post a Job
            </Button>
          </Link>
        </div>

        <div className="space-y-6">
          <Card className="p-4">
            <div className="flex flex-col gap-4">
              <div className="flex gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by title, description, or location..."
                    value={filters.query || ''}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    className="pl-10"
                  />
                  {filters.query && (
                    <button
                      onClick={() => removeFilter('query')}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2"
                    >
                      <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                    </button>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant={viewMode === 'list' ? 'default' : 'outline'}
                    size="icon"
                    onClick={() => setViewMode('list')}
                    title="List View"
                  >
                    <List className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'map' ? 'default' : 'outline'}
                    size="icon"
                    onClick={() => setViewMode('map')}
                    title="Map View"
                  >
                    <Map className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              {/* Active Filters Display */}
              {getActiveFiltersCount() > 0 && (
                <div className="flex flex-wrap gap-2">
                  {filters.query && (
                    <Badge variant="secondary" className="gap-1">
                      Search: "{filters.query}"
                      <button onClick={() => removeFilter('query')} className="ml-1">
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  )}
                  {(filters.minBudget || filters.maxBudget) && (
                    <Badge variant="secondary" className="gap-1">
                      Budget: ${filters.minBudget || 0} - ${filters.maxBudget || '∞'}
                      <button onClick={() => { removeFilter('minBudget'); removeFilter('maxBudget'); }} className="ml-1">
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  )}
                  {filters.location && (
                    <Badge variant="secondary" className="gap-1">
                      {filters.location} {filters.radius && `(${filters.radius}mi)`}
                      <button onClick={() => { removeFilter('location'); removeFilter('radius'); }} className="ml-1">
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  )}
                  {filters.datePosted && filters.datePosted !== 'all' && (
                    <Badge variant="secondary" className="gap-1">
                      Posted: {filters.datePosted}
                      <button onClick={() => removeFilter('datePosted')} className="ml-1">
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  )}
                </div>
              )}
            </div>
          </Card>

          <AdvancedFilters filters={filters} onFiltersChange={setFilters} />

          {showSavedSearches && (
            <SavedSearches 
              currentFilters={filters}
              onLoadSearch={handleLoadSearch}
            />
          )}

          <div className="flex justify-between items-center">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowSavedSearches(!showSavedSearches)}
            >
              {showSavedSearches ? 'Hide' : 'Show'} Saved Searches
            </Button>
          </div>

          {loading ? (
            <div className="text-center py-12">Loading jobs...</div>
          ) : jobs.length === 0 ? (
            <Card className="p-12 text-center">
              <p className="text-muted-foreground">No jobs found</p>
              <p className="text-sm text-muted-foreground mt-2">Try adjusting your filters</p>
            </Card>
          ) : (
            <>
              {viewMode === 'list' ? (
                <div className="space-y-4">
                  <div className="text-sm text-muted-foreground mb-4">
                    {jobs.length} {jobs.length === 1 ? 'job' : 'jobs'} found
                  </div>
                  {jobs.map((job) => (
                    <JobCard key={job.id} job={job} />
                  ))}
                </div>
              ) : (
                <JobMapView jobs={jobs} />
              )}
            </>
          )}
        </div>
      </div>

      <Link to="/jobs/new">
        <Button
          size="lg"
          className="fixed bottom-6 right-6 rounded-full shadow-lg"
        >
          <Plus className="mr-2 h-5 w-5" />
          Post Job
        </Button>
      </Link>
    </div>
  );
}
