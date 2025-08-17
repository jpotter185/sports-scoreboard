<script lang="ts">
  import { page } from '$app/stores';
  import { onMount } from 'svelte';
  import { getScoreboardData } from '$lib/data';
  import GameCard from '$lib/components/GameCard.svelte';
  import FavoriteButton from '$lib/components/FavoriteButton.svelte';
  import type { League, Team, Game } from '$lib/types';
  import { favoritesStore } from '$lib/favorites';
  import { browser } from '$app/environment';

  export let data: { league: League | null };

  let league: League | null = data.league;
  let loading = false;
  let error: string | null = null;
  let showFavoritesOnly = false;
  let showStandings = true;
  let showAL = true;
  let showALEast = true;
  let showALCentral = true;
  let showALWest = true;
  let showNL = true;
  let showNLEast = true;
  let showNLCentral = true;
  let showNLWest = true;
  let showAFC = true;
  let showNFC = true;

  // Get league ID from URL
  $: leagueId = $page.params.id;

  onMount(() => {
    // restore showFavoritesOnly preference
    if (browser) {
      try {
        const savedFavorites = localStorage.getItem('showFavoritesOnly');
        if (savedFavorites != null) showFavoritesOnly = savedFavorites === '1';
      } catch {}
    }
  });

  // persist showFavoritesOnly
  $: if (browser) {
    try { localStorage.setItem('showFavoritesOnly', showFavoritesOnly ? '1' : '0'); } catch {}
  }

  async function refreshData() {
    loading = true;
    try {
      const scoreboardData = await getScoreboardData();
      league = scoreboardData.leagues.find(l => l.id === leagueId) || null;
      error = null;
    } catch (err) {
      error = 'Failed to load league data';
      console.error('Error loading data:', err);
    } finally {
      loading = false;
    }
  }

  function toggleLeagueFavorite() {
    if (league) {
      favoritesStore.toggleLeague(league.id);
    }
  }

  function toggleTeamFavorite(teamId: string) {
    favoritesStore.toggleTeam(teamId);
  }

  // Filter teams and games based on favorites preference
  $: filteredTeams = showFavoritesOnly && league 
    ? league.teams.filter(team => {
        if (!league) return false;
        const internalId = `${league.id}-${team.id}`;
        return $favoritesStore.teams.includes(internalId);
      })
    : league?.teams || [];

  $: filteredGames = showFavoritesOnly && league
    ? league.games.filter(game => {
        if (!league) return false;
        const homeTeamInternalId = `${league.id}-${game.homeTeam.id}`;
        const awayTeamInternalId = `${league.id}-${game.awayTeam.id}`;
        return $favoritesStore.teams.includes(homeTeamInternalId) || $favoritesStore.teams.includes(awayTeamInternalId);
      })
    : league?.games || [];

  // Sort games by date (oldest first)
  $: sortedGames = [...filteredGames].sort((a, b) => {
    if (!a.date || !b.date) return 0;
    return new Date(a.date).getTime() - new Date(b.date).getTime();
  });

  // Get league emoji
  $: leagueEmoji = league?.id === 'nfl' ? '🏈' : 
                   league?.id === 'mlb' ? '⚾' : '⚽';
</script>

<svelte:head>
  <title>{league?.name || 'League'} - Sports Scoreboard</title>
</svelte:head>

