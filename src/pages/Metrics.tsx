import { useState, useEffect } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ArrowLeft, Trophy, Target, TrendingDown, Calendar, LogOut } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { MetricsResponse, TimeScope } from '@/lib/types';
import { getCurrentPeriodReference } from '@/lib/date-utils';

export default function Metrics() {
  const { user, profile, signOut, loading } = useAuth();
  const { toast } = useToast();
  const [scope, setScope] = useState<TimeScope>('week');
  const [viewMode, setViewMode] = useState<'me' | 'all'>('me');
  const [metrics, setMetrics] = useState<MetricsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Redirect to auth if not authenticated
  if (!loading && !user) {
    return <Navigate to="/auth" replace />;
  }

  useEffect(() => {
    if (user) {
      fetchMetrics();
    }
  }, [scope, viewMode, user]);

  const fetchMetrics = async () => {
    setIsLoading(true);
    try {
      const reference = getCurrentPeriodReference(scope);
      const endpoint = viewMode === 'me' ? 'me-metrics' : 'all-metrics';
      
      let params: Record<string, string> = { scope };
      
      if (scope === 'week') {
        params.weekStart = reference;
      } else if (scope === 'month') {
        params.month = reference;
      } else {
        params.year = reference;
      }

      const { data, error } = await supabase.functions.invoke(endpoint, {
        body: params,
      });

      if (error) {
        throw error;
      }

      setMetrics(data);
    } catch (error: any) {
      console.error('Error fetching metrics:', error);
      toast({
        title: 'Error loading metrics',
        description: error.message || 'Failed to load metrics data.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatChartData = (series: MetricsResponse['series']) => {
    return series.map(item => ({
      date: new Date(item.date).toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      }),
      hours: item.totalHours,
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Home
              </Button>
            </Link>
            <h1 className="text-2xl font-bold text-foreground">Metrics & Charts</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              {profile?.name || user?.email}
            </span>
            <Button variant="ghost" size="sm" onClick={signOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      {/* Controls */}
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex gap-2">
            <Select value={scope} onValueChange={(value: TimeScope) => setScope(value)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="week">Weekly</SelectItem>
                <SelectItem value="month">Monthly</SelectItem>
                <SelectItem value="year">Yearly</SelectItem>
              </SelectContent>
            </Select>

            <Select value={viewMode} onValueChange={(value: 'me' | 'all') => setViewMode(value)}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="me">My Data</SelectItem>
                <SelectItem value="all">All Users</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button onClick={fetchMetrics} disabled={isLoading} variant="outline">
            <Calendar className="h-4 w-4 mr-2" />
            {isLoading ? 'Loading...' : 'Refresh'}
          </Button>
        </div>

        {/* Stats Cards */}
        {metrics && viewMode === 'me' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Hours</CardTitle>
                <TrendingDown className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.aggregates.totalHours}</div>
                <p className="text-xs text-muted-foreground">
                  {scope === 'week' ? 'This week' : scope === 'month' ? 'This month' : 'This year'}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Average per Week</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.aggregates.avgPerWeek.toFixed(1)}</div>
                <p className="text-xs text-muted-foreground">
                  Hours per week average
                </p>
              </CardContent>
            </Card>

            {metrics.streak && (
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Current Streak</CardTitle>
                  <Trophy className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{metrics.streak.weeks}</div>
                  <p className="text-xs text-muted-foreground">
                    Weeks with entries
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Chart */}
        <Card>
          <CardHeader>
            <CardTitle>
              {viewMode === 'me' ? 'Your Screen Time Trend' : 'Average Screen Time Trend'}
              {metrics?.streak && viewMode === 'me' && metrics.streak.weeks >= 3 && (
                <span className="ml-2 inline-flex items-center">
                  <Trophy className="h-4 w-4 text-yellow-500" />
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="h-80 flex items-center justify-center">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-muted-foreground">Loading chart data...</p>
                </div>
              </div>
            ) : metrics && metrics.series.length > 0 ? (
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={formatChartData(metrics.series)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip 
                      labelFormatter={(label) => `Date: ${label}`}
                      formatter={(value) => [`${value} hours`, 'Screen Time']}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="hours" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={2}
                      dot={{ r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-80 flex items-center justify-center">
                <div className="text-center">
                  <TrendingDown className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No data available for the selected period</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {viewMode === 'me' ? 'Add some screen time entries to see your trends' : 'No user data available yet'}
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}