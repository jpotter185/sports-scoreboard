import type { Team, InternalTeam, TeamIdTranslation } from './types';

// Generate unique internal ID for a team
export function generateInternalTeamId(leagueId: string, espnId: string): string {
  return `${leagueId}-${espnId}`;
}

// Convert ESPN team to internal team representation
export function convertToInternalTeam(leagueId: string, team: Team): InternalTeam {
  return {
    internalId: generateInternalTeamId(leagueId, team.id),
    espnId: team.id,
    leagueId,
    team
  };
}

// Convert internal team back to regular team
export function convertFromInternalTeam(internalTeam: InternalTeam): Team {
  return internalTeam.team;
}

// Build translation layer from leagues data
export function buildTeamIdTranslation(leagues: Array<{ id: string; teams: Team[] }>): TeamIdTranslation {
  const translation: TeamIdTranslation = {};
  
  leagues.forEach(league => {
    league.teams.forEach(team => {
      if (!translation[team.id]) {
        translation[team.id] = {};
      }
      translation[team.id][league.id] = generateInternalTeamId(league.id, team.id);
    });
  });
  
  return translation;
}

// Convert ESPN team ID to internal ID
export function getInternalTeamId(translation: TeamIdTranslation, espnId: string, leagueId: string): string | null {
  return translation[espnId]?.[leagueId] || null;
}

// Convert internal team ID back to ESPN ID and league ID
export function parseInternalTeamId(internalId: string): { espnId: string; leagueId: string } | null {
  const parts = internalId.split('-');
  if (parts.length !== 2) return null;
  
  const [leagueId, espnId] = parts;
  return { leagueId, espnId };
}

// Migrate existing favorites from ESPN IDs to internal IDs
export function migrateFavoritesToInternalIds(
  oldFavoriteTeams: string[], 
  translation: TeamIdTranslation
): string[] {
  const migrated: string[] = [];
  
  oldFavoriteTeams.forEach(espnId => {
    // Find all leagues that have this team ID
    const leagueIds = Object.keys(translation[espnId] || {});
    
    if (leagueIds.length > 0) {
      // For now, just add the first one we find
      // In the future, we could ask the user which league they meant
      const firstLeagueId = leagueIds[0];
      const internalId = translation[espnId][firstLeagueId];
      if (internalId) {
        migrated.push(internalId);
      }
    }
  });
  
  return migrated;
}
