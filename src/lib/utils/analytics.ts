import { supabase } from '@/integrations/supabase/client';

export interface TimeSeriesData {
  date: string;
  value: number;
  label?: string;
}

export interface CategoryData {
  name: string;
  value: number;
  percentage?: number;
}

export interface GrowthMetrics {
  current: number;
  previous: number;
  growth: number;
  growthPercentage: number;
}

/**
 * Get user growth data over time
 */
export async function getUserGrowthData(days: number = 30): Promise<TimeSeriesData[]> {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const { data } = await supabase
    .from('profiles')
    .select('created_at')
    .gte('created_at', startDate.toISOString())
    .order('created_at', { ascending: true });

  if (!data) return [];

  // Group by date
  const grouped = data.reduce((acc: Record<string, number>, profile) => {
    const date = new Date(profile.created_at).toLocaleDateString();
    acc[date] = (acc[date] || 0) + 1;
    return acc;
  }, {});

  // Convert to time series with cumulative count
  let cumulative = 0;
  return Object.entries(grouped).map(([date, count]) => {
    cumulative += count;
    return { date, value: cumulative };
  });
}

/**
 * Get revenue trends over time
 */
export async function getRevenueTrends(days: number = 30): Promise<TimeSeriesData[]> {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const { data } = await supabase
    .from('payments')
    .select('created_at, customer_fee, provider_fee, status')
    .gte('created_at', startDate.toISOString())
    .eq('status', 'completed')
    .order('created_at', { ascending: true });

  if (!data) return [];

  // Group by date
  const grouped = data.reduce((acc: Record<string, number>, payment) => {
    const date = new Date(payment.created_at).toLocaleDateString();
    const revenue = Number(payment.customer_fee) + Number(payment.provider_fee);
    acc[date] = (acc[date] || 0) + revenue;
    return acc;
  }, {});

  return Object.entries(grouped).map(([date, value]) => ({ date, value }));
}

/**
 * Get popular services/categories
 */
export async function getPopularServices(limit: number = 10): Promise<CategoryData[]> {
  const { data: jobs } = await supabase
    .from('jobs')
    .select('category_id, categories(name)');

  if (!jobs) return [];

  // Count jobs per category
  const categoryCounts = jobs.reduce((acc: Record<string, { name: string; count: number }>, job) => {
    const categoryName = job.categories?.name || 'Uncategorized';
    if (!acc[categoryName]) {
      acc[categoryName] = { name: categoryName, count: 0 };
    }
    acc[categoryName].count += 1;
    return acc;
  }, {});

  // Convert to array and sort
  const sorted = Object.values(categoryCounts)
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);

  // Calculate percentages
  const total = sorted.reduce((sum, cat) => sum + cat.count, 0);
  return sorted.map(cat => ({
    name: cat.name,
    value: cat.count,
    percentage: (cat.count / total) * 100,
  }));
}

/**
 * Get job status distribution
 */
export async function getJobStatusDistribution(): Promise<CategoryData[]> {
  const { data } = await supabase
    .from('jobs')
    .select('status');

  if (!data) return [];

  // Count by status
  const statusCounts = data.reduce((acc: Record<string, number>, job) => {
    acc[job.status] = (acc[job.status] || 0) + 1;
    return acc;
  }, {});

  const total = data.length;
  return Object.entries(statusCounts).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value,
    percentage: (value / total) * 100,
  }));
}

/**
 * Calculate growth metrics between two periods
 */
