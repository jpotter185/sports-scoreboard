import { writable, derived, get } from 'svelte/store';
import { browser } from '$app/environment';
import type { FavoritePreferences, Team, League } from './types';
import { migrateFavoritesToInternalIds, buildTeamIdTranslation } from './teamIds';

// Default favorites
const defaultFavorites: FavoritePreferences = {
  teams: [],
  leagues: [],
  lastUpdated: new Date().toISOString(),
};

// Create the favorites store
function createFavoritesStore() {
  const { subscribe, set, update } = writable<FavoritePreferences>(defaultFavorites);

  // Initialize from localStorage if available
  if (browser) {
    try {
      const saved = localStorage.getItem('favorites');
      if (saved) {
        const parsed = JSON.parse(saved) as FavoritePreferences;

        // Check if we need to migrate from old ESPN IDs to internal IDs
        if (parsed.teams.length > 0 && !parsed.teams[0].includes('-')) {
          // Store the old favorites temporarily - we'll migrate them when we have the translation data
          parsed._needsMigration = true;
        }

        set(parsed);
      }
    } catch (error) {
      console.error('Error loading favorites from localStorage:', error);
    }
  }

  return {
    subscribe,
    set,
    update,

    // Migrate favorites from ESPN IDs to internal IDs
    migrateFavorites: (leagues: Array<{ id: string; teams: Team[] }>) => {
      update(favorites => {
        if (!favorites._needsMigration) return favorites;

        const translation = buildTeamIdTranslation(leagues);
        const migratedTeams = migrateFavoritesToInternalIds(favorites.teams, translation);

        const newFavorites = {
          ...favorites,
          teams: migratedTeams,
          lastUpdated: new Date().toISOString(),
          _needsMigration: false,
        };

        return newFavorites;
      });
    },

    // Toggle team favorite (now using internal IDs)
    toggleTeam: (internalTeamId: string) => {
      update(favorites => {
        const newFavorites = { ...favorites };
        const index = newFavorites.teams.indexOf(internalTeamId);

        if (index > -1) {
          newFavorites.teams.splice(index, 1);
        } else {
          newFavorites.teams.push(internalTeamId);
        }

        newFavorites.lastUpdated = new Date().toISOString();
        return newFavorites;
      });
    },

    // Toggle league favorite
    toggleLeague: (leagueId: string) => {
      update(favorites => {
        const newFavorites = { ...favorites };
        const index = newFavorites.leagues.indexOf(leagueId);

        if (index > -1) {
          newFavorites.leagues.splice(index, 1);
        } else {
          newFavorites.leagues.push(leagueId);
        }

        newFavorites.lastUpdated = new Date().toISOString();
        return newFavorites;
      });
    },

    // Check if team is favorite (using internal ID)
    isTeamFavorite: (internalTeamId: string) => {
      let result = false;
      subscribe(favorites => {
        result = favorites.teams.includes(internalTeamId);
      })();
      return result;
    },

    // Check if league is favorite
    isLeagueFavorite: (leagueId: string) => {
      let result = false;
      subscribe(favorites => {
        result = favorites.leagues.includes(leagueId);
      })();
      return result;
    },

    // Helper function to check if a team is favorite by ESPN ID and league ID
    isTeamFavoriteByEspnId: (espnId: string, leagueId: string) => {
      let result = false;
      subscribe(favorites => {
        const internalId = `${leagueId}-${espnId}`;
        result = favorites.teams.includes(internalId);
      })();
      return result;
    },

    // Clear all favorites
    clearAll: () => {
      set(defaultFavorites);
      if (browser) {
        try {
          localStorage.removeItem('favorites');
        } catch (error) {
          console.error('❌ Failed to clear localStorage:', error);
        }
      }
    },

    // Reset to default state (useful for debugging)
    reset: () => {
      set(defaultFavorites);
      if (browser) {
        try {
          localStorage.removeItem('favorites');
        } catch (error) {
          console.error('❌ Failed to reset favorites store:', error);
        }
      }
    },

    // Debug function to see current state
    debug: () => {
      if (browser) {
        try {
          const stored = localStorage.getItem('favorites');
        } catch (error) {
          console.error('❌ Failed to read localStorage:', error);
        }
      }
    },
  };
}

export const favoritesStore = createFavoritesStore();

// Derived stores for easy access
export const favoriteTeams = derived(favoritesStore, $favorites => $favorites.teams);
export const favoriteLeagues = derived(favoritesStore, $favorites => $favorites.leagues);

// Persist to localStorage whenever favorites change
if (browser) {
  favoritesStore.subscribe(favorites => {
    try {
      localStorage.setItem('favorites', JSON.stringify(favorites));
    } catch (error) {
      console.error('❌ Failed to save favorites to localStorage:', error);
    }
  });
}

// Function to apply favorite status to data
export function applyFavoriteStatus<T extends Team | League>(
  items: T[],
  favoriteIds: string[]
): T[] {
  return items.map(item => ({
    ...item,
    isFavorite: favoriteIds.includes(item.id),
  }));
}
