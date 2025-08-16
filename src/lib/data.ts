import type { ScoreboardData, League, Team, Game } from './types';
import { fetchNFLGames, fetchMLSGames, fetchEPLGames, fetchMLBGames } from './api';

function deriveTeamsFromGames(games: Game[]): Team[] {
  const teams = new Map<string, Team>();
  for (const game of games) {
    if (game.homeTeam) teams.set(game.homeTeam.id, game.homeTeam);
    if (game.awayTeam) teams.set(game.awayTeam.id, game.awayTeam);
  }
  return Array.from(teams.values());
}

export async function getScoreboardData(): Promise<ScoreboardData> {
  try {
    const [nflGames, mlsGames, eplGames, mlbGames] = await Promise.all([
      fetchNFLGames(),
      fetchMLSGames(),
      fetchEPLGames(),
      fetchMLBGames()
    ]);

    const nflTeams = deriveTeamsFromGames(nflGames);
    const mlsTeams = deriveTeamsFromGames(mlsGames);
    const eplTeams = deriveTeamsFromGames(eplGames);
    const mlbTeams = deriveTeamsFromGames(mlbGames);

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
