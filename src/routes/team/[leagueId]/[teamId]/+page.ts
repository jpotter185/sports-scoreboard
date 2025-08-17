import type { PageLoad } from './$types';
import { getScoreboardData } from '$lib/data';
import { parseInternalTeamId } from '$lib/teamIds';

export const load: PageLoad = async ({ params, fetch }) => {
  try {
    const scoreboardData = await getScoreboardData(fetch);
    const { leagueId, teamId } = params;

    // Find the league
    const league = scoreboardData.leagues.find(l => l.id === leagueId);
    if (!league) {
      throw new Error('League not found');
    }

    // Find the team
    const team = league.teams.find(t => t.id === teamId);
    if (!team) {
      throw new Error('Team not found');
    }

    // Get team's games (both home and away)
    const teamGames = league.games.filter(game => {
      // Check by ID first
      if (game.homeTeam.id === teamId || game.awayTeam.id === teamId) {
        return true;
      }

      // Fallback: check by name if IDs don't match
      if (game.homeTeam.name === team.name || game.awayTeam.name === team.name) {
        return true;
      }

      return false;
    });

    // Sort games by date (oldest first)
    const sortedGames = [...teamGames].sort((a, b) => {
      if (!a.date || !b.date) return 0;
      return new Date(a.date).getTime() - new Date(b.date).getTime();
    });

    return {
      team,
      league,
      games: sortedGames,
      leagueId,
      teamId,
    };
  } catch (error) {
    console.error('Error loading team data:', error);
    throw error;
  }
};
