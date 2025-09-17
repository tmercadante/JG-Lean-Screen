export interface Profile {
  id: string;
  user_id: string;
  name: string;
  email: string;
  time_zone: string;
  created_at: string;
  updated_at: string;
}

export interface ScreenEntry {
  id: string;
  user_id: string;
  week_start_local: string;
  total_hours: number;
  created_at: string;
  updated_at: string;
}

export interface MetricsResponse {
  scope: 'week' | 'month' | 'year';
  range: {
    start: string;
    end: string;
  };
  series: Array<{
    date: string;
    totalHours: number;
  }>;
  aggregates: {
    totalHours: number;
    avgPerWeek: number;
  };
  streak?: {
    weeks: number;
    currentStart: string;
  };
}

export interface LeaderboardRow {
  rank: number;
  user: {
    id: string;
    name: string;
  };
  totalHours: number;
  top3: boolean;
  streak?: number;
}

export interface LeaderboardResponse {
  scope: 'week' | 'month' | 'year';
  range: {
    start: string;
    end: string;
  };
  rows: LeaderboardRow[];
  myRank?: {
    rank: number;
    totalHours: number;
  };
}

export type TimeScope = 'week' | 'month' | 'year';