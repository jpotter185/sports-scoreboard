import { getScoreboardData } from '$lib/data';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ params, fetch }) => {
  try {
    const scoreboardData = await getScoreboardData(fetch);
    const league = scoreboardData.leagues.find(l => l.id === params.id) || null;
    
    return {
      league
    };
  } catch (error) {
    console.error('Error loading league data:', error);
    return {
      league: null
    };
  }
};
