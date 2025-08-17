<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { fetchNFLTeams } from '$lib/api';
  import { favoritesStore, applyFavoriteStatus } from '$lib/favorites';
  import { getTeamLogo } from '$lib/teamLogos';
  import type { Team, League } from '$lib/types';
  import FavoriteButton from '$lib/components/FavoriteButton.svelte';

  // Page data
  export let data: { league: League; teams: Team[] };

  // Reactive variables
  let league: League | null = data.league;
  let loading = false;
  let error: string | null = null;
  let showStandings = true;
  let showAFC = true;
  let showNFC = true;

  // Get league ID from URL
  $: leagueId = $page.params.id;

  // Filter teams based on favorites toggle
  $: filteredTeams = data.teams;

  // Group teams by conference and division for better standings display
  $: afcTeams = filteredTeams.filter(team => team.conference === 'AFC');
  $: nfcTeams = filteredTeams.filter(team => team.conference === 'NFC');
  
  // Sort teams within each division by win percentage
  $: sortedAFCTeams = afcTeams.sort((a, b) => (b.winPercentage || 0) - (a.winPercentage || 0));
  $: sortedNFCTeams = nfcTeams.sort((a, b) => (b.winPercentage || 0) - (a.winPercentage || 0));

  // Refresh data function
  async function refreshData() {
    loading = true;
    error = null;
    try {
      const refreshedTeams = await fetchNFLTeams();
      data.teams = refreshedTeams;
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to fetch data';
    } finally {
      loading = false;
    }
  }

  // Initialize favorites
  onMount(() => {
    data.teams = applyFavoriteStatus(data.teams, $favoritesStore.teams);
  });

  // Subscribe to favorites store
  $: if (data.teams.length > 0) {
    data.teams = applyFavoriteStatus(data.teams, $favoritesStore.teams);
  }
</script>

<svelte:head>
  <title>{league?.name || 'Football League'} - Sports Scoreboard</title>
</svelte:head>

