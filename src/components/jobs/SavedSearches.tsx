import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Bookmark, Trash2, Search, Plus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { SearchFilters } from '@/hooks/useAdvancedSearch';

interface SavedSearchesProps {
  currentFilters: SearchFilters;
  onLoadSearch: (filters: SearchFilters) => void;
}

export function SavedSearches({ currentFilters, onLoadSearch }: SavedSearchesProps) {
  const { user } = useAuth();
  const [savedSearches, setSavedSearches] = useState<any[]>([]);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [searchName, setSearchName] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      fetchSavedSearches();
    }
  }, [user]);

  const fetchSavedSearches = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('saved_searches')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setSavedSearches(data);
    }
  };

  const saveCurrentSearch = async () => {
    if (!user) {
      toast({
        title: 'Login required',
        description: 'Please login to save searches',
        variant: 'destructive',
      });
      return;
    }

    if (!searchName.trim()) {
      toast({
        title: 'Name required',
        description: 'Please enter a name for this search',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.from('saved_searches').insert({
        user_id: user.id,
        name: searchName,
        filters: currentFilters,
      });

      if (error) throw error;

      toast({ title: 'Search saved!', description: 'You can access it anytime from your saved searches' });
      setSaveDialogOpen(false);
      setSearchName('');
      fetchSavedSearches();
    } catch (error: any) {
      toast({
        title: 'Error saving search',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const deleteSearch = async (searchId: string) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('saved_searches')
        .delete()
        .eq('id', searchId);

      if (error) throw error;

      toast({ title: 'Search deleted' });
      fetchSavedSearches();
    } catch (error: any) {
      toast({
        title: 'Error deleting search',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const loadSearch = (search: any) => {
    onLoadSearch(search.filters);
    toast({ title: 'Search loaded', description: `Applied filters from "${search.name}"` });
  };

  const getFilterSummary = (filters: SearchFilters) => {
    const parts: string[] = [];
    if (filters.query) parts.push(`"${filters.query}"`);
    if (filters.category) parts.push('Category');
    if (filters.minBudget || filters.maxBudget) parts.push('Budget');
    if (filters.location) parts.push('Location');
    if (filters.radius) parts.push(`${filters.radius}mi radius`);
    return parts.join(' • ') || 'All jobs';
  };

  if (!user) return null;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Bookmark className="h-5 w-5" />
              Saved Searches
            </CardTitle>
            <CardDescription>Quick access to your favorite searches</CardDescription>
          </div>
          <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Save Current
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Save Search</DialogTitle>
                <DialogDescription>
                  Give this search a name so you can quickly access it later
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="search-name">Search Name</Label>
                  <Input
                    id="search-name"
                    placeholder="e.g., Cleaning jobs in my area"
                    value={searchName}
                    onChange={(e) => setSearchName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Current Filters</Label>
                  <p className="text-sm text-muted-foreground">
                    {getFilterSummary(currentFilters)}
                  </p>
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setSaveDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button onClick={saveCurrentSearch} disabled={loading}>
                  Save Search
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {savedSearches.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Search className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No saved searches yet</p>
            <p className="text-sm mt-1">Save your current search to quickly access it later</p>
          </div>
        ) : (
          <div className="space-y-2">
            {savedSearches.map((search) => (
              <div
                key={search.id}
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors"
              >
                <button
                  onClick={() => loadSearch(search)}
                  className="flex-1 text-left"
                >
                  <div className="font-medium">{search.name}</div>
                  <div className="text-sm text-muted-foreground">
                    {getFilterSummary(search.filters)}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Saved {new Date(search.created_at).toLocaleDateString()}
                  </div>
                </button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => deleteSearch(search.id)}
                  disabled={loading}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
