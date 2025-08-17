import type { ScoreboardData, League, Team, Game } from './types';
import { fetchNFLGames, fetchMLSGames, fetchEPLGames, fetchMLBGames, fetchNFLTeams, fetchMLSTeams, fetchEPLTeams, fetchMLBTeams } from './api';



export async function getScoreboardData(fetch?: typeof globalThis.fetch): Promise<ScoreboardData> {
  try {
    const [nflGames, mlsGames, eplGames, mlbGames, nflTeams, mlsTeams, eplTeams, mlbTeams] = await Promise.all([
      fetchNFLGames(undefined, undefined, fetch),
      fetchMLSGames(fetch),
      fetchEPLGames(fetch),
      fetchMLBGames(fetch),
      fetchNFLTeams(fetch),
      fetchMLSTeams(fetch),
      fetchEPLTeams(fetch),
      fetchMLBTeams(fetch)
    ]);

    const nfl: League = {
      id: 'nfl',
      name: 'National Football League',
      sport: 'Football',
      teams: nflTeams,
      games: nflGames
    };

    const mls: League = {
      id: 'mls',
      name: 'Major League Soccer',
      sport: 'Soccer',
      teams: mlsTeams,
      games: mlsGames
    };

    const epl: League = {
      id: 'epl',
      name: 'English Premier League',
      sport: 'Soccer',
      teams: eplTeams,
      games: eplGames
    };

    const mlb: League = {
      id: 'mlb',
      name: 'Major League Baseball',
      sport: 'Baseball',
      teams: mlbTeams,
      games: mlbGames
    };

    return {
      leagues: [nfl, mls, epl, mlb],
      lastUpdated: new Date().toLocaleTimeString()
    };
  } catch (error) {
    console.error('Error fetching scoreboard data:', error);
    return {
      leagues: [],
      lastUpdated: new Date().toLocaleTimeString()
    };
  }
}

export const scoreboardData: ScoreboardData = {
  leagues: [],
  lastUpdated: new Date().toLocaleTimeString()
};