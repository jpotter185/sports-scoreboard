<script lang="ts">
  import type { League } from '$lib/types';
  import GameCard from './GameCard.svelte';
  import TeamCard from './TeamCard.svelte';
  import FavoriteButton from './FavoriteButton.svelte';
  import { onMount, createEventDispatcher } from 'svelte';
  import { slide } from 'svelte/transition';
  import { browser } from '$app/environment';
  import { favoritesStore } from '$lib/favorites';

  export let league: League;
  export let reorderMode: boolean = false;
  export let forceCollapse: boolean = false;
  export let forceExpand: boolean = false;
  export let showTeams: boolean = false;
  export let showFavoritesOnly: boolean = false;

  // Direct subscription to favorites store for real-time updates
  $: leagueIsFavorite = $favoritesStore.leagues.includes(league.id);
  $: teamsWithFavorites = league.teams.map(team => ({
    ...team,
    isFavorite: $favoritesStore.teams.includes(team.id)
  }));

  let expanded = false;
  // Apply jump-driven overrides to the real collapsed state
  $: if (forceExpand) expanded = false;
  $: if (forceCollapse) expanded = true;
  const dispatch = createEventDispatcher();

  // Read initial collapsed state synchronously on the client to avoid flicker on first paint
  if (browser) {
    try {
      const saved = localStorage.getItem(`leagueCollapsed:${league?.id ?? ''}`);
      if (saved !== null) expanded = saved === '1';
    } catch {}
  }

  // Sort games by date (oldest first) and filter by favorites if needed
  $: sortedGames = (() => {
    let games = [...league.games];
    
    // Filter to show only games involving favorite teams if showFavoritesOnly is true
    if (showFavoritesOnly) {
      games = games.filter(game => {
        const homeTeamInternalId = `${league.id}-${game.homeTeam.id}`;
        const awayTeamInternalId = `${league.id}-${game.awayTeam.id}`;
        return $favoritesStore.teams.includes(homeTeamInternalId) || $favoritesStore.teams.includes(awayTeamInternalId);
      });
    }
    
    // Sort by date (oldest first)
    return games.sort((a, b) => {
      if (!a.date || !b.date) return 0;
      return new Date(a.date).getTime() - new Date(b.date).getTime();
    });
  })();

  let storageKey: string;
  $: storageKey = `leagueCollapsed:${league.id}`;

  onMount(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved !== null) expanded = saved === '1';
    } catch {}
  });

  $: try { if (typeof window !== 'undefined') localStorage.setItem(storageKey, expanded ? '1' : '0'); } catch {}

  function toggleCollapse() {
    expanded = !expanded;
  }

  function toggleFavorite() {
    favoritesStore.toggleLeague(league.id);
  }
</script>

<style>
  .league-section {
    margin-bottom: 32px;
  }
  
  .league-header {
    background: white;
    border-radius: 12px;
    padding: 20px;
    margin-bottom: 0;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
    border: 1px solid #f3f4f6;
  }

  .header-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 8px;
  }

  .left-header {
    display: inline-flex;
    align-items: center;
    gap: 10px;
  }
  
  .league-title {
    font-size: 24px;
    font-weight: bold;
    color: #111827;
    margin-bottom: 8px;
  }

  .league-title-link {
    text-decoration: none;
    color: inherit;
  }

  .collapse-button {
    background: #f1f5f9;
    border: 1px solid #e2e8f0;
    color: #334155;
    border-radius: 8px;
    padding: 8px 12px;
    font-weight: 600;
    font-size: 14px;
    cursor: pointer;
    transition: background 0.2s ease;
    display: inline-flex;
    align-items: center;
    gap: 8px;
  }

  .collapse-button:hover {
    background: #e2e8f0;
  }

  .chevron {
    width: 16px;
    height: 16px;
    transition: transform 0.2s ease;
  }

  .drag-handle {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    background: #f8fafc;
    color: #94a3b8;
    cursor: grab;
    user-select: none;
  }

  .drag-handle:active {
    cursor: grabbing;
  }

  .right-controls {
    display: inline-flex;
    align-items: center;
    gap: 8px;
  }

  .reorder-btn {
    background: #f1f5f9;
    border: 1px solid #e2e8f0;
    color: #334155;
    border-radius: 8px;
    padding: 6px 10px;
    font-weight: 600;
    font-size: 13px;
    cursor: pointer;
  }

  .chevron.rotate {
    transform: rotate(-90deg);
  }
  
  .league-meta {
    display: flex;
    align-items: center;
    gap: 16px;
    flex-wrap: wrap;
  }
  
  .meta-item {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 14px;
    color: #6b7280;
  }
  
  .meta-icon {
    font-size: 16px;
  }
  
  .meta-divider {
    color: #d1d5db;
    font-weight: 300;
  }
  
  .games-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
    gap: 20px;
  }

  .league-body {
    background: white;
    border-left: 1px solid #f3f4f6;
    border-right: 1px solid #f3f4f6;
    border-bottom: 1px solid #f3f4f6;
    border-bottom-left-radius: 12px;
    border-bottom-right-radius: 12px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
    padding: 16px;
    margin-bottom: 24px;
  }

  .section-title {
    font-size: 18px;
    font-weight: 600;
    color: #111827;
    margin-bottom: 16px;
    padding-bottom: 8px;
    border-bottom: 2px solid #e5e7eb;
  }

  .teams-section {
    margin-bottom: 24px;
  }

  .teams-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 12px;
  }

  .games-section {
    margin-bottom: 16px;
  }
  
  .no-games {
    text-align: center;
    padding: 40px 20px;
    color: #6b7280;
    background: white;
    border-radius: 12px;
    border: 1px solid #f3f4f6;
  }
  
  .no-games-icon {
    font-size: 48px;
    margin-bottom: 16px;
    opacity: 0.5;
  }
  
  .no-games-title {
    font-size: 18px;
    font-weight: 600;
    margin-bottom: 8px;
  }
  
  .no-games-subtitle {
    font-size: 14px;
  }

  /* Mobile adjustments */
  @media (max-width: 480px) {
    .league-title { font-size: 20px; }
    .collapse-button { padding: 6px 10px; font-size: 13px; }
    .meta-item { font-size: 13px; }
    .games-grid { grid-template-columns: 1fr; gap: 12px; }
    .drag-handle { display: none; }
  }
