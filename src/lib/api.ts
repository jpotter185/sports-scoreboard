import type { ScoreboardData, League, Game, Team, Stat } from './types';

const ESPN_NFL_API = 'https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard';
const ESPN_MLS_API = 'https://site.api.espn.com/apis/site/v2/sports/soccer/usa.1/scoreboard';
const ESPN_EPL_API = 'https://site.api.espn.com/apis/site/v2/sports/soccer/eng.1/scoreboard';
const ESPN_MLB_API = 'https://site.api.espn.com/apis/site/v2/sports/baseball/mlb/scoreboard';

// New endpoints for getting ALL teams in each league
const ESPN_NFL_TEAMS_API = 'https://site.api.espn.com/apis/site/v2/sports/football/nfl/teams';
const ESPN_MLS_TEAMS_API = 'https://site.api.espn.com/apis/site/v2/sports/soccer/usa.1/teams';
const ESPN_EPL_TEAMS_API = 'https://site.api.espn.com/apis/site/v2/sports/soccer/eng.1/teams';
const ESPN_MLB_TEAMS_API = 'https://site.api.espn.com/apis/site/v2/sports/baseball/mlb/teams';

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

// New interface for teams API response
interface ESPNTeamsResponse {
  sports: Array<{
    leagues: Array<{
      teams: Array<{
        team: {
          id: string;
          name: string;
          displayName: string;
          abbreviation: string;
          color?: string;
          alternateColor?: string;
          logos?: Array<{
            href: string;
            alt: string;
            rel: string[];
            width: number;
            height: number;
          }>;
        };
        record?: {
          items?: Array<{
            summary: string;
            stats?: Array<{
              name: string;
              value: number;
            }>;
          }>;
        };
        stats?: Array<{
          name: string;
          value: number;
        }>;
        group?: {
          name: string;
        };
      }>;
    }>;
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
function convertESPNGame(espnGame: ESPNGame, sport: 'football' | 'soccer' | 'baseball', league: 'nfl' | 'mls' | 'epl' | 'mlb'): Game {
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
    league: league,
    url
  };
}

export async function fetchNFLGames(week?: number, season?: number, fetchFn?: typeof globalThis.fetch): Promise<Game[]> {
  try {
    let url = ESPN_NFL_API;
    const params = new URLSearchParams();
    if (week) { params.append('week', week.toString()); }
    if (season) { params.append('year', season.toString()); }
    if (params.toString()) { url += '?' + params.toString(); }

    // Use provided fetchFn or fall back to global fetch
    const fetchFunction = fetchFn || globalThis.fetch;
    const response = await fetchFunction(url);
    if (!response.ok) throw new Error('Failed to fetch NFL games from ESPN API');
    const data: ESPNScheduleResponse = await response.json();
    return data.events.map(e => convertESPNGame(e, 'football', 'nfl'));
  } catch (error) {
    console.error('Error fetching NFL games from ESPN:', error);
    return [];
  }
}

const groupDivisionMapping: Record<string, { division: string; conference: string }> = {
  '1': { division: 'NFC East', conference: 'NFC' },
  '3': { division: 'NFC West', conference: 'NFC' },
  '4': { division: 'AFC East', conference: 'AFC' },
  '6': { division: 'AFC West', conference: 'AFC' },
  '10': { division: 'NFC North', conference: 'NFC' },
  '11': { division: 'NFC South', conference: 'NFC' },
  '12': { division: 'AFC North', conference: 'AFC' },
  '13': { division: 'AFC South', conference: 'AFC' }
};

export async function fetchNFLTeams(fetchFn?: typeof globalThis.fetch): Promise<Team[]> {


  try {
    // Try the main NFL teams API first
    // Use provided fetchFn or fall back to global fetch
    const fetchFunction = fetchFn || globalThis.fetch;
    const response = await fetchFunction(ESPN_NFL_TEAMS_API);
    if (!response.ok) throw new Error('Failed to fetch NFL teams from ESPN API');
    const data: ESPNTeamsResponse = await response.json();
    
    // Debug: Log the raw API response to see the actual structure
    
    if (!data.sports?.[0]?.leagues?.[0]?.teams) {
      return [];
    }

    // Fetch detailed stats for each team from individual team endpoints
    const teamsWithStats = await Promise.all(data.sports[0].leagues[0].teams.map(async (espnTeam) => {
      const team = espnTeam.team;
      const record = espnTeam.record?.items?.[0]?.summary || '';
      // Try to fetch detailed stats from the individual team stats page
      const detailedStats = await fetchNFLTeamStats(team.id, fetchFunction);
      // Extract logo from team.logos array
      const logo = team.logos?.[0]?.href;
      
      // Extract NFL-specific stats for standings
      const wins = detailedStats?.wins || 0;
      const losses = detailedStats?.losses || 0;
      const ties = detailedStats?.ties || 0;
      const gamesPlayed = detailedStats?.gamesPlayed || 0;
      const pointsFor = detailedStats?.pointsFor || 0;
      const pointsAgainst = detailedStats?.pointsAgainst || 0;
      
      // Parse record string to get wins, losses, and ties if stats aren't available
      let parsedWins = wins;
      let parsedLosses = losses;
      let parsedTies = ties;
      if (record && record.includes('-')) {
        const parts = record.split('-');
        if (parts.length >= 2) {
          parsedWins = parseInt(parts[0].trim()) || 0;
          parsedLosses = parseInt(parts[1].trim()) || 0;
          if (parts.length >= 3) {
            parsedTies = parseInt(parts[2].trim()) || 0;
          }
        }
      }
      const winPercentage = detailedStats?.winPercent ? Math.round(detailedStats.winPercent * 1000) / 1000 : undefined;
      
      
      let divisionName = detailedStats?.division;
      let conference = detailedStats?.conference;
      
      return {
        id: team.id,
        name: team.name,
        city: team.displayName.replace(team.name, '').trim(),
        abbreviation: team.abbreviation,
        logo: logo,
        primaryColor: team.color,
        secondaryColor: team.alternateColor,
        division: divisionName,
        record: detailedStats?.record || record,
        // NFL standings stats
        wins: parsedWins,
        losses: parsedLosses,
        ties: parsedTies,
        gamesPlayed: gamesPlayed,
        pointsFor: pointsFor,
        pointsAgainst: pointsAgainst,
        winPercentage: winPercentage,
        // Conference information
        conference: conference,
        // Store group IDs for debugging - get this from the main team data
        groupId: (team as any).groups?.id || null,
        parentGroupId: (team as any).groups?.parent?.id || null
      };
    }));

    // Debug: Show summary of all group IDs discovered
    const discoveredGroups = new Map<string, Set<string>>();
    teamsWithStats.forEach(team => {
      if (team.groupId) {
        if (!discoveredGroups.has(team.groupId)) {
          discoveredGroups.set(team.groupId, new Set());
        }
        discoveredGroups.get(team.groupId)!.add(team.abbreviation);
      }
    });
    
    discoveredGroups.forEach((teams, groupId) => {
    });

    // Hardcode the division names for each group ID
    

    // Now assign the correct division and conference to each team based on their group ID
    teamsWithStats.forEach(team => {
      if (team.groupId && groupDivisionMapping[team.groupId]) {
        const mapping = groupDivisionMapping[team.groupId];
        team.division = mapping.division;
        team.conference = mapping.conference;
      }
    });


    return teamsWithStats;
  } catch (error) {
    console.error('Error fetching NFL teams (fallback):', error);
    return [];
  }
}

export async function fetchMLSGames(fetchFn?: typeof globalThis.fetch): Promise<Game[]> {
  try {
    // Use provided fetchFn or fall back to global fetch
    const fetchFunction = fetchFn || globalThis.fetch;
    const response = await fetchFunction(ESPN_MLS_API);
    if (!response.ok) throw new Error('Failed to fetch MLS games from ESPN API');
    const data: ESPNScheduleResponse = await response.json();
    if (!data.events || data.events.length === 0) {
      return [];
    }
    return data.events.map(e => convertESPNGame(e,'soccer', 'mls'));
  } catch (error) {
    console.error('Error fetching MLS games from ESPN:', error);
    return [];
  }
}

export async function fetchMLSTeams(fetchFn?: typeof globalThis.fetch): Promise<Team[]> {
  try {
    // Use provided fetchFn or fall back to global fetch
    const fetchFunction = fetchFn || globalThis.fetch;
    const response = await fetchFunction(ESPN_MLS_TEAMS_API);
    if (!response.ok) throw new Error('Failed to fetch MLS teams from ESPN API');
    const data: ESPNTeamsResponse = await response.json();
    
    // Debug: Log the raw API response to see the actual structure
    
    if (!data.sports?.[0]?.leagues?.[0]?.teams) {
      return [];
    }
    

    return Promise.all(data.sports[0].leagues[0].teams.map(async (espnTeam) => {
      const team = espnTeam.team;

      const statsResponseUrl = `https://site.api.espn.com/apis/site/v2/sports/soccer/usa.1/teams/${team.id}`;

      const statsResponse = await fetchFunction(statsResponseUrl);
      const statsData = await statsResponse.json();
      const stats = statsData.team.record.items[0].stats;
      // Extract logo from team.logos array - logos are inside the team object
      const logo = team.logos?.[0]?.href;
      
      // Extract soccer-specific stats
      const gamesPlayed = stats.find((s: Stat) => s.name === 'gamesPlayed')?.value || 0;
      const wins = stats.find((s: Stat) => s.name === 'wins')?.value || 0;
      const draws = stats.find((s: Stat) => s.name === 'ties')?.value || 0;
      const losses = stats.find((s: Stat) => s.name === 'losses')?.value || 0;
      const goalsFor = stats.find((s: Stat) => s.name === 'points')?.value || 0;
      const goalsAgainst = stats.find((s: Stat) => s.name === 'pointsAgainst')?.value || 0;
      const goalsDiff = stats.find((s: Stat) => s.name === 'pointDifferential')?.value || 0;
      const points = stats.find((s: Stat) => s.name === 'points')?.value || 0;
      const conference = statsData.team.groups.id === '1' ? 'Eastern Conference' : 'Western Conference';

      return {
        id: team.id,
        name: team.name,
        city: statsData.team.shortDisplayName,
        abbreviation: team.abbreviation,
        logo: logo,
        primaryColor: team.color,
        secondaryColor: team.alternateColor,
        conference: conference,
        // Soccer stats
        gamesPlayed,
        wins,
        draws,
        losses,
        goalsFor,
        goalsAgainst,
        goalsDiff,
        points
      };
    }));
  } catch (error) {
    console.error('Error fetching MLS teams:', error);
    return [];
  }
}

export async function fetchEPLGames(fetchFn?: typeof globalThis.fetch): Promise<Game[]> {
  try {
    // Use provided fetchFn or fall back to global fetch
    const fetchFunction = fetchFn || globalThis.fetch;
    const response = await fetchFunction(ESPN_EPL_API);
    if (!response.ok) throw new Error('Failed to fetch EPL games from ESPN API');
    const data: ESPNScheduleResponse = await response.json();
    if (!data.events || data.events.length === 0) {
      return [];
    }
    return data.events.map(e => convertESPNGame(e, 'soccer', 'epl'));
  } catch (error) {
    console.error('Error fetching EPL games from ESPN:', error);
    return [];
  }
}

export async function fetchEPLTeams(fetchFn?: typeof globalThis.fetch): Promise<Team[]> {
  try {
    // Use provided fetchFn or fall back to global fetch
    const fetchFunction = fetchFn || globalThis.fetch;
    const response = await fetchFunction(ESPN_EPL_TEAMS_API);
    if (!response.ok) throw new Error('Failed to fetch EPL teams from ESPN API');
    const data: ESPNTeamsResponse = await response.json();
    
    if (!data.sports?.[0]?.leagues?.[0]?.teams) {
      return [];
    }
    

    return Promise.all(data.sports[0].leagues[0].teams.map(async (espnTeam) => {
      
      const team = espnTeam.team;

      const statsResponseUrl = `https://site.api.espn.com/apis/site/v2/sports/soccer/eng.1/teams/${team.id}`;

      const statsResponse = await fetchFunction(statsResponseUrl);
      const statsData = await statsResponse.json();
      const stats = statsData.team.record.items[0].stats;
      // Extract logo from team.logos array
      const logo = team.logos?.[0]?.href;
      
      // Extract soccer-specific stats
      const gamesPlayed = stats.find((s: Stat) => s.name === 'gamesPlayed')?.value || 0;
      const wins = stats.find((s: Stat) => s.name === 'wins')?.value || 0;
      const draws = stats.find((s: Stat) => s.name === 'ties')?.value || 0;
      const losses = stats.find((s: Stat) => s.name === 'losses')?.value || 0;
      const goalsFor = stats.find((s: Stat) => s.name === 'points')?.value || 0;
      const goalsAgainst = stats.find((s: Stat) => s.name === 'pointsAgainst')?.value || 0;
      const goalsDiff = stats.find((s: Stat) => s.name === 'pointDifferential')?.value || 0;
      const points = stats.find((s: Stat) => s.name === 'points')?.value || 0;
      
      return {
        id: team.id,
        name: team.name,
        city: team.displayName.replace(team.name, '').trim(),
        abbreviation: team.abbreviation,
        logo: logo,
        primaryColor: team.color,
        secondaryColor: team.alternateColor,
        // Soccer stats
        gamesPlayed,
        wins,
        draws,
        losses,
        goalsFor,
        goalsAgainst,
        goalsDiff,
        points
      };
    }));
  } catch (error) {
    console.error('Error fetching EPL teams:', error);
    return [];
  }
}

export async function fetchMLBGames(fetchFn?: typeof globalThis.fetch): Promise<Game[]> {
  try {
    // Use provided fetchFn or fall back to global fetch
    const fetchFunction = fetchFn || globalThis.fetch;
    const response = await fetchFunction(ESPN_MLB_API);
    if (!response.ok) throw new Error('Failed to fetch MLB games from ESPN API');
    const data: ESPNScheduleResponse = await response.json();
    if (!data.events || data.events.length === 0) {
      return [];
    }
    return data.events.map(e => convertESPNGame(e, 'baseball', 'mlb'));
  } catch (error) {
    console.error('Error fetching MLB games from ESPN:', error);
    return [];
  }
}

// Function to fetch detailed team stats from ESPN individual team API
async function fetchMLBTeamStats(teamAbbr: string, teamName: string, fetchFn?: typeof globalThis.fetch): Promise<any> {
  try {
    // Use the individual team API endpoint that provides comprehensive stats
    const teamStatsUrl = `https://site.api.espn.com/apis/site/v2/sports/baseball/mlb/teams/${teamAbbr.toLowerCase()}`;
    
    const response = await (fetchFn || fetch)(teamStatsUrl);
    if (!response.ok) {
      return null;
    }
    
    const data = await response.json();
    
    // Extract the standings data from the response
    if (data.team && data.team.record && data.team.record.items) {
      const overallRecord = data.team.record.items.find((item: any) => item.type === 'total');
      if (overallRecord) {
        return {
          record: overallRecord.summary,
          stats: overallRecord.stats,
          standingSummary: data.team.standingSummary
        };
      }
    }
    
    return null;
  } catch (error) {
    console.error(`Error fetching stats for ${teamName}:`, error);
    return null;
  }
}

// Function to fetch detailed NFL team stats from ESPN individual team API
async function fetchNFLTeamStats(teamId: string, fetchFn?: typeof globalThis.fetch): Promise<any> {
  try {
    // Use the better ESPN core API endpoint that provides comprehensive stats
    const teamInfoUrl = `https://site.api.espn.com/apis/site/v2/sports/football/nfl/teams/${teamId}`;
    
    // Use provided fetchFn or fall back to global fetch
    const fetchFunction = fetchFn || globalThis.fetch;
    const response = await fetchFunction(teamInfoUrl);
    if (!response.ok) {
      return null;
    }
    
    const data = await response.json();
    const divisionGroupId = data.team.groups.id;
    const divisionName = groupDivisionMapping[divisionGroupId].division;
    const conferenceName = groupDivisionMapping[divisionGroupId].conference;

    const teamStatsUrl = `https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/seasons/2024/types/2/teams/${teamId}/record`;
    const teamStatsResponse = await fetchFunction(teamStatsUrl);
    if (!teamStatsResponse.ok) {
      return null;
    }
    const teamStatsData = await teamStatsResponse.json();
    
    if (teamStatsData.items && teamStatsData.items.length > 0) {
      // Extract different record types
      const overallRecord = teamStatsData.items.find((item: any) => item.type === 'total');
      const homeRecord = teamStatsData.items.find((item: any) => item.type === 'home');
      const roadRecord = teamStatsData.items.find((item: any) => item.type === 'road');
      const divisionRecord = teamStatsData.items.find((item: any) => item.type === 'vsdiv');
      const conferenceRecord = teamStatsData.items.find((item: any) => item.type === 'vsconf');
      
      if (overallRecord) {
        // Extract the comprehensive stats from overall record
        const stats = overallRecord.stats || [];
        
        // Helper function to find stat values
        const getStatValue = (statName: string) => {
          const stat = stats.find((s: any) => s.name === statName);
          return stat ? stat.value : 0;
        };
        
        // Extract key stats
        const wins = getStatValue('wins');
        const losses = getStatValue('losses');
        const ties = getStatValue('ties');
        const gamesPlayed = getStatValue('gamesPlayed');
        const pointsFor = getStatValue('pointsFor');
        const pointsAgainst = getStatValue('pointsAgainst');
        const winPercent = Math.round(getStatValue('winPercent') * 1000) / 1000;
        const pointDifferential = getStatValue('pointDifferential');
        const avgPointsFor = getStatValue('avgPointsFor');
        const avgPointsAgainst = getStatValue('avgPointsAgainst');
        const playoffSeed = getStatValue('playoffSeed');
        const streak = stats.find((s: any) => s.name === 'streak')?.displayValue || '';
        
        // Extract home/road records
        const homeSummary = homeRecord?.summary || '';
        const roadSummary = roadRecord?.summary || '';
        const divisionSummary = divisionRecord?.summary || '';
        const conferenceSummary = conferenceRecord?.summary || '';
        
        return {
          record: overallRecord.summary,
          wins,
          losses,
          ties,
          gamesPlayed,
          pointsFor,
          pointsAgainst,
          winPercent,
          pointDifferential,
          avgPointsFor,
          avgPointsAgainst,
          playoffSeed,
          streak,
          homeRecord: homeSummary,
          roadRecord: roadSummary,
          divisionRecord: divisionSummary,
          conferenceRecord: conferenceSummary,
          // Keep the existing fields for backward compatibility
          stats: stats,
          division: divisionName, // We'll get this from the group mapping
          conference: conferenceName, // We'll get this from the group mapping
        };
      }
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching NFL team stats:', error);
    return null;
  }
}
// ... existing code ...

// MLB Division mapping fallback since ESPN API doesn't provide divisions
const MLB_DIVISIONS: Record<string, string> = {
  // AL East
  'BAL': 'AL East', 'BOS': 'AL East', 'NYY': 'AL East', 'TB': 'AL East', 'TOR': 'AL East',
  // AL Central  
  'CHW': 'AL Central', 'CLE': 'AL Central', 'DET': 'AL Central', 'KC': 'AL Central', 'MIN': 'AL Central',
  // AL West
  'HOU': 'AL West', 'LAA': 'AL West', 'ATH': 'AL West', 'SEA': 'AL West', 'TEX': 'AL West',
  // NL East
  'ATL': 'NL East', 'MIA': 'NL East', 'NYM': 'NL East', 'PHI': 'NL East', 'WSH': 'NL East',
  // NL Central
  'CHC': 'NL Central', 'CIN': 'NL Central', 'MIL': 'NL Central', 'PIT': 'NL Central', 'STL': 'NL Central',
  // NL West
  'ARI': 'NL West', 'COL': 'NL West', 'LAD': 'NL West', 'SD': 'NL West', 'SF': 'NL West'
};



export async function fetchMLBTeams(fetchFn?: typeof globalThis.fetch): Promise<Team[]> {
  try {
    const response = await (fetchFn || fetch)(ESPN_MLB_TEAMS_API);
    if (!response.ok) throw new Error('Failed to fetch MLB teams from ESPN API');
    const data: ESPNTeamsResponse = await response.json();
    
    // Debug: Log the raw API response to see the actual structure
    
    if (!data.sports?.[0]?.leagues?.[0]?.teams) {
      return [];
    }

    const teams = data.sports[0].leagues[0].teams;
    
    // Log all team abbreviations to see what we're working with
    const allAbbreviations = teams.map(t => t.team.abbreviation);
    
    // Log all unique division names to see what we're working with
    const divisions = [...new Set(teams.map(t => t.group?.name).filter(Boolean))];

    // Fetch detailed stats for each team
    const teamsWithStats = await Promise.all(teams.map(async (espnTeam) => {
      const team = espnTeam.team;
      const record = espnTeam.record?.items?.[0]?.summary || '';
      
      // Try multiple possible fields for division information
      let division = espnTeam.group?.name || '';
      if (!division) {
        division = MLB_DIVISIONS[team.abbreviation] || '';
      }
      
      const stats = espnTeam.stats || [];
      
      // Debug: Log each team's structure and division assignment
      
      // Extract logo from team.logos array
      const logo = team.logos?.[0]?.href;
      
      // Try to fetch detailed stats from the team stats page
      const detailedStats = await fetchMLBTeamStats(team.abbreviation, team.name, fetchFn);
      
      // Extract MLB-specific stats for standings from the detailed team API
      let parsedWins = 0;
      let parsedLosses = 0;
      let gamesBack = 0;
      let divisionGamesBehind = 0;
      let standingSummary = '';
      
      if (detailedStats) {
        // Parse the record string (e.g., "56-69")
        if (detailedStats.record && detailedStats.record.includes('-')) {
          const [w, l] = detailedStats.record.split('-').map((s: string) => parseInt(s.trim()) || 0);
          parsedWins = w;
          parsedLosses = l;
        }
        
        // Extract games behind and other stats from the detailed stats
        if (detailedStats.stats) {
          gamesBack = detailedStats.stats.find((s: { name: string; value: number }) => s.name === 'gamesBehind')?.value || 0;
          divisionGamesBehind = detailedStats.stats.find((s: { name: string; value: number }) => s.name === 'divisionGamesBehind')?.value || 0;
        }
        
        standingSummary = detailedStats.standingSummary || '';
      }
      
      // Fallback to parsing record from the teams list API if no detailed stats
      if (parsedWins === 0 && parsedLosses === 0 && record && record.includes('-')) {
        const [w, l] = record.split('-').map((s: string) => parseInt(s.trim()) || 0);
        if (w > 0 || l > 0) {
          parsedWins = w;
          parsedLosses = l;
        }
      }
      
      // Calculate win percentage
      const totalGames = parsedWins + parsedLosses;
      const winPercentage = totalGames > 0 ? Math.round((parsedWins / totalGames) * 1000) / 1000 : 0;
      
      const teamData = {
        id: team.id,
        name: team.name,
        city: team.displayName.replace(team.name, '').trim(),
        abbreviation: team.abbreviation,
        logo: logo,
        primaryColor: team.color,
        secondaryColor: team.alternateColor,
        division: division,
        record: detailedStats?.record || record,
        // MLB standings stats
        wins: parsedWins,
        losses: parsedLosses,
        gamesPlayed: totalGames,
        gamesBack: gamesBack,
        divisionGamesBehind: divisionGamesBehind,
        standingSummary: standingSummary,
        winPercentage: winPercentage
      };
      
      return teamData;
    }));

    // Debug: Show which teams didn't get divisions
    const teamsWithoutDivisions = teamsWithStats.filter((t: any) => !t.division);
    if (teamsWithoutDivisions.length > 0) {
      teamsWithoutDivisions.forEach((t: any) => {
      });
    }

    return teamsWithStats;
  } catch (error) {
    console.error('Error fetching MLB teams:', error);
    return [];
  }
}