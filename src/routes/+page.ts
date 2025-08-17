import type { PageLoad } from './$types';
import { getScoreboardData } from '$lib/data';

export const load: PageLoad = async ({ fetch }) => {
  try {
    const scoreboardData = await getScoreboardData(fetch);
    return {
      scoreboardData,
    };
  } catch (error) {
    console.error('Error in page load:', error);
    return {
      scoreboardData: { leagues: [], lastUpdated: new Date().toLocaleTimeString() },
    };
  }
};