export async function calculateGrowthMetrics(
  table: string,
  days: number = 30
): Promise<GrowthMetrics> {
  const currentStart = new Date();
  currentStart.setDate(currentStart.getDate() - days);
  
  const previousStart = new Date();
  previousStart.setDate(previousStart.getDate() - (days * 2));
  
  const previousEnd = new Date();
  previousEnd.setDate(previousEnd.getDate() - days);

  const [currentData, previousData] = await Promise.all([
    supabase
      .from(table)
      .select('id', { count: 'exact', head: true })
      .gte('created_at', currentStart.toISOString()),
    supabase
      .from(table)
      .select('id', { count: 'exact', head: true })
      .gte('created_at', previousStart.toISOString())
      .lt('created_at', previousEnd.toISOString()),
  ]);

  const current = currentData.count || 0;
  const previous = previousData.count || 0;
  const growth = current - previous;
  const growthPercentage = previous > 0 ? (growth / previous) * 100 : 0;

  return { current, previous, growth, growthPercentage };
}

/**
 * Get active users (users who posted jobs or bids in last N days)
 */
export async function getActiveUsersData(days: number = 30): Promise<TimeSeriesData[]> {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const [jobsData, bidsData] = await Promise.all([
    supabase
      .from('jobs')
      .select('customer_id, created_at')
      .gte('created_at', startDate.toISOString()),
    supabase
      .from('bids')
      .select('provider_id, created_at')
      .gte('created_at', startDate.toISOString()),
  ]);

  // Combine and count unique users per day
  const activityByDate: Record<string, Set<string>> = {};

  jobsData.data?.forEach(job => {
    const date = new Date(job.created_at).toLocaleDateString();
    if (!activityByDate[date]) activityByDate[date] = new Set();
    activityByDate[date].add(job.customer_id);
  });

  bidsData.data?.forEach(bid => {
    const date = new Date(bid.created_at).toLocaleDateString();
    if (!activityByDate[date]) activityByDate[date] = new Set();
    activityByDate[date].add(bid.provider_id);
  });

  return Object.entries(activityByDate)
    .map(([date, users]) => ({ date, value: users.size }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

/**
 * Get average job value by category
 */
export async function getAvgJobValueByCategory(): Promise<CategoryData[]> {
  const { data } = await supabase
    .from('jobs')
    .select('budget, categories(name)');

  if (!data) return [];

  // Calculate averages per category
  const categoryData = data.reduce((acc: Record<string, { sum: number; count: number }>, job) => {
    const categoryName = job.categories?.name || 'Uncategorized';
    if (!acc[categoryName]) {
      acc[categoryName] = { sum: 0, count: 0 };
    }
    acc[categoryName].sum += Number(job.budget);
    acc[categoryName].count += 1;
    return acc;
  }, {});

  return Object.entries(categoryData)
    .map(([name, data]) => ({
      name,
      value: Math.round(data.sum / data.count),
    }))
    .sort((a, b) => b.value - a.value);
}

/**
 * Get provider response time metrics
 */
export async function getProviderResponseMetrics() {
  const { data: bids } = await supabase
    .from('bids')
    .select('created_at, jobs(created_at)');

  if (!bids) return { avgResponseTime: 0, fastestResponse: 0, slowestResponse: 0 };

  const responseTimes = bids
    .filter(bid => bid.jobs?.created_at)
    .map(bid => {
      const jobTime = new Date(bid.jobs!.created_at).getTime();
      const bidTime = new Date(bid.created_at).getTime();
      return (bidTime - jobTime) / (1000 * 60 * 60); // Convert to hours
    })
    .filter(time => time >= 0); // Only positive times

  if (responseTimes.length === 0) {
    return { avgResponseTime: 0, fastestResponse: 0, slowestResponse: 0 };
  }

  return {
    avgResponseTime: responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length,
    fastestResponse: Math.min(...responseTimes),
    slowestResponse: Math.max(...responseTimes),
  };
}

/**
 * Get completion rate metrics
 */
export async function getCompletionMetrics() {
  const { data } = await supabase
    .from('jobs')
    .select('status');

  if (!data) return { completionRate: 0, total: 0, completed: 0 };

  const total = data.length;
  const completed = data.filter(job => job.status === 'completed').length;
  const completionRate = total > 0 ? (completed / total) * 100 : 0;

  return { completionRate, total, completed };
}
