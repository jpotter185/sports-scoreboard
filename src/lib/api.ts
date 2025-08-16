import type { Game, Team } from './types';

const ESPN_NFL_API = 'https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard';
const ESPN_MLS_API = 'https://site.api.espn.com/apis/site/v2/sports/soccer/usa.1/scoreboard';
const ESPN_EPL_API = 'https://site.api.espn.com/apis/site/v2/sports/soccer/eng.1/scoreboard';
const ESPN_MLB_API = 'https://site.api.espn.com/apis/site/v2/sports/baseball/mlb/scoreboard';

// ESPN API response interfaces
interface ESPNGame {
  id: string;
  date: string;
  status: {
    type: {
      name: string;
      state: string;
      shortDetail?: string;
    };
    displayClock?: string;
    period: number;
  };
  competitions: Array<{
    competitors: Array<{
      id: string;
      homeAway: string;
      score: string;
      team: {
        id: string;
        name: string;
        displayName: string;
        abbreviation: string;
        color?: string;
        alternateColor?: string;
        logo?: string;
      };
      records?: Array<{ summary: string }>;
    }>;
    situation?: {
      outs?: number;
    };
    venue?: {
      fullName: string;
    };
  }>;
}

interface ESPNScheduleResponse {
  events: ESPNGame[];
  leagues?: Array<{
    week?: { number: number };
    season: { year: number; type: number };
  }>;
}

function convertESPNStatus(espnStatus: ESPNGame['status']): 'scheduled' | 'live' | 'final' | 'postponed' | 'cancelled' {
  const name = espnStatus.type.name;
  const state = espnStatus.type.state;

  const statusMap: Record<string, 'scheduled' | 'live' | 'final' | 'postponed' | 'cancelled'> = {
    // Common across sports
    'STATUS_SCHEDULED': 'scheduled',
    'STATUS_IN_PROGRESS': 'live',
    'STATUS_HALFTIME': 'live',
    'STATUS_FINAL': 'final',
    'STATUS_POSTPONED': 'postponed',
    'STATUS_CANCELLED': 'cancelled',
    'STATUS_DELAYED': 'postponed',
    // Soccer-specific or alternates seen on ESPN
    'STATUS_FULL_TIME': 'final',
    'STATUS_END': 'final',
    'STATUS_EXTRA_TIME': 'live',
    'STATUS_PENALTIES': 'live',
    'STATUS_END_PERIOD': 'live',
    'STATUS_END_REGULATION': 'live'
  };

  if (name in statusMap) {
    return statusMap[name];
  }

  // Fallback based on high-level state
  if (state === 'in') return 'live';
  if (state === 'post') return 'final';
  if (state === 'pre') return 'scheduled';

  return 'scheduled';
}

// (duplicate ESPNGame interface removed)

// Use displayClock when formatting live periods for football and soccer
function convertESPNGame(espnGame: ESPNGame, sport: 'football' | 'soccer' | 'baseball'): Game {
  const competition = espnGame.competitions[0];
  const homeTeam = competition.competitors.find(c => c.homeAway === 'home')!;
  const awayTeam = competition.competitors.find(c => c.homeAway === 'away')!;

  const homeTeamObj: Team = {
    id: homeTeam.id,
    name: homeTeam.team.name,
    city: homeTeam.team.displayName.replace(homeTeam.team.name, '').trim(),
    abbreviation: homeTeam.team.abbreviation,
    primaryColor: homeTeam.team.color || '#6B7280',
    secondaryColor: homeTeam.team.alternateColor || '#9CA3AF',
    logo: homeTeam.team.logo,
    record: homeTeam.records?.[0]?.summary
  };

  const awayTeamObj: Team = {
    id: awayTeam.id,
    name: awayTeam.team.name,
    city: awayTeam.team.displayName.replace(awayTeam.team.name, '').trim(),
    abbreviation: awayTeam.team.abbreviation,
    primaryColor: awayTeam.team.color || '#6B7280',
    secondaryColor: awayTeam.team.alternateColor || '#9CA3AF',
    logo: awayTeam.team.logo,
    record: awayTeam.records?.[0]?.summary
  };

  let time: string | undefined;
  let quarter: string | undefined;
  let period: string | undefined;

  if (espnGame.status.type.state === 'pre') {
    // leave top as Scheduled; bottom uses date
  } else if (espnGame.status.type.state === 'in') {
    const clock = espnGame.status.displayClock;
    const currentPeriod = espnGame.status.period;

    if (sport === 'football') {
      quarter = `Q${currentPeriod}`;
      period = clock ? `${clock}` : undefined;
    } else if (sport === 'soccer') {
      let halfLabel: string;
      if (currentPeriod === 1) halfLabel = '1H';
      else if (currentPeriod === 2) halfLabel = '2H';
      else if (currentPeriod === 3) halfLabel = 'ET1';
      else if (currentPeriod === 4) halfLabel = 'ET2';
      else halfLabel = `P${currentPeriod}`;
      period = clock ? `${halfLabel} - ${clock}` : halfLabel;
    } else {
      // baseball
      // ESPN often provides a useful shortDetail like "Top 5th"
      const short = espnGame.status.type.shortDetail;
      const outs = competition.situation?.outs;
      const baseLabel = short || `Inning ${currentPeriod}`;
      period = typeof outs === 'number' ? `${baseLabel} - ${outs} ${outs === 1 ? 'Out' : 'Outs'}` : baseLabel;
    }
  } else if (espnGame.status.type.state === 'post') {
    time = 'Final';
  }

  const url = sport === 'football'
    ? `https://www.espn.com/nfl/game/_/gameId/${espnGame.id}`
    : sport === 'soccer'
      ? `https://www.espn.com/soccer/match/_/gameId/${espnGame.id}`
      : `https://www.espn.com/mlb/game/_/gameId/${espnGame.id}`;

  return {
    id: espnGame.id,
    homeTeam: homeTeamObj,
    awayTeam: awayTeamObj,
    homeScore: parseInt(homeTeam.score || '0'),
    awayScore: parseInt(awayTeam.score || '0'),
    status: convertESPNStatus(espnGame.status),
    time,
    quarter,
    period,
    date: espnGame.date,
    venue: competition.venue?.fullName,
    url
  };
}

