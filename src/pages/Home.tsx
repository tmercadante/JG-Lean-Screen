import { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Hourglass, BarChart3, Trophy, LogOut } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import ScreenTimeModal from '@/components/ScreenTimeModal';

export default function Home() {
  const { user, profile, signOut, loading } = useAuth();
  const [modalOpen, setModalOpen] = useState(false);
  const handleAddScreenTime = () => {
    // TODO: open your modal, route to a form, etc.
    // e.g., setOpen(true) or navigate("/log-week")
  };

  // Redirect to auth if not authenticated
  if (!loading && !user) {
    return <Navigate to="/auth" replace />;
  }

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

  const handleModalSuccess = () => {
    // Refresh or refetch data if needed
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground">JG Lean Screen</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              Welcome, {profile?.name || user?.email}
            </span>
            <Button variant="ghost" size="sm" onClick={signOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto text-center space-y-8">
          {/* Hero Section */}
          <div className="space-y-4">
            <h2 className="text-3xl font-bold text-foreground">
              Track Your Digital Wellness
            </h2>
            <p className="text-lg text-muted-foreground">
              Record your weekly screen time and compete for the lowest usage. Less screen time = higher rank!
            </p>
          </div>

          {/* Primary Action */}
          <div className="space-y-4">
            <Button
  className="h-14 w-full sm:w-auto px-6 text-lg gap-3 bg-[var(--primary)] text-white hover:opacity-90"
  aria-label="Add Screen Time"
  onClick={handleAddScreenTime} // keep your existing handler
>
  <Hourglass size={32} strokeWidth={1.75} aria-hidden="true" />
  Add Screen Time
</Button>

            <p className="text-sm text-muted-foreground">
              Submit your total screen time for this week or the past two weeks
            </p>
          </div>

          {/* Navigation Cards */}
          <div className="grid md:grid-cols-2 gap-6 mt-12">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <Link to="/metrics">
                <CardContent className="p-6 text-center space-y-4">
                  <div className="w-12 h-12 mx-auto bg-primary/10 rounded-lg flex items-center justify-center">
                    <BarChart3 className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-foreground">Metrics & Charts</h3>
                    <p className="text-muted-foreground">
                      View your personal stats and compare with aggregated user data
                    </p>
                  </div>
                </CardContent>
              </Link>
            </Card>

            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <Link to="/leaderboard">
                <CardContent className="p-6 text-center space-y-4">
                  <div className="w-12 h-12 mx-auto bg-primary/10 rounded-lg flex items-center justify-center">
                    <Trophy className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-foreground">Leaderboard</h3>
                    <p className="text-muted-foreground">
                      See how you rank against other users and earn badges
                    </p>
                  </div>
                </CardContent>
              </Link>
            </Card>
          </div>

          {/* Info Section */}
          <div className="mt-16 p-6 bg-muted/50 rounded-lg">
            <h3 className="text-lg font-semibold mb-3">How it works</h3>
            <div className="text-sm text-muted-foreground space-y-2 text-left">
              <p>• <strong>Less is more:</strong> Users with the lowest screen time rank highest</p>
              <p>• <strong>Weekly submissions:</strong> Enter your total hours for the current or past 2 weeks</p>
              <p>• <strong>Compete and improve:</strong> Track streaks and earn top-3 badges</p>
              <p>• <strong>Build healthy habits:</strong> Gamification encourages mindful screen time usage</p>
            </div>
          </div>
        </div>
      </main>

      <ScreenTimeModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        onSuccess={handleModalSuccess}
      />
    </div>
  );
}
