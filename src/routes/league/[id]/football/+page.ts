import type { PageLoad } from './$types';
import { fetchNFLTeams } from '$lib/api';
import { getScoreboardData } from '$lib/data';

export const load: PageLoad = async ({ params, fetch }) => {
  try {
    const scoreboardData = await getScoreboardData(fetch);
    const league = scoreboardData.leagues.find(l => l.id === params.id);
    
    if (!league) {
      return {
        league: null,
        teams: []
      };
    }

    const teams = await fetchNFLTeams(fetch);
    
    return {
      league,
      teams
    };
  } catch (error) {
    console.error('Error loading football page:', error);
    return {
      league: null,
      teams: []
    };
  }
};