<div class="container">
  <!-- Header -->
  <div class="header">
    <a href="/league/{leagueId}" class="back-link">← Back to League</a>
    {#if league}
      <div class="league-info">
        <div class="league-header">
          <span class="league-emoji">🏈</span>
          <h1 class="league-title">{league.name}</h1>
          <FavoriteButton 
            isFavorite={league.isFavorite || false} 
            size="large"
            on:toggle={() => favoritesStore.toggleLeague(league.id)}
          />
        </div>
        <p class="league-subtitle">{league.sport} • {league.teams.length} teams</p>
      </div>
    {:else}
      <h1 class="league-title">League Not Found</h1>
    {/if}
  </div>

  {#if loading}
    <div class="loading-spinner">
      <div class="spinner"></div>
    </div>
  {:else if error}
    <div class="error-message">
      <div class="error-title">⚠️ {error}</div>
      <button class="retry-button" on:click={refreshData}>
        Try Again
      </button>
    </div>
  {:else if league}
    <!-- Controls -->
    <div class="controls">
      <button class="control-button" on:click={refreshData}>
        🔄 Refresh
      </button>
    </div>

    <!-- Standings Section -->
    <div class="standings-container">
      <div class="standings-section">
        <button class="section-header" on:click={() => showStandings = !showStandings}>
          <span class="section-title">Standings</span>
          <span class="expand-icon">{showStandings ? '−' : '+'}</span>
        </button>
        
        {#if showStandings}
          <!-- NFL Standings Table -->
          <div class="nfl-standings">
            <!-- Conference Standings -->
            <div class="conference-standings">
              <div class="conference-section">
                <h3 class="conference-title">AFC Conference Standings</h3>
                <div class="conference-table">
                  <div class="table-header">
                    <div class="pos">Pos</div>
                    <div class="team">Team</div>
                    <div class="w">W</div>
                    <div class="l">L</div>
                    <div class="t">T</div>
                    <div class="pct">PCT</div>
                    <div class="pf">PF</div>
                    <div class="pa">PA</div>
                  </div>
                  {#each sortedAFCTeams.slice(0, 16) as team, index (team.id)}
                    <div class="table-row">
                      <div class="pos">{index + 1}</div>
                      <div class="team">
                        <a href="/team/{league.id}/{team.id}">
                          <img src={team.logo} alt={team.name} class="team-logo-small" />
                          <span class="team-name">{team.city} {team.name}</span>
                        </a>
                        <span class="team-division">({team.division})</span>
                        <button 
                          class="favorite-btn {team.isFavorite ? 'favorited' : ''}"
                          on:click={() => favoritesStore.toggleTeam(team.id)}
                          title="{team.isFavorite ? 'Remove from favorites' : 'Add to favorites'}"
                        >
                          {team.isFavorite ? '★' : '☆'}
                        </button>
                      </div>
                      <div class="w">{team.wins || 0}</div>
                      <div class="l">{team.losses || 0}</div>
                      <div class="t">{team.ties || 0}</div>
                      <div class="pct">{(team.winPercentage || 0).toFixed(3).replace(/^0+/, '')}</div>
                      <div class="pf">{team.pointsFor || 0}</div>
                      <div class="pa">{team.pointsAgainst || 0}</div>
                    </div>
                  {/each}
                </div>
              </div>
              
              <div class="conference-section">
                <h3 class="conference-title">NFC Conference Standings</h3>
                <div class="conference-table">
                  <div class="table-header">
                    <div class="pos">Pos</div>
                    <div class="team">Team</div>
                    <div class="w">W</div>
                    <div class="l">L</div>
                    <div class="t">T</div>
                    <div class="pct">PCT</div>
                    <div class="pf">PF</div>
                    <div class="pa">PA</div>
                  </div>
                  {#each sortedNFCTeams.slice(0, 16) as team, index (team.id)}
                    <div class="table-row">
                      <div class="pos">{index + 1}</div>
                      <div class="team">
                        <a href="/team/{league.id}/{team.id}">
                          <img src={team.logo} alt={team.name} class="team-logo-small" />
                          <span class="team-name">{team.city} {team.name}</span>
                        </a>
                        <span class="team-division">({team.division})</span>
                        <button 
                          class="favorite-btn {team.isFavorite ? 'favorited' : ''}"
                          on:click={() => favoritesStore.toggleTeam(team.id)}
                          title="{team.isFavorite ? 'Remove from favorites' : 'Add to favorites'}"
                        >
                          {team.isFavorite ? '★' : '☆'}
                        </button>
                      </div>
                      <div class="w">{team.wins || 0}</div>
                      <div class="l">{team.losses || 0}</div>
                      <div class="t">{team.ties || 0}</div>
                      <div class="pct">{(team.winPercentage || 0).toFixed(3).replace(/^0+/, '')}</div>
                      <div class="pf">{team.pointsFor || 0}</div>
                      <div class="pa">{team.pointsAgainst || 0}</div>
                    </div>
                  {/each}
                </div>
              </div>
            </div>
            
            <!-- AFC Divisions -->
            <div class="league-section">
              <button class="league-header" on:click={() => showAFC = !showAFC}>
                <h2 class="league-title">American Football Conference</h2>
                <span class="expand-icon">{showAFC ? '−' : '+'}</span>
              </button>
              
              {#if showAFC}
                {#each ['AFC East', 'AFC North', 'AFC South', 'AFC West'] as division}
                  <div class="division-group">
                    <h3 class="division-title">{division}</h3>
                    <div class="nfl-table">
                      <div class="table-header">
                        <div class="pos">Pos</div>
                        <div class="team">Team</div>
                        <div class="w">W</div>
                        <div class="l">L</div>
                        <div class="t">T</div>
                        <div class="pct">PCT</div>
                        <div class="pf">PF</div>
                        <div class="pa">PA</div>
                      </div>
                      {#each sortedAFCTeams.filter(team => team.division === division) as team, index (team.id)}
                        <div class="table-row">
                          <div class="pos">{index + 1}</div>
                          <div class="team">
                            <a href="/team/{league.id}/{team.id}">
                              <img src={team.logo} alt={team.name} class="team-logo-small" />
                              <span class="team-name">{team.city} {team.name}</span>
                            </a>
                            <button 
                              class="favorite-btn {team.isFavorite ? 'favorited' : ''}"
                              on:click={() => favoritesStore.toggleTeam(team.id)}
                              title="{team.isFavorite ? 'Remove from favorites' : 'Add to favorites'}"
                            >
                              {team.isFavorite ? '★' : '☆'}
                            </button>
                          </div>
                          <div class="w">{team.wins || 0}</div>
                          <div class="l">{team.losses || 0}</div>
                          <div class="t">{team.ties || 0}</div>
                          <div class="pct">{(team.winPercentage || 0).toFixed(3).replace(/^0+/, '')}</div>
                          <div class="pf">{team.pointsFor || 0}</div>
                          <div class="pa">{team.pointsAgainst || 0}</div>
                        </div>
                      {/each}
                    </div>
                  </div>
                {/each}
              {/if}
            </div>
            
            <!-- NFC Divisions -->
            <div class="league-section">
              <button class="league-header" on:click={() => showNFC = !showNFC}>
                <h2 class="league-title">National Football Conference</h2>
                <span class="expand-icon">{showNFC ? '−' : '+'}</span>
              </button>
              
              {#if showNFC}
                {#each ['NFC East', 'NFC North', 'NFC South', 'NFC West'] as division}
                  <div class="division-group">
                    <h3 class="division-title">{division}</h3>
                    <div class="nfl-table">
                      <div class="table-header">
                        <div class="pos">Pos</div>
                        <div class="team">Team</div>
                        <div class="w">W</div>
                        <div class="l">L</div>
                        <div class="t">T</div>
                        <div class="pct">PCT</div>
                        <div class="pf">PF</div>
                        <div class="pa">PA</div>
                      </div>
                      {#each sortedNFCTeams.filter(team => team.division === division) as team, index (team.id)}
                        <div class="table-row">
                          <div class="pos">{index + 1}</div>
                          <div class="team">
                            <a href="/team/{league.id}/{team.id}">
                              <img src={team.logo} alt={team.name} class="team-logo-small" />
                              <span class="team-name">{team.city} {team.name}</span>
                            </a>
                            <button 
                              class="favorite-btn {team.isFavorite ? 'favorited' : ''}"
                              on:click={() => favoritesStore.toggleTeam(team.id)}
                              title="{team.isFavorite ? 'Remove from favorites' : 'Add to favorites'}"
                            >
                              {team.isFavorite ? '★' : '☆'}
                            </button>
                          </div>
                          <div class="w">{team.wins || 0}</div>
                          <div class="l">{team.losses || 0}</div>
                          <div class="t">{team.ties || 0}</div>
                          <div class="pct">{(team.winPercentage || 0).toFixed(3).replace(/^0+/, '')}</div>
                          <div class="pf">{team.pointsFor || 0}</div>
                          <div class="pa">{team.pointsAgainst || 0}</div>
                        </div>
                      {/each}
                    </div>
                  </div>
                {/each}
              {/if}
            </div>
          </div>
        {/if}
      </div>
    </div>
  {:else}
    <div class="not-found">
      <div class="not-found-icon">❌</div>
      <div class="not-found-title">League Not Found</div>
      <div class="not-found-subtitle">The league you're looking for doesn't exist</div>
      <a href="/" class="back-home">Go Back Home</a>
    </div>
  {/if}
</div>

<style>
  .container {
    max-width: 1400px;
    margin: 0 auto;
    padding: 20px;
  }

  .header {
    margin-bottom: 32px;
  }

  .back-link {
    display: inline-block;
    color: #6b7280;
    text-decoration: none;
    font-weight: 500;
    margin-bottom: 16px;
    transition: color 0.2s ease;
  }

  .back-link:hover {
    color: #374151;
  }

  .league-info {
    text-align: center;
  }

  .league-header {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 16px;
    margin-bottom: 8px;
  }

  .league-emoji {
    font-size: 3rem;
  }

  .league-title {
    font-size: 2.5rem;
    font-weight: bold;
    color: #111827;
    margin: 0;
  }

  .league-subtitle {
    font-size: 1.1rem;
    color: #6b7280;
    margin: 0;
  }

  .controls {
    display: flex;
    justify-content: center;
    gap: 12px;
    margin-bottom: 32px;
    flex-wrap: wrap;
  }

  .control-button {
    padding: 8px 16px;
    border: 1px solid #d1d5db;
    border-radius: 6px;
    background: white;
    color: #374151;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .control-button:hover {
    background: #e2e8f0;
  }

  .standings-container {
    margin-bottom: 32px;
    width: 100%;
  }

  .standings-section {
    background: white;
    border-radius: 12px;
    padding: 20px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
    border: 1px solid #e5e7eb;
    width: 100%;
  }

  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
    background: none;
    border: none;
    padding: 0;
    font-size: 1.2rem;
    font-weight: 600;
    color: #111827;
    cursor: pointer;
    text-align: left;
  }

  .expand-icon {
    font-size: 1.2rem;
    color: #6b7280;
    transition: transform 0.2s ease;
  }

  /* NFL Standings Styles - Using exact same format as MLS/EPL/MLB */
  .nfl-standings {
    width: 100%;
  }

  .nfl-standings .league-section {
    margin-bottom: 32px;
    background: white;
    border-radius: 12px;
    border: 1px solid #e5e7eb;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
    overflow: hidden;
  }

  .nfl-standings .league-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: linear-gradient(135deg, #dc2626, #ef4444);
    color: white;
    padding: 16px 20px;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .nfl-standings .league-header:hover {
    background: linear-gradient(135deg, #b91c1c, #dc2626);
  }

  .nfl-standings .league-title {
    font-size: 18px;
    font-weight: 700;
    margin: 0;
    color: white;
  }

  .nfl-standings .expand-icon {
    font-size: 18px;
    color: white;
    transition: transform 0.2s ease;
  }

  .nfl-standings .division-group {
    background: white;
    border-radius: 8px;
    border: 1px solid #e5e7eb;
    margin: 16px;
    overflow: hidden;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
  }

  .nfl-standings .division-title {
    background: linear-gradient(135deg, #f8fafc, #f1f5f9);
    color: #1e293b;
    font-size: 16px;
    font-weight: 600;
    padding: 12px 16px;
    border-bottom: 1px solid #e5e7eb;
    margin: 0;
  }

  /* Conference standings layout */
  .nfl-standings .conference-standings {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 24px;
    margin-bottom: 32px;
  }

  .nfl-standings .conference-section {
    background: white;
    border-radius: 12px;
    border: 1px solid #e5e7eb;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
    overflow: hidden;
  }

  .nfl-standings .conference-title {
    background: linear-gradient(135deg, #f8fafc, #f1f5f9);
    color: #1e293b;
    font-size: 16px;
    font-weight: 600;
    padding: 12px 16px;
    border-bottom: 1px solid #e5e7eb;
    margin: 0;
  }

  /* Using exact same table format as soccer standings */
  .nfl-standings .nfl-table,
  .nfl-standings .conference-table {
    display: flex;
    flex-direction: column;
    gap: 4px;
    border-radius: 8px;
    overflow: hidden;
    border: 1px solid #e5e7eb;
    background: white;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  }

  .nfl-standings .nfl-table .table-header,
  .nfl-standings .conference-table .table-header {
    display: grid;
    grid-template-columns: 35px 1.8fr 35px 35px 35px 35px 35px 50px 50px;
    background: linear-gradient(135deg, #f8fafc, #f1f5f9);
    font-weight: 700;
    color: #374151;
    font-size: 12px;
    padding: 12px 14px;
    border-bottom: 2px solid #e5e7eb;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .nfl-standings .nfl-table .table-row,
  .nfl-standings .conference-table .table-row {
    display: grid;
    grid-template-columns: 35px 1.8fr 35px 35px 35px 35px 35px 50px 50px;
    padding: 10px 14px;
    border-bottom: 1px solid #f3f4f6;
    align-items: center;
    font-size: 12px;
    transition: all 0.2s ease;
  }

  .nfl-standings .nfl-table .table-row:hover,
  .nfl-standings .conference-table .table-row:hover {
    background: linear-gradient(135deg, #f8fafc, #f1f5f9);
    transform: translateX(2px);
  }

  .nfl-standings .nfl-table .table-row:nth-child(even),
  .nfl-standings .conference-table .table-row:nth-child(even) {
    background: #fafbfc;
  }

  .nfl-standings .nfl-table .table-row:nth-child(even):hover,
  .nfl-standings .conference-table .table-row:nth-child(even):hover {
    background: linear-gradient(135deg, #f1f5f9, #e2e8f0);
  }

  .nfl-standings .nfl-table .table-row:last-child,
  .nfl-standings .conference-table .table-row:last-child {
    border-bottom: none;
  }

  .nfl-standings .nfl-table .pos,
  .nfl-standings .conference-table .pos {
    font-weight: 700;
    color: #1e293b;
    text-align: center;
    background: #f1f5f9;
    border-radius: 4px;
    padding: 3px 6px;
    font-size: 11px;
  }

  .nfl-standings .nfl-table .team,
  .nfl-standings .conference-table .team {
    font-weight: 500;
    color: #111827;
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .nfl-standings .nfl-table .team-logo-small,
  .nfl-standings .conference-table .team-logo-small {
    width: 22px;
    height: 22px;
    border-radius: 50%;
    object-fit: cover;
    border: 2px solid #e5e7eb;
  }

  .nfl-standings .nfl-table .team-name,
  .nfl-standings .conference-table .team-name {
    flex-grow: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-weight: 600;
  }

  /* Team link styling - same as MLS/EPL */
  .nfl-standings .nfl-table .team a,
  .nfl-standings .conference-table .team a {
    color: inherit;
    text-decoration: none;
    display: flex;
    align-items: center;
    gap: 10px;
    flex-grow: 1;
  }

  .nfl-standings .nfl-table .team a:hover,
  .nfl-standings .conference-table .team a:hover {
    color: inherit;
    text-decoration: none;
  }

  .nfl-standings .nfl-table .w,
  .nfl-standings .nfl-table .l,
  .nfl-standings .nfl-table .t,
  .nfl-standings .nfl-table .pct,
  .nfl-standings .nfl-table .pf,
  .nfl-standings .nfl-table .pa,
  .nfl-standings .conference-table .w,
  .nfl-standings .conference-table .l,
  .nfl-standings .conference-table .t,
  .nfl-standings .conference-table .pct,
  .nfl-standings .conference-table .pf,
  .nfl-standings .conference-table .pa {
    text-align: center;
    font-weight: 600;
    color: #374151;
  }

  .nfl-standings .nfl-table .w,
  .nfl-standings .nfl-table .l,
  .nfl-standings .nfl-table .t,
  .nfl-standings .conference-table .w,
  .nfl-standings .conference-table .l,
  .nfl-standings .conference-table .t {
    background: #f8fafc;
    border-radius: 4px;
    padding: 3px 6px;
    font-size: 11px;
  }

  .nfl-standings .nfl-table .pct,
  .nfl-standings .conference-table .pct {
    background: #f0f9ff;
    border-radius: 4px;
    padding: 3px 6px;
    font-size: 11px;
    color: #0369a1;
  }

  .nfl-standings .nfl-table .pf,
  .nfl-standings .conference-table .pf {
    background: #fef3c7;
    border-radius: 4px;
    padding: 3px 6px;
    font-size: 11px;
    color: #92400e;
  }

  .nfl-standings .nfl-table .pa,
  .nfl-standings .conference-table .pa {
    background: #f3e8ff;
    border-radius: 4px;
    padding: 3px 6px;
    font-size: 11px;
    color: #7c3aed;
  }

  /* Favorite button styling */
  .favorite-btn {
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    color: #94a3b8;
    border-radius: 4px;
    padding: 3px 6px;
    cursor: pointer;
    transition: all 0.2s ease;
    font-size: 12px;
    min-width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-left: 8px;
  }

  .favorite-btn:hover {
    background: #e2e8f0;
    color: #64748b;
    transform: scale(1.05);
  }

  .favorite-btn.favorited {
    background: #fef3c7;
    color: #f59e0b;
    border-color: #fbbf24;
  }

  .favorite-btn.favorited:hover {
    background: #fde68a;
    color: #d97706;
  }

  /* Loading and Error States */
  .loading-spinner {
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 40px;
  }

  .spinner {
    width: 40px;
    height: 40px;
    border: 4px solid #f3f4f6;
    border-top: 4px solid #3b82f6;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  .error-message {
    text-align: center;
    padding: 40px;
    background: #fef2f2;
    border: 1px solid #fecaca;
    border-radius: 8px;
    margin: 20px 0;
  }

  .error-title {
    font-size: 1.2rem;
    font-weight: 600;
    color: #dc2626;
    margin-bottom: 16px;
  }

  .retry-button {
    padding: 8px 16px;
    background: #dc2626;
    color: white;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    transition: background-color 0.2s ease;
  }

  .retry-button:hover {
    background: #b91c1c;
  }

  .not-found {
    text-align: center;
    padding: 40px;
  }

  .not-found-icon {
    font-size: 3rem;
    margin-bottom: 16px;
  }

  .not-found-title {
    font-size: 1.5rem;
    font-weight: 600;
    color: #111827;
    margin-bottom: 8px;
  }

  .not-found-subtitle {
    color: #6b7280;
    margin-bottom: 24px;
  }

  .back-home {
    display: inline-block;
    padding: 8px 16px;
    background: #3b82f6;
    color: white;
    text-decoration: none;
    border-radius: 6px;
    transition: background-color 0.2s ease;
  }

  .back-home:hover {
    background: #2563eb;
  }

  /* Responsive design - using exact same as soccer */
  @media (max-width: 1024px) {
    .nfl-standings .nfl-table .table-header,
    .nfl-standings .nfl-table .table-row,
    .nfl-standings .conference-table .table-header,
    .nfl-standings .conference-table .table-row {
      grid-template-columns: 35px 1.8fr 35px 35px 35px 35px 35px 50px 50px;
      font-size: 12px;
      padding: 12px 14px;
    }
    
    .nfl-standings .nfl-table .team-logo-small,
    .nfl-standings .conference-table .team-logo-small {
      width: 22px;
      height: 22px;
    }
    
    .nfl-standings .nfl-table .pos,
    .nfl-standings .nfl-table .w,
    .nfl-standings .nfl-table .l,
    .nfl-standings .nfl-table .t,
    .nfl-standings .nfl-table .pct,
    .nfl-standings .nfl-table .pf,
    .nfl-standings .nfl-table .pa,
    .nfl-standings .conference-table .pos,
    .nfl-standings .conference-table .w,
    .nfl-standings .conference-table .l,
    .nfl-standings .conference-table .t,
    .nfl-standings .conference-table .pct,
    .nfl-standings .conference-table .pf,
    .nfl-standings .conference-table .pa {
      padding: 3px 6px;
      font-size: 12px;
    }
  }

  @media (max-width: 768px) {
    .container {
      padding: 16px;
    }
    
    .league-header {
      flex-direction: column;
      gap: 16px;
      align-items: flex-start;
    }
    
    .nfl-standings .nfl-table .table-header,
    .nfl-standings .nfl-table .table-row,
    .nfl-standings .conference-table .table-header,
    .nfl-standings .conference-table .table-row {
      grid-template-columns: 30px 1.5fr 30px 30px 30px 30px 30px 40px 40px;
      font-size: 11px;
      padding: 10px 12px;
    }
    
    .nfl-standings .nfl-table .team-logo-small,
    .nfl-standings .conference-table .team-logo-small {
      width: 20px;
      height: 20px;
    }
    
    .nfl-standings .nfl-table .team,
    .nfl-standings .conference-table .team {
      gap: 8px;
    }
    
    .nfl-standings .nfl-table .pos,
    .nfl-standings .nfl-table .w,
    .nfl-standings .nfl-table .l,
    .nfl-standings .nfl-table .t,
    .nfl-standings .nfl-table .pct,
    .nfl-standings .nfl-table .pf,
    .nfl-standings .nfl-table .pa,
    .nfl-standings .conference-table .pos,
    .nfl-standings .conference-table .w,
    .nfl-standings .conference-table .l,
    .nfl-standings .conference-table .t,
    .nfl-standings .conference-table .pct,
    .nfl-standings .conference-table .pf,
    .nfl-standings .conference-table .pa {
      padding: 2px 4px;
      font-size: 11px;
    }
    
    .nfl-standings .division-group {
      margin: 12px;
    }
    
    .nfl-standings .division-title {
      font-size: 14px;
      padding: 10px 12px;
    }
  }

  @media (max-width: 480px) {
    .nfl-standings .nfl-table .table-header,
    .nfl-standings .nfl-table .table-row,
    .nfl-standings .conference-table .table-header,
    .nfl-standings .conference-table .table-row {
      grid-template-columns: 25px 1.3fr 25px 25px 25px 25px 25px 35px 35px;
      font-size: 10px;
      padding: 8px 10px;
    }
    
    .nfl-standings .nfl-table .team-logo-small,
    .nfl-standings .conference-table .team-logo-small {
      width: 18px;
      height: 18px;
    }
    
    .nfl-standings .nfl-table .team,
    .nfl-standings .conference-table .team {
      gap: 6px;
    }
    
    .nfl-standings .nfl-table .pos,
    .nfl-standings .nfl-table .w,
    .nfl-standings .nfl-table .l,
    .nfl-standings .nfl-table .t,
    .nfl-standings .nfl-table .pct,
    .nfl-standings .nfl-table .pf,
    .nfl-standings .nfl-table .pa,
    .nfl-standings .conference-table .pos,
    .nfl-standings .conference-table .w,
    .nfl-standings .conference-table .l,
    .nfl-standings .conference-table .t,
    .nfl-standings .conference-table .pct,
    .nfl-standings .conference-table .pf,
    .nfl-standings .conference-table .pa {
      padding: 2px 3px;
      font-size: 10px;
    }
  }
</style>
