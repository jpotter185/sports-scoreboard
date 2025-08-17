import type { PageLoad } from './$types';
import { fetchMLSTeams, fetchEPLTeams } from '$lib/api';
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

    let teams;
    if (league.id === 'mls') {
      teams = await fetchMLSTeams(fetch);
    } else if (league.id === 'epl') {
      teams = await fetchEPLTeams(fetch);
    } else {
      throw new Error('Unknown soccer league');
    }
    
    return {
      league,
      teams
    };
  } catch (error) {
    console.error('Error loading soccer page:', error);
    return {
      league: null,
      teams: []
    };
  }
};
