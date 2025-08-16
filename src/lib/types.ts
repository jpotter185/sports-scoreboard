export interface Team {
  id: string;
  name: string;
  city: string;
  abbreviation: string;
  logo?: string;
  primaryColor?: string;
  secondaryColor?: string;
  conference?: string;
  division?: string;
  record?: string;
}

export interface Game {
  id: string;
  homeTeam: Team;
  awayTeam: Team;
  homeScore: number;
  awayScore: number;
  status: 'scheduled' | 'live' | 'final' | 'postponed' | 'cancelled';
  time?: string;
  quarter?: string;
  period?: string;
  date?: string;
  venue?: string;
  odds?: string;
  url?: string;
}

export interface League {
  id: string;
  name: string;
  sport: string;
  teams: Team[];
  games: Game[];
  season?: string;
  currentWeek?: number;
}

export interface ScoreboardData {
  leagues: League[];
  lastUpdated: string;
}

// Removed APIGame and APITeam (not used)
