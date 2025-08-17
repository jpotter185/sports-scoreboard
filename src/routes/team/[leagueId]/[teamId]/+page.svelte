<script lang="ts">
  import { page } from '$app/stores';
  import { onMount } from 'svelte';
  import { getScoreboardData } from '$lib/data';
  import GameCard from '$lib/components/GameCard.svelte';
  import FavoriteButton from '$lib/components/FavoriteButton.svelte';
  import type { Team, League, Game } from '$lib/types';
  import { favoritesStore } from '$lib/favorites';
  import { browser } from '$app/environment';

  export let data: {
    team: Team;
    league: League;
    games: Game[];
    leagueId: string;
    teamId: string;
  };

  let team: Team = data.team;
  let league: League = data.league;
  let games: Game[] = data.games;
  let wins = data.team.wins;
  let losses = data.team.losses;
  let winPercentage = data.team.winPercentage;
  let loading = false;
  let error: string | null = null;

  // Get league emoji
  $: leagueEmoji = league?.id === 'nfl' ? '🏈' : league?.id === 'mlb' ? '⚾' : '⚽';

  // Determine back navigation - prioritize going back to the league page
  $: backTo = (() => {
    // If there's a backTo query parameter, use it
    const queryBackTo = $page.url.searchParams.get('backTo');
    if (queryBackTo) return queryBackTo;

    // Check if user came from the main page by looking at referrer
    if (browser && document.referrer) {
      const referrer = new URL(document.referrer);
      // If referrer is the main page (root path), go back there
      if (referrer.pathname === '/' || referrer.pathname === '') {
        return '/';
      }
    }

    // Otherwise, go back to the league page
    return `/league/${league.id}`;
  })();

  // Determine back button text
  $: backButtonText = (() => {
    if ($page.url.searchParams.get('backTo')) {
      return '← Back';
    }
    if (browser && document.referrer) {
      const referrer = new URL(document.referrer);
      if (referrer.pathname === '/' || referrer.pathname === '') {
        return '← Back to Main';
      }
    }
    return `← Back to ${league.name}`;
  })();

  // Check if team is favorite
  $: teamInternalId = `${league.id}-${team.id}`;
  $: isTeamFavorite = $favoritesStore.teams.includes(teamInternalId);

  function toggleTeamFavorite() {
    favoritesStore.toggleTeam(teamInternalId);
  }

  async function refreshData() {
    loading = true;
    try {
      const scoreboardData = await getScoreboardData();
      const updatedLeague = scoreboardData.leagues.find(l => l.id === league.id);
      if (updatedLeague) {
        league = updatedLeague;
        const updatedTeam = updatedLeague.teams.find(t => t.id === team.id);
        if (updatedTeam) {
          team = updatedTeam;
        }

        // Update games
        const teamGames = updatedLeague.games.filter(
          game => game.homeTeam.id === team.id || game.awayTeam.id === team.id
        );
        games = [...teamGames].sort((a, b) => {
          if (!a.date || !b.date) return 0;
          return new Date(a.date).getTime() - new Date(b.date).getTime();
        });
      }
      error = null;
    } catch (err) {
      error = 'Failed to refresh team data';
      console.error('Error refreshing data:', err);
    } finally {
      loading = false;
    }
  }
</script>

<svelte:head>
  <title>{team.name} - {league.name} - Sports Scoreboard</title>
</svelte:head>