export async function fetchNFLGames(week?: number, season?: number): Promise<Game[]> {
  try {
    let url = ESPN_NFL_API;
    const params = new URLSearchParams();
    if (week) { params.append('week', week.toString()); }
    if (season) { params.append('year', season.toString()); }
    if (params.toString()) { url += '?' + params.toString(); }

    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch NFL games from ESPN API');
    const data: ESPNScheduleResponse = await response.json();
    return data.events.map(e => convertESPNGame(e, 'football'));
  } catch (error) {
    console.error('Error fetching NFL games from ESPN:', error);
    return [];
  }
}

export async function fetchNFLTeams(): Promise<Team[]> {
  try {
    const games = await fetchNFLGames();
    const teams = new Map<string, Team>();
    games.forEach(game => {
      teams.set(game.homeTeam.id, game.homeTeam);
      teams.set(game.awayTeam.id, game.awayTeam);
    });
    return Array.from(teams.values());
  } catch (error) {
    console.error('Error fetching NFL teams:', error);
    return [];
  }
}

export async function fetchMLSGames(): Promise<Game[]> {
  try {
    const response = await fetch(ESPN_MLS_API);
    if (!response.ok) throw new Error('Failed to fetch MLS games from ESPN API');
    const data: ESPNScheduleResponse = await response.json();
    if (!data.events || data.events.length === 0) {
      console.log('No MLS games found in ESPN API response');
      return [];
    }
    return data.events.map(e => convertESPNGame(e, 'soccer'));
  } catch (error) {
    console.error('Error fetching MLS games from ESPN:', error);
    return [];
  }
}

export async function fetchMLSTeams(): Promise<Team[]> {
  try {
    const games = await fetchMLSGames();
    const teams = new Map<string, Team>();
    games.forEach(game => {
      teams.set(game.homeTeam.id, game.homeTeam);
      teams.set(game.awayTeam.id, game.awayTeam);
    });
    return Array.from(teams.values());
  } catch (error) {
    console.error('Error fetching MLS teams:', error);
    return [];
  }
}

export async function fetchEPLGames(): Promise<Game[]> {
  try {
    const response = await fetch(ESPN_EPL_API);
    if (!response.ok) throw new Error('Failed to fetch EPL games from ESPN API');
    const data: ESPNScheduleResponse = await response.json();
    if (!data.events || data.events.length === 0) {
      console.log('No EPL games found in ESPN API response');
      return [];
    }
    return data.events.map(e => convertESPNGame(e, 'soccer'));
  } catch (error) {
    console.error('Error fetching EPL games from ESPN:', error);
    return [];
  }
}

export async function fetchEPLTeams(): Promise<Team[]> {
  try {
    const games = await fetchEPLGames();
    const teams = new Map<string, Team>();
    games.forEach(game => {
      teams.set(game.homeTeam.id, game.homeTeam);
      teams.set(game.awayTeam.id, game.awayTeam);
    });
    return Array.from(teams.values());
  } catch (error) {
    console.error('Error fetching EPL teams:', error);
    return [];
  }
}

export async function fetchMLBGames(): Promise<Game[]> {
  try {
    const response = await fetch(ESPN_MLB_API);
    if (!response.ok) throw new Error('Failed to fetch MLB games from ESPN API');
    const data: ESPNScheduleResponse = await response.json();
    if (!data.events || data.events.length === 0) {
      console.log('No MLB games found in ESPN API response');
      return [];
    }
    return data.events.map(e => convertESPNGame(e, 'baseball'));
  } catch (error) {
    console.error('Error fetching MLB games from ESPN:', error);
    return [];
  }
}

export async function fetchMLBTeams(): Promise<Team[]> {
  try {
    const games = await fetchMLBGames();
    const teams = new Map<string, Team>();
    games.forEach(game => {
      teams.set(game.homeTeam.id, game.homeTeam);
      teams.set(game.awayTeam.id, game.awayTeam);
    });
    return Array.from(teams.values());
  } catch (error) {
    console.error('Error fetching MLB teams:', error);
    return [];
  }
}

export async function getNFLInfo(): Promise<{ week: number; season: number; seasonType: string }> {
  async function fetchInfo(query: string = ''): Promise<ESPNScheduleResponse> {
    const url = query ? `${ESPN_NFL_API}?${query}` : ESPN_NFL_API;
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch NFL info from ESPN API');
    return response.json();
  }

  try {
    // First try default endpoint
    let data: ESPNScheduleResponse = await fetchInfo();
    let league = data.leagues?.[0];

    // If ESPN reports Offseason (type 4), retry asking explicitly for Preseason
    if (!league || league.season.type === 4) {
      data = await fetchInfo('seasontype=1');
      league = data.leagues?.[0] || league;
    }

    const type = league?.season.type ?? 2;
    const seasonType = type === 1 ? 'Preseason' : type === 2 ? 'Regular Season' : type === 3 ? 'Postseason' : 'Off Season';

    return {
      week: league?.week?.number ?? 0,
      season: league?.season.year || new Date().getFullYear(),
      seasonType
    };
  } catch (error) {
    console.error('Error fetching NFL info:', error);
    return { week: 0, season: new Date().getFullYear(), seasonType: 'Regular Season' };
  }
}
 
