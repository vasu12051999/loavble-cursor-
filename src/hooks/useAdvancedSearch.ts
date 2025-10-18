import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface SearchFilters {
  query?: string;
  category?: string;
  minBudget?: number;
  maxBudget?: number;
  location?: string;
  radius?: number; // in miles
  datePosted?: 'today' | 'week' | 'month' | 'all';
  sortBy?: 'recent' | 'budget_high' | 'budget_low' | 'nearest' | 'relevance';
  status?: string[];
  availableOnly?: boolean;
}

export function useAdvancedSearch(filters: SearchFilters) {
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    searchJobs();
  }, [JSON.stringify(filters)]);

  const searchJobs = async () => {
    setLoading(true);
    let query = supabase
      .from('jobs')
      .select(`
        *,
        categories(name, icon),
        profiles!jobs_customer_id_fkey(full_name, avatar_url)
      `);

    // Status filter - default to open if not specified
    if (filters.status && filters.status.length > 0) {
      query = query.in('status', filters.status);
    } else {
      query = query.eq('status', 'open');
    }

    // Full-text search - search across title, description, and location
    if (filters.query && filters.query.trim()) {
      const searchTerm = filters.query.trim();
      // Use Postgres full-text search or fallback to ilike
      query = query.or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%,location.ilike.%${searchTerm}%`);
    }

    // Category filter
    if (filters.category) {
      query = query.eq('category_id', filters.category);
    }

    // Budget range filter
    if (filters.minBudget !== undefined) {
      query = query.gte('budget', filters.minBudget);
    }
    if (filters.maxBudget !== undefined) {
      query = query.lte('budget', filters.maxBudget);
    }

    // Date posted filter
    if (filters.datePosted && filters.datePosted !== 'all') {
      const now = new Date();
      let dateThreshold = new Date();
      
      switch (filters.datePosted) {
        case 'today':
          dateThreshold.setHours(0, 0, 0, 0);
          break;
        case 'week':
          dateThreshold.setDate(now.getDate() - 7);
          break;
        case 'month':
          dateThreshold.setMonth(now.getMonth() - 1);
          break;
      }
      
      query = query.gte('created_at', dateThreshold.toISOString());
    }

    // Location filter (simple text match for now)
    if (filters.location) {
      query = query.ilike('location', `%${filters.location}%`);
    }

    // Sorting
    switch (filters.sortBy) {
      case 'budget_high':
        query = query.order('budget', { ascending: false });
        break;
      case 'budget_low':
        query = query.order('budget', { ascending: true });
        break;
      case 'recent':
      default:
        query = query.order('created_at', { ascending: false });
        break;
    }

    const { data, error } = await query;

    if (!error) {
      setJobs(data || []);
    }

    setLoading(false);
  };

  return { jobs, loading, refetch: searchJobs };
}