<div class="container">
  <!-- Header -->
  <div class="header">
    <a href={backTo} class="back-link">{backButtonText}</a>

    <div class="team-info">
      <div class="team-header">
        <div class="team-logo-large">
          {#if team.logo}
            <img src={team.logo} alt="{team.name} logo" loading="lazy" />
          {:else}
            <div class="team-logo-fallback-large">
              {team.abbreviation}
            </div>
          {/if}
        </div>
        <div class="team-details">
          <h1 class="team-title">{team.name}</h1>
          <div class="team-meta">
            <span class="league-badge">
              {leagueEmoji}
              {league.name}
            </span>
            {#if team.city}
              <span class="city-badge">{team.city}</span>
            {/if}
            {#if team.conference}
              <span class="city-badge">{team.conference}</span>
            {/if}
            {#if team.division}
              <span class="city-badge">{team.division}</span>
            {/if}
          </div>
          <div class="team-actions">
            <FavoriteButton
              isFavorite={isTeamFavorite}
              size="large"
              on:toggle={toggleTeamFavorite}
            />
          </div>
        </div>
      </div>
    </div>
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
  {:else}
    <!-- Team Stats Section -->
    <div class="stats-section">
      <h2 class="section-title">Team Statistics</h2>
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-value">{wins}</div>
          <div class="stat-label">Wins</div>
        </div>
        {#if league.id === 'mls' || league.id === 'epl' || team.draws}
          <div class="stat-card">
            <div class="stat-value">{team.draws || 0}</div>
            <div class="stat-label">Draws</div>
          </div>
        {/if}
        <div class="stat-card">
          <div class="stat-value">{losses}</div>
          <div class="stat-label">Losses</div>
        </div>
        {#if winPercentage}
          <div class="stat-card">
            <div class="stat-value">{winPercentage}</div>
            <div class="stat-label">Win %</div>
          </div>
        {/if}
      </div>
    </div>

    <!-- Games Section -->
    <div class="games-section">
      <h2 class="section-title">Schedule & Results ({games.length})</h2>
      {#if games.length > 0}
        <div class="games-grid">
          {#each games as game (game.id)}
            <GameCard {game} backTo="/team/{league.id}/{team.id}" leagueId={league.id} />
          {/each}
        </div>
      {:else}
        <div class="no-games">
          <div class="no-games-icon">🏟️</div>
          <div class="no-games-title">No games scheduled</div>
          <div class="no-games-subtitle">Check back later for upcoming games</div>
        </div>
      {/if}
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

  .team-info {
    margin-top: 24px;
  }

  .team-header {
    display: flex;
    align-items: center;
    gap: 24px;
    padding: 32px;
    background: white;
    border-radius: 16px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
    border: 1px solid #f3f4f6;
  }

  .team-logo-large {
    width: 120px;
    height: 120px;
    border-radius: 16px;
    overflow: hidden;
    flex-shrink: 0;
  }

  .team-logo-large img {
    width: 100%;
    height: 100%;
    object-fit: contain;
  }

  .team-logo-fallback-large {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #f3f4f6;
    font-size: 3rem;
    font-weight: bold;
    color: #4b5563;
  }

  .team-details {
    flex: 1;
  }

  .team-title {
    font-size: 2.5rem;
    font-weight: bold;
    color: #111827;
    margin: 0 0 16px 0;
  }

  .team-meta {
    display: flex;
    gap: 12px;
    margin-bottom: 20px;
    flex-wrap: wrap;
  }

  .league-badge,
  .city-badge {
    padding: 8px 16px;
    border-radius: 9999px;
    font-size: 0.9rem;
    font-weight: 600;
  }

  .league-badge {
    background: #dbeafe;
    color: #1e40af;
  }

  .city-badge {
    background: #f3f4f6;
    color: #374151;
  }

  .team-actions {
    display: flex;
    gap: 12px;
  }

  /* Stats Section */
  .stats-section {
    margin-bottom: 32px;
    padding: 24px;
    background: white;
    border-radius: 16px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
    border: 1px solid #f3f4f6;
  }

  .section-title {
    font-size: 24px;
    font-weight: bold;
    color: #111827;
    margin-bottom: 20px;
    text-align: center;
  }

  .stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 20px;
  }

  .stat-card {
    text-align: center;
    padding: 20px;
    background: #f8fafc;
    border-radius: 12px;
    border: 1px solid #e2e8f0;
  }

  .stat-value {
    font-size: 2rem;
    font-weight: bold;
    color: #111827;
    margin-bottom: 8px;
  }

  .stat-label {
    font-size: 0.9rem;
    color: #6b7280;
    font-weight: 500;
  }

  /* Games Section */
  .games-section {
    margin-bottom: 32px;
    padding: 24px;
    background: white;
    border-radius: 16px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
    border: 1px solid #f3f4f6;
  }

  .games-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
    gap: 20px;
    margin-top: 20px;
  }

  /* Loading and Error States */
  .loading-spinner {
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 60px 20px;
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
    padding: 40px 20px;
  }

  .error-title {
    font-size: 1.2rem;
    color: #dc2626;
    margin-bottom: 16px;
  }

  .retry-button {
    background: #3b82f6;
    color: white;
    border: none;
    padding: 12px 24px;
    border-radius: 8px;
    font-weight: 600;
    cursor: pointer;
    transition: background-color 0.2s ease;
  }

  .retry-button:hover {
    background: #2563eb;
  }

  .no-games {
    text-align: center;
    padding: 40px 20px;
  }

  .no-games-icon {
    font-size: 3rem;
    margin-bottom: 16px;
  }

  .no-games-title {
    font-size: 1.5rem;
    font-weight: bold;
    color: #111827;
    margin-bottom: 8px;
  }

  .no-games-subtitle {
    color: #6b7280;
  }

  /* Responsive Design */
  @media (max-width: 768px) {
    .team-header {
      flex-direction: column;
      text-align: center;
      gap: 16px;
    }

    .team-title {
      font-size: 2rem;
    }

    .stats-grid {
      grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
      gap: 16px;
    }

    .games-grid {
      grid-template-columns: 1fr;
    }
  }
</style>