<div class="container">
  <!-- Header -->
  <div class="header">
    <a href="/" class="back-link">← Back </a>
    
    {#if league}
      <div class="league-info">
        <div class="league-header">
          <span class="league-emoji">{leagueEmoji}</span>
          <h1 class="league-title">{league.name}</h1>
          <FavoriteButton 
            isFavorite={league.isFavorite || false} 
            size="large"
            on:toggle={toggleLeagueFavorite}
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
      <button class="control-button" on:click={() => showFavoritesOnly = !showFavoritesOnly} class:active={showFavoritesOnly}>
        {showFavoritesOnly ? '⭐ Show All' : '⭐ Show Favorites Only'}
      </button>
    </div>

    <!-- Sport-Specific Navigation -->
    <div class="section">
      <h2 class="section-title">Standings & Tables</h2>
      <div class="sport-navigation">
        {#if league.id === 'mlb'}
          <a href="/league/{league.id}/baseball" class="sport-link">
            <span class="sport-emoji">⚾</span>
            <span class="sport-text">View MLB Standings</span>
            <span class="sport-arrow">→</span>
          </a>
        {:else if league.id === 'nfl'}
          <a href="/league/{league.id}/football" class="sport-link">
            <span class="sport-emoji">🏈</span>
            <span class="sport-text">View NFL Standings</span>
            <span class="sport-arrow">→</span>
          </a>
        {:else if league.id === 'epl' || league.id === 'mls'}
          <a href="/league/{league.id}/soccer" class="sport-link">
            <span class="sport-emoji">⚽</span>
            <span class="sport-text">View {league.name} Table</span>
            <span class="sport-arrow">→</span>
          </a>
        {/if}
      </div>
    </div>

    <!-- Games Section -->
    <div class="section">
      <h2 class="section-title">Games ({sortedGames.length})</h2>
      {#if sortedGames.length > 0}
        <div class="games-grid">
          {#each sortedGames as game (game.id)}
            <GameCard {game} backTo="/league/{league.id}" leagueId={league.id} />
          {/each}
        </div>
      {:else}
        <div class="no-games">
          <div class="no-games-icon">🏟️</div>
          <div class="no-games-title">No games available</div>
          <div class="no-games-subtitle">
            {showFavoritesOnly ? 'No favorite teams have games scheduled' : 'Check back later for upcoming games'}
          </div>
        </div>
      {/if}
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
    background: #f1f5f9;
    border: 1px solid #e2e8f0;
    color: #334155;
    padding: 10px 16px;
    border-radius: 8px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .control-button:hover {
    background: #e2e8f0;
  }

  .control-button.active {
    background: #3b82f6;
    color: white;
    border-color: #3b82f6;
  }

  .section {
    margin-bottom: 40px;
  }

  .section-title {
    font-size: 1.5rem;
    font-weight: 600;
    color: #111827;
    margin-bottom: 20px;
    text-align: center;
  }

  .sport-navigation {
    display: flex;
    justify-content: center;
    gap: 20px;
    flex-wrap: wrap;
  }

  .sport-link {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 16px 24px;
    background: white;
    border: 2px solid #e5e7eb;
    border-radius: 12px;
    text-decoration: none;
    color: #374151;
    font-weight: 500;
    transition: all 0.2s ease;
    min-width: 200px;
    justify-content: center;
  }

  .sport-link:hover {
    border-color: #3b82f6;
    color: #3b82f6;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.15);
  }

  .sport-emoji {
    font-size: 1.5rem;
  }

  .sport-text {
    font-size: 1rem;
  }

  .sport-arrow {
    font-size: 1.2rem;
    color: #9ca3af;
    transition: color 0.2s ease;
  }

  .sport-link:hover .sport-arrow {
    color: #3b82f6;
  }

  .games-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
    gap: 20px;
    margin-bottom: 32px;
  }

  .loading-spinner {
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 60px 20px;
  }

  .spinner {
    width: 40px;
    height: 40px;
    border: 4px solid #e5e7eb;
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
    padding: 40px 20px;
    color: #dc2626;
  }

  .error-title {
    font-size: 1.5rem;
    font-weight: 600;
    margin-bottom: 16px;
  }

  .retry-button {
    background: #dc2626;
    color: white;
    border: none;
    padding: 12px 24px;
    border-radius: 8px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .retry-button:hover {
    background: #b91c1c;
    transform: translateY(-2px);
  }

  .no-games {
    text-align: center;
    padding: 60px 20px;
    color: #6b7280;
    background: white;
    border-radius: 12px;
    border: 1px solid #f3f4f6;
  }

  .no-games-icon {
    font-size: 64px;
    margin-bottom: 16px;
    opacity: 0.5;
  }

  .no-games-title {
    font-size: 1.5rem;
    font-weight: 600;
    margin-bottom: 8px;
  }

  .no-games-subtitle {
    font-size: 1.1rem;
  }

  .not-found {
    text-align: center;
    padding: 80px 20px;
    color: #6b7280;
  }

  .not-found-icon {
    font-size: 80px;
    margin-bottom: 24px;
    opacity: 0.5;
  }

  .not-found-title {
    font-size: 2rem;
    font-weight: 600;
    margin-bottom: 16px;
    color: #111827;
  }

  .not-found-subtitle {
    font-size: 1.2rem;
    margin-bottom: 32px;
  }

  .back-home {
    background: #3b82f6;
    color: white;
    text-decoration: none;
    padding: 12px 24px;
    border-radius: 8px;
    font-weight: 600;
    transition: all 0.2s ease;
  }

  .back-home:hover {
    background: #2563eb;
    transform: translateY(-2px);
  }

  /* Mobile adjustments */
  @media (max-width: 768px) {
    .container {
      padding: 16px;
    }
    
    .league-header {
      flex-direction: column;
      gap: 16px;
      align-items: flex-start;
    }
    
    .sport-navigation {
      flex-direction: column;
      align-items: center;
    }
    
    .sport-link {
      min-width: 100%;
      justify-content: center;
    }

    .games-grid {
      grid-template-columns: 1fr;
      gap: 12px;
    }
  }
</style>
