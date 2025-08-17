<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { fetchMLSTeams, fetchEPLTeams } from '$lib/api';
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

  // Get league ID from URL
  $: leagueId = $page.params.id;

  // Filter teams based on favorites toggle
  $: filteredTeams = data.teams;

  // Refresh data function
  async function refreshData() {
    loading = true;
    error = null;
    try {
      let refreshedTeams;
      if (league?.id === 'mls') {
        refreshedTeams = await fetchMLSTeams();
      } else if (league?.id === 'epl') {
        refreshedTeams = await fetchEPLTeams();
      } else {
        throw new Error('Unknown soccer league');
      }
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
  <title>{league?.name || 'Soccer League'} - Sports Scoreboard</title>
</svelte:head>

<div class="container">
  <!-- Header -->
  <div class="header">
    <a href="/league/{leagueId}" class="back-link">← Back to League</a>
    {#if league}
      <div class="league-info">
        <div class="league-header">
          <span class="league-emoji">⚽</span>
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
      <button class="retry-button" on:click={refreshData}> Try Again </button>
    </div>
  {:else if league}
    <!-- Standings Section -->
    <div class="standings-container">
      <div class="standings-section">
        <div class="section-header">
          <div class="header-left">
            <span class="section-title">Table</span>
            <button class="control-button" on:click={refreshData}> 🔄 Refresh </button>
          </div>
          <button class="expand-toggle" on:click={() => (showStandings = !showStandings)}>
            <span class="expand-icon">{showStandings ? '−' : '+'}</span>
          </button>
        </div>

        {#if showStandings}
          {#if league?.id === 'mls' && data.teams.some(team => team.conference)}
            <!-- MLS Conference Tables -->
            <div class="conference-tables">
              <!-- Eastern Conference -->
              <div class="conference-section">
                <h3 class="conference-title">Eastern Conference</h3>
                <div class="soccer-table">
                  <div class="table-header">
                    <div class="pos">Pos</div>
                    <div class="team">Team</div>
                    <div class="played">GP</div>
                    <div class="won">W</div>
                    <div class="drawn">D</div>
                    <div class="lost">L</div>
                    <div class="gf">GF</div>
                    <div class="ga">GA</div>
                    <div class="gd">GD</div>
                    <div class="points">Pts</div>
                  </div>
                  {#each data.teams
                    .filter(team => team.conference === 'Eastern Conference')
                    .sort((a, b) => (b.points || 0) - (a.points || 0)) as team, index (team.id)}
                    <div class="table-row">
                      <div class="pos">{index + 1}</div>
                      <div class="team">
                        <a href="/team/{league.id}/{team.id}?backTo=/league/{league.id}/soccer">
                          <img src={team.logo} alt={team.name} class="team-logo-small" />
                          <span class="team-name">{team.name}</span>
                        </a>
                        <button
                          class="favorite-btn {team.isFavorite ? 'favorited' : ''}"
                          on:click={() => favoritesStore.toggleTeam(team.id)}
                          title={team.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                        >
                          {team.isFavorite ? '★' : '☆'}
                        </button>
                      </div>
                      <div class="played">{team.gamesPlayed || 0}</div>
                      <div class="won">{team.wins || 0}</div>
                      <div class="drawn">{team.draws || 0}</div>
                      <div class="lost">{team.losses || 0}</div>
                      <div class="gf">{team.goalsFor || 0}</div>
                      <div class="ga">{team.goalsAgainst || 0}</div>
                      <div class="gd">{team.goalsDiff}</div>
                      <div class="points">{team.points || 0}</div>
                    </div>
                  {/each}
                </div>
              </div>

              <!-- Western Conference -->
              <div class="conference-section">
                <h3 class="conference-title">Western Conference</h3>
                <div class="soccer-table">
                  <div class="table-header">
                    <div class="pos">Pos</div>
                    <div class="team">Team</div>
                    <div class="played">GP</div>
                    <div class="won">W</div>
                    <div class="drawn">D</div>
                    <div class="lost">L</div>
                    <div class="gf">GF</div>
                    <div class="ga">GA</div>
                    <div class="gd">GD</div>
                    <div class="points">Pts</div>
                  </div>
                  {#each data.teams
                    .filter(team => team.conference === 'Western Conference')
                    .sort((a, b) => (b.points || 0) - (a.points || 0)) as team, index (team.id)}
                    <div class="table-row">
                      <div class="pos">{index + 1}</div>
                      <div class="team">
                        <a href="/team/{league.id}/{team.id}?backTo=/league/{league.id}/soccer">
                          <img src={team.logo} alt={team.name} class="team-logo-small" />
                          <span class="team-name">{team.name}</span>
                        </a>
                        <button
                          class="favorite-btn {team.isFavorite ? 'favorited' : ''}"
                          on:click={() => favoritesStore.toggleTeam(team.id)}
                          title={team.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                        >
                          {team.isFavorite ? '★' : '☆'}
                        </button>
                      </div>
                      <div class="played">{team.gamesPlayed || 0}</div>
                      <div class="won">{team.wins || 0}</div>
                      <div class="drawn">{team.draws || 0}</div>
                      <div class="lost">{team.losses || 0}</div>
                      <div class="gf">{team.goalsFor || 0}</div>
                      <div class="ga">{team.goalsAgainst || 0}</div>
                      <div class="gd">{team.goalsDiff}</div>
                      <div class="points">{team.points || 0}</div>
                    </div>
                  {/each}
                </div>
              </div>
            </div>
          {:else}
            <!-- Single Table for EPL or other leagues -->
            <div class="soccer-table">
              <div class="table-header">
                <div class="pos">Pos</div>
                <div class="team">Team</div>
                <div class="played">GP</div>
                <div class="won">W</div>
                <div class="drawn">D</div>
                <div class="lost">L</div>
                <div class="gf">GF</div>
                <div class="ga">GA</div>
                <div class="gd">GD</div>
                <div class="points">Pts</div>
              </div>
              {#each data.teams.sort((a, b) => (b.points || 0) - (a.points || 0)) as team, index (team.id)}
                <div class="table-row">
                  <div class="pos">{index + 1}</div>
                  <div class="team">
                    <a href="/team/{league.id}/{team.id}?backTo=/league/{league.id}/soccer">
                      <img src={team.logo} alt={team.name} class="team-logo-small" />
                      <span class="team-name">{team.name}</span>
                    </a>
                    <button
                      class="favorite-btn {team.isFavorite ? 'favorited' : ''}"
                      on:click={() => favoritesStore.toggleTeam(team.id)}
                      title={team.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                    >
                      {team.isFavorite ? '★' : '☆'}
                    </button>
                  </div>
                  <div class="played">{team.gamesPlayed || 0}</div>
                  <div class="won">{team.wins || 0}</div>
                  <div class="drawn">{team.draws || 0}</div>
                  <div class="lost">{team.losses || 0}</div>
                  <div class="gf">{team.goalsFor || 0}</div>
                  <div class="ga">{team.goalsAgainst || 0}</div>
                  <div class="gd">{team.goalsDiff}</div>
                  <div class="points">{team.points || 0}</div>
                </div>
              {/each}
            </div>
          {/if}
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

  /* Conference Tables Styles */
  .conference-tables {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
    margin-top: 12px;
  }

  .conference-section {
    background: white;
    border-radius: 8px;
    padding: 16px;
    border: 1px solid #e5e7eb;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  }

  .conference-title {
    font-size: 1.1rem;
    font-weight: 700;
    color: #111827;
    margin: 0 0 16px 0;
    text-align: center;
    padding: 10px;
    background: linear-gradient(135deg, #f8fafc, #f1f5f9);
    border-radius: 6px;
    border: 1px solid #e5e7eb;
  }

  /* Soccer Table Styles */
  .soccer-table {
    display: flex;
    flex-direction: column;
    gap: 4px;
    border-radius: 8px;
    overflow: hidden;
    border: 1px solid #e5e7eb;
    background: white;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  }

  .soccer-table .table-header {
    display: grid;
    grid-template-columns: 35px 1.8fr 35px 35px 35px 35px 35px 50px 50px 50px;
    background: linear-gradient(135deg, #f8fafc, #f1f5f9);
    font-weight: 700;
    color: #374151;
    font-size: 12px;
    padding: 12px 14px;
    border-bottom: 2px solid #e5e7eb;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .soccer-table .table-row {
    display: grid;
    grid-template-columns: 35px 1.8fr 35px 35px 35px 35px 35px 50px 50px 50px;
    padding: 10px 14px;
    border-bottom: 1px solid #f3f4f6;
    align-items: center;
    font-size: 12px;
    transition: all 0.2s ease;
  }

  .soccer-table .table-row:hover {
    background: linear-gradient(135deg, #f8fafc, #f1f5f9);
    transform: translateX(2px);
  }

  .soccer-table .table-row:nth-child(even) {
    background: #fafbfc;
  }

  .soccer-table .table-row:nth-child(even):hover {
    background: linear-gradient(135deg, #f1f5f9, #e2e8f0);
  }

  .soccer-table .table-row:last-child {
    border-bottom: none;
  }

  .soccer-table .pos {
    font-weight: 700;
    color: #1e293b;
    text-align: center;
    background: #f1f5f9;
    border-radius: 4px;
    padding: 3px 6px;
    font-size: 11px;
  }

  .soccer-table .team {
    font-weight: 500;
    color: #111827;
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .soccer-table .team-logo-small {
    width: 22px;
    height: 22px;
    border-radius: 50%;
    object-fit: cover;
    border: 2px solid #e5e7eb;
  }

  .soccer-table .team-name {
    flex-grow: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-weight: 600;
  }

  /* Team link styling */
  .soccer-table .team a {
    color: inherit;
    text-decoration: none;
    display: flex;
    align-items: center;
    gap: 10px;
    flex-grow: 1;
  }

  .soccer-table .team a:hover {
    color: inherit;
    text-decoration: none;
  }

  .soccer-table .played,
  .soccer-table .won,
  .soccer-table .drawn,
  .soccer-table .lost,
  .soccer-table .gf,
  .soccer-table .ga,
  .soccer-table .gd,
  .soccer-table .points {
    text-align: center;
    font-weight: 600;
    color: #374151;
  }

  .soccer-table .played,
  .soccer-table .won,
  .soccer-table .drawn,
  .soccer-table .lost {
    background: #f8fafc;
    border-radius: 4px;
    padding: 3px 6px;
    font-size: 11px;
  }

  .soccer-table .gf {
    background: #f0f9ff;
    border-radius: 4px;
    padding: 3px 6px;
    font-size: 11px;
    color: #0369a1;
  }

  .soccer-table .ga {
    background: #fef3c7;
    border-radius: 4px;
    padding: 3px 6px;
    font-size: 11px;
    color: #92400e;
  }

  .soccer-table .gd {
    background: #f3e8ff;
    border-radius: 4px;
    padding: 3px 6px;
    font-size: 11px;
    color: #7c3aed;
  }

  .soccer-table .points {
    background: linear-gradient(135deg, #fbbf24, #f59e0b);
    border-radius: 4px;
    padding: 3px 6px;
    font-size: 11px;
    color: white;
    font-weight: 700;
  }

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
  }

  .favorite-btn:hover {
    background: #f1f5f9;
    border-color: #cbd5e1;
    color: #64748b;
    transform: scale(1.05);
  }

  .favorite-btn.favorited {
    background: linear-gradient(135deg, #fbbf24, #f59e0b);
    border-color: #f59e0b;
    color: white;
    box-shadow: 0 2px 8px rgba(245, 158, 11, 0.3);
  }

  .favorite-btn.favorited:hover {
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
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
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
      padding: 12px;
    }

    .header {
      margin-bottom: 20px;
    }

    .back-link {
      font-size: 16px;
      padding: 8px 0;
      margin-bottom: 12px;
    }

    .league-header {
      flex-direction: column;
      gap: 12px;
      align-items: flex-start;
      padding: 16px;
    }

    .league-title {
      font-size: 20px;
      line-height: 1.2;
    }

    .league-subtitle {
      font-size: 16px;
    }

    .standings-section {
      padding: 16px;
      margin-bottom: 20px;
    }

    .standings-section .section-header {
      padding: 16px;
      margin-bottom: 16px;
      flex-direction: column;
      gap: 12px;
      align-items: stretch;
    }

    .standings-section .header-left {
      flex-direction: column;
      gap: 12px;
      align-items: stretch;
    }

    .standings-section .section-title {
      font-size: 18px;
      text-align: center;
    }

    .control-button {
      padding: 12px 20px;
      font-size: 16px;
      min-height: 48px;
    }

    .standings-section .expand-toggle {
      padding: 12px 20px;
      min-height: 48px;
      font-size: 16px;
    }

    .conference-section {
      margin-bottom: 24px;
    }

    .conference-title {
      font-size: 18px;
      padding: 16px;
    }

    /* Table mobile optimizations */
    .soccer-table {
      gap: 8px;
      margin-bottom: 20px;
    }

    .soccer-table .table-header,
    .soccer-table .table-row {
      grid-template-columns: 40px 1fr 50px 50px 50px 50px 50px 50px 50px 50px;
      padding: 16px 12px;
      gap: 8px;
      font-size: 14px;
      min-height: 60px;
    }

    .soccer-table .pos {
      font-size: 16px;
      font-weight: 700;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .soccer-table .team {
      gap: 12px;
      padding: 8px 0;
    }

    .soccer-table .team a {
      gap: 12px;
      padding: 8px;
      min-height: 44px;
      border-radius: 8px;
      transition: background-color 0.2s ease;
    }

    .soccer-table .team a:hover {
      background-color: #f8fafc;
    }

    .soccer-table .team a:active {
      background-color: #e2e8f0;
    }

    .soccer-table .team-logo-small {
      width: 32px;
      height: 32px;
      min-width: 32px;
      min-height: 32px;
    }

    .soccer-table .team-name {
      font-size: 16px;
      font-weight: 600;
      line-height: 1.3;
      flex: 1;
    }

    .soccer-table .played,
    .soccer-table .won,
    .soccer-table .drawn,
    .soccer-table .lost,
    .soccer-table .gf,
    .soccer-table .ga,
    .soccer-table .gd,
    .soccer-table .points {
      font-size: 16px;
      font-weight: 600;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 44px;
    }

    .soccer-table .favorite-btn {
      padding: 8px 12px;
      min-width: 44px;
      min-height: 44px;
      font-size: 18px;
      border-radius: 8px;
    }

    /* Ensure tables don't overflow */
    .conference-tables {
      overflow-x: auto;
      -webkit-overflow-scrolling: touch;
      padding-bottom: 8px;
    }

    .soccer-table {
      min-width: 100%;
      width: max-content;
    }
  }

  /* Small mobile devices */
  @media (max-width: 480px) {
    .container {
      padding: 8px;
    }

    .standings-section {
      padding: 12px;
    }

    .standings-section .section-header {
      padding: 12px;
    }

    .conference-title {
      font-size: 16px;
      padding: 12px;
    }

    .soccer-table .table-header,
    .soccer-table .table-row {
      grid-template-columns: 35px 1fr 45px 45px 45px 45px 45px 45px 45px 45px;
      padding: 12px 8px;
      font-size: 13px;
      min-height: 56px;
    }

    .soccer-table .team-logo-small {
      width: 28px;
      height: 28px;
      min-width: 28px;
      min-height: 28px;
    }

    .soccer-table .team-name {
      font-size: 14px;
    }

    .soccer-table .played,
    .soccer-table .won,
    .soccer-table .drawn,
    .soccer-table .lost,
    .soccer-table .gf,
    .soccer-table .ga,
    .soccer-table .gd,
    .soccer-table .points {
      font-size: 14px;
      min-height: 40px;
    }

    .soccer-table .favorite-btn {
      min-width: 40px;
      min-height: 40px;
      font-size: 16px;
    }

    .control-button,
    .standings-section .expand-toggle {
      padding: 10px 16px;
      min-height: 44px;
      font-size: 15px;
    }
  }

  /* Landscape mobile optimization */
  @media (max-width: 768px) and (orientation: landscape) {
    .soccer-table .table-header,
    .soccer-table .table-row {
      grid-template-columns: 35px 1fr 45px 45px 45px 45px 45px 45px 45px 45px;
      padding: 12px 8px;
      min-height: 48px;
    }

    .soccer-table .team-logo-small {
      width: 24px;
      height: 24px;
      min-width: 24px;
      min-height: 24px;
    }

    .soccer-table .team-name {
      font-size: 14px;
    }
  }
</style>
