import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import type { TooltipProps } from 'recharts';
import { DollarSign, TrendingUp, Users, Calendar, ArrowUp, ArrowDown } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { getRevenueTrends } from '@/lib/utils/analytics';

export function FinancialReports() {
  const [payments, setPayments] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalRevenue: 0,
    customerFees: 0,
    providerFees: 0,
    pendingPayments: 0,
  });
  const [previousStats, setPreviousStats] = useState({
    totalRevenue: 0,
    customerFees: 0,
    providerFees: 0,
  });
  const [revenueData, setRevenueData] = useState<any[]>([]);
  const [categoryRevenue, setCategoryRevenue] = useState<any[]>([]);
  const [timeRange, setTimeRange] = useState('30');

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82ca9d'];

  useEffect(() => {
    fetchFinancialData();
    fetchRevenueChartData();
    fetchCategoryRevenue();
  }, [timeRange]);

  const fetchFinancialData = async () => {
    const days = parseInt(timeRange);
    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - days);

    // Fetch current period
    const { data: paymentsData } = await supabase
      .from('payments')
      .select(`
        *,
        job:jobs(title),
        customer:profiles!payments_customer_id_fkey(full_name),
        provider:profiles!payments_provider_id_fkey(full_name)
      `)
      .gte('created_at', daysAgo.toISOString())
      .order('created_at', { ascending: false });

    // Fetch previous period for comparison
    const previousPeriodStart = new Date();
    previousPeriodStart.setDate(previousPeriodStart.getDate() - (days * 2));
    const previousPeriodEnd = new Date();
    previousPeriodEnd.setDate(previousPeriodEnd.getDate() - days);

    const { data: previousPaymentsData } = await supabase
      .from('payments')
      .select('customer_fee, provider_fee, status')
      .gte('created_at', previousPeriodStart.toISOString())
      .lt('created_at', previousPeriodEnd.toISOString())
      .eq('status', 'completed');

    if (paymentsData) {
      setPayments(paymentsData);
      
      const totalCustomerFees = paymentsData
        .filter(p => p.status === 'completed')
        .reduce((sum, p) => sum + Number(p.customer_fee), 0);
      const totalProviderFees = paymentsData
        .filter(p => p.status === 'completed')
        .reduce((sum, p) => sum + Number(p.provider_fee), 0);
      const pending = paymentsData.filter(p => p.status === 'pending').length;

      setStats({
        totalRevenue: totalCustomerFees + totalProviderFees,
        customerFees: totalCustomerFees,
        providerFees: totalProviderFees,
        pendingPayments: pending,
      });

      if (previousPaymentsData) {
        const prevCustomerFees = previousPaymentsData.reduce((sum, p) => sum + Number(p.customer_fee), 0);
        const prevProviderFees = previousPaymentsData.reduce((sum, p) => sum + Number(p.provider_fee), 0);
        
        setPreviousStats({
          totalRevenue: prevCustomerFees + prevProviderFees,
          customerFees: prevCustomerFees,
          providerFees: prevProviderFees,
        });
      }
    }
  };

  const fetchRevenueChartData = async () => {
    const data = await getRevenueTrends(parseInt(timeRange));
    setRevenueData(data);
  };

  const fetchCategoryRevenue = async () => {
    const days = parseInt(timeRange);
    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - days);

    const { data } = await supabase
      .from('payments')
      .select('customer_fee, provider_fee, status, jobs(categories(name))')
      .gte('created_at', daysAgo.toISOString())
      .eq('status', 'completed');

    if (data) {
      // Group revenue by category
      const categoryMap: Record<string, number> = {};
      data.forEach(payment => {
        const categoryName = payment.jobs?.categories?.name || 'Uncategorized';
        const revenue = Number(payment.customer_fee) + Number(payment.provider_fee);
        categoryMap[categoryName] = (categoryMap[categoryName] || 0) + revenue;
      });

      const categoryData = Object.entries(categoryMap)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 6);

      setCategoryRevenue(categoryData);
    }
  };

  const calculateGrowth = (current: number, previous: number) => {
    if (previous === 0) return 0;
    return ((current - previous) / previous) * 100;
  };

  const revenueGrowth = calculateGrowth(stats.totalRevenue, previousStats.totalRevenue);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Financial Overview</h2>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Last 7 days</SelectItem>
            <SelectItem value="30">Last 30 days</SelectItem>
            <SelectItem value="90">Last 90 days</SelectItem>
            <SelectItem value="365">Last year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.totalRevenue.toFixed(2)}</div>
            <div className="flex items-center text-xs mt-1">
              {revenueGrowth >= 0 ? (
                <ArrowUp className="h-3 w-3 text-green-500 mr-1" />
              ) : (
                <ArrowDown className="h-3 w-3 text-red-500 mr-1" />
              )}
              <span className={revenueGrowth >= 0 ? 'text-green-500' : 'text-red-500'}>
                {Math.abs(revenueGrowth).toFixed(1)}%
              </span>
              <span className="text-muted-foreground ml-1">vs previous period</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Customer Fees</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.customerFees.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.totalRevenue > 0 ? ((stats.customerFees / stats.totalRevenue) * 100).toFixed(1) : 0}% of total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Provider Fees</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.providerFees.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.totalRevenue > 0 ? ((stats.providerFees / stats.totalRevenue) * 100).toFixed(1) : 0}% of total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingPayments}</div>
            <p className="text-xs text-muted-foreground mt-1">Awaiting completion</p>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Trend Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Revenue Trend</CardTitle>
            <CardDescription>Daily revenue over selected period</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={revenueData}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#8884d8" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 12 }}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip 
                  formatter={(value: number) => `$${value.toFixed(2)}`}
                  labelStyle={{ color: '#000' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#8884d8" 
                  fillOpacity={1} 
                  fill="url(#colorRevenue)" 
                  name="Revenue"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Revenue by Category */}
        <Card>
          <CardHeader>
            <CardTitle>Revenue by Category</CardTitle>
            <CardDescription>Top earning service categories</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={categoryRevenue}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {categoryRevenue.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => `$${value.toFixed(2)}`} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Job</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Provider</TableHead>
                <TableHead>Customer Fee</TableHead>
                <TableHead>Provider Fee</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments.map((payment) => (
                <TableRow key={payment.id}>
                  <TableCell>
                    {new Date(payment.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="font-medium">
                    {payment.job?.title || 'N/A'}
                  </TableCell>
                  <TableCell>{payment.customer?.full_name || 'Anonymous'}</TableCell>
                  <TableCell>{payment.provider?.full_name || 'Anonymous'}</TableCell>
                  <TableCell>${Number(payment.customer_fee).toFixed(2)}</TableCell>
                  <TableCell>${Number(payment.provider_fee).toFixed(2)}</TableCell>
                  <TableCell>
                    <Badge variant={payment.status === 'completed' ? 'default' : 'secondary'}>
                      {payment.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
              {payments.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground">
                    No transactions found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
