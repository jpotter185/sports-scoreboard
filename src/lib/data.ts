import type { ScoreboardData, League, Team, Game } from './types';
import {
  fetchNFLGames,
  fetchMLSGames,
  fetchEPLGames,
  fetchMLBGames,
  fetchNFLTeams,
  fetchMLSTeams,
  fetchEPLTeams,
  fetchMLBTeams,
} from './api';

// Cache for teams data
let teamsCache: {
  nfl: Team[];
  mls: Team[];
  epl: Team[];
  mlb: Team[];
  lastUpdated: number;
} | null = null;

const TEAMS_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds

// Fetch teams with caching
async function getTeamsData(fetch?: typeof globalThis.fetch) {
  const now = Date.now();

  // Return cached teams if they're still fresh
  if (teamsCache && now - teamsCache.lastUpdated < TEAMS_CACHE_DURATION) {
    return teamsCache;
  }

  try {
    const [nflTeams, mlsTeams, eplTeams, mlbTeams] = await Promise.all([
      fetchNFLTeams(fetch),
      fetchMLSTeams(fetch),
      fetchEPLTeams(fetch),
      fetchMLBTeams(fetch),
    ]);

    // Update cache
    teamsCache = {
      nfl: nflTeams,
      mls: mlsTeams,
      epl: eplTeams,
      mlb: mlbTeams,
      lastUpdated: now,
    };

    return teamsCache;
  } catch (error) {
    console.error('Error fetching teams data:', error);
    // Return cached data if available, even if expired
    return (
      teamsCache || {
        nfl: [],
        mls: [],
        epl: [],
        mlb: [],
        lastUpdated: 0,
      }
    );
  }
}

// Fetch only games (for frequent updates)
export async function getGamesData(fetch?: typeof globalThis.fetch): Promise<ScoreboardData> {
  try {
    const [nflGames, mlsGames, eplGames, mlbGames] = await Promise.all([
      fetchNFLGames(undefined, undefined, fetch),
      fetchMLSGames(fetch),
      fetchEPLGames(fetch),
      fetchMLBGames(fetch),
    ]);

    // Get cached teams data
    const teamsData = await getTeamsData(fetch);

    const nfl: League = {
      id: 'nfl',
      name: 'National Football League',
      sport: 'Football',
      teams: teamsData.nfl,
      games: nflGames,
    };

    const mls: League = {
      id: 'mls',
      name: 'Major League Soccer',
      sport: 'Soccer',
      teams: teamsData.mls,
      games: mlsGames,
    };

    const epl: League = {
      id: 'epl',
      name: 'English Premier League',
      sport: 'Soccer',
      teams: teamsData.epl,
      games: eplGames,
    };

    const mlb: League = {
      id: 'mlb',
      name: 'Major League Baseball',
      sport: 'Baseball',
      teams: teamsData.mlb,
      games: mlbGames,
    };

    return {
      leagues: [nfl, mls, epl, mlb],
      lastUpdated: new Date().toLocaleTimeString(),
    };
  } catch (error) {
    console.error('Error fetching games data:', error);
    return {
      leagues: [],
      lastUpdated: new Date().toLocaleTimeString(),
    };
  }
}

// Fetch everything (for initial load)
export async function getScoreboardData(fetch?: typeof globalThis.fetch): Promise<ScoreboardData> {
  try {
    const [nflGames, mlsGames, eplGames, mlbGames, nflTeams, mlsTeams, eplTeams, mlbTeams] =
      await Promise.all([
        fetchNFLGames(undefined, undefined, fetch),
        fetchMLSGames(fetch),
        fetchEPLGames(fetch),
        fetchMLBGames(fetch),
        fetchNFLTeams(fetch),
        fetchMLSTeams(fetch),
        fetchEPLTeams(fetch),
        fetchMLBTeams(fetch),
      ]);

    // Update cache with fresh teams data
    teamsCache = {
      nfl: nflTeams,
      mls: mlsTeams,
      epl: eplTeams,
      mlb: mlbTeams,
      lastUpdated: Date.now(),
    };

    const nfl: League = {
      id: 'nfl',
      name: 'National Football League',
      sport: 'Football',
      teams: nflTeams,
      games: nflGames,
    };

    const mls: League = {
      id: 'mls',
      name: 'Major League Soccer',
      sport: 'Soccer',
      teams: mlsTeams,
      games: mlsGames,
    };

    const epl: League = {
      id: 'epl',
      name: 'English Premier League',
      sport: 'Soccer',
      teams: eplTeams,
      games: eplGames,
    };

    const mlb: League = {
      id: 'mlb',
      name: 'Major League Baseball',
      sport: 'Baseball',
      teams: mlbTeams,
      games: mlbGames,
    };

    return {
      leagues: [nfl, mls, epl, mlb],
      lastUpdated: new Date().toLocaleTimeString(),
    };
  } catch (error) {
    console.error('Error fetching scoreboard data:', error);
    return {
      leagues: [],
      lastUpdated: new Date().toLocaleTimeString(),
    };
  }
}

export const scoreboardData: ScoreboardData = {
  leagues: [],
  lastUpdated: new Date().toLocaleTimeString(),
};