</style>

<div class="league-section" id={`league-${league.id}`}>
  <!-- League Header -->
  <div class="league-header">
    <div class="header-top">
      <div class="left-header">
        <span class="drag-handle" title="Drag to reorder" aria-label="Drag to reorder" draggable="true">
          <!-- Grip icon -->
          <svg viewBox="0 0 20 20" width="14" height="14" fill="currentColor" aria-hidden="true">
            <circle cx="6" cy="6" r="1.5" />
            <circle cx="6" cy="10" r="1.5" />
            <circle cx="6" cy="14" r="1.5" />
            <circle cx="10" cy="6" r="1.5" />
            <circle cx="10" cy="10" r="1.5" />
            <circle cx="10" cy="14" r="1.5" />
          </svg>
        </span>
        <a href="/league/{league.id}" class="league-title-link">
          <h2 class="league-title">{league.name}</h2>
        </a>
      </div>
      <div class="right-controls">
        <FavoriteButton 
          isFavorite={leagueIsFavorite} 
          size="medium"
          on:toggle={toggleFavorite}
        />
        {#if reorderMode}
          <button class="reorder-btn" on:click={() => dispatch('moveUp')}>↑</button>
          <button class="reorder-btn" on:click={() => dispatch('moveDown')}>↓</button>
        {/if}
        <button class="collapse-button" on:click={() => { if (reorderMode) dispatch('exitReorder'); dispatch('clearJump'); toggleCollapse(); }} aria-expanded={!expanded} aria-controls={`grid-${league.id}`}>
          <svg class="chevron" class:rotate={expanded} viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path fill-rule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z" clip-rule="evenodd" />
          </svg>
          {expanded ? 'Expand' : 'Collapse'}
        </button>
      </div>
    </div>
    <div class="league-meta">
      <div class="meta-item">
        <span class="meta-icon">{league.id === 'nfl' ? '🏈' : league.id === 'mlb' ? '⚾' : '⚽'}</span>
        <span>{league.sport}</span>
      </div>

      {#if league.currentWeek && league.id === 'nfl'}
        <span class="meta-divider">•</span>
        <div class="meta-item">
          <span class="meta-icon">🏈</span>
          <span>Week {league.currentWeek}</span>
        </div>
      {/if}
      
      <span class="meta-divider">•</span>
      <div class="meta-item">
        <span class="meta-icon">🎮</span>
        <span>{league.games.length} game{league.games.length !== 1 ? 's' : ''}</span>
      </div>
      
      {#if league.games.filter(g => g.status === 'live').length > 0}
        <span class="meta-divider">•</span>
        <div class="meta-item">
          <span class="meta-icon">🔴</span>
          <span>{league.games.filter(g => g.status === 'live').length} live</span>
        </div>
      {/if}

      {#if league.games.filter(g => g.status === 'final').length > 0}
        <span class="meta-divider">•</span>
        <div class="meta-item">
          <span class="meta-icon">✅</span>
          <span>{league.games.filter(g => g.status === 'final').length} final</span>
        </div>
      {/if}
    </div>
  </div>

  <!-- Games Grid -->
  {#if !expanded}
    <div class="league-body" id={`grid-${league.id}`} in:slide={{ duration: 180 }} out:slide={{ duration: 140 }}>
      <!-- Teams Section -->
      {#if showTeams}
        <div class="teams-section">
          <h3 class="section-title">Teams</h3>
          <div class="teams-grid">
            {#each league.teams as team (team.id)}
              <TeamCard {team} />
            {/each}
          </div>
        </div>
      {/if}
      
      <!-- Games Section -->
      {#if league.games.length > 0}
        <div class="games-section">
          <h3 class="section-title">Games</h3>
          <div class="games-grid">
            {#each sortedGames as game (game.id)}
              <GameCard {game} backTo="/" leagueId={league.id} />
            {/each}
          </div>
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
