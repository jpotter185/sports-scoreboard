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
  isFavorite?: boolean;
  // Soccer-specific properties
  points?: number;
  gamesPlayed?: number;
  wins?: number;
  draws?: number;
  losses?: number;
  goalsFor?: number;
  goalsAgainst?: number;
  // MLB-specific properties
  gamesBack?: number;
  divisionGamesBehind?: number;
  standingSummary?: string;
  winPercentage?: number;
  // NFL-specific properties
  ties?: number;
  pointsFor?: number;
  pointsAgainst?: number;
}

// Internal team representation with unique IDs
export interface InternalTeam {
  internalId: string; // e.g., "mlb-17", "nfl-17"
  espnId: string;     // ESPN's original ID
  leagueId: string;   // e.g., "mlb", "nfl"
  team: Team;         // Original team data
}

// Translation layer for team IDs
export interface TeamIdTranslation {
  [espnId: string]: {
    [leagueId: string]: string; // espnId -> leagueId -> internalId
  };
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
  league?: string;
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
  isFavorite?: boolean;
}

export interface ScoreboardData {
  leagues: League[];
  lastUpdated: string;
}

// Removed APIGame and APITeam (not used)

export interface FavoritePreferences {
  teams: string[];
  leagues: string[];
  lastUpdated: string;
  _needsMigration?: boolean; // Temporary flag for migration from ESPN IDs
}
