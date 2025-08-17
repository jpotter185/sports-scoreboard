import { getScoreboardData } from '$lib/data';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ params, fetch }) => {
  try {
    const scoreboardData = await getScoreboardData(fetch);

    // Find game by ID across all leagues
    let game = null;
    for (const league of scoreboardData.leagues) {
      const foundGame = league.games.find(g => g.id === params.id);
      if (foundGame) {
        game = foundGame;
        break;
      }
    }

    return {
      game,
    };
  } catch (error) {
    console.error('Error loading game data:', error);
    return {
      game: null,
    };
  }
};
