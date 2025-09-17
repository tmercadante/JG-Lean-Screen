import { useState, useEffect } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Trophy, Medal, Award, Crown, Zap, LogOut } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { LeaderboardResponse, TimeScope } from '@/lib/types';
import { getCurrentPeriodReference } from '@/lib/date-utils';

export default function Leaderboard() {
  const { user, profile, signOut, loading } = useAuth();
  const { toast } = useToast();
  const [scope, setScope] = useState<TimeScope>('week');
  const [leaderboard, setLeaderboard] = useState<LeaderboardResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Redirect to auth if not authenticated
  if (!loading && !user) {
    return <Navigate to="/auth" replace />;
  }

  useEffect(() => {
    if (user) {
      fetchLeaderboard();
    }
  }, [scope, user]);

  const fetchLeaderboard = async () => {
    setIsLoading(true);
    try {
      const reference = getCurrentPeriodReference(scope);
      
      let params: Record<string, string> = { scope, limit: '50' };
      
      if (scope === 'week') {
        params.weekStart = reference;
      } else if (scope === 'month') {
        params.month = reference;
      } else {
        params.year = reference;
      }

      const { data, error } = await supabase.functions.invoke('leaderboard', {
        body: params,
      });

      if (error) {
        throw error;
      }

      setLeaderboard(data);
    } catch (error: any) {
      console.error('Error fetching leaderboard:', error);
      toast({
        title: 'Error loading leaderboard',
        description: error.message || 'Failed to load leaderboard data.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="h-5 w-5 text-yellow-500" />;
      case 2:
        return <Medal className="h-5 w-5 text-gray-400" />;
      case 3:
        return <Award className="h-5 w-5 text-amber-600" />;
      default:
        return null;
    }
  };

  const getRankBadge = (rank: number) => {
    if (rank <= 3) {
      const colors = {
        1: 'bg-yellow-500 text-white',
        2: 'bg-gray-400 text-white',
        3: 'bg-amber-600 text-white'
      };
      return (
        <Badge className={colors[rank as keyof typeof colors]}>
          #{rank}
        </Badge>
      );
    }
    return <Badge variant="outline">#{rank}</Badge>;
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
            <h1 className="text-2xl font-bold text-foreground">Leaderboard</h1>
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

      <div className="container mx-auto px-4 py-6">
        {/* Controls */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-primary" />
            <span className="text-lg font-medium">Rankings by lowest screen time</span>
          </div>
          
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

            <Button onClick={fetchLeaderboard} disabled={isLoading} variant="outline">
              {isLoading ? 'Loading...' : 'Refresh'}
            </Button>
          </div>
        </div>

        {/* My Rank Card */}
        {leaderboard?.myRank && (
          <Card className="mb-6 border-primary/20 bg-primary/5">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Trophy className="h-5 w-5 text-primary" />
                Your Ranking
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {getRankBadge(leaderboard.myRank.rank)}
                  <span className="font-medium">{profile?.name || 'You'}</span>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold">{leaderboard.myRank.totalHours} hours</div>
                  <div className="text-sm text-muted-foreground">Total screen time</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Leaderboard */}
        <Card>
          <CardHeader>
            <CardTitle>
              {scope === 'week' ? 'This Week' : scope === 'month' ? 'This Month' : 'This Year'} - Top Performers
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-6 bg-muted rounded"></div>
                        <div className="w-32 h-4 bg-muted rounded"></div>
                      </div>
                      <div className="w-16 h-4 bg-muted rounded"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : !leaderboard || leaderboard.rows.length === 0 ? (
              <div className="text-center py-12">
                <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No rankings available yet</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Be the first to submit screen time data!
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {leaderboard.rows.map((row, index) => (
                  <div
                    key={row.user.id}
                    className={`flex items-center justify-between p-4 border rounded-lg transition-colors ${
                      row.top3 ? 'bg-muted/50 border-primary/20' : 'hover:bg-muted/30'
                    } ${row.user.id === user?.id ? 'ring-2 ring-primary/30' : ''}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2 min-w-[60px]">
                        {getRankIcon(row.rank)}
                        {getRankBadge(row.rank)}
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <span className="font-medium">
                          {row.user.name}
                          {row.user.id === user?.id && (
                            <span className="text-sm text-primary ml-1">(You)</span>
                          )}
                        </span>
                        {row.streak && row.streak > 1 && (
                          <Badge variant="secondary" className="text-xs">
                            <Zap className="h-3 w-3 mr-1" />
                            {row.streak} week streak
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="font-bold">{row.totalHours} hours</div>
                      <div className="text-xs text-muted-foreground">
                        {row.top3 && '🏆 Top 3'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Info */}
        <div className="mt-8 p-4 bg-muted/50 rounded-lg">
          <h3 className="font-medium mb-2">How Rankings Work</h3>
          <div className="text-sm text-muted-foreground space-y-1">
            <p>• Lower screen time = higher rank (1st place has the least hours)</p>
            <p>• Ties are resolved using standard competition ranking (1, 1, 3, 4...)</p>
            <p>• Top 3 users earn special badges and recognition</p>
            <p>• Streaks show consecutive weeks with screen time entries</p>
          </div>
        </div>
      </div>
    </div>
  );
}