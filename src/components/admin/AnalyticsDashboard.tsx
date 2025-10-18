import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  LineChart, Line, BarChart, Bar, AreaChart, Area, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import { 
  TrendingUp, Users, Briefcase, Star, Clock, CheckCircle,
  Activity, Target, Award
} from 'lucide-react';
import {
  getUserGrowthData,
  getPopularServices,
  getJobStatusDistribution,
  calculateGrowthMetrics,
  getActiveUsersData,
  getAvgJobValueByCategory,
  getProviderResponseMetrics,
  getCompletionMetrics,
} from '@/lib/utils/analytics';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82ca9d', '#ffc658'];

export function AnalyticsDashboard() {
  const [timeRange, setTimeRange] = useState('30');
  const [userGrowthData, setUserGrowthData] = useState<any[]>([]);
  const [popularServices, setPopularServices] = useState<any[]>([]);
  const [jobStatusData, setJobStatusData] = useState<any[]>([]);
  const [activeUsersData, setActiveUsersData] = useState<any[]>([]);
  const [avgJobValue, setAvgJobValue] = useState<any[]>([]);
  const [growthMetrics, setGrowthMetrics] = useState({
    users: { current: 0, growth: 0, growthPercentage: 0 },
    jobs: { current: 0, growth: 0, growthPercentage: 0 },
    bids: { current: 0, growth: 0, growthPercentage: 0 },
  });
  const [responseMetrics, setResponseMetrics] = useState({
    avgResponseTime: 0,
    fastestResponse: 0,
    slowestResponse: 0,
  });
  const [completionMetrics, setCompletionMetrics] = useState({
    completionRate: 0,
    total: 0,
    completed: 0,
  });

  useEffect(() => {
    fetchAllAnalytics();
  }, [timeRange]);

  const fetchAllAnalytics = async () => {
    const days = parseInt(timeRange);

    // Fetch all analytics data in parallel
    const [
      userGrowth,
      services,
      jobStatus,
      activeUsers,
      jobValue,
      userMetrics,
      jobMetrics,
      bidMetrics,
      providerMetrics,
      completionData,
    ] = await Promise.all([
      getUserGrowthData(days),
      getPopularServices(10),
      getJobStatusDistribution(),
      getActiveUsersData(days),
      getAvgJobValueByCategory(),
      calculateGrowthMetrics('profiles', days),
      calculateGrowthMetrics('jobs', days),
      calculateGrowthMetrics('bids', days),
      getProviderResponseMetrics(),
      getCompletionMetrics(),
    ]);

    setUserGrowthData(userGrowth);
    setPopularServices(services);
    setJobStatusData(jobStatus);
    setActiveUsersData(activeUsers);
    setAvgJobValue(jobValue);
    setGrowthMetrics({
      users: userMetrics,
      jobs: jobMetrics,
      bids: bidMetrics,
    });
    setResponseMetrics(providerMetrics);
    setCompletionMetrics(completionData);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Analytics Dashboard</h2>
          <p className="text-muted-foreground">Comprehensive platform insights and metrics</p>
        </div>
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

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">User Growth</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{growthMetrics.users.current}</div>
            <p className="text-xs text-muted-foreground">
              <span className={growthMetrics.users.growth >= 0 ? 'text-green-500' : 'text-red-500'}>
                {growthMetrics.users.growth >= 0 ? '+' : ''}{growthMetrics.users.growth}
              </span>
              {' '}({growthMetrics.users.growthPercentage.toFixed(1)}%) vs previous period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Jobs Created</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{growthMetrics.jobs.current}</div>
            <p className="text-xs text-muted-foreground">
              <span className={growthMetrics.jobs.growth >= 0 ? 'text-green-500' : 'text-red-500'}>
                {growthMetrics.jobs.growth >= 0 ? '+' : ''}{growthMetrics.jobs.growth}
              </span>
              {' '}({growthMetrics.jobs.growthPercentage.toFixed(1)}%) vs previous period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completionMetrics.completionRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              {completionMetrics.completed} of {completionMetrics.total} jobs completed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{responseMetrics.avgResponseTime.toFixed(1)}h</div>
            <p className="text-xs text-muted-foreground">
              Fastest: {responseMetrics.fastestResponse.toFixed(1)}h
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="growth" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="growth">
            <TrendingUp className="h-4 w-4 mr-2" />
            Growth
          </TabsTrigger>
          <TabsTrigger value="services">
            <Target className="h-4 w-4 mr-2" />
            Services
          </TabsTrigger>
          <TabsTrigger value="activity">
            <Activity className="h-4 w-4 mr-2" />
            Activity
          </TabsTrigger>
          <TabsTrigger value="performance">
            <Award className="h-4 w-4 mr-2" />
            Performance
          </TabsTrigger>
        </TabsList>

        {/* Growth Tab */}
        <TabsContent value="growth" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>User Growth</CardTitle>
                <CardDescription>Cumulative user registrations over time</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={userGrowthData}>
                    <defs>
                      <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
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
                    <Tooltip />
                    <Area 
                      type="monotone" 
                      dataKey="value" 
                      stroke="#8884d8" 
                      fillOpacity={1} 
                      fill="url(#colorUsers)"
                      name="Total Users"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Active Users</CardTitle>
                <CardDescription>Daily active users (posted job or bid)</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={activeUsersData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fontSize: 12 }}
                      angle={-45}
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="value" 
                      stroke="#82ca9d" 
                      strokeWidth={2}
                      name="Active Users"
                      dot={{ r: 3 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Services Tab */}
        <TabsContent value="services" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Popular Services</CardTitle>
                <CardDescription>Most requested service categories</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={popularServices} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis 
                      dataKey="name" 
                      type="category" 
                      width={120}
                      tick={{ fontSize: 12 }}
                    />
                    <Tooltip />
                    <Bar dataKey="value" fill="#8884d8" name="Jobs">
                      {popularServices.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Average Job Value</CardTitle>
                <CardDescription>Average budget by service category</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={avgJobValue}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="name" 
                      tick={{ fontSize: 12 }}
                      angle={-45}
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip formatter={(value: number) => `$${value.toFixed(2)}`} />
                    <Bar dataKey="value" fill="#82ca9d" name="Avg Budget" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Activity Tab */}
        <TabsContent value="activity" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Job Status Distribution</CardTitle>
                <CardDescription>Current status of all jobs</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={jobStatusData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percentage }) => `${name}: ${percentage?.toFixed(0)}%`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {jobStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Platform Activity</CardTitle>
                <CardDescription>Key activity metrics for selected period</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Briefcase className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">New Jobs</p>
                      <p className="text-xs text-muted-foreground">Posted in period</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold">{growthMetrics.jobs.current}</p>
                    <p className="text-xs text-green-500">
                      +{growthMetrics.jobs.growthPercentage.toFixed(1)}%
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <Star className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">New Bids</p>
                      <p className="text-xs text-muted-foreground">Submitted in period</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold">{growthMetrics.bids.current}</p>
                    <p className="text-xs text-green-500">
                      +{growthMetrics.bids.growthPercentage.toFixed(1)}%
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <Users className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">New Users</p>
                      <p className="text-xs text-muted-foreground">Registered in period</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold">{growthMetrics.users.current}</p>
                    <p className="text-xs text-green-500">
                      +{growthMetrics.users.growthPercentage.toFixed(1)}%
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Completion Rate</CardTitle>
                <CardDescription>Jobs successfully completed</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className="text-4xl font-bold text-green-600">
                    {completionMetrics.completionRate.toFixed(1)}%
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    {completionMetrics.completed} out of {completionMetrics.total} total jobs
                  </p>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-4">
                    <div 
                      className="bg-green-600 h-2 rounded-full transition-all" 
                      style={{ width: `${completionMetrics.completionRate}%` }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Response Time</CardTitle>
                <CardDescription>Provider response metrics</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Average</span>
                  <span className="text-lg font-bold">
                    {responseMetrics.avgResponseTime.toFixed(1)}h
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Fastest</span>
                  <span className="text-lg font-bold text-green-600">
                    {responseMetrics.fastestResponse.toFixed(1)}h
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Slowest</span>
                  <span className="text-lg font-bold text-orange-600">
                    {responseMetrics.slowestResponse.toFixed(1)}h
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Platform Health</CardTitle>
                <CardDescription>Overall platform metrics</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">User Growth</span>
                  <Badge variant={growthMetrics.users.growth >= 0 ? 'default' : 'destructive'}>
                    {growthMetrics.users.growth >= 0 ? '+' : ''}{growthMetrics.users.growthPercentage.toFixed(1)}%
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Job Growth</span>
                  <Badge variant={growthMetrics.jobs.growth >= 0 ? 'default' : 'destructive'}>
                    {growthMetrics.jobs.growth >= 0 ? '+' : ''}{growthMetrics.jobs.growthPercentage.toFixed(1)}%
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Engagement</span>
                  <Badge variant="default">
                    {growthMetrics.bids.growthPercentage.toFixed(1)}%
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
