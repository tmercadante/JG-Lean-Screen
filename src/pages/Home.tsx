// src/pages/Home.tsx
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
    setModalOpen(true);
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

          {/* Primary Action – large square brand-blue button */}
