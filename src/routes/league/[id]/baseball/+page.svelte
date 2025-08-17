<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { fetchMLBTeams } from '$lib/api';
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
  let showAL = true;
  let showALEast = true;
  let showALCentral = true;
  let showALWest = true;
  let showNL = true;
  let showNLEast = true;
  let showNLCentral = true;
  let showNLWest = true;

  // Get league ID from URL
  $: leagueId = $page.params.id;

  // Filter teams based on favorites toggle
  $: filteredTeams = data.teams;

  // Refresh data function
  async function refreshData() {
    loading = true;
    error = null;
    try {
      const refreshedTeams = await fetchMLBTeams();
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
  <title>{league?.name || 'Baseball League'} - Sports Scoreboard</title>
</svelte:head>

<div class="container">
  <!-- Header -->
  <div class="header">
    <a href="/league/{leagueId}" class="back-link">← Back to League</a>
    {#if league}
      <div class="league-info">
        <div class="league-header">
          <span class="league-emoji">⚾</span>
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
          <!-- MLB Standings Table -->
          <div class="mlb-standings">
            <!-- American League Divisions -->
            <div class="league-section">
              <button class="league-header" on:click={() => showAL = !showAL}>
                <h2 class="league-title">American League</h2>
                <span class="expand-icon">{showAL ? '−' : '+'}</span>
              </button>
              
              {#if showAL}
                <!-- AL East -->
                <div class="division-group">
                  <button class="division-header" on:click={() => showALEast = !showALEast}>
                    <h3 class="division-title">AL East</h3>
                    <span class="expand-icon">{showALEast ? '−' : '+'}</span>
                  </button>
                  
                  {#if showALEast}
                    <div class="mlb-table">
                      <div class="table-header">
                        <div class="pos">Pos</div>
                        <div class="team">Team</div>
                        <div class="w">W</div>
                        <div class="l">L</div>
                        <div class="pct">PCT</div>
                        <div class="div-gb">Div GB</div>
                        <div class="standing">Standing</div>
                      </div>
                      {#each filteredTeams.filter(team => team.division === 'AL East').sort((a, b) => (b.winPercentage || 0) - (a.winPercentage || 0)) as team, index (team.id)}
                        <div class="table-row">
                          <div class="pos">{index + 1}</div>
                          <div class="team">
                            <img src={team.logo} alt={team.name} class="team-logo-small" />
                            <span class="team-name">{team.city} {team.name}</span>
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
                          <div class="pct">{(team.winPercentage || 0).toFixed(3).replace(/^0+/, '')}</div>
                          <div class="div-gb">{team.divisionGamesBehind || 0}</div>
                          <div class="standing">{team.standingSummary || ''}</div>
                        </div>
                      {/each}
                    </div>
                  {/if}
                </div>
                
                <!-- AL Central -->
                <div class="division-group">
                  <button class="division-header" on:click={() => showALCentral = !showALCentral}>
                    <h3 class="division-title">AL Central</h3>
                    <span class="expand-icon">{showALCentral ? '−' : '+'}</span>
                  </button>
                  
                  {#if showALCentral}
                    <div class="mlb-table">
                      <div class="table-header">
                        <div class="pos">Pos</div>
                        <div class="team">Team</div>
                        <div class="w">W</div>
                        <div class="l">L</div>
                        <div class="pct">PCT</div>
                        <div class="div-gb">Div GB</div>
                        <div class="standing">Standing</div>
                      </div>
                      {#each filteredTeams.filter(team => team.division === 'AL Central').sort((a, b) => (b.winPercentage || 0) - (a.winPercentage || 0)) as team, index (team.id)}
                        <div class="table-row">
                          <div class="pos">{index + 1}</div>
                          <div class="team">
                            <img src={team.logo} alt={team.name} class="team-logo-small" />
                            <span class="team-name">{team.city} {team.name}</span>
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
                          <div class="pct">{(team.winPercentage || 0).toFixed(3).replace(/^0+/, '')}</div>
                          <div class="div-gb">{team.divisionGamesBehind || 0}</div>
                          <div class="standing">{team.standingSummary || ''}</div>
                        </div>
                      {/each}
                    </div>
                  {/if}
                </div>
                
                <!-- AL West -->
                <div class="division-group">
                  <button class="division-header" on:click={() => showALWest = !showALWest}>
                    <h3 class="division-title">AL West</h3>
                    <span class="expand-icon">{showALWest ? '−' : '+'}</span>
                  </button>
                  
                  {#if showALWest}
                    <div class="mlb-table">
                      <div class="table-header">
                        <div class="pos">Pos</div>
                        <div class="team">Team</div>
                        <div class="w">W</div>
                        <div class="l">L</div>
                        <div class="pct">PCT</div>
                        <div class="div-gb">Div GB</div>
                        <div class="standing">Standing</div>
                      </div>
                      {#each filteredTeams.filter(team => team.division === 'AL West').sort((a, b) => (b.winPercentage || 0) - (a.winPercentage || 0)) as team, index (team.id)}
                        <div class="table-row">
                          <div class="pos">{index + 1}</div>
                          <div class="team">
                            <img src={team.logo} alt={team.name} class="team-logo-small" />
                            <span class="team-name">{team.city} {team.name}</span>
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
                          <div class="pct">{(team.winPercentage || 0).toFixed(3).replace(/^0+/, '')}</div>
                          <div class="div-gb">{team.divisionGamesBehind || 0}</div>
                          <div class="standing">{team.standingSummary || ''}</div>
                        </div>
                      {/each}
                    </div>
                  {/if}
                </div>
              {/if}
            </div>
            
            <!-- National League Divisions -->
            <div class="league-section">
              <button class="league-header" on:click={() => showNL = !showNL}>
                <h2 class="league-title">National League</h2>
                <span class="expand-icon">{showNL ? '−' : '+'}</span>
              </button>
              
              {#if showNL}
                <!-- NL East -->
                <div class="division-group">
                  <button class="division-header" on:click={() => showNLEast = !showNLEast}>
                    <h3 class="division-title">NL East</h3>
                    <span class="expand-icon">{showNLEast ? '−' : '+'}</span>
                  </button>
                  
                  {#if showNLEast}
                    <div class="mlb-table">
                      <div class="table-header">
                        <div class="pos">Pos</div>
                        <div class="team">Team</div>
                        <div class="w">W</div>
                        <div class="l">L</div>
                        <div class="pct">PCT</div>
                        <div class="div-gb">Div GB</div>
                        <div class="standing">Standing</div>
                      </div>
                      {#each filteredTeams.filter(team => team.division === 'NL East').sort((a, b) => (b.winPercentage || 0) - (a.winPercentage || 0)) as team, index (team.id)}
                        <div class="table-row">
                          <div class="pos">{index + 1}</div>
                          <div class="team">
                            <img src={team.logo} alt={team.name} class="team-logo-small" />
                            <span class="team-name">{team.city} {team.name}</span>
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
                          <div class="pct">{(team.winPercentage || 0).toFixed(3).replace(/^0+/, '')}</div>
                          <div class="div-gb">{team.divisionGamesBehind || 0}</div>
                          <div class="standing">{team.standingSummary || ''}</div>
                        </div>
                      {/each}
                    </div>
                  {/if}
                </div>
                
                <!-- NL Central -->
                <div class="division-group">
                  <button class="division-header" on:click={() => showNLCentral = !showNLCentral}>
                    <h3 class="division-title">NL Central</h3>
                    <span class="expand-icon">{showNLCentral ? '−' : '+'}</span>
                  </button>
                  
                  {#if showNLCentral}
                    <div class="mlb-table">
                      <div class="table-header">
                        <div class="pos">Pos</div>
                        <div class="team">Team</div>
                        <div class="w">W</div>
                        <div class="l">L</div>
                        <div class="pct">PCT</div>
                        <div class="div-gb">Div GB</div>
                        <div class="standing">Standing</div>
                      </div>
                      {#each filteredTeams.filter(team => team.division === 'NL Central').sort((a, b) => (b.winPercentage || 0) - (a.winPercentage || 0)) as team, index (team.id)}
                        <div class="table-row">
                          <div class="pos">{index + 1}</div>
                          <div class="team">
                            <img src={team.logo} alt={team.name} class="team-logo-small" />
                            <span class="team-name">{team.city} {team.name}</span>
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
                          <div class="pct">{(team.winPercentage || 0).toFixed(3).replace(/^0+/, '')}</div>
                          <div class="div-gb">{team.divisionGamesBehind || 0}</div>
                          <div class="standing">{team.standingSummary || ''}</div>
                        </div>
                      {/each}
                    </div>
                  {/if}
                </div>
                
                <!-- NL West -->
                <div class="division-group">
                  <button class="division-header" on:click={() => showNLWest = !showNLWest}>
                    <h3 class="division-title">NL West</h3>
                    <span class="expand-icon">{showNLWest ? '−' : '+'}</span>
                  </button>
                  
                  {#if showNLWest}
                    <div class="mlb-table">
                      <div class="table-header">
                        <div class="pos">Pos</div>
                        <div class="team">Team</div>
                        <div class="w">W</div>
                        <div class="l">L</div>
                        <div class="pct">PCT</div>
                        <div class="div-gb">Div GB</div>
                        <div class="standing">Standing</div>
                      </div>
                      {#each filteredTeams.filter(team => team.division === 'NL West').sort((a, b) => (b.winPercentage || 0) - (a.winPercentage || 0)) as team, index (team.id)}
                        <div class="table-row">
                          <div class="pos">{index + 1}</div>
                          <div class="team">
                            <img src={team.logo} alt={team.name} class="team-logo-small" />
                            <span class="team-name">{team.city} {team.name}</span>
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
                          <div class="pct">{(team.winPercentage || 0).toFixed(3).replace(/^0+/, '')}</div>
                          <div class="div-gb">{team.divisionGamesBehind || 0}</div>
                          <div class="standing">{team.standingSummary || ''}</div>
                        </div>
                      {/each}
                    </div>
                  {/if}
                </div>
              {/if}
            </div>
            
            <!-- Fallback: Show teams without division info -->
            {#if filteredTeams.filter(t => !t.division).length > 0}
              <div class="division-group">
                <h3 class="division-title">Other Teams</h3>
                <div class="mlb-table">
                  <div class="table-header">
                    <div class="pos">Pos</div>
                    <div class="team">Team</div>
                    <div class="w">W</div>
                    <div class="l">L</div>
                    <div class="pct">PCT</div>
                    <div class="div-gb">Div GB</div>
                    <div class="standing">Standing</div>
                  </div>
                  {#each filteredTeams.filter(team => !team.division) as team, index (team.id)}
                    <div class="table-row">
                      <div class="pos">{index + 1}</div>
                      <div class="team">
                        <img src={team.logo} alt={team.name} class="team-logo-small" />
                        <span class="team-name">{team.city} {team.name}</span>
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
                      <div class="pct">{(team.winPercentage || 0).toFixed(3).replace(/^0+/, '')}</div>
                      <div class="div-gb">{team.divisionGamesBehind || 0}</div>
                      <div class="standing">{team.standingSummary || ''}</div>
                    </div>
                  {/each}
                </div>
              </div>
            {/if}
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
    justify-content: space-between;
    align-items: center;
    width: 100%;
    background: #f1f5f9;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    padding: 12px 16px;
    font-size: 1.1rem;
    font-weight: 600;
    color: #334155;
    cursor: pointer;
    text-align: left;
    transition: background 0.2s ease;
    margin-bottom: 16px;
  }

  .league-header:hover {
    background: #e2e8f0;
  }

  .league-emoji {
    font-size: 3rem;
  }

  .league-title {
    font-size: 20px;
    font-weight: 700;
    color: #334155;
    margin: 0;
    padding: 0;
    background: none;
    border-radius: 0;
    text-align: left;
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
  }

  .standings-section {
    background: white;
    border-radius: 12px;
    padding: 20px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
    border: 1px solid #e5e7eb;
  }

  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
    background: #f1f5f9;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    padding: 12px 16px;
    font-size: 1.1rem;
    font-weight: 600;
    color: #334155;
    cursor: pointer;
    text-align: left;
    transition: background 0.2s ease;
  }

  .section-header:hover {
    background: #e2e8f0;
  }

  .expand-icon {
    font-size: 1.2rem;
    color: #6b7280;
    transition: transform 0.2s ease;
  }

  /* MLB Standings Styles */
  .mlb-standings .league-section {
    margin-bottom: 40px;
  }

  .mlb-standings .league-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
    background: linear-gradient(135deg, #1e40af, #3b82f6);
    border: none;
    border-radius: 16px;
    padding: 20px 24px;
    font-size: 1.3rem;
    font-weight: 700;
    color: white;
    cursor: pointer;
    text-align: left;
    transition: all 0.3s ease;
    box-shadow: 0 4px 16px rgba(59, 130, 246, 0.3);
    margin-bottom: 24px;
  }

  .mlb-standings .league-header:hover {
    background: linear-gradient(135deg, #1d4ed8, #2563eb);
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(59, 130, 246, 0.4);
  }

  .mlb-standings .league-title {
    font-size: 24px;
    font-weight: 800;
    color: white;
    margin: 0;
    padding: 0;
    background: none;
    border-radius: 0;
    text-align: left;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  }

  .mlb-standings .division-group {
    background: white;
    border-radius: 16px;
    padding: 24px;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
    border: 1px solid #e5e7eb;
    margin-bottom: 24px;
    transition: all 0.3s ease;
  }

  .mlb-standings .division-group:hover {
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
    transform: translateY(-1px);
  }

  .mlb-standings .division-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
    background: linear-gradient(135deg, #f8fafc, #f1f5f9);
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    padding: 16px 20px;
    font-size: 1.1rem;
    font-weight: 600;
    color: #334155;
    cursor: pointer;
    text-align: left;
    transition: all 0.3s ease;
    margin-bottom: 20px;
  }

  .mlb-standings .division-header:hover {
    background: linear-gradient(135deg, #f1f5f9, #e2e8f0);
    border-color: #cbd5e1;
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }

  .mlb-standings .division-title {
    font-size: 18px;
    font-weight: 700;
    color: #1e293b;
    margin: 0;
  }

  .mlb-standings .expand-icon {
    font-size: 1.4rem;
    color: #64748b;
    font-weight: 700;
    transition: all 0.3s ease;
    background: white;
    border-radius: 50%;
    width: 28px;
    height: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }

  .mlb-standings .league-header .expand-icon {
    color: white;
    background: rgba(255, 255, 255, 0.2);
    border: 1px solid rgba(255, 255, 255, 0.3);
  }

  .mlb-standings .mlb-table {
    display: flex;
    flex-direction: column;
    gap: 6px;
    border-radius: 12px;
    overflow: hidden;
    border: 1px solid #e5e7eb;
  }

  .mlb-standings .table-header {
    display: grid;
    grid-template-columns: 40px 2fr 40px 40px 40px 40px 60px 80px;
    background: linear-gradient(135deg, #f8fafc, #f1f5f9);
    font-weight: 700;
    color: #374151;
    font-size: 13px;
    padding: 16px;
    border-bottom: 2px solid #e5e7eb;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .mlb-standings .table-row {
    display: grid;
    grid-template-columns: 40px 2fr 40px 40px 40px 40px 60px 80px;
    padding: 14px 16px;
    border-bottom: 1px solid #f3f4f6;
    align-items: center;
    font-size: 14px;
    transition: all 0.2s ease;
  }

  .mlb-standings .table-row:hover {
    background: linear-gradient(135deg, #f8fafc, #f1f5f9);
    transform: translateX(2px);
  }

  .mlb-standings .table-row:nth-child(even) {
    background: #fafbfc;
  }

  .mlb-standings .table-row:nth-child(even):hover {
    background: linear-gradient(135deg, #f1f5f9, #e2e8f0);
  }

  .mlb-standings .table-row:last-child {
    border-bottom: none;
  }

  .mlb-standings .pos {
    font-weight: 700;
    color: #1e293b;
    text-align: center;
    background: #f1f5f9;
    border-radius: 6px;
    padding: 4px 8px;
    font-size: 13px;
  }

  .mlb-standings .team {
    font-weight: 500;
    color: #111827;
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .mlb-standings .team-logo-small {
    width: 24px;
    height: 24px;
    border-radius: 50%;
    object-fit: cover;
    border: 2px solid #e5e7eb;
  }

  .mlb-standings .team-name {
    flex-grow: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-weight: 600;
  }

  .mlb-standings .w, .mlb-standings .l, .mlb-standings .pct, .mlb-standings .div-gb, .mlb-standings .standing {
    text-align: center;
    font-weight: 600;
    color: #374151;
  }

  .mlb-standings .w, .mlb-standings .l {
    background: #f8fafc;
    border-radius: 6px;
    padding: 4px 8px;
    font-size: 13px;
  }

  .mlb-standings .pct {
    background: #f0f9ff;
    border-radius: 6px;
    padding: 4px 8px;
    font-size: 13px;
    color: #0369a1;
  }

  .mlb-standings .div-gb {
    background: #fef3c7;
    border-radius: 6px;
    padding: 4px 8px;
    font-size: 13px;
    color: #92400e;
  }

  .mlb-standings .standing {
    background: #f3e8ff;
    border-radius: 6px;
    padding: 4px 8px;
    font-size: 12px;
    color: #7c3aed;
    font-weight: 500;
  }

  .mlb-standings .favorite-btn {
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    color: #94a3b8;
    border-radius: 6px;
    padding: 4px 8px;
    cursor: pointer;
    transition: all 0.2s ease;
    font-size: 14px;
    min-width: 28px;
    height: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .mlb-standings .favorite-btn:hover {
    background: #f1f5f9;
    border-color: #cbd5e1;
    color: #64748b;
    transform: scale(1.05);
  }

  .mlb-standings .favorite-btn.favorited {
    background: linear-gradient(135deg, #fbbf24, #f59e0b);
    border-color: #f59e0b;
    color: white;
    box-shadow: 0 2px 8px rgba(245, 158, 11, 0.3);
  }

  .mlb-standings .favorite-btn.favorited:hover {
    background: linear-gradient(135deg, #f59e0b, #d97706);
    border-color: #d97706;
    transform: scale(1.05);
    box-shadow: 0 4px 12px rgba(245, 158, 11, 0.4);
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

  /* Mobile adjustments */
  @media (max-width: 768px) {
    .container {
      padding: 16px;
    }
    
    .league-header {
      flex-direction: column;
      gap: 12px;
      align-items: flex-start;
      padding: 10px 12px;
    }
    
    .mlb-standings .table-header, .mlb-standings .table-row {
      grid-template-columns: 30px 1.5fr 30px 30px 40px 30px 40px 50px 60px;
      font-size: 12px;
      padding: 8px 12px;
    }
    
    .mlb-standings .league-title {
      font-size: 18px;
    }
    
    .mlb-standings .division-title {
      font-size: 14px;
    }

    .section-header, .division-header {
      padding: 8px 12px;
      font-size: 1rem;
    }
  }
</style>
